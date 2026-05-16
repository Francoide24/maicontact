-- =============================================================================
-- MaiContact — Row Level Security (RLS)
-- Ejecutar DESPUÉS de schema.sql
--
-- Modelo de seguridad: aislamiento por organización.
-- Cada usuario autenticado solo ve y modifica datos de su propia organización.
--
-- Patrones usados:
--   - Tablas con organization_id → política directa
--   - Tablas sin organization_id (messages, pool_users, etc.) → JOIN a tabla padre
--   - Admins y supervisores tienen acceso ampliado donde corresponde
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Helper: obtiene el organization_id del usuario autenticado
-- SECURITY DEFINER permite consultar users sin RLS circular
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM   public.users
  WHERE  id = auth.uid()
$$;

-- ---------------------------------------------------------------------------
-- Helper: verifica si el usuario autenticado es admin o supervisor
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION my_role_is(roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role = ANY(roles)
  FROM   public.users
  WHERE  id = auth.uid()
    AND  is_active = true
$$;

-- =============================================================================
-- ORGANIZATIONS
-- =============================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = my_org_id());

-- Solo admins pueden actualizar datos de la organización
CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = my_org_id() AND my_role_is(ARRAY['admin']));

-- =============================================================================
-- USERS
-- =============================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Todos ven a los usuarios activos de su organización
CREATE POLICY "users_select" ON users
  FOR SELECT USING (organization_id = my_org_id());

-- Solo admins insertan/actualizan/eliminan usuarios
CREATE POLICY "users_insert" ON users
  FOR INSERT WITH CHECK (organization_id = my_org_id() AND my_role_is(ARRAY['admin']));

CREATE POLICY "users_update" ON users
  FOR UPDATE USING (organization_id = my_org_id() AND my_role_is(ARRAY['admin']));

CREATE POLICY "users_delete" ON users
  FOR DELETE USING (organization_id = my_org_id() AND my_role_is(ARRAY['admin']));

-- =============================================================================
-- FUNNELS
-- =============================================================================
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "funnels_select" ON funnels
  FOR SELECT USING (organization_id = my_org_id());

CREATE POLICY "funnels_insert" ON funnels
  FOR INSERT WITH CHECK (organization_id = my_org_id() AND my_role_is(ARRAY['admin', 'supervisor']));

CREATE POLICY "funnels_update" ON funnels
  FOR UPDATE USING (organization_id = my_org_id() AND my_role_is(ARRAY['admin', 'supervisor']));

CREATE POLICY "funnels_delete" ON funnels
  FOR DELETE USING (organization_id = my_org_id() AND my_role_is(ARRAY['admin']));

-- =============================================================================
-- STAGES
-- =============================================================================
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

-- Sin organization_id directo → verificar a través del funnel padre
CREATE POLICY "stages_select" ON stages
  FOR SELECT USING (
    funnel_id IN (SELECT id FROM funnels WHERE organization_id = my_org_id())
  );

CREATE POLICY "stages_insert" ON stages
  FOR INSERT WITH CHECK (
    funnel_id IN (SELECT id FROM funnels WHERE organization_id = my_org_id())
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

CREATE POLICY "stages_update" ON stages
  FOR UPDATE USING (
    funnel_id IN (SELECT id FROM funnels WHERE organization_id = my_org_id())
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

CREATE POLICY "stages_delete" ON stages
  FOR DELETE USING (
    funnel_id IN (SELECT id FROM funnels WHERE organization_id = my_org_id())
    AND my_role_is(ARRAY['admin'])
  );

-- =============================================================================
-- POOLS
-- =============================================================================
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pools_select" ON pools
  FOR SELECT USING (organization_id = my_org_id());

CREATE POLICY "pools_write" ON pools
  FOR ALL USING (organization_id = my_org_id() AND my_role_is(ARRAY['admin', 'supervisor']));

-- =============================================================================
-- POOL_USERS
-- =============================================================================
ALTER TABLE pool_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pool_users_select" ON pool_users
  FOR SELECT USING (
    pool_id IN (SELECT id FROM pools WHERE organization_id = my_org_id())
  );

CREATE POLICY "pool_users_write" ON pool_users
  FOR ALL USING (
    pool_id IN (SELECT id FROM pools WHERE organization_id = my_org_id())
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

-- =============================================================================
-- CAMPAIGNS
-- =============================================================================
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_select" ON campaigns
  FOR SELECT USING (organization_id = my_org_id());

CREATE POLICY "campaigns_write" ON campaigns
  FOR ALL USING (organization_id = my_org_id() AND my_role_is(ARRAY['admin', 'supervisor']));

-- =============================================================================
-- CAMPAIGN_POOLS
-- =============================================================================
ALTER TABLE campaign_pools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaign_pools_select" ON campaign_pools
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM campaigns WHERE organization_id = my_org_id())
  );

CREATE POLICY "campaign_pools_write" ON campaign_pools
  FOR ALL USING (
    campaign_id IN (SELECT id FROM campaigns WHERE organization_id = my_org_id())
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

-- =============================================================================
-- CONTACTS
-- =============================================================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_select" ON contacts
  FOR SELECT USING (organization_id = my_org_id());

CREATE POLICY "contacts_insert" ON contacts
  FOR INSERT WITH CHECK (organization_id = my_org_id());

CREATE POLICY "contacts_update" ON contacts
  FOR UPDATE USING (organization_id = my_org_id());

-- =============================================================================
-- CONVERSATIONS
-- =============================================================================
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Admins y supervisores ven todas; agentes solo las propias
CREATE POLICY "conversations_select_admin_supervisor" ON conversations
  FOR SELECT USING (
    organization_id = my_org_id()
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

CREATE POLICY "conversations_select_agent" ON conversations
  FOR SELECT USING (
    organization_id = my_org_id()
    AND current_assignee_id = auth.uid()
  );

CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (organization_id = my_org_id());

CREATE POLICY "conversations_update" ON conversations
  FOR UPDATE USING (
    organization_id = my_org_id()
    AND (
      my_role_is(ARRAY['admin', 'supervisor'])
      OR current_assignee_id = auth.uid()
    )
  );

-- =============================================================================
-- MESSAGES
-- =============================================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_admin_supervisor" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE organization_id = my_org_id()
    )
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

CREATE POLICY "messages_select_agent" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE organization_id = my_org_id()
        AND current_assignee_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE organization_id = my_org_id()
    )
  );

-- =============================================================================
-- AUDIT_LOGS
-- =============================================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Solo admins y supervisores leen logs
CREATE POLICY "audit_logs_select" ON audit_logs
  FOR SELECT USING (
    organization_id = my_org_id()
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

-- Cualquier miembro puede insertar (el sistema inserta eventos)
CREATE POLICY "audit_logs_insert" ON audit_logs
  FOR INSERT WITH CHECK (organization_id = my_org_id());

-- =============================================================================
-- INTEGRATIONS
-- =============================================================================
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integrations_select" ON integrations
  FOR SELECT USING (
    organization_id = my_org_id()
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

CREATE POLICY "integrations_write" ON integrations
  FOR ALL USING (
    organization_id = my_org_id()
    AND my_role_is(ARRAY['admin'])
  );

-- =============================================================================
-- TAGS y CONVERSATION_TAGS
-- =============================================================================
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_select" ON tags
  FOR SELECT USING (organization_id = my_org_id());

CREATE POLICY "tags_write" ON tags
  FOR ALL USING (
    organization_id = my_org_id()
    AND my_role_is(ARRAY['admin', 'supervisor'])
  );

ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conv_tags_select" ON conversation_tags
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE organization_id = my_org_id()
    )
  );

CREATE POLICY "conv_tags_write" ON conversation_tags
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE organization_id = my_org_id()
    )
  );

-- =============================================================================
-- Habilitar Realtime para las tablas que la app necesita escuchar en vivo
-- (ejecutar en Supabase Dashboard → Database → Replication → Tables)
-- O via SQL:
-- =============================================================================
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;

-- =============================================================================
-- FIN DE RLS
-- Continúa con seed.sql
-- =============================================================================
