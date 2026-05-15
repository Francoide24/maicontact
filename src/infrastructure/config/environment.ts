export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'MaiContact',
    env: import.meta.env.VITE_APP_ENV || 'development',
  },
  whatsapp: {
    token: import.meta.env.VITE_WHATSAPP_TOKEN,
    phoneId: import.meta.env.VITE_WHATSAPP_PHONE_ID,
    businessId: import.meta.env.VITE_WHATSAPP_BUSINESS_ID,
  },
  n8n: {
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
  },
  database: {
    url: import.meta.env.VITE_DATABASE_URL,
  },
  bigquery: {
    projectId: import.meta.env.VITE_BIGQUERY_PROJECT_ID,
    datasetId: import.meta.env.VITE_BIGQUERY_DATASET_ID,
  },
  ai: {
    provider: import.meta.env.VITE_AI_PROVIDER || 'anthropic',
    apiKey: import.meta.env.VITE_AI_API_KEY,
  },
} as const;