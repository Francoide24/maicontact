import React from 'react';
import { AuthProvider } from './application/contexts/AuthContext';
import { ProtectedRoute } from './presentation/components/auth/ProtectedRoute';
import { StoreProvider, useStore } from './state/store';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { FunnelBoard } from './components/FunnelBoard';
import { ChatLayout } from './components/ChatLayout';

function AppShell() {
  const { state } = useStore();

  return (
    <div className="app-shell">
      <Topbar />
      <Sidebar />
      <main className="app-main">
        {state.activeView === 'funnel' && <FunnelBoard />}
        {state.activeView === 'chat' && <ChatLayout />}
        {state.activeView === 'channels' && <div className="stub-view">Canales</div>}
        {state.activeView === 'team' && <div className="stub-view">Equipo</div>}
        {state.activeView === 'settings' && <div className="stub-view">Configuración</div>}
      </main>
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
