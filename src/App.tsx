import React from 'react';
import { AuthProvider } from './application/contexts/AuthContext';
import { ProtectedRoute } from './presentation/components/auth/ProtectedRoute';
import { StoreProvider, useStore } from './state/store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { FunnelBoard } from './components/FunnelBoard';
import { ChatLayout } from './components/ChatLayout';
import { TeamPage } from './presentation/pages/TeamPage';
import { CampaignsPage } from './presentation/pages/CampaignsPage';

function AppShell() {
  const { state } = useStore();

  const renderView = () => {
    switch (state.activeView) {
      case 'funnel':    return <FunnelBoard />;
      case 'chat':      return <ChatLayout />;
      case 'team':      return <TeamPage />;
      case 'campaigns': return <CampaignsPage />;
      case 'channels':  return <div className="stub-view">Canales</div>;
      case 'templates': return <div className="stub-view">Plantillas Meta</div>;
      case 'settings':  return <div className="stub-view">Configuración</div>;
      default:          return null;
    }
  };

  return (
    <div className="app-shell">
      <Topbar />
      <Sidebar />
      <main className="app-main">{renderView()}</main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <StoreProvider>
          <AppShell />
        </StoreProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
