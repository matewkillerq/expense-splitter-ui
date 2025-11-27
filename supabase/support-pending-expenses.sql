-- =====================================================
-- SOPORTE PARA GASTOS CON MIEMBROS PENDIENTES
-- =====================================================
-- Permite crear gastos asignados a usuarios que aún no tienen cuenta

-- 1. Modificar expense_payers
ALTER TABLE public.expense_payers 
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN username TEXT;

ALTER TABLE public.expense_payers 
    ADD CONSTRAINT expense_payers_user_or_username_check 
    CHECK (user_id IS NOT NULL OR username IS NOT NULL);

-- 2. Modificar expense_participants
ALTER TABLE public.expense_participants 
    ALTER COLUMN user_id DROP NOT NULL,
    ADD COLUMN username TEXT;

ALTER TABLE public.expense_participants 
    ADD CONSTRAINT expense_participants_user_or_username_check 
    CHECK (user_id IS NOT NULL OR username IS NOT NULL);

-- 3. Actualizar función de activación para migrar gastos
CREATE OR REPLACE FUNCTION activate_pending_invitations()
RETURNS TRIGGER AS $$
BEGIN
    -- 1. Agregar al usuario a todos los grupos donde tiene invitaciones pendientes
    INSERT INTO public.group_members (group_id, user_id)
    SELECT group_id, NEW.id
    FROM public.pending_invitations
    WHERE username = NEW.username
    ON CONFLICT (group_id, user_id) DO NOTHING;
    
    -- 2. Actualizar expense_payers: asignar user_id donde coincida el username
    UPDATE public.expense_payers
    SET user_id = NEW.id
    WHERE username = NEW.username AND user_id IS NULL;

    -- 3. Actualizar expense_participants: asignar user_id donde coincida el username
    UPDATE public.expense_participants
    SET user_id = NEW.id
    WHERE username = NEW.username AND user_id IS NULL;

    -- 4. Eliminar las invitaciones pendientes ya procesadas
    DELETE FROM public.pending_invitations
    WHERE username = NEW.username;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
