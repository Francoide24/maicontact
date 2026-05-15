import React from 'react';
import { mockUsers } from '../../../shared/mocks/users';

export const Header: React.FC = () => {
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
        <span>Vista de usuario</span>
        <select>
          {mockUsers.map(user => (
            <option key={user.name}>
              {user.name} - {user.role}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
};