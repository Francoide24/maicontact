import React, { useState } from 'react';
import { useStore } from '../state/store';
import { FunnelColumn } from './FunnelColumn';
import { Modal } from './Modal';

export const FunnelBoard: React.FC = () => {
  const { state, dispatch } = useStore();
  const [showNewStageModal, setShowNewStageModal] = useState(false);
  const [newStageName, setNewStageName] = useState('');

  const activeFunnel = state.activeFunnelId ? state.funnels[state.activeFunnelId] : null;

  const handleDragStart = (e: React.DragEvent, conversationId: string) => {
    e.dataTransfer.setData('conversationId', conversationId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCreateStage = () => {
    const name = newStageName.trim();
    if (!name || !state.activeFunnelId) return;
    dispatch({ type: 'CREATE_STAGE', funnelId: state.activeFunnelId, name });
    setNewStageName('');
    setShowNewStageModal(false);
  };

  if (!activeFunnel) {
    return (
      <div className="stub-view">
        No hay embudos. Crea uno desde la barra superior.
      </div>
    );
  }

  const stages = activeFunnel.stageIds
    .map((id) => state.stages[id])
    .filter(Boolean);

  const convsByStage = Object.values(state.conversations).reduce<Record<string, typeof state.conversations[string][]>>(
    (acc, conv) => {
      if (conv.funnelId !== activeFunnel.id) return acc;
      if (!acc[conv.stageId]) acc[conv.stageId] = [];
      acc[conv.stageId].push(conv);
      return acc;
    },
    {}
  );

  return (
    <>
      <div className="funnel-board">
        {stages.map((stage) => (
          <FunnelColumn
            key={stage.id}
            stage={stage}
            conversations={convsByStage[stage.id] ?? []}
            onDragStart={handleDragStart}
          />
        ))}
        <button
          className="funnel-new-stage-btn"
          onClick={() => setShowNewStageModal(true)}
        >
          ＋ Nueva etapa
        </button>
      </div>

      {showNewStageModal && (
        <Modal title="Nueva Etapa" onClose={() => setShowNewStageModal(false)}>
          <div className="modal-field">
            <label htmlFor="stage-name">Nombre de la etapa</label>
            <input
              id="stage-name"
              type="text"
              value={newStageName}
              onChange={(e) => setNewStageName(e.target.value)}
              placeholder="Ej: En negociación"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateStage(); }}
            />
          </div>
          <div className="modal-actions">
            <button className="modal-btn secondary" onClick={() => setShowNewStageModal(false)}>
              Cancelar
            </button>
            <button className="modal-btn primary" onClick={handleCreateStage}>
              Crear
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
