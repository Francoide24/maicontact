import React, { useState, useRef, useEffect } from 'react';
import type { Message, ConvEvent } from '../data/mockData';
import { useStore } from '../state/store';
import { escapeHtml } from '../services/sanitizer';

type TimelineItem =
  | { kind: 'message'; data: Message; sortKey: string }
  | { kind: 'event'; data: ConvEvent; sortKey: string };

function formatEventText(event: ConvEvent, state: ReturnType<typeof useStore>['state']): string {
  switch (event.type) {
    case 'stage_changed': {
      const from = event.fromStageId ? state.stages[event.fromStageId]?.name : '?';
      const to = event.toStageId ? state.stages[event.toStageId]?.name : '?';
      return `Etapa: ${from} → ${to}`;
    }
    case 'assigned': {
      const name = event.assigneeId ? state.users[event.assigneeId]?.name : 'nadie';
      return `Asignado a ${name ?? 'nadie'}`;
    }
    case 'label_added':
      return `Etiqueta añadida: ${event.label}`;
    case 'label_removed':
      return `Etiqueta removida: ${event.label}`;
    case 'status_changed':
      return 'Estado cambiado';
    default:
      return 'Evento';
  }
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
}

export const ConversationView: React.FC = () => {
  const { state, dispatch } = useStore();
  const [text, setText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const convId = state.selectedConversationId;
  const conv = convId ? state.conversations[convId] : null;
  const contact = conv ? state.contacts[conv.contactId] : null;

  const messages = (convId ? state.messages[convId] : null) ?? [];
  const events = (convId ? state.events[convId] : null) ?? [];

  const timeline: TimelineItem[] = [
    ...messages.map((m) => ({ kind: 'message' as const, data: m, sortKey: m.createdAt })),
    ...events.map((e) => ({ kind: 'event' as const, data: e, sortKey: e.createdAt })),
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline.length]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || !convId) return;
    dispatch({ type: 'SEND_MESSAGE', conversationId: convId, text: trimmed, isInternal });
    setText('');
  };

  if (!conv || !contact) {
    return (
      <div className="conv-view-panel">
        <div className="no-conv-selected">Selecciona una conversación</div>
      </div>
    );
  }

  return (
    <div className="conv-view-panel">
      <div className="conv-view-header">{contact.name}</div>
      <div className="conv-view-timeline">
        {timeline.map((item) => {
          if (item.kind === 'message') {
            const msg = item.data;
            const isAgent = msg.sender === 'agent';
            const bubbleClass = msg.type === 'internal_note'
              ? 'internal'
              : isAgent ? 'agent' : 'contact';
            return (
              <div key={msg.id} className={`msg-bubble-wrap ${isAgent ? 'agent' : 'contact'}`}>
                <div
                  className={`msg-bubble ${bubbleClass}`}
                  dangerouslySetInnerHTML={{ __html: escapeHtml(msg.text) }}
                />
                <span className="msg-time">{formatTime(msg.createdAt)}</span>
              </div>
            );
          } else {
            const evt = item.data;
            return (
              <div key={evt.id} className="timeline-event">
                <span className="timeline-event-chip">
                  {formatEventText(evt, state)}
                </span>
              </div>
            );
          }
        })}
        <div ref={bottomRef} />
      </div>
      <div className="conv-view-input">
        <div className="conv-view-input-toolbar">
          <label className="internal-toggle">
            <input
              type="checkbox"
              checked={isInternal}
              onChange={(e) => setIsInternal(e.target.checked)}
            />
            Nota interna
          </label>
        </div>
        <div className="conv-view-input-row">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={isInternal ? 'Escribe una nota interna...' : 'Escribe un mensaje...'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={isInternal ? { borderColor: 'var(--color-warning)' } : undefined}
          />
          <button className="send-btn" onClick={handleSend}>
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
};
