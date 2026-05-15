import React, { useState } from 'react';
import { useApp } from '../../../application/contexts/AppContext';

export const ConversationView: React.FC = () => {
  const { selectedConversation, sendMessage } = useApp();
  const [messageText, setMessageText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  if (!selectedConversation) {
    return (
      <section className="card center-pane" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ textAlign: 'center', opacity: 0.7 }}>
          <h3>Selecciona una conversación</h3>
          <p>Elige una conversación de la lista para ver sus mensajes</p>
        </div>
      </section>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || sending) return;

    setSending(true);
    try {
      await sendMessage(selectedConversation.id, messageText, isInternal);
      setMessageText('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageClassName = (direction: string, senderType: string) => {
    if (direction === 'internal') return 'message internal';
    if (direction === 'event') return 'message event';
    if (senderType === 'bot') return 'message bot-note';
    if (direction === 'inbound') return 'message inbound';
    return 'message outbound';
  };

  return (
    <section className="card center-pane">
      <p className="eyebrow">{selectedConversation.channel?.toUpperCase()}</p>
      <h2>{selectedConversation.contact?.display_name || selectedConversation.contact?.phone || 'Sin nombre'}</h2>
      <p className="subtitle">
        {selectedConversation.contact?.phone} - {selectedConversation.current_area?.name || 'Sin área'} - 
        asignado a {selectedConversation.current_assignee?.name || 'Sin asignar'}
      </p>
      
      <div className="timeline" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
          selectedConversation.messages
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .map((message: any) => (
              <article 
                key={message.id} 
                className={getMessageClassName(message.direction, message.sender_type)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {message.body}
                  </div>
                  <small style={{ opacity: 0.6, marginLeft: '1rem', whiteSpace: 'nowrap' }}>
                    {formatMessageTime(message.created_at)}
                  </small>
                </div>
              </article>
            ))
        ) : (
          <article className="message event">
            No hay mensajes en esta conversación
          </article>
        )}
      </div>

      <form onSubmit={handleSendMessage} className="composer">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          <input
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Escribe respuesta, nota interna o instrucción para IA..."
            disabled={sending}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
              disabled={sending}
            />
            Nota interna (no visible para el cliente)
          </label>
        </div>
        <button type="submit" disabled={sending || !messageText.trim()}>
          {sending ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </section>
  );
};