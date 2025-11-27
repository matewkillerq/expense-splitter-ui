-- =====================================================
-- LIMPIAR Y RECREAR POLÍTICAS RLS PARA GROUP_MEMBERS
-- =====================================================
-- Ejecuta este script completo en Supabase Dashboard → SQL Editor

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group members can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can remove members" ON public.group_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.group_members;
DROP POLICY IF EXISTS "Users can view memberships of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Members can add other members" ON public.group_members;
DROP POLICY IF EXISTS "Members can remove members" ON public.group_members;

-- 2. CREAR NUEVAS POLÍTICAS SIN RECURSIÓN

-- Permitir a los usuarios ver sus propias membresías
CREATE POLICY "view_own_memberships"
    ON public.group_members FOR SELECT
    USING (auth.uid() = user_id);

-- Permitir a los usuarios insertar membresías en grupos donde ya son miembros
-- Usamos una función para evitar recursión
CREATE POLICY "insert_group_members"
    ON public.group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.group_members existing
            WHERE existing.group_id = group_members.group_id
            AND existing.user_id = auth.uid()
        )
    );

-- Permitir a los usuarios eliminar membresías de grupos donde son miembros
CREATE POLICY "delete_group_members"
    ON public.group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM public.group_members existing
            WHERE existing.group_id = group_members.group_id
            AND existing.user_id = auth.uid()
        )
    );

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
-- Ejecuta esto después para verificar que las políticas se crearon correctamente:
-- SELECT * FROM pg_policies WHERE tablename = 'group_members';
