import { config } from '../../infrastructure/config/environment';

interface N8nWebhookPayload {
  event: string;
  data: any;
  metadata?: Record<string, any>;
}

export class N8nService {
  private static instance: N8nService;
  private webhookUrl: string;
  private apiKey: string;

  private constructor() {
    this.webhookUrl = config.n8n.webhookUrl || '';
    this.apiKey = config.n8n.apiKey || '';
  }

  static getInstance(): N8nService {
    if (!N8nService.instance) {
      N8nService.instance = new N8nService();
    }
    return N8nService.instance;
  }

  async sendWebhook(payload: N8nWebhookPayload): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('n8n webhook URL not configured');
      return;
    }

    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`n8n webhook failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending n8n webhook:', error);
      throw error;
    }
  }

  // Eventos específicos para n8n
  async notifyNewMessage(conversationId: string, message: any): Promise<void> {
    await this.sendWebhook({
      event: 'message.created',
      data: {
        conversationId,
        message,
      },
    });
  }

  async notifyConversationAssigned(conversationId: string, assigneeId: string, areaId?: string): Promise<void> {
    await this.sendWebhook({
      event: 'conversation.assigned',
      data: {
        conversationId,
        assigneeId,
        areaId,
      },
    });
  }

  async notifyConversationTransferred(conversationId: string, fromAreaId: string, toAreaId: string): Promise<void> {
    await this.sendWebhook({
      event: 'conversation.transferred',
      data: {
        conversationId,
        fromAreaId,
        toAreaId,
      },
    });
  }

  async notifyConversationClosed(conversationId: string): Promise<void> {
    await this.sendWebhook({
      event: 'conversation.closed',
      data: {
        conversationId,
      },
    });
  }

  async requestAISuggestion(conversationId: string, context: string): Promise<string> {
    const payload = {
      event: 'ai.suggestion.requested',
      data: {
        conversationId,
        context,
      },
    };

    // En producción, esto esperaría una respuesta de n8n
    await this.sendWebhook(payload);
    
    // Por ahora, retornamos una sugerencia mock
    return 'Sugerencia de IA: Basado en el contexto, recomiendo...';
  }
}