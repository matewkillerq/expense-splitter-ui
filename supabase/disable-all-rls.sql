-- =====================================================
-- DESHABILITAR RLS EN TODAS LAS TABLAS (TEMPORAL)
-- =====================================================
-- Esto es TEMPORAL para hacer funcionar la app
-- Luego crearemos políticas RLS correctas

-- Deshabilitar RLS en todas las tablas
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_payers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('groups', 'group_members', 'expenses', 'expense_payers', 'expense_participants');
