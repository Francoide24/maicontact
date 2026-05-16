import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { MockDataState, Message } from '../data/mockData';
import { loadState, saveState } from '../services/persistence';
import { moveConversationToStage } from '../services/stageRouting';

export type ActiveView = 'funnel' | 'chat' | 'channels' | 'team' | 'settings';

export interface AppState extends MockDataState {
  activeFunnelId: string | null;
  activeView: ActiveView;
  selectedConversationId: string | null;
}

type Action =
  | { type: 'SET_ACTIVE_VIEW'; view: ActiveView }
  | { type: 'SET_ACTIVE_FUNNEL'; funnelId: string }
  | { type: 'SELECT_CONVERSATION'; conversationId: string | null }
  | { type: 'MOVE_CONVERSATION'; conversationId: string; targetStageId: string; actorId: string }
  | { type: 'SEND_MESSAGE'; conversationId: string; text: string; isInternal: boolean }
  | { type: 'CREATE_FUNNEL'; name: string }
  | { type: 'CREATE_STAGE'; funnelId: string; name: string };

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view };

    case 'SET_ACTIVE_FUNNEL':
      return { ...state, activeFunnelId: action.funnelId };

    case 'SELECT_CONVERSATION':
      return { ...state, selectedConversationId: action.conversationId };

    case 'MOVE_CONVERSATION': {
      const domainState: MockDataState = extractDomainState(state);
      const updated = moveConversationToStage(domainState, action.conversationId, action.targetStageId, { actorId: action.actorId });
      return { ...state, ...updated };
    }

    case 'SEND_MESSAGE': {
      const msg: Message = {
        id: newId('msg'),
        conversationId: action.conversationId,
        type: action.isInternal ? 'internal_note' : 'text',
        sender: 'agent',
        text: action.text,
        createdAt: new Date().toISOString(),
      };
      const existing = state.messages[action.conversationId] ?? [];
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.conversationId]: [...existing, msg],
        },
        conversations: {
          ...state.conversations,
          [action.conversationId]: {
            ...state.conversations[action.conversationId],
            updatedAt: msg.createdAt,
          },
        },
      };
    }

    case 'CREATE_FUNNEL': {
      const id = newId('f');
      return {
        ...state,
        funnels: {
          ...state.funnels,
          [id]: { id, name: action.name, stageIds: [] },
        },
        activeFunnelId: id,
      };
    }

    case 'CREATE_STAGE': {
      const id = newId('s');
      const funnel = state.funnels[action.funnelId];
      if (!funnel) return state;
      const stage = {
        id,
        name: action.name,
        funnelId: action.funnelId,
        color: '#6366f1',
        campaignId: null,
        poolId: null,
        fixedUserId: null,
        assignmentStrategy: 'none' as const,
        n8nWebhookUrl: null,
        autoLabels: [],
        onEnterAutomation: null,
      };
      return {
        ...state,
        stages: { ...state.stages, [id]: stage },
        funnels: {
          ...state.funnels,
          [action.funnelId]: {
            ...funnel,
            stageIds: [...funnel.stageIds, id],
          },
        },
      };
    }

    default:
      return state;
  }
}

function extractDomainState(appState: AppState): MockDataState {
  return {
    funnels: appState.funnels,
    stages: appState.stages,
    pools: appState.pools,
    users: appState.users,
    campaigns: appState.campaigns,
    contacts: appState.contacts,
    conversations: appState.conversations,
    messages: appState.messages,
    events: appState.events,
    automationRuns: appState.automationRuns,
    assignmentState: appState.assignmentState,
  };
}

function buildInitialState(): AppState {
  const persisted = loadState();
  const firstFunnelId = Object.keys(persisted.funnels)[0] ?? null;
  return {
    ...persisted,
    activeFunnelId: firstFunnelId,
    activeView: 'funnel',
    selectedConversationId: null,
  };
}

interface StoreContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const useStore = (): StoreContextType => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitialState);

  useEffect(() => {
    saveState(extractDomainState(state));
  }, [state]);

  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};
