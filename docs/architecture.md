# Arquitectura MaiContact

MaiContact debe operar como sistema operacional propio, con n8n como motor de automatizacion y WhatsApp Cloud API como canal.

## Componentes

- Frontend: inbox, supervisor, etiquetas, derivacion, asignacion y auditoria.
- Backend: permisos, conversaciones, mensajes, eventos, transferencias y webhooks.
- Base operacional: PostgreSQL.
- Analitica: BigQuery.
- Automatizacion: n8n.
- IA: proveedor configurable desde backend.

## Principio clave

Una transferencia no duplica el chat. La conversacion conserva mensajes, eventos, etiquetas, resumen, SLA y notas internas. Solo cambia el responsable o el area actual.
