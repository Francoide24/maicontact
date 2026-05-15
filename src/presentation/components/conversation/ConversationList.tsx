import React from 'react';
import { Box } from '../common/Box';
import { mockConversations } from '../../../shared/mocks/conversations';

interface ConversationListProps {
  activeIndex: number;
  onSelect: (index: number) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ activeIndex, onSelect }) => {
  return (
    <Box title="Conversaciones">
      <div className="conversation-list">
        {mockConversations.map((conversation, idx) => (
          <button
            key={conversation.name}
            className={`conversation-item ${idx === activeIndex ? 'active' : ''}`}
            onClick={() => onSelect(idx)}
          >
            <strong>{conversation.name}</strong>
            <span>
              {conversation.channel} - {conversation.area} - {conversation.assignee}
            </span>
            <small>prioridad: {conversation.priority}</small>
          </button>
        ))}
      </div>
    </Box>
  );
};