# MaiContact

Plataforma operacional omnicanal tipo Vambe para Maihue. CRM con embudos Kanban, gestión de conversaciones, roles, campañas y pools de ejecutivos.

## Estado

✅ **MVP funcional** — Supabase Auth, RBAC, Kanban board, Team, Campañas, Pools.

> ⚠️  **Seguridad**: `AuthContext` usa Supabase Auth real. Si faltan las variables de entorno se muestra una pantalla de configuración en lugar de pantalla blanca. Los usuarios deben crearse manualmente (ver sección Provisioning). No hay `service_role key` en el frontend.

## Provisioning de usuarios

### Flujo actual (MVP)

Los usuarios se crean en dos pasos manuales:

1. **Supabase Auth** → Dashboard → Authentication → Users → "Invite user" o "Add user".
2. **public.users** → insertar fila con `id = auth.users.id`:

```sql
INSERT INTO public.users (id, organization_id, name, email, role, is_active)
VALUES (
  '<uuid del usuario en auth.users>',
  '<uuid de la organización>',
  'Nombre Apellido',
  'correo@maihue.cl',
  'agent',   -- admin | supervisor | agent
  true
);
```

El admin inicial es `prueba1@maihue.cl` (creado manualmente en Supabase Auth + public.users).

### ⚠️ Qué NO hacer

- **No usar `service_role key` en el frontend** — expone acceso total a la base de datos.
- No implementar `supabase.auth.admin.createUser()` en código cliente.

### Flujo futuro (producción)

La creación de usuarios desde la UI de Equipo debe implementarse vía:
- **Cloudflare Worker** o **Pages Function** con `service_role key` en variable de entorno del Worker (nunca expuesta al cliente).
- O **Supabase Edge Function** que recibe el email y crea el usuario en Auth + inserta en `public.users`.

El botón "+ Nuevo usuario" en TeamPage actualmente opera sobre el estado local (mock). Cuando el backend esté listo, `dispatch({ type: 'CREATE_USER' })` debe reemplazarse por una llamada al Worker/Edge Function.

## Arquitectura

```
src/
  infrastructure/
    auth/          # Demo auth (⚠️  reemplazar en prod)
    api/           # Supabase client (listo para conectar)
    config/        # Variables de entorno
  application/
    contexts/      # AuthContext (demo), AppContext (legacy)
    services/      # RBAC (can/canAny/canAll)
  domain/
    types/         # Tipos de base de datos Supabase
  data/
    mockData.ts    # Estado inicial + tipos del dominio
  state/
    store.tsx      # useReducer + Context (fuente única de verdad)
  services/
    persistence.ts   # localStorage — loadState/saveState/loadSession/saveSession
    sanitizer.ts     # escapeHtml()
    assignmentService.ts  # Round-robin real
    stageRouting.ts       # moveConversationToStage() inmutable
  components/         # Componentes nuevos (flujo principal)
    Sidebar.tsx       # Expansible/colapsable
    Topbar.tsx        # Toolbar con botones por vista
    FunnelBoard.tsx   # Kanban board
    FunnelColumn.tsx  # Columna drag-target
    TicketCard.tsx    # Tarjeta draggable
    ChatLayout.tsx
    ConversationView.tsx
    TicketDetailPanel.tsx
    Modal.tsx
  presentation/
    pages/
      LoginPage.tsx       # Login con email+password
      TeamPage.tsx        # Gestión de usuarios
      CampaignsPage.tsx   # Campañas + Pools
    components/
      auth/               # ProtectedRoute
      layout/             # Header legacy
      workspace/          # Paneles legacy (para limpiar)
  styles/
    base.css      # Variables CSS, reset
    layout.css    # Shell, sidebar, topbar, login, páginas, utilidades
    funnel.css    # Kanban board y tarjetas
    chat.css      # Vista de conversación
    modal.css     # Modales
```

## Instalación

```bash
npm install
cp .env.template .env   # completar variables cuando haya Supabase real
npm run dev
```

## Scripts

- `npm run dev` — Servidor de desarrollo
- `npm run build` — Build de producción (Vite + tsc)
- `npm run lint` — Verificación de tipos TypeScript

## Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Estado**: useReducer + Context (sin librerías externas)
- **Estilos**: CSS puro con variables
- **Persistencia demo**: localStorage vía servicio
- **Auth demo**: credenciales hardcodeadas (reemplazar en producción)
- **Supabase**: cliente configurado, listo para conectar
- **Cloudflare**: `wrangler.toml` preparado para Workers/Pages
- **n8n**: servicio de webhooks preparado en `src/application/services/n8nService.ts`
- **WhatsApp**: servicio preparado en `src/application/services/whatsappService.ts`

## Funcionalidades implementadas

- ✅ Login con email + contraseña (demo)
- ✅ RBAC con 18 permisos granulares
- ✅ Roles: Admin, Supervisor, Agente
- ✅ Sidebar expandible/colapsable con tooltips
- ✅ Topbar con toolbar contextual por vista
- ✅ Kanban board con drag & drop HTML5
- ✅ Scroll horizontal entre etapas
- ✅ Scroll vertical dentro de columnas
- ✅ Crear embudo y etapas
- ✅ Mover conversaciones (drag + manual)
- ✅ Round-robin real con memoria de último asignado
- ✅ Stage routing inmutable con eventos auditados
- ✅ Vista Chat (3 paneles)
- ✅ Gestión de equipo (usuarios, roles, permisos, campañas, pools)
- ✅ Gestión de campañas
- ✅ Gestión de pools de ejecutivos
- ✅ Persistencia en localStorage

## Próximos pasos para producción

1. Reemplazar demo auth por Cloudflare Access o Supabase Auth real
2. Conectar Supabase: completar `.env` con URL y anon key
3. Configurar n8n webhooks reales
4. Conectar WhatsApp Cloud API (META Business)
5. Configurar Cloudflare Workers/Pages (`wrangler.toml`)
6. Limpiar `src/presentation/components/workspace/` (componentes legacy)
7. Agregar Plantillas Meta (view stub lista para conectar)
