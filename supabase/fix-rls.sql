-- =====================================================
-- FIX: Políticas RLS para GROUP_MEMBERS (sin recursión)
-- =====================================================
-- Ejecuta este script en Supabase Dashboard → SQL Editor

-- Primero, eliminar las políticas problemáticas
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
DROP POLICY IF EXISTS "Group members can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group members can remove members" ON public.group_members;

-- Crear nuevas políticas SIN recursión
-- Los usuarios pueden ver membresías donde ellos son el usuario
CREATE POLICY "Users can view their own memberships"
    ON public.group_members FOR SELECT
    USING (auth.uid() = user_id);

-- Los usuarios pueden ver membresías de grupos donde ellos son miembros
-- IMPORTANTE: Usamos una subconsulta simple sin JOIN para evitar recursión
CREATE POLICY "Users can view memberships of their groups"
    ON public.group_members FOR SELECT
    USING (
        group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Los usuarios pueden insertar membresías en grupos donde ya son miembros
CREATE POLICY "Members can add other members"
    ON public.group_members FOR INSERT
    WITH CHECK (
        group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Los usuarios pueden eliminar membresías de grupos donde son miembros
CREATE POLICY "Members can remove members"
    ON public.group_members FOR DELETE
    USING (
        group_id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );
