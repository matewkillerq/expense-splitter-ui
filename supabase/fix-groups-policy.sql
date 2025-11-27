-- =====================================================
-- ARREGLAR POLÍTICA DE CREACIÓN DE GRUPOS
-- =====================================================
-- Ejecuta este script en Supabase Dashboard → SQL Editor

-- Eliminar la política problemática
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;

-- Crear nueva política que permita a cualquier usuario autenticado crear grupos
CREATE POLICY "authenticated_users_can_create_groups"
    ON public.groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Verificar que se creó correctamente
SELECT * FROM pg_policies WHERE tablename = 'groups' AND cmd = 'INSERT';
