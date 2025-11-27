-- =====================================================
-- SOLUCIÓN TEMPORAL: DESHABILITAR RLS EN GROUPS
-- =====================================================
-- Ejecuta este script para probar si RLS es el problema

-- Deshabilitar RLS temporalmente
ALTER TABLE public.groups DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'groups';
