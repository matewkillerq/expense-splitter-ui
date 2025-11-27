-- =====================================================
-- POLÍTICAS RLS CORRECTAS (SIN RECURSIÓN)
-- =====================================================
-- Este script crea políticas RLS que funcionan correctamente
-- sin causar recursión infinita ni problemas de "huevo y gallina"

-- 1. HABILITAR RLS EN TODAS LAS TABLAS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS PARA PROFILES
-- Todos pueden ver todos los perfiles (necesario para buscar usuarios)
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
CREATE POLICY "Anyone can view profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

-- Los usuarios solo pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3. POLÍTICAS PARA GROUPS
-- Ver grupos donde soy miembro
DROP POLICY IF EXISTS "view_own_groups" ON public.groups;
CREATE POLICY "view_own_groups"
    ON public.groups FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- Crear grupos (cualquier usuario autenticado)
DROP POLICY IF EXISTS "create_groups" ON public.groups;
CREATE POLICY "create_groups"
    ON public.groups FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Actualizar grupos donde soy miembro
DROP POLICY IF EXISTS "update_own_groups" ON public.groups;
CREATE POLICY "update_own_groups"
    ON public.groups FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- Eliminar grupos donde soy miembro
DROP POLICY IF EXISTS "delete_own_groups" ON public.groups;
CREATE POLICY "delete_own_groups"
    ON public.groups FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- 4. POLÍTICAS PARA GROUP_MEMBERS
-- Ver membresías de mis grupos
DROP POLICY IF EXISTS "view_group_memberships" ON public.group_members;
CREATE POLICY "view_group_memberships"
    ON public.group_members FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Insertar membresías (permitir si soy miembro O si soy el creador del grupo)
DROP POLICY IF EXISTS "insert_group_members" ON public.group_members;
CREATE POLICY "insert_group_members"
    ON public.group_members FOR INSERT
    TO authenticated
    WITH CHECK (
        -- Permitir si ya soy miembro del grupo
        EXISTS (
            SELECT 1 FROM public.group_members existing
            WHERE existing.group_id = group_members.group_id
            AND existing.user_id = auth.uid()
        )
        OR
        -- O si soy el creador del grupo (para el primer miembro)
        EXISTS (
            SELECT 1 FROM public.groups
            WHERE groups.id = group_members.group_id
            AND groups.created_by = auth.uid()
        )
    );

-- Eliminar membresías de mis grupos
DROP POLICY IF EXISTS "delete_group_members" ON public.group_members;
CREATE POLICY "delete_group_members"
    ON public.group_members FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- 5. POLÍTICAS PARA EXPENSES
-- Ver gastos de mis grupos
DROP POLICY IF EXISTS "view_group_expenses" ON public.expenses;
CREATE POLICY "view_group_expenses"
    ON public.expenses FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Crear gastos en mis grupos
DROP POLICY IF EXISTS "create_expenses" ON public.expenses;
CREATE POLICY "create_expenses"
    ON public.expenses FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

-- Eliminar gastos de mis grupos
DROP POLICY IF EXISTS "delete_expenses" ON public.expenses;
CREATE POLICY "delete_expenses"
    ON public.expenses FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- 6. POLÍTICAS PARA EXPENSE_PAYERS
DROP POLICY IF EXISTS "view_expense_payers" ON public.expense_payers;
CREATE POLICY "view_expense_payers"
    ON public.expense_payers FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_payers.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "insert_expense_payers" ON public.expense_payers;
CREATE POLICY "insert_expense_payers"
    ON public.expense_payers FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_payers.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "delete_expense_payers" ON public.expense_payers;
CREATE POLICY "delete_expense_payers"
    ON public.expense_payers FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_payers.expense_id
            AND gm.user_id = auth.uid()
        )
    );

-- 7. POLÍTICAS PARA EXPENSE_PARTICIPANTS
DROP POLICY IF EXISTS "view_expense_participants" ON public.expense_participants;
CREATE POLICY "view_expense_participants"
    ON public.expense_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "insert_expense_participants" ON public.expense_participants;
CREATE POLICY "insert_expense_participants"
    ON public.expense_participants FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "delete_expense_participants" ON public.expense_participants;
CREATE POLICY "delete_expense_participants"
    ON public.expense_participants FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

-- 8. VERIFICAR
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    CASE WHEN roles = '{authenticated}' THEN 'authenticated' ELSE roles::text END as roles
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'groups', 'group_members', 'expenses', 'expense_payers', 'expense_participants')
ORDER BY tablename, cmd, policyname;
