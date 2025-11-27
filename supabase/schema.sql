-- =====================================================
-- EXPENSE SPLITTER - DATABASE SCHEMA
-- =====================================================
-- Este script crea todas las tablas y políticas RLS necesarias
-- Ejecuta este script en: Supabase Dashboard → SQL Editor → New Query

-- =====================================================
-- 1. CREAR TABLAS
-- =====================================================

-- Tabla de perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT username_lowercase CHECK (username = LOWER(username))
);

-- Tabla de grupos
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de miembros de grupos (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(group_id, user_id)
);

-- Tabla de gastos
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
    created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de pagadores de gastos
CREATE TABLE IF NOT EXISTS public.expense_payers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(expense_id, user_id)
);

-- Tabla de participantes de gastos
CREATE TABLE IF NOT EXISTS public.expense_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    UNIQUE(expense_id, user_id)
);

-- =====================================================
-- 2. CREAR ÍNDICES PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON public.expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expense_payers_expense_id ON public.expense_payers(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_participants_expense_id ON public.expense_participants(expense_id);

-- =====================================================
-- 3. CREAR FUNCIÓN PARA ACTUALIZAR updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 4. CREAR TRIGGERS PARA updated_at
-- =====================================================

DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_groups ON public.groups;
CREATE TRIGGER set_updated_at_groups
    BEFORE UPDATE ON public.groups
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 5. CREAR FUNCIÓN PARA AUTO-CREAR PERFIL
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Esta función se ejecutará desde el código, no como trigger
    -- porque necesitamos datos adicionales (username, display_name)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. POLÍTICAS RLS PARA PROFILES
-- =====================================================

-- Todos pueden ver todos los perfiles (para buscar usuarios)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Los usuarios solo pueden insertar su propio perfil
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Los usuarios solo pueden actualizar su propio perfil
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- =====================================================
-- 8. POLÍTICAS RLS PARA GROUPS
-- =====================================================

-- Los usuarios solo ven grupos donde son miembros
DROP POLICY IF EXISTS "Users can view groups they are members of" ON public.groups;
CREATE POLICY "Users can view groups they are members of"
    ON public.groups FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- Los usuarios autenticados pueden crear grupos
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public.groups;
CREATE POLICY "Authenticated users can create groups"
    ON public.groups FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Los miembros pueden actualizar grupos
DROP POLICY IF EXISTS "Group members can update groups" ON public.groups;
CREATE POLICY "Group members can update groups"
    ON public.groups FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- Los miembros pueden eliminar grupos
DROP POLICY IF EXISTS "Group members can delete groups" ON public.groups;
CREATE POLICY "Group members can delete groups"
    ON public.groups FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = groups.id
            AND group_members.user_id = auth.uid()
        )
    );

-- =====================================================
-- 9. POLÍTICAS RLS PARA GROUP_MEMBERS
-- =====================================================

-- Los usuarios ven membresías de sus grupos
DROP POLICY IF EXISTS "Users can view group members of their groups" ON public.group_members;
CREATE POLICY "Users can view group members of their groups"
    ON public.group_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Los miembros pueden agregar otros miembros
DROP POLICY IF EXISTS "Group members can add members" ON public.group_members;
CREATE POLICY "Group members can add members"
    ON public.group_members FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- Los miembros pueden eliminar miembros
DROP POLICY IF EXISTS "Group members can remove members" ON public.group_members;
CREATE POLICY "Group members can remove members"
    ON public.group_members FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members gm
            WHERE gm.group_id = group_members.group_id
            AND gm.user_id = auth.uid()
        )
    );

-- =====================================================
-- 10. POLÍTICAS RLS PARA EXPENSES
-- =====================================================

-- Los miembros del grupo ven los gastos
DROP POLICY IF EXISTS "Group members can view expenses" ON public.expenses;
CREATE POLICY "Group members can view expenses"
    ON public.expenses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- Los miembros del grupo pueden crear gastos
DROP POLICY IF EXISTS "Group members can create expenses" ON public.expenses;
CREATE POLICY "Group members can create expenses"
    ON public.expenses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
        AND auth.uid() = created_by
    );

-- Los miembros del grupo pueden eliminar gastos
DROP POLICY IF EXISTS "Group members can delete expenses" ON public.expenses;
CREATE POLICY "Group members can delete expenses"
    ON public.expenses FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.group_members
            WHERE group_members.group_id = expenses.group_id
            AND group_members.user_id = auth.uid()
        )
    );

-- =====================================================
-- 11. POLÍTICAS RLS PARA EXPENSE_PAYERS
-- =====================================================

DROP POLICY IF EXISTS "Group members can view expense payers" ON public.expense_payers;
CREATE POLICY "Group members can view expense payers"
    ON public.expense_payers FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_payers.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can insert expense payers" ON public.expense_payers;
CREATE POLICY "Group members can insert expense payers"
    ON public.expense_payers FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_payers.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can delete expense payers" ON public.expense_payers;
CREATE POLICY "Group members can delete expense payers"
    ON public.expense_payers FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_payers.expense_id
            AND gm.user_id = auth.uid()
        )
    );

-- =====================================================
-- 12. POLÍTICAS RLS PARA EXPENSE_PARTICIPANTS
-- =====================================================

DROP POLICY IF EXISTS "Group members can view expense participants" ON public.expense_participants;
CREATE POLICY "Group members can view expense participants"
    ON public.expense_participants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can insert expense participants" ON public.expense_participants;
CREATE POLICY "Group members can insert expense participants"
    ON public.expense_participants FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Group members can delete expense participants" ON public.expense_participants;
CREATE POLICY "Group members can delete expense participants"
    ON public.expense_participants FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses e
            JOIN public.group_members gm ON gm.group_id = e.group_id
            WHERE e.id = expense_participants.expense_id
            AND gm.user_id = auth.uid()
        )
    );

-- =====================================================
-- COMPLETADO
-- =====================================================
-- El schema está listo. Ahora configura:
-- 1. Settings → Authentication → Email Auth → Disable email confirmations
-- 2. Copia las credenciales a .env.local
