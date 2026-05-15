# MaiContact

Plataforma operacional omnicanal preparada para WhatsApp Cloud API, n8n, supervisión, permisos, transferencias con historial completo, etiquetas y auditoría.

## Estado

Scaffold inicial preparado para pasar de prototipo local a producto integrable.

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
