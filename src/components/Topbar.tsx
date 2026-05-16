import React, { useState } from 'react';
import { useStore } from '../state/store';
import { useAuth } from '../application/contexts/AuthContext';
import { Modal } from './Modal';

export const Topbar: React.FC = () => {
  const { state, dispatch } = useStore();
  const { userProfile, signOut } = useAuth();
  const [showNewFunnelModal, setShowNewFunnelModal] = useState(false);
  const [newFunnelName, setNewFunnelName] = useState('');

  const activeFunnel = state.activeFunnelId ? state.funnels[state.activeFunnelId] : null;
  const funnelList = Object.values(state.funnels);

  const handleCreateFunnel = () => {
    const name = newFunnelName.trim();
    if (!name) return;
    dispatch({ type: 'CREATE_FUNNEL', name });
    setNewFunnelName('');
    setShowNewFunnelModal(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // ignore
    }
  };

  return (
    <>
      <header className="app-topbar">
        <div className="topbar-sidebar-space">
          <span className="topbar-brand">M</span>
        </div>

        {state.activeView === 'funnel' && (
          <div className="topbar-funnel-section">
            {funnelList.length > 1 ? (
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
            )}
            <button className="topbar-btn" onClick={() => setShowNewFunnelModal(true)}>
              + Nuevo embudo
            </button>
          </div>
        )}

        <div className="topbar-user-section">
          <span className="topbar-username">{userProfile?.name ?? 'Usuario'}</span>
          <button className="topbar-logout-btn" onClick={handleSignOut}>
            Salir
          </button>
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
            <button className="modal-btn secondary" onClick={() => setShowNewFunnelModal(false)}>
              Cancelar
            </button>
            <button className="modal-btn primary" onClick={handleCreateFunnel}>
              Crear
            </button>
          </div>
        </Modal>
      )}
    </>
  );
};
