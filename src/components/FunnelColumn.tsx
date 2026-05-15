import React, { useState } from 'react';
import type { Stage, Conversation } from '../data/mockData';
import { useStore } from '../state/store';
import { TicketCard } from './TicketCard';

interface FunnelColumnProps {
  stage: Stage;
  conversations: Conversation[];
  onDragStart: (e: React.DragEvent, conversationId: string) => void;
}

export const FunnelColumn: React.FC<FunnelColumnProps> = ({ stage, conversations, onDragStart }) => {
  const { state, dispatch } = useStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const conversationId = e.dataTransfer.getData('conversationId');
    if (conversationId) {
      dispatch({
        type: 'MOVE_CONVERSATION',
        conversationId,
        targetStageId: stage.id,
        actorId: 'u_franco',
      });
    }
  };

  return (
    <div
      className={`funnel-column${isDragOver ? ' drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="funnel-column-header">
        <div className="funnel-column-dot" style={{ background: stage.color }} />
        <span className="funnel-column-name">{stage.name}</span>
        <span className="funnel-column-count">{conversations.length}</span>
      </div>
      <div className="funnel-column-body">
        {conversations.map((conv) => {
          const contact = state.contacts[conv.contactId];
          const assignee = conv.assigneeId ? state.users[conv.assigneeId] ?? null : null;
          if (!contact) return null;
          return (
            <TicketCard
              key={conv.id}
              conversation={conv}
              contact={contact}
              assignee={assignee}
              onDragStart={onDragStart}
            />
          );
        })}
      </div>
    </div>
  );
};
