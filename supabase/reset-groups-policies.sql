-- =====================================================
-- RESETEAR COMPLETAMENTE POLÍTICAS DE GROUPS
-- =====================================================
-- Ejecuta este script en Supabase Dashboard → SQL Editor

-- 1. ELIMINAR TODAS LAS POLÍTICAS DE GROUPS
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can update groups" ON public.groups;
DROP POLICY IF EXISTS "Group members can delete groups" ON public.groups;
DROP POLICY IF EXISTS "authenticated_users_can_create_groups" ON public.groups;

-- 2. CREAR POLÍTICAS CORRECTAS

-- Permitir SELECT: usuarios ven grupos donde son miembros
CREATE POLICY "select_user_groups"
    ON public.groups FOR SELECT
    USING (
        id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Permitir INSERT: cualquier usuario autenticado puede crear grupos
CREATE POLICY "insert_groups"
    ON public.groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Permitir UPDATE: miembros del grupo pueden actualizar
CREATE POLICY "update_groups"
    ON public.groups FOR UPDATE
    USING (
        id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

-- Permitir DELETE: miembros del grupo pueden eliminar
CREATE POLICY "delete_groups"
    ON public.groups FOR DELETE
    USING (
        id IN (
            SELECT group_id 
            FROM public.group_members 
            WHERE user_id = auth.uid()
        )
    );

-- 3. VERIFICAR
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename = 'groups';
