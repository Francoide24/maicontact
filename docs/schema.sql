-- =============================================================================
-- MaiContact — Schema completo para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
--
-- ORDEN DE EJECUCIÓN:
--   1. schema.sql  (este archivo — crea tablas e índices)
--   2. rls.sql     (activa Row Level Security y crea políticas)
--   3. seed.sql    (inserta organización y admin inicial)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensiones necesarias
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. ORGANIZATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- 2. USERS (espeja auth.users — el id debe coincidir)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  email           text        NOT NULL,
  role            text        NOT NULL DEFAULT 'agent'
                              CHECK (role IN ('admin', 'supervisor', 'agent')),
  is_active       boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_org_idx ON users(organization_id);

-- ---------------------------------------------------------------------------
-- 3. FUNNELS (embudos Kanban)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS funnels (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text        NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funnels_org_idx ON funnels(organization_id);

-- ---------------------------------------------------------------------------
-- 4. POOLS (grupos de ejecutivos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pools (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  strategy        text    NOT NULL DEFAULT 'round_robin'
                          CHECK (strategy IN ('round_robin', 'least_loaded', 'manual')),
  max_open_per_user integer NOT NULL DEFAULT 15,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pools_org_idx ON pools(organization_id);

-- Pool ↔ User (junction)
CREATE TABLE IF NOT EXISTS pool_users (
  pool_id  uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  user_id  uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (pool_id, user_id)
);

-- ---------------------------------------------------------------------------
-- 5. CAMPAIGNS (campañas vinculadas a embudos)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campaigns (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  funnel_id       uuid    REFERENCES funnels(id) ON DELETE SET NULL,
  active          boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_org_idx ON campaigns(organization_id);

-- Campaign ↔ Pool (junction)
CREATE TABLE IF NOT EXISTS campaign_pools (
  campaign_id uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  pool_id     uuid NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  PRIMARY KEY (campaign_id, pool_id)
);

-- ---------------------------------------------------------------------------
-- 6. STAGES (etapas Kanban dentro de un funnel)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stages (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id           uuid    NOT NULL REFERENCES funnels(id) ON DELETE CASCADE,
  name                text    NOT NULL,
  color               text    NOT NULL DEFAULT '#6366f1',
  position            integer NOT NULL DEFAULT 0,
  campaign_id         uuid    REFERENCES campaigns(id) ON DELETE SET NULL,
  pool_id             uuid    REFERENCES pools(id) ON DELETE SET NULL,
  fixed_user_id       uuid    REFERENCES users(id) ON DELETE SET NULL,
  assignment_strategy text    NOT NULL DEFAULT 'round_robin'
                              CHECK (assignment_strategy IN ('round_robin', 'fixed', 'none')),
  n8n_webhook_url     text,
  auto_labels         text[]  NOT NULL DEFAULT '{}',
  on_enter_automation text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS stages_funnel_idx ON stages(funnel_id);
CREATE INDEX IF NOT EXISTS stages_position_idx ON stages(funnel_id, position);

-- ---------------------------------------------------------------------------
-- 7. CONTACTS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS contacts (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  display_name    text,
  phone           text,
  email           text,
  rut             text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contacts_org_idx   ON contacts(organization_id);
CREATE INDEX IF NOT EXISTS contacts_phone_idx ON contacts(phone);

-- ---------------------------------------------------------------------------
-- 8. CONVERSATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id          uuid    NOT NULL REFERENCES contacts(id),
  funnel_id           uuid    REFERENCES funnels(id)  ON DELETE SET NULL,
  stage_id            uuid    REFERENCES stages(id)   ON DELETE SET NULL,
  campaign_id         uuid    REFERENCES campaigns(id) ON DELETE SET NULL,
  channel             text    NOT NULL DEFAULT 'whatsapp',
  external_thread_id  text,
  current_assignee_id uuid    REFERENCES users(id)    ON DELETE SET NULL,
  status              text    NOT NULL DEFAULT 'new'
                              CHECK (status IN ('new', 'open', 'waiting', 'closed')),
  priority            text    NOT NULL DEFAULT 'media'
                              CHECK (priority IN ('alta', 'media', 'baja')),
  labels              text[]  NOT NULL DEFAULT '{}',
  sla_due_at          timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_org_idx     ON conversations(organization_id);
CREATE INDEX IF NOT EXISTS conversations_stage_idx   ON conversations(stage_id);
CREATE INDEX IF NOT EXISTS conversations_assignee_idx ON conversations(current_assignee_id);
CREATE INDEX IF NOT EXISTS conversations_status_idx  ON conversations(status);

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 9. MESSAGES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id                  uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     uuid    NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction           text    NOT NULL
                              CHECK (direction IN ('inbound', 'outbound', 'internal', 'event')),
  sender_type         text    NOT NULL
                              CHECK (sender_type IN ('contact', 'agent', 'bot', 'system')),
  sender_user_id      uuid    REFERENCES users(id) ON DELETE SET NULL,
  external_message_id text,
  body                text,
  message_type        text    NOT NULL DEFAULT 'text',
  delivery_status     text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages(conversation_id, created_at);

-- ---------------------------------------------------------------------------
-- 10. AUDIT_LOGS (eventos auditados: stage_changed, assigned, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_user_id   uuid    REFERENCES users(id) ON DELETE SET NULL,
  conversation_id uuid    REFERENCES conversations(id) ON DELETE SET NULL,
  action          text    NOT NULL,
  payload         jsonb   NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_conv_idx ON audit_logs(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_org_idx  ON audit_logs(organization_id, created_at);

-- ---------------------------------------------------------------------------
-- 11. INTEGRATIONS (WhatsApp, n8n, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS integrations (
  id              uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid  NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider        text  NOT NULL,   -- 'whatsapp' | 'n8n' | 'email'
  status          text  NOT NULL DEFAULT 'pending',
  config          jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- 12. TAGS y CONVERSATION_TAGS
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tags (
  id              uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid    NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text    NOT NULL,
  color           text,
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_tags (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  tag_id          uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  added_by        uuid REFERENCES users(id) ON DELETE SET NULL,
  added_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, tag_id)
);

-- =============================================================================
-- FIN DE SCHEMA
-- Continúa con rls.sql
-- =============================================================================
