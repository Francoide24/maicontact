import React, { useState } from 'react';
import type { ConvEvent } from '../data/mockData';
import { useStore } from '../state/store';
import { useDbActions } from './DataLoader';

const CLOSE_REASONS = ['Resuelto', 'Sin respuesta', 'Vendido', 'No calificado', 'Duplicado', 'Otro'];

function formatEventText(event: ConvEvent, state: ReturnType<typeof useStore>['state']): string {
  switch (event.type) {
    case 'stage_changed': {
      const from = event.fromStageId ? state.stages[event.fromStageId]?.name : '?';
      const to = event.toStageId ? state.stages[event.toStageId]?.name : '?';
      return `Etapa: ${from ?? '?'} → ${to ?? '?'}`;
    }
    case 'assigned': {
      const name = event.assigneeId ? state.users[event.assigneeId]?.name : 'nadie';
      return `Asignado a ${name ?? 'nadie'}`;
    }
    case 'label_added':
      return `+ Etiqueta: ${event.label}`;
    case 'label_removed':
      return `- Etiqueta: ${event.label}`;
    case 'status_changed':
      return 'Estado cambiado';
    default:
      return 'Evento';
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-CL', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function CloseModal({ convId, onClose }: { convId: string; onClose: () => void }) {
  const { closeConversation } = useDbActions();
  const [selected, setSelected] = useState('Resuelto');
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    const reason = selected === 'Otro' ? (custom.trim() || 'Otro') : selected;
    setSaving(true);
    await closeConversation(convId, reason);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <h3 className="modal-title">Cerrar conversación</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {CLOSE_REASONS.map((r) => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14 }}>
              <input
                type="radio"
                name="closeReason"
                value={r}
                checked={selected === r}
                onChange={() => setSelected(r)}
              />
              {r}
            </label>
          ))}
          {selected === 'Otro' && (
            <input
              style={{ width: '100%', padding: '6px 10px', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)', fontSize: 13 }}
              placeholder="Describe el motivo..."
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              autoFocus
            />
          )}
        </div>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
          <button className="btn btn-danger" onClick={handleConfirm} disabled={saving}>
            {saving ? 'Cerrando...' : 'Cerrar conversación'}
          </button>
        </div>
      </div>
    </div>
  );
}

export const TicketDetailPanel: React.FC = () => {
  const { state, dispatch } = useStore();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const convId = state.selectedConversationId;
  const conv = convId ? state.conversations[convId] : null;

  if (!conv) {
    return (
      <div className="ticket-detail-panel">
        <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
          Selecciona una conversación
        </span>
      </div>
    );
  }

  const stage = state.stages[conv.stageId];
  const assignee = conv.assigneeId ? state.users[conv.assigneeId] : null;
  const campaign = conv.campaignId ? state.campaigns[conv.campaignId] : null;
  const events = (state.events[conv.id] ?? []).slice().sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  );

  const activeFunnel = state.activeFunnelId ? state.funnels[state.activeFunnelId] : null;
  const stagesInFunnel = (activeFunnel?.stageIds ?? conv.funnelId
    ? state.funnels[conv.funnelId]?.stageIds ?? []
    : []).map((id) => state.stages[id]).filter(Boolean);

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({
      type: 'MOVE_CONVERSATION',
      conversationId: conv.id,
      targetStageId: e.target.value,
      actorId: 'u_franco',
    });
  };

  return (
    <div className="ticket-detail-panel">
      {showCloseModal && (
        <CloseModal convId={conv.id} onClose={() => setShowCloseModal(false)} />
      )}

      {/* Etapa */}
      <div className="ticket-detail-section">
        <div className="ticket-detail-section-title">Etapa</div>
        <select
          className="ticket-detail-select"
          value={conv.stageId}
          onChange={handleStageChange}
          disabled={conv.status === 'closed'}
        >
          {stagesInFunnel.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Info */}
      <div className="ticket-detail-section">
        <div className="ticket-detail-section-title">Información</div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Ejecutivo</span>
          <span className="ticket-detail-value">{assignee?.name ?? '—'}</span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Campaña</span>
          <span className="ticket-detail-value">{campaign?.name ?? '—'}</span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Canal</span>
          <span className="ticket-detail-value">{state.contacts[conv.contactId]?.channel ?? '—'}</span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Prioridad</span>
          <span className={`priority-badge priority-${conv.priority}`}>{conv.priority}</span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Estado</span>
          <span className="ticket-detail-value">{conv.status === 'open' ? 'Abierto' : 'Cerrado'}</span>
        </div>
        {conv.status === 'closed' && conv.closeReason && (
          <div className="ticket-detail-row">
            <span className="ticket-detail-label">Motivo cierre</span>
            <span className="ticket-detail-value">{conv.closeReason}</span>
          </div>
        )}
      </div>

      {/* Etiquetas */}
      <div className="ticket-detail-section">
        <div className="ticket-detail-section-title">Etiquetas</div>
        <div className="labels-container">
          {conv.labels.length > 0
            ? conv.labels.map((l) => <span key={l} className="label-chip">{l}</span>)
            : <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Sin etiquetas</span>
          }
        </div>
      </div>

      {/* SLA */}
      <div className="ticket-detail-section">
        <div className="ticket-detail-section-title">SLA</div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Creado</span>
          <span className="ticket-detail-value" style={{ fontSize: '11px' }}>
            {formatDateTime(conv.createdAt)}
          </span>
        </div>
        <div className="ticket-detail-row">
          <span className="ticket-detail-label">Actualizado</span>
          <span className="ticket-detail-value" style={{ fontSize: '11px' }}>
            {formatDateTime(conv.updatedAt)}
          </span>
        </div>
      </div>

      {/* Etapa info */}
      {stage && (
        <div className="ticket-detail-section">
          <div className="ticket-detail-section-title">Configuración etapa</div>
          <div className="ticket-detail-row">
            <span className="ticket-detail-label">Estrategia</span>
            <span className="ticket-detail-value">{stage.assignmentStrategy}</span>
          </div>
        </div>
      )}

      {/* Historial de eventos */}
      <div className="ticket-detail-section">
        <div className="ticket-detail-section-title">Historial</div>
        <div className="detail-event-list">
          {events.length === 0 && (
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Sin eventos</span>
          )}
          {events.map((evt) => (
            <div key={evt.id} className="detail-event-item">
              <div>{formatEventText(evt, state)}</div>
              <div className="detail-event-time">{formatDateTime(evt.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cerrar */}
      {conv.status === 'open' && (
        <div className="ticket-detail-section" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <button
            className="btn btn-danger"
            style={{ width: '100%' }}
            onClick={() => setShowCloseModal(true)}
          >
            Cerrar conversación
          </button>
        </div>
      )}
    </div>
  );
};
