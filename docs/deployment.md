# Guía de Despliegue - MaiContact

## Prerequisitos

1. **Supabase**: Base de datos y autenticación
2. **n8n**: Automatización de workflows
3. **Cloudflare**: Hosting y CDN
4. **Meta Business**: WhatsApp Cloud API

## 1. Configuración de Supabase

### Crear proyecto Supabase
```bash
# 1. Crear cuenta en supabase.com
# 2. Crear nuevo proyecto
# 3. Ejecutar el SQL del modelo de datos
```

### SQL a ejecutar en Supabase
```sql
-- Copiar y pegar el contenido de docs/data-model.sql
-- en el SQL Editor de Supabase
```

### Configuración RLS (Row Level Security)
```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ... (repetir para todas las tablas)

-- Políticas básicas (expandir según necesidades)
CREATE POLICY "Users can view own organization data" ON organizations
    FOR ALL USING (id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
    ));
```

### Variables de entorno para Supabase
```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

## 2. Configuración de n8n

### Instalación
```bash
# Opción 1: Docker
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n

# Opción 2: npm
npm install n8n -g
n8n start
```

### Webhooks necesarios
1. **Webhook para mensajes WhatsApp**: `/webhook/whatsapp`
2. **Webhook para IA**: `/webhook/ai-suggestions`
3. **Webhook para notificaciones**: `/webhook/notifications`

### Variables de entorno para n8n
```
VITE_N8N_WEBHOOK_URL=https://tu-n8n.com/webhook
VITE_N8N_API_KEY=tu_api_key
```

## 3. Configuración de WhatsApp Cloud API

### Requisitos Meta Business
1. Cuenta Meta Business verificada
2. Aplicación WhatsApp Business
3. Número de teléfono verificado

### Variables de entorno
```
VITE_WHATSAPP_TOKEN=tu_access_token
VITE_WHATSAPP_PHONE_ID=tu_phone_number_id
VITE_WHATSAPP_BUSINESS_ID=tu_business_account_id
VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN=tu_verification_token
```

### Configurar Webhook en Meta
```
URL del webhook: https://tu-dominio.com/api/whatsapp/webhook
Verify token: tu_verification_token
Campos suscritos: messages, message_deliveries, message_reads
```

## 4. Despliegue en Cloudflare

### Instalación Wrangler CLI
```bash
npm install -g wrangler
wrangler login
```

### Configuración
1. Editar `wrangler.toml` con tu dominio
2. Configurar variables de entorno en Cloudflare Dashboard

### Variables de entorno en Cloudflare
```bash
# Configurar en Cloudflare Dashboard > Workers > Settings > Environment Variables
wrangler secret put VITE_SUPABASE_URL
wrangler secret put VITE_SUPABASE_ANON_KEY
wrangler secret put VITE_WHATSAPP_TOKEN
# ... etc
```

### Despliegue
```bash
# Build del proyecto
npm run build

# Deploy a Cloudflare
wrangler deploy

# Para Pages (alternativa)
wrangler pages deploy dist --project-name maicontact
```

## 5. Configuración de dominios

### DNS en Cloudflare
```
Tipo: CNAME
Nombre: maicontact (o @)
Destino: maicontact.tu-worker.workers.dev
Proxy: Habilitado (naranja)
```

### SSL/TLS
- Configurar SSL/TLS en modo "Full (strict)"
- Habilitar "Always Use HTTPS"

## 6. Verificación del despliegue

### Checklist
- [ ] Aplicación carga correctamente
- [ ] Login funciona con Supabase
- [ ] Base de datos conectada
- [ ] Webhook WhatsApp responde
- [ ] n8n recibe notificaciones
- [ ] SSL configurado correctamente

### URLs importantes
- Aplicación: `https://tu-dominio.com`
- Webhook WhatsApp: `https://tu-dominio.com/api/whatsapp/webhook`
- Health check: `https://tu-dominio.com/api/health`

## 7. Monitoreo

### Logs de Cloudflare
- Workers Analytics para métricas
- Real-time Logs para debugging

### Supabase Analytics
- Monitor de queries lentas
- Auth metrics
- API usage

## 8. Usuarios de prueba

Crear usuarios iniciales en Supabase:
```sql
-- Insertar organización
INSERT INTO organizations (name) VALUES ('Maihue Demo');

-- Insertar usuarios de prueba
INSERT INTO users (organization_id, name, email, role) VALUES 
(org_id, 'Admin Maihue', 'admin@maihue.cl', 'admin'),
(org_id, 'Supervisor Comercial', 'supervisor@maihue.cl', 'supervisor'),
(org_id, 'Agente Ventas', 'agente@maihue.cl', 'agent');

-- Crear áreas
INSERT INTO areas (organization_id, name) VALUES 
(org_id, 'Leads Hogar'),
(org_id, 'SAC'),
(org_id, 'Retencion'),
(org_id, 'Empresas y Horeca');
```