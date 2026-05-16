/**
 * AppContext legacy — mantenido para compatibilidad con componentes de presentación
 * que aún usan el viejo flujo Supabase. No se usa en el flujo principal de la app.
 * TODO: limpiar junto con src/presentation/components/workspace/ en próxima iteración.
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../../infrastructure/api/supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

interface LegacyAppContextType {
  conversations: AnyRecord[];
  areas: AnyRecord[];
  tags: AnyRecord[];
  selectedConversationId: string | null;
  selectedConversation: AnyRecord | null;
  loading: boolean;
  error: string | null;
  selectConversation: (id: string) => void;
  refreshConversations: () => Promise<void>;
  sendMessage: (conversationId: string, body: string, isInternal?: boolean) => Promise<void>;
  assignConversation: (conversationId: string, userId?: string, areaId?: string) => Promise<void>;
  updateConversationStatus: (conversationId: string, status: string) => Promise<void>;
  addTag: (conversationId: string, tagId: string) => Promise<void>;
  removeTag: (conversationId: string, tagId: string) => Promise<void>;
}

const AppContext = createContext<LegacyAppContextType | undefined>(undefined);

export const useApp = (): LegacyAppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conversations, setConversations]                 = useState<AnyRecord[]>([]);
  const [areas]                                           = useState<AnyRecord[]>([]);
  const [tags]                                            = useState<AnyRecord[]>([]);
  const [selectedConversationId, setSelectedId]          = useState<string | null>(null);
  const [loading, setLoading]                             = useState(false);
  const [error]                                           = useState<string | null>(null);

  const selectedConversation = conversations.find(
    (c) => c['id'] === selectedConversationId
  ) ?? null;

  useEffect(() => {
    refreshConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshConversations = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any).from('conversations').select('*');
      setConversations(data ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const noop = async () => { /* stub */ };

  return (
    <AppContext.Provider
      value={{
        conversations,
        areas,
        tags,
        selectedConversationId,
        selectedConversation,
        loading,
        error,
        selectConversation: setSelectedId,
        refreshConversations,
        sendMessage: noop,
        assignConversation: noop,
        updateConversationStatus: noop,
        addTag: noop,
        removeTag: noop,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
