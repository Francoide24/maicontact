import { config } from '../../infrastructure/config/environment';

interface WhatsAppMessage {
  to: string;
  type: 'text' | 'image' | 'document' | 'template';
  text?: {
    body: string;
  };
  template?: {
    name: string;
    language: {
      code: string;
    };
    components?: any[];
  };
}

export class WhatsAppService {
  private static instance: WhatsAppService;
  private baseUrl = 'https://graph.facebook.com/v18.0';
  private token: string;
  private phoneId: string;

  private constructor() {
    this.token = config.whatsapp.token || '';
    this.phoneId = config.whatsapp.phoneId || '';
  }

  static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService();
    }
    return WhatsAppService.instance;
  }

  async sendMessage(message: WhatsAppMessage): Promise<any> {
    if (!this.token || !this.phoneId) {
      throw new Error('WhatsApp configuration missing');
    }

    const url = `${this.baseUrl}/${this.phoneId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...message,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendTextMessage(to: string, text: string): Promise<any> {
    return this.sendMessage({
      to,
      type: 'text',
      text: { body: text },
    });
  }

  async sendTemplate(to: string, templateName: string, languageCode = 'es', components?: any[]): Promise<any> {
    return this.sendMessage({
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }

  async markAsRead(messageId: string): Promise<void> {
    if (!this.token || !this.phoneId) {
      return;
    }

    const url = `${this.baseUrl}/${this.phoneId}/messages`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: messageId,
        }),
      });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  }

  // Webhook verification for WhatsApp
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === config.whatsapp.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }

  // Process incoming webhook from WhatsApp
  async processWebhook(body: any): Promise<void> {
    if (body.entry && body.entry.length > 0) {
      for (const entry of body.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              await this.handleIncomingMessages(change.value);
            }
          }
        }
      }
    }
  }

  private async handleIncomingMessages(value: any): Promise<void> {
    if (value.messages && value.messages.length > 0) {
      for (const message of value.messages) {
        // Here you would typically save the message to your database
        // and trigger any necessary workflows
        console.log('Incoming WhatsApp message:', message);
        
        // Mark message as read
        await this.markAsRead(message.id);
      }
    }
  }
}