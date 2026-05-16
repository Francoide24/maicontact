import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useAuth } from '../application/contexts/AuthContext';
import { can } from '../application/services/rbac';
import { Modal } from './Modal';

export const Topbar: React.FC = () => {
  const { state, dispatch } = useStore();
  const { currentUser, logout } = useAuth();

  const [showNewFunnelModal, setShowNewFunnelModal]   = useState(false);
  const [showNewStageModal, setShowNewStageModal]     = useState(false);
  const [newFunnelName, setNewFunnelName]             = useState('');
  const [newStageName, setNewStageName]               = useState('');

  const activeFunnel   = state.activeFunnelId ? state.funnels[state.activeFunnelId] : null;
  const funnelList     = Object.values(state.funnels);
  const isFunnelView   = state.activeView === 'funnel';
  const canManage      = can(currentUser, 'funnels.manage');

  const handleCreateFunnel = () => {
    const name = newFunnelName.trim();
    if (!name) return;
    dispatch({ type: 'CREATE_FUNNEL', name });
    setNewFunnelName('');
    setShowNewFunnelModal(false);
  };

  const handleCreateStage = () => {
    const name = newStageName.trim();
    if (!name || !state.activeFunnelId) return;
    dispatch({ type: 'CREATE_STAGE', funnelId: state.activeFunnelId, name });
    setNewStageName('');
    setShowNewStageModal(false);
  };

  return (
    <>
      <header className="app-topbar">
        {/* Left: brand + funnel selector */}
        <div className="topbar-left">
          <span className="topbar-brand">M</span>
          {isFunnelView && (
            funnelList.length > 1 ? (
              <select
                className="topbar-funnel-select"
                value={state.activeFunnelId ?? ''}
                onChange={(e) => dispatch({ type: 'SET_ACTIVE_FUNNEL', funnelId: e.target.value })}
              >
                {funnelList.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            ) : (
              <span className="topbar-funnel-name">{activeFunnel?.name ?? 'Sin embudo'}</span>
            )
          )}
          {!isFunnelView && (
            <span className="topbar-view-name">
              {({'chat': 'Chat', 'channels': 'Canales', 'team': 'Equipo', 'campaigns': 'Campañas', 'templates': 'Plantillas Meta', 'settings': 'Configuración'} as Record<string, string>)[state.activeView] ?? ''}
            </span>
          )}
        </div>

        {/* Right: actions + user */}
        <div className="topbar-right">
          {isFunnelView && canManage && (
            <div className="topbar-actions">
              <button className="topbar-btn" onClick={() => setShowNewStageModal(true)}>
                + Nueva etapa
              </button>
              <button className="topbar-btn" onClick={() => setShowNewFunnelModal(true)}>
                + Nuevo embudo
              </button>
              <button className="topbar-btn topbar-btn-accent">
                + Inbound
              </button>
            </div>
          )}
          <div className="topbar-user">
            <span className="topbar-username">{currentUser?.name ?? 'Usuario'}</span>
            <button className="topbar-logout-btn" onClick={logout} title="Cerrar sesión">
              Salir
            </button>
          </div>
        </div>
      </header>

      {showNewFunnelModal && (
        <Modal title="Nuevo Embudo" onClose={() => setShowNewFunnelModal(false)}>
          <div className="modal-field">
            <label htmlFor="funnel-name">Nombre del embudo</label>
            <input
              id="funnel-name"
              type="text"
              value={newFunnelName}
              onChange={(e) => setNewFunnelName(e.target.value)}
              placeholder="Ej: Leads Empresa"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreateFunnel(); }}
            />
          </div>
          <div className="modal-actions">
            <button className="modal-btn secondary" onClick={() => setShowNewFunnelModal(false)}>Cancelar</button>
            <button className="modal-btn primary" onClick={handleCreateFunnel}>Crear</button>
          </div>
        </Modal>
      )}

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
          <p className="modal-hint">Se agregará al embudo: <strong>{activeFunnel?.name ?? '—'}</strong></p>
          <div className="modal-actions">
            <button className="modal-btn secondary" onClick={() => setShowNewStageModal(false)}>Cancelar</button>
            <button className="modal-btn primary" onClick={handleCreateStage}>Crear</button>
          </div>
        </Modal>
      )}
    </>
  );
};
