import React from 'react';
import { Header, SystemStatus } from '../components/layout';
import { ConversationList, ConversationView } from '../components/conversation';
import { 
  Filters, 
  DerivationPanel, 
  TagsPanel, 
  BotPanel, 
  HistoryPanel, 
  IntegrationsPanel 
} from '../components/workspace';
import { useApp } from '../../application/contexts/AppContext';

export const InboxPage: React.FC = () => {
  const { loading, error } = useApp();

  if (loading) {
    return (
      <main className="shell" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p>Cargando conversaciones...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="shell" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="primary">
            Recargar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="shell">
      <Header />
      <SystemStatus />
      
      <section className="workspace">
        <aside className="card">
          <ConversationList />
          <Filters />
        </aside>

        <ConversationView />

        <aside className="card">
          <DerivationPanel />
          <TagsPanel />
          <BotPanel />
          <HistoryPanel />
          <IntegrationsPanel />
        </aside>
      </section>
    </main>
  );
};