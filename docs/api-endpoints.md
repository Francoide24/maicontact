# API Endpoints - MaiContact

## Webhook WhatsApp

### POST /api/whatsapp/webhook
Recibe mensajes de WhatsApp Cloud API

**Headers:**
```
Content-Type: application/json
```

**Body ejemplo:**
```json
{
  "entry": [{
    "changes": [{
      "field": "messages",
      "value": {
        "messages": [{
          "id": "mensaje_id",
          "from": "56912345678",
          "timestamp": "1234567890",
          "type": "text",
          "text": {
            "body": "Hola, necesito ayuda"
          }
        }]
      }
    }]
  }]
}
```

### GET /api/whatsapp/webhook
Verificación de webhook

**Query params:**
- `hub.mode`: subscribe
- `hub.verify_token`: token configurado
- `hub.challenge`: challenge de Meta

## n8n Webhooks

### POST /webhook/message-received
Notifica a n8n cuando llega un mensaje

**Body:**
```json
{
  "event": "message.received",
  "data": {
    "conversationId": "uuid",
    "message": {
      "id": "uuid",
      "body": "texto del mensaje",
      "sender": "contact|agent",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  }
}
```

### POST /webhook/conversation-assigned
Notifica asignación de conversación

**Body:**
```json
{
  "event": "conversation.assigned",
  "data": {
    "conversationId": "uuid",
    "assigneeId": "uuid",
    "areaId": "uuid",
    "assignedBy": "uuid"
  }
}
```

### POST /webhook/ai-suggestion
Solicita sugerencia de IA

**Body:**
```json
{
  "event": "ai.suggestion.requested",
  "data": {
    "conversationId": "uuid",
    "context": "contexto de la conversación",
    "language": "es"
  }
}
```

**Response esperado:**
```json
{
  "suggestion": "Respuesta sugerida por IA",
  "confidence": 0.95,
  "actions": ["close", "transfer", "escalate"]
}
```

## Health Checks

### GET /api/health
Estado del sistema

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00Z",
  "services": {
    "supabase": "ok",
    "n8n": "ok",
    "whatsapp": "ok"
  }
}
```

## Integración con Supabase

### Realtime subscriptions
El frontend se suscribe automáticamente a:
- `conversations`: cambios en conversaciones
- `messages`: nuevos mensajes
- `transfers`: transferencias

### RPC Functions (a implementar)
```sql
-- Función para auto-asignación
CREATE OR REPLACE FUNCTION auto_assign_conversation(
  conversation_id uuid,
  area_id uuid
) RETURNS uuid;

-- Función para métricas
CREATE OR REPLACE FUNCTION get_agent_metrics(
  user_id uuid,
  date_from date,
  date_to date
) RETURNS json;
```

## Autenticación

Todos los endpoints internos requieren autenticación JWT de Supabase:

**Headers:**
```
Authorization: Bearer jwt_token
```

## Rate Limiting

- WhatsApp webhook: 1000 req/min
- API interno: 100 req/min por usuario
- n8n webhooks: 500 req/min

## Error Handling

Formato estándar de errores:
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Descripción del error",
    "details": {}
  }
}
```

## Códigos de estado comunes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Rate Limited
- `500`: Internal Server Error