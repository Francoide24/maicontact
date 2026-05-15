import React from 'react';
import type { Conversation, Contact, AppUser } from '../data/mockData';
import { useStore } from '../state/store';

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  webchat: '🌐',
  instagram: '📸',
  email: '✉️',
};

interface TicketCardProps {
  conversation: Conversation;
  contact: Contact;
  assignee: AppUser | null;
  onDragStart: (e: React.DragEvent, conversationId: string) => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export const TicketCard: React.FC<TicketCardProps> = ({
  conversation,
  contact,
  assignee,
  onDragStart,
}) => {
  const { dispatch } = useStore();

  const handleClick = () => {
    dispatch({ type: 'SET_ACTIVE_VIEW', view: 'chat' });
    dispatch({ type: 'SELECT_CONVERSATION', conversationId: conversation.id });
  };

  return (
    <div
      className="ticket-card"
      draggable
      onDragStart={(e) => onDragStart(e, conversation.id)}
      onClick={handleClick}
    >
      <div className="ticket-card-top">
        <span className="ticket-card-name">{contact.name}</span>
        <span className="ticket-card-channel">{CHANNEL_ICONS[contact.channel] ?? '💬'}</span>
      </div>
      <div className="ticket-card-meta">
        <span className={`priority-badge priority-${conversation.priority}`}>
          {conversation.priority}
        </span>
        <span>{timeAgo(conversation.updatedAt)}</span>
      </div>
      {assignee && (
        <div className="ticket-card-assignee">👤 {assignee.name}</div>
      )}
    </div>
  );
};
