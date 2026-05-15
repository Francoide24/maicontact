-- MaiContact core data model
-- Target: PostgreSQL

create table organizations (
  id uuid primary key,
  name text not null,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  name text not null,
  email text not null unique,
  role text not null check (role in ('admin', 'supervisor', 'agent')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table areas (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table user_area_memberships (
  user_id uuid not null references users(id),
  area_id uuid not null references areas(id),
  can_receive_assignments boolean not null default true,
  daily_capacity integer not null default 8,
  primary key (user_id, area_id)
);

create table contacts (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  display_name text,
  phone text,
  rut text,
  email text,
  created_at timestamptz not null default now()
);

create table conversations (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  contact_id uuid not null references contacts(id),
  channel text not null,
  external_thread_id text,
  current_area_id uuid references areas(id),
  current_assignee_id uuid references users(id),
  status text not null check (status in ('new', 'open', 'waiting', 'closed')),
  bot_status text not null default 'active',
  priority text not null default 'normal',
  sla_due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table messages (
  id uuid primary key,
  conversation_id uuid not null references conversations(id),
  direction text not null check (direction in ('inbound', 'outbound', 'internal', 'event')),
  sender_type text not null check (sender_type in ('contact', 'agent', 'bot', 'system')),
  sender_user_id uuid references users(id),
  external_message_id text,
  body text,
  message_type text not null default 'text',
  delivery_status text,
  created_at timestamptz not null default now()
);

create table transfers (
  id uuid primary key,
  conversation_id uuid not null references conversations(id),
  from_area_id uuid references areas(id),
  to_area_id uuid references areas(id),
  from_user_id uuid references users(id),
  to_user_id uuid references users(id),
  reason text not null,
  ai_summary text,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  area_id uuid references areas(id),
  name text not null,
  category text,
  color text,
  is_global boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table conversation_tags (
  conversation_id uuid not null references conversations(id),
  tag_id uuid not null references tags(id),
  added_by uuid references users(id),
  added_at timestamptz not null default now(),
  primary key (conversation_id, tag_id)
);

create table audit_logs (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  actor_user_id uuid references users(id),
  conversation_id uuid references conversations(id),
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table integrations (
  id uuid primary key,
  organization_id uuid not null references organizations(id),
  provider text not null,
  status text not null default 'pending',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
