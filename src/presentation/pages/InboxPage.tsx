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
import { useConversationSelection } from '../../application/hooks/useConversationSelection';
import { mockConversations } from '../../shared/mocks/conversations';

export const InboxPage: React.FC = () => {
  const { activeIndex, handleSelect } = useConversationSelection();
  const activeConversation = mockConversations[activeIndex];

  return (
    <main className="shell">
      <Header />
      <SystemStatus />
      
      <section className="workspace">
        <aside className="card">
          <ConversationList 
            activeIndex={activeIndex} 
            onSelect={handleSelect} 
          />
          <Filters />
        </aside>

        <ConversationView conversation={activeConversation} />

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