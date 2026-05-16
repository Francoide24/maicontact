import React from 'react';
import { useAuth } from '../../../application/contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';

const ConfigErrorScreen: React.FC = () => (
  <div className="login-page">
    <div className="login-card" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem' }}>Configuración incompleta</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        Las variables de entorno de Supabase no están configuradas.
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> en el entorno de Cloudflare Pages.
      </p>
    </div>
  </div>
);

const ProfileMissingScreen: React.FC = () => (
  <div className="login-page">
    <div className="login-card" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem' }}>Sin perfil operacional</h2>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>
        Usuario autenticado sin perfil en la plataforma.
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Pide al administrador que cree tu usuario en <code>public.users</code>.
      </p>
    </div>
  </div>
);

const AuthErrorScreen: React.FC<{ message: string }> = ({ message }) => (
  <div className="login-page">
    <div className="login-card" style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem' }}>Error de autenticación</h2>
      <p style={{ color: 'var(--color-danger, #e53e3e)' }}>{message}</p>
    </div>
  </div>
);

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading, configError, profileMissing, authError } = useAuth();

  if (configError) return <ConfigErrorScreen />;

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-muted)' }}>Cargando…</p>
        </div>
      </div>
    );
  }

  if (authError) return <AuthErrorScreen message={authError} />;
  if (profileMissing) return <ProfileMissingScreen />;
  if (!isAuthenticated) return <LoginPage />;

  return <>{children}</>;
};
