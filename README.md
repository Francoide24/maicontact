# MaiContact

Plataforma operacional omnicanal preparada para WhatsApp Cloud API, n8n, supervisión, permisos, transferencias con historial completo, etiquetas y auditoría.

## Estado

✅ **Funcional y listo para producción**

El proyecto ahora incluye todas las funcionalidades operacionales:
- Autenticación real con Supabase
- Sistema de roles (Admin, Supervisor, Agente)  
- Gestión de conversaciones en tiempo real
- Integración con WhatsApp Cloud API
- Webhooks para n8n
- Base de datos PostgreSQL completa
- Despliegue en Cloudflare Workers

## Arquitectura

El proyecto sigue Clean Architecture con la siguiente estructura:

```
src/
├── domain/           # Entidades y tipos del dominio
│   └── types/       # Definiciones TypeScript basadas en el modelo SQL
├── infrastructure/   # Configuración y servicios externos
│   ├── api/         # Integraciones con APIs externas
│   └── config/      # Configuración del entorno
├── application/      # Lógica de aplicación
│   ├── hooks/       # Custom React hooks
│   └── services/    # Servicios de negocio
├── presentation/     # Capa de presentación
│   ├── components/  # Componentes React organizados por dominio
│   ├── pages/       # Páginas/vistas principales
│   └── styles/      # Estilos CSS
└── shared/          # Código compartido
    ├── constants/   # Constantes de la aplicación
    ├── mocks/       # Datos de prueba
    └── utils/       # Utilidades comunes
```

## Instalación

```bash
# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.template .env

# Ejecutar en desarrollo
npm run dev
```

## Scripts disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build de producción  
- `npm run preview` - Preview del build
- `npm run lint` - Verificación de tipos TypeScript

## Funcionalidades implementadas

### 🔐 Autenticación y Autorización
- Login/logout con Supabase Auth
- Roles: Admin, Supervisor, Agente
- Protección de rutas basada en permisos
- Filtros de datos por rol

### 💬 Gestión de Conversaciones
- Lista de conversaciones en tiempo real
- Vista detallada con mensajes
- Envío de mensajes y notas internas
- Estados: nuevo, abierto, esperando, cerrado
- Prioridades y asignaciones

### 🔄 Derivación y Asignación
- Transferencia entre áreas
- Asignación manual y automática
- Estrategias por área
- Historial de transferencias

### 🏷️ Etiquetado y Organización
- Sistema de etiquetas por conversación
- Etiquetas globales y por área
- Filtros y búsqueda

### 📊 Auditoría y Trazabilidad
- Log completo de acciones
- Historial de cambios
- Métricas de agentes

### 🔌 Integraciones Listas
- **WhatsApp Cloud API**: Envío/recepción de mensajes
- **n8n**: Webhooks para automatización
- **Supabase**: Base de datos y tiempo real
- **Cloudflare**: Hosting y CDN

## Próximos pasos

1. **Configurar Supabase** (ver `docs/deployment.md`)
2. **Configurar WhatsApp Business API** 
3. **Configurar n8n workflows**
4. **Desplegar en Cloudflare Workers**
5. **Configurar dominio personalizado**

Consulta la documentación completa en `/docs/`
