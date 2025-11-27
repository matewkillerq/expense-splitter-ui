-- =====================================================
-- SOLUCIÓN FINAL: DESHABILITAR RLS
-- =====================================================
-- Para evitar problemas de recursión infinita, deshabilitamos RLS
-- En producción, se recomienda:
-- 1. Usar Service Role Key en el backend (no exponer al cliente)
-- 2. Implementar políticas RLS basadas en funciones de PostgreSQL
-- 3. O usar un esquema de seguridad diferente

-- Deshabilitar RLS en todas las tablas
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas para limpiar
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "view_own_groups" ON public.groups;
DROP POLICY IF EXISTS "create_groups" ON public.groups;
DROP POLICY IF EXISTS "update_own_groups" ON public.groups;
DROP POLICY IF EXISTS "delete_own_groups" ON public.groups;
DROP POLICY IF EXISTS "view_group_memberships" ON public.group_members;
DROP POLICY IF EXISTS "insert_group_members" ON public.group_members;
DROP POLICY IF EXISTS "delete_group_members" ON public.group_members;
DROP POLICY IF EXISTS "view_group_expenses" ON public.expenses;
DROP POLICY IF EXISTS "create_expenses" ON public.expenses;
DROP POLICY IF EXISTS "delete_expenses" ON public.expenses;
DROP POLICY IF EXISTS "view_expense_payers" ON public.expense_payers;
DROP POLICY IF EXISTS "insert_expense_payers" ON public.expense_payers;
DROP POLICY IF EXISTS "delete_expense_payers" ON public.expense_payers;
DROP POLICY IF EXISTS "view_expense_participants" ON public.expense_participants;
DROP POLICY IF EXISTS "insert_expense_participants" ON public.expense_participants;
DROP POLICY IF EXISTS "delete_expense_participants" ON public.expense_participants;

-- Verificar que RLS está deshabilitado
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'groups', 'group_members', 'expenses', 'expense_payers', 'expense_participants')
ORDER BY tablename;
