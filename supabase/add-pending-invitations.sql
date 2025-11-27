-- =====================================================
-- AGREGAR SOPORTE PARA MIEMBROS PENDIENTES
-- =====================================================
-- Permite agregar usernames que aún no existen en el sistema

-- 1. Crear tabla para invitaciones pendientes
CREATE TABLE IF NOT EXISTS public.pending_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, username)
);

-- 2. Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_pending_invitations_username 
ON public.pending_invitations(username);

CREATE INDEX IF NOT EXISTS idx_pending_invitations_group 
ON public.pending_invitations(group_id);

-- 3. Función para activar invitaciones pendientes cuando un usuario se registra
CREATE OR REPLACE FUNCTION activate_pending_invitations()
RETURNS TRIGGER AS $$
BEGIN
    -- Agregar al usuario a todos los grupos donde tiene invitaciones pendientes
    INSERT INTO public.group_members (group_id, user_id)
    SELECT group_id, NEW.id
    FROM public.pending_invitations
    WHERE username = NEW.username
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    -- Eliminar las invitaciones pendientes ya procesadas
    DELETE FROM public.pending_invitations
    WHERE username = NEW.username;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger para activar invitaciones al crear un perfil
DROP TRIGGER IF EXISTS trigger_activate_pending_invitations ON public.profiles;
CREATE TRIGGER trigger_activate_pending_invitations
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION activate_pending_invitations();

-- 5. Deshabilitar RLS en la nueva tabla (ya que RLS está deshabilitado en todo)
ALTER TABLE public.pending_invitations DISABLE ROW LEVEL SECURITY;

-- 6. Verificar
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'pending_invitations'
ORDER BY ordinal_position;
