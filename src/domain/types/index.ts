export type UserRole = 'admin' | 'supervisor' | 'agent';
export type ConversationStatus = 'new' | 'open' | 'waiting' | 'closed';
export type MessageDirection = 'inbound' | 'outbound' | 'internal' | 'event';
export type SenderType = 'contact' | 'agent' | 'bot' | 'system';
export type Priority = 'alta' | 'media' | 'baja';
export type Channel = 'WhatsApp' | 'Webchat' | 'Instagram';
export type BotStatus = 'active' | 'inactive';

export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
}

export interface User {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
}

export interface Area {
  id: string;
  organizationId: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Contact {
  id: string;
  organizationId: string;
  displayName?: string;
  phone?: string;
  rut?: string;
  email?: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  organizationId: string;
  contactId: string;
  channel: Channel;
  externalThreadId?: string;
  currentAreaId?: string;
  currentAssigneeId?: string;
  status: ConversationStatus;
  botStatus: BotStatus;
  priority: Priority;
  slaDueAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  direction: MessageDirection;
  senderType: SenderType;
  senderUserId?: string;
  externalMessageId?: string;
  body?: string;
  messageType: string;
  deliveryStatus?: string;
  createdAt: Date;
}

export interface Tag {
  id: string;
  organizationId: string;
  areaId?: string;
  name: string;
  category?: string;
  color?: string;
  isGlobal: boolean;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
}

export interface Transfer {
  id: string;
  conversationId: string;
  fromAreaId?: string;
  toAreaId?: string;
  fromUserId?: string;
  toUserId?: string;
  reason: string;
  aiSummary?: string;
  createdBy: string;
  createdAt: Date;
}

export interface Integration {
  id: string;
  organizationId: string;
  provider: string;
  status: string;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}