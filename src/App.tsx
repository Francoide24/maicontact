import React, { useState, useEffect } from 'react';
import { AuthProvider } from './application/contexts/AuthContext';
import { ProtectedRoute } from './presentation/components/auth/ProtectedRoute';
import { StoreProvider, useStore } from './state/store';
import { DataLoader } from './components/DataLoader';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { FunnelBoard } from './components/FunnelBoard';
import { ChatLayout } from './components/ChatLayout';
import { TeamPage } from './presentation/pages/TeamPage';
import { CampaignsPage } from './presentation/pages/CampaignsPage';

const COLLAPSE_KEY = 'maicontact_sidebar_collapsed';

function AppShell() {
  const { state } = useStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem(COLLAPSE_KEY, String(sidebarCollapsed)); } catch { /* ignore */ }
  }, [sidebarCollapsed]);

  const renderView = () => {
    if (state.dbLoading) {
      return (
        <div className="stub-view" style={{ flexDirection: 'column', gap: 12 }}>
          <span style={{ fontSize: 24 }}>⟳</span>
          <span style={{ fontSize: 14 }}>Cargando datos…</span>
        </div>
      );
    }
    if (state.dbError) {
      return (
        <div className="stub-view" style={{ flexDirection: 'column', gap: 8 }}>
          <span style={{ color: 'var(--color-danger)' }}>Error al cargar</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{state.dbError}</span>
        </div>
      );
    }
    switch (state.activeView) {
      case 'funnel':    return <FunnelBoard />;
      case 'chat':      return <ChatLayout />;
      case 'team':      return <TeamPage />;
      case 'campaigns': return <CampaignsPage />;
      case 'channels':  return <div className="stub-view">Canales — próximamente</div>;
      case 'templates': return <div className="stub-view">Plantillas Meta — próximamente</div>;
      case 'settings':  return <div className="stub-view">Configuración — próximamente</div>;
      default:          return null;
    }
  };

  return (
    <div className={`app-shell${sidebarCollapsed ? ' sidebar-collapsed' : ' sidebar-expanded'}`}>
      <Topbar />
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed((c) => !c)} />
      <main className="app-main">{renderView()}</main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <StoreProvider>
          <DataLoader>
            <AppShell />
          </DataLoader>
        </StoreProvider>
      </ProtectedRoute>
    </AuthProvider>
  );
}
