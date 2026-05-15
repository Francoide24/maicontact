export interface Funnel {
  id: string;
  name: string;
  stageIds: string[];
}

export interface Stage {
  id: string;
  name: string;
  funnelId: string;
  color: string;
  campaignId: string | null;
  poolId: string | null;
  fixedUserId: string | null;
  assignmentStrategy: 'round_robin' | 'fixed' | 'none';
  n8nWebhookUrl: string | null;
  autoLabels: string[];
  onEnterAutomation: string | null;
}

export interface Pool {
  id: string;
  name: string;
  userIds: string[];
}

export interface AppUser {
  id: string;
  name: string;
  role: 'admin' | 'supervisor' | 'agent';
  isActive: boolean;
}

export interface Campaign {
  id: string;
  name: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  channel: 'whatsapp' | 'webchat' | 'instagram' | 'email';
}

export interface Conversation {
  id: string;
  contactId: string;
  stageId: string;
  funnelId: string;
  assigneeId: string | null;
  campaignId: string | null;
  labels: string[];
  priority: 'alta' | 'media' | 'baja';
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  type: 'text' | 'internal_note';
  sender: 'contact' | 'agent';
  text: string;
  createdAt: string;
}

export interface ConvEvent {
  id: string;
  conversationId: string;
  type: 'stage_changed' | 'assigned' | 'label_added' | 'label_removed' | 'status_changed';
  fromStageId?: string;
  toStageId?: string;
  assigneeId?: string;
  label?: string;
  actorId: string;
  createdAt: string;
}

export interface AutomationRun {
  id: string;
  conversationId: string;
  automationId: string;
  ranAt: string;
}

export interface AssignmentState {
  byPool: Record<string, { lastAssignedUserId: string }>;
  byStage: Record<string, { lastAssignedUserId: string }>;
}

export interface MockDataState {
  funnels: Record<string, Funnel>;
  stages: Record<string, Stage>;
  pools: Record<string, Pool>;
  users: Record<string, AppUser>;
  campaigns: Record<string, Campaign>;
  contacts: Record<string, Contact>;
  conversations: Record<string, Conversation>;
  messages: Record<string, Message[]>;
  events: Record<string, ConvEvent[]>;
  automationRuns: AutomationRun[];
  assignmentState: AssignmentState;
}

export const INITIAL_STATE: MockDataState = {
  funnels: {
    f_hogar: {
      id: 'f_hogar',
      name: 'Leads Hogar',
      stageIds: ['s_nuevo', 's_contactado', 's_calificado', 's_propuesta', 's_cerrado'],
    },
  },
  stages: {
    s_nuevo: { id: 's_nuevo', name: 'Nuevo', funnelId: 'f_hogar', color: '#6366f1', campaignId: null, poolId: null, fixedUserId: null, assignmentStrategy: 'round_robin', n8nWebhookUrl: null, autoLabels: [], onEnterAutomation: null },
    s_contactado: { id: 's_contactado', name: 'Contactado', funnelId: 'f_hogar', color: '#f59e0b', campaignId: 'c_bienvenida', poolId: 'pool_growth', fixedUserId: null, assignmentStrategy: 'round_robin', n8nWebhookUrl: null, autoLabels: ['interesado'], onEnterAutomation: null },
    s_calificado: { id: 's_calificado', name: 'Calificado', funnelId: 'f_hogar', color: '#10b981', campaignId: null, poolId: 'pool_growth', fixedUserId: null, assignmentStrategy: 'round_robin', n8nWebhookUrl: null, autoLabels: ['calificado'], onEnterAutomation: null },
    s_propuesta: { id: 's_propuesta', name: 'Propuesta', funnelId: 'f_hogar', color: '#3b82f6', campaignId: null, poolId: null, fixedUserId: 'u_franco', assignmentStrategy: 'fixed', n8nWebhookUrl: null, autoLabels: [], onEnterAutomation: null },
    s_cerrado: { id: 's_cerrado', name: 'Cerrado', funnelId: 'f_hogar', color: '#6b7280', campaignId: null, poolId: null, fixedUserId: null, assignmentStrategy: 'none', n8nWebhookUrl: null, autoLabels: ['cerrado'], onEnterAutomation: null },
  },
  pools: {
    pool_growth: { id: 'pool_growth', name: 'Growth', userIds: ['u_carla', 'u_paula'] },
  },
  users: {
    u_franco: { id: 'u_franco', name: 'Franco Viveros', role: 'admin', isActive: true },
    u_carla: { id: 'u_carla', name: 'Carla Ventas', role: 'agent', isActive: true },
    u_paula: { id: 'u_paula', name: 'Paula SAC', role: 'agent', isActive: true },
  },
  campaigns: {
    c_bienvenida: { id: 'c_bienvenida', name: 'Bienvenida Hogar' },
  },
  contacts: {
    ct_1: { id: 'ct_1', name: 'María González', phone: '+56912345678', channel: 'whatsapp' },
    ct_2: { id: 'ct_2', name: 'Jorge Pérez', phone: '+56987654321', channel: 'whatsapp' },
    ct_3: { id: 'ct_3', name: 'Lead Web', phone: '+56911223344', channel: 'webchat' },
    ct_4: { id: 'ct_4', name: 'Café Alameda', phone: '+56955667788', channel: 'instagram' },
  },
  conversations: {
    cv_1: { id: 'cv_1', contactId: 'ct_1', stageId: 's_contactado', funnelId: 'f_hogar', assigneeId: 'u_carla', campaignId: 'c_bienvenida', labels: ['interesado'], priority: 'alta', status: 'open', createdAt: '2025-05-14T10:00:00Z', updatedAt: '2025-05-14T11:30:00Z' },
    cv_2: { id: 'cv_2', contactId: 'ct_2', stageId: 's_nuevo', funnelId: 'f_hogar', assigneeId: null, campaignId: null, labels: [], priority: 'media', status: 'open', createdAt: '2025-05-15T09:00:00Z', updatedAt: '2025-05-15T09:00:00Z' },
    cv_3: { id: 'cv_3', contactId: 'ct_3', stageId: 's_calificado', funnelId: 'f_hogar', assigneeId: 'u_paula', campaignId: null, labels: ['calificado'], priority: 'alta', status: 'open', createdAt: '2025-05-13T14:00:00Z', updatedAt: '2025-05-14T16:00:00Z' },
    cv_4: { id: 'cv_4', contactId: 'ct_4', stageId: 's_nuevo', funnelId: 'f_hogar', assigneeId: null, campaignId: null, labels: [], priority: 'baja', status: 'open', createdAt: '2025-05-15T08:00:00Z', updatedAt: '2025-05-15T08:00:00Z' },
  },
  messages: {
    cv_1: [
      { id: 'msg_1', conversationId: 'cv_1', type: 'text', sender: 'contact', text: 'Hola, necesito información sobre el servicio hogar.', createdAt: '2025-05-14T10:01:00Z' },
      { id: 'msg_2', conversationId: 'cv_1', type: 'text', sender: 'agent', text: 'Con gusto te ayudo. ¿En qué dirección te encuentras?', createdAt: '2025-05-14T10:05:00Z' },
      { id: 'msg_3', conversationId: 'cv_1', type: 'internal_note', sender: 'agent', text: 'Nota interna: cliente calificado, seguimiento prioritario.', createdAt: '2025-05-14T10:10:00Z' },
    ],
  },
  events: {
    cv_1: [
      { id: 'evt_1', conversationId: 'cv_1', type: 'stage_changed', fromStageId: 's_nuevo', toStageId: 's_contactado', actorId: 'u_franco', createdAt: '2025-05-14T10:00:30Z' },
      { id: 'evt_2', conversationId: 'cv_1', type: 'assigned', assigneeId: 'u_carla', actorId: 'u_franco', createdAt: '2025-05-14T10:00:31Z' },
      { id: 'evt_3', conversationId: 'cv_1', type: 'label_added', label: 'interesado', actorId: 'system', createdAt: '2025-05-14T10:00:32Z' },
    ],
  },
  automationRuns: [],
  assignmentState: {
    byPool: { pool_growth: { lastAssignedUserId: 'u_carla' } },
    byStage: {},
  },
};
