import React from 'react';
import { useAuth } from '../../../application/contexts/AuthContext';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = { admin: 'Administrador', supervisor: 'Supervisor', agent: 'Agente' };
    return labels[role] ?? role;
  };

  return (
    <header className="hero">
      <div>
        <p className="eyebrow">MAIHUE - PLATAFORMA OPERACIONAL</p>
        <h1>Inbox omnicanal</h1>
      </div>
      <div className="user-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Usuario actual</span>
            <div>
              <strong>{currentUser?.name}</strong> - {getRoleLabel(currentUser?.role ?? '')}
            </div>
          </div>
          <button onClick={logout} style={{ padding: '0.5rem 1rem' }}>Cerrar sesión</button>
        </div>
      </div>
    </header>
  );
};
