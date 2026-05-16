-- =============================================================================
-- MaiContact — Seed inicial
-- Ejecutar DESPUÉS de schema.sql y rls.sql
--
-- IMPORTANTE: El UUID del admin debe ser el que Supabase Auth asignó al usuario.
-- Pasos:
--   1. Crea el usuario en Supabase Auth (Dashboard → Auth → Users → Add user)
--   2. Copia el UUID que aparece en la columna "UID"
--   3. Reemplaza '<UUID-DEL-ADMIN-EN-AUTH>' abajo con ese UUID
--   4. Ejecuta este script en SQL Editor
-- =============================================================================

-- 1. Crear organización
INSERT INTO organizations (id, name)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Maihue'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Insertar admin inicial
--    ⚠️  Reemplaza <UUID-DEL-ADMIN-EN-AUTH> con el UUID real de Supabase Auth
INSERT INTO users (id, organization_id, name, email, role, is_active)
VALUES (
  '<UUID-DEL-ADMIN-EN-AUTH>',
  'a0000000-0000-0000-0000-000000000001',
  'Admin Maihue',
  'prueba1@maihue.cl',
  'admin',
  true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Funnel de ejemplo
INSERT INTO funnels (id, organization_id, name)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Leads Hogar'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Etapas del funnel (en orden)
INSERT INTO stages (id, funnel_id, name, color, position, assignment_strategy)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Nuevo',      '#6366f1', 0, 'round_robin'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Contactado', '#f59e0b', 1, 'round_robin'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Calificado', '#10b981', 2, 'round_robin'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Propuesta',  '#3b82f6', 3, 'round_robin'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Cerrado',    '#6b7280', 4, 'none')
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- FIN DEL SEED
-- =============================================================================
