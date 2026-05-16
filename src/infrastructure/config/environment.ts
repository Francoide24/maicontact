export const config = {
  app: {
    name: import.meta.env.VITE_APP_NAME || 'MaiContact',
    env: import.meta.env.VITE_APP_ENV || 'development',
  },
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },
  whatsapp: {
    token: import.meta.env.VITE_WHATSAPP_TOKEN,
    phoneId: import.meta.env.VITE_WHATSAPP_PHONE_ID,
    businessId: import.meta.env.VITE_WHATSAPP_BUSINESS_ID,
    webhookVerifyToken: import.meta.env.VITE_WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  },
  n8n: {
    webhookUrl: import.meta.env.VITE_N8N_WEBHOOK_URL,
    apiKey: import.meta.env.VITE_N8N_API_KEY,
  },
  ai: {
    provider: import.meta.env.VITE_AI_PROVIDER || 'anthropic',
    apiKey: import.meta.env.VITE_AI_API_KEY,
  },
  cloudflare: {
    workerUrl: import.meta.env.VITE_CLOUDFLARE_WORKER_URL,
  },
} as const;