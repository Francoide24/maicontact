import React from 'react';
import { useAuth } from '../../../application/contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <LoginPage />;

  return <>{children}</>;
};
