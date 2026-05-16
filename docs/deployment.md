# Guía de despliegue — MaiContact

## Resumen del stack

| Capa | Servicio |
|---|---|
| Frontend | Cloudflare Pages (build estático) |
| Auth + DB | Supabase |
| Mensajería | WhatsApp Cloud API (Meta) → n8n → Supabase |
| Backend (futuro) | Cloudflare Workers (Pages Functions) |

---

## Paso 1 — Supabase: crear proyecto y ejecutar schema

### 1.1 Crear proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com) → New project
2. Anota la **Project URL** y la **anon key** (Settings → API)

### 1.2 Ejecutar el schema

En Supabase Dashboard → **SQL Editor → New query**, ejecutar en este orden:

```
docs/schema.sql   ← tablas, índices, triggers
docs/rls.sql      ← Row Level Security y políticas
```

### 1.3 Crear el usuario admin en Supabase Auth

1. Dashboard → **Authentication → Users → Add user**
2. Email: `prueba1@maihue.cl`, contraseña segura
3. Copiar el **UUID** que aparece en la columna UID

### 1.4 Ejecutar el seed

Abrir `docs/seed.sql`, reemplazar `<UUID-DEL-ADMIN-EN-AUTH>` con el UUID real y ejecutar en SQL Editor.

### 1.5 Verificar

```sql
-- Debe devolver 1 fila con role = 'admin'
SELECT id, name, email, role FROM users;

-- Debe devolver 1 funnel con 5 etapas
SELECT f.name AS funnel, s.name AS stage, s.position
FROM funnels f
JOIN stages s ON s.funnel_id = f.id
ORDER BY s.position;
```

---

## Paso 2 — Cloudflare Pages: configurar variables de entorno

Las variables deben configurarse en Cloudflare Pages (no en Workers) porque el frontend es un sitio estático compilado con Vite. Las variables `VITE_*` se incrustan en el build.

### 2.1 Agregar variables en Cloudflare Pages

1. Ir a [dash.cloudflare.com](https://dash.cloudflare.com)
2. **Workers & Pages → tu proyecto → Settings → Environment variables**
3. Agregar para **Production** (y opcionalmente Preview):

| Variable | Valor | Dónde obtenerlo |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...` | Supabase → Settings → API |
| `VITE_APP_NAME` | `MaiContact` | Libre |
| `VITE_APP_ENV` | `production` | Libre |

> ⚠️ **NO agregar** `SUPABASE_SERVICE_ROLE_KEY` como variable `VITE_*` — quedaría expuesta en el bundle del cliente. La service role key solo va en variables de entorno de Workers (lado servidor).

### 2.2 Forzar un nuevo deploy

Después de guardar las variables, Cloudflare Pages necesita un nuevo build para incrustarlas:

- Ir a **Deployments → Retry deployment** en el deploy más reciente
- O hacer `git push` al branch conectado

### 2.3 Verificar que la app carga

- La pantalla de login debe aparecer (no pantalla blanca ni "configuración incompleta")
- Ingresar con `prueba1@maihue.cl` y la contraseña que seteaste en Auth
- Debe cargar la vista de Embudos con los datos del seed

---

## Paso 3 — Habilitar Realtime (opcional para MVP)

Para que múltiples agentes vean cambios en tiempo real sin recargar:

1. Supabase Dashboard → **Database → Replication**
2. Activar las tablas: `conversations`, `messages`, `audit_logs`

O via SQL:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
```

---

## Paso 4 — n8n + WhatsApp (después de MVP funcional)

> Completar una vez que el paso 2 funcione end-to-end.

### Variables adicionales a agregar en Cloudflare Pages

| Variable | Descripción |
|---|---|
| `VITE_N8N_WEBHOOK_URL` | URL base de tu instancia n8n |
| `VITE_WHATSAPP_PHONE_ID` | Phone Number ID de Meta Business |
| `VITE_WHATSAPP_BUSINESS_ID` | WhatsApp Business Account ID |

> `VITE_WHATSAPP_TOKEN` (token de acceso) es sensible. Evaluar si manejarlo desde el Worker en lugar del frontend.

### Flujo de mensajes entrantes

```
WhatsApp Cloud API
      ↓ webhook POST
    n8n
      ↓ HTTP Request node
  Supabase REST API   ← inserta en contacts + conversations + messages
      ↓ postgres_changes
   Frontend (Realtime)  ← aparece en el inbox sin recargar
```

---

## Variables de entorno de desarrollo local

Copiar `.env.template` a `.env` y completar:

```bash
cp .env.template .env
```

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_APP_NAME=MaiContact
VITE_APP_ENV=development
```

---

## Checklist de lanzamiento MVP

- [ ] Schema ejecutado sin errores en Supabase
- [ ] RLS ejecutado y verificado (usuario sin sesión no puede leer datos)
- [ ] Seed ejecutado — admin existe en `public.users`
- [ ] `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` seteadas en Cloudflare Pages
- [ ] Nuevo deploy forzado después de setear variables
- [ ] Login funciona con `prueba1@maihue.cl`
- [ ] Vista de Embudos carga con funnel y etapas del seed
- [ ] Si no hay sesión → muestra LoginPage (no pantalla blanca)
- [ ] Si usuario autenticado no tiene fila en `public.users` → muestra pantalla "Sin perfil operacional"
