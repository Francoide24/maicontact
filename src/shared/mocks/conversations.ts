import type { Channel, Priority } from '../../domain/types';
import { AREAS, type AreaName } from '../constants/areas';

export interface ConversationMock {
  name: string;
  channel: Channel;
  area: AreaName;
  assignee: string;
  priority: Priority;
}

export const mockConversations: ConversationMock[] = [
  {
    name: 'Lead Web Hogar',
    channel: 'WhatsApp',
    area: AREAS[0],
    assignee: 'Admin Maihue',
    priority: 'media'
  },
  {
    name: 'Maria Gonzalez',
    channel: 'WhatsApp',
    area: AREAS[0],
    assignee: 'Carla Ventas',
    priority: 'alta'
  },
  {
    name: 'Jorge Perez',
    channel: 'Webchat',
    area: AREAS[1],
    assignee: 'Diego SAC',
    priority: 'media'
  },
  {
    name: 'Cafe Alameda',
    channel: 'Instagram',
    area: AREAS[3],
    assignee: 'sin asignar',
    priority: 'alta'
  }
];