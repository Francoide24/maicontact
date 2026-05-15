import React from 'react';
import { useAuth } from '../../../application/contexts/AuthContext';
import { LoginPage } from '../../pages/LoginPage';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'admin' | 'supervisor' | 'agent'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return (
      <main className="shell" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ padding: '2rem' }}>
          <p>Cargando...</p>
        </div>
      </main>
    );
  }

  if (!userProfile) {
    return <LoginPage />;
  }

  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return (
      <main className="shell" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Acceso Denegado</h2>
          <p>No tienes permisos para ver esta página.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
};