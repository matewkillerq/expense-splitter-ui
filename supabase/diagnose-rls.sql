-- =====================================================
-- DIAGNÓSTICO: Ver estado actual de RLS y políticas
-- =====================================================

-- 1. Ver si RLS está habilitado
SELECT 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'groups', 'group_members', 'expenses', 'expense_payers', 'expense_participants')
ORDER BY tablename;

-- 2. Ver todas las políticas activas
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
