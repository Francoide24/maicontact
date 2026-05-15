import React from 'react';
import { ConversationMock } from '../../../shared/mocks/conversations';

interface ConversationViewProps {
  conversation: ConversationMock;
}

export const ConversationView: React.FC<ConversationViewProps> = ({ conversation }) => {
  return (
    <section className="card center-pane">
      <p className="eyebrow">{conversation.channel.toUpperCase()}</p>
      <h2>{conversation.name}</h2>
      <p className="subtitle">
        +56 9 3522 0880 - {conversation.area} - asignado a {conversation.assignee}
      </p>
      <div className="timeline">
        <article className="message inbound">Hola, necesito ayuda de Maihue.</article>
        <article className="message bot-note">
          Intencion detectada. Preparando derivacion con contexto completo.
        </article>
        <article className="message event">
          Transferencia lista: historial, tags, resumen IA, motivo y SLA se mantienen en la conversacion.
        </article>
        <article className="message internal">
          Nota interna: validar cobertura y estado comercial antes de ofrecer agenda.
        </article>
      </div>
      <div className="composer">
        <input placeholder="Escribe respuesta, nota interna o instruccion para IA..." />
        <button>Enviar</button>
      </div>
    </section>
  );
};