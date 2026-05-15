import React from 'react';
import { Box } from '../common/Box';
import { useApp } from '../../../application/contexts/AppContext';

export const ConversationList: React.FC = () => {
  const { conversations, selectedConversationId, selectConversation } = useApp();

  const getStatusColor = (status: string) => {
    const colors = {
      new: '#ff6b6b',
      open: '#4ecdc4',
      waiting: '#ffe66d',
      closed: '#95a5a6'
    };
    return colors[status as keyof typeof colors] || '#95a5a6';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return `${diffDays} días`;
    }
    return date.toLocaleDateString('es-ES');
  };

  return (
    <Box title={`Conversaciones (${conversations.length})`}>
      <div className="conversation-list">
        {conversations.length === 0 ? (
          <p style={{ textAlign: 'center', opacity: 0.7, padding: '2rem' }}>
            No hay conversaciones disponibles
          </p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`conversation-item ${selectedConversationId === conversation.id ? 'active' : ''}`}
              onClick={() => selectConversation(conversation.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: getStatusColor(conversation.status),
                  }}
                />
                <strong>{conversation.contact?.display_name || conversation.contact?.phone || 'Sin nombre'}</strong>
              </div>
              <span>
                {conversation.channel} - {conversation.current_area?.name || 'Sin área'} - {conversation.current_assignee?.name || 'Sin asignar'}
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <small>prioridad: {conversation.priority}</small>
                <small style={{ opacity: 0.6 }}>{formatDate(conversation.updated_at)}</small>
              </div>
            </button>
          ))
        )}
      </div>
    </Box>
  );
};