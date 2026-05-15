import React from 'react';
import { useAuth } from '../../../application/contexts/AuthContext';

export const Header: React.FC = () => {
  const { userProfile, signOut } = useAuth();

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Administrador',
      supervisor: 'Supervisor',
      agent: 'Agente'
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <header className="hero">
      <div>
        <p className="eyebrow">MAIHUE - PLATAFORMA OPERACIONAL</p>
        <h1>Inbox omnicanal</h1>
        <p className="subtitle">
          Bandeja con derivacion, asignacion, historial completo, supervision e integraciones reales.
        </p>
      </div>
      <div className="user-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.875rem', opacity: 0.7 }}>Usuario actual</span>
            <div>
              <strong>{userProfile?.name}</strong> - {getRoleLabel(userProfile?.role || '')}
            </div>
          </div>
          <button 
            onClick={signOut} 
            className="secondary"
            style={{ padding: '0.5rem 1rem' }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
};