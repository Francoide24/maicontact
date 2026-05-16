import React, { useState } from 'react';
import { useStore } from '../state/store';
import { ConversationView } from './ConversationView';
import { TicketDetailPanel } from './TicketDetailPanel';
import { escapeHtml } from '../services/sanitizer';

const CHANNEL_ICONS: Record<string, string> = {
  whatsapp: '💬',
  webchat: '🌐',
  instagram: '📸',
  email: '✉️',
};

export const ChatLayout: React.FC = () => {
  const { state, dispatch } = useStore();
  const [search, setSearch] = useState('');

  const conversations = Object.values(state.conversations);
  const filtered = conversations.filter((conv) => {
    const contact = state.contacts[conv.contactId];
    if (!contact) return false;
    if (!search) return true;
    return contact.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="chat-layout">
      {/* Left panel */}
      <div className="conv-list-panel">
        <div className="conv-list-search">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar conversación..."
          />
        </div>
        <div className="conv-list-items">
          {filtered.map((conv) => {
            const contact = state.contacts[conv.contactId];
            if (!contact) return null;
            const isSelected = state.selectedConversationId === conv.id;
            const stage = state.stages[conv.stageId];
            return (
              <div
                key={conv.id}
                className={`conv-list-item${isSelected ? ' selected' : ''}`}
                onClick={() => dispatch({ type: 'SELECT_CONVERSATION', conversationId: conv.id })}
              >
                <div className="conv-list-item-name">
                  <span>{CHANNEL_ICONS[contact.channel] ?? '💬'}</span>
                  <span dangerouslySetInnerHTML={{ __html: escapeHtml(contact.name) }} />
                </div>
                <div className="conv-list-item-preview">
                  {stage?.name ?? ''} · {conv.priority}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center panel */}
      <ConversationView />

      {/* Right panel */}
      <TicketDetailPanel />
    </div>
  );
};
