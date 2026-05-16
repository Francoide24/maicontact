import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { MockDataState, Message, AppUser, Campaign, Pool } from '../data/mockData';
import { loadState, saveState } from '../services/persistence';
import { moveConversationToStage } from '../services/stageRouting';
import type { OrgData } from '../infrastructure/api/db';

export type ActiveView = 'funnel' | 'chat' | 'channels' | 'team' | 'campaigns' | 'templates' | 'settings';

export interface AppState extends MockDataState {
  activeFunnelId: string | null;
  activeView: ActiveView;
  selectedConversationId: string | null;
  dbLoading: boolean;
  dbError: string | null;
}

type Action =
  // ── DB lifecycle ──────────────────────────────────────────────────────────
  | { type: 'DB_LOADING' }
  | { type: 'DB_ERROR'; message: string }
  | { type: 'HYDRATE'; data: OrgData }
  | { type: 'LOAD_MESSAGES_SUCCESS'; conversationId: string; messages: Message[] }
  // ── UI ────────────────────────────────────────────────────────────────────
  | { type: 'SET_ACTIVE_VIEW'; view: ActiveView }
  | { type: 'SET_ACTIVE_FUNNEL'; funnelId: string }
  | { type: 'SELECT_CONVERSATION'; conversationId: string | null }
  // ── Domain mutations ──────────────────────────────────────────────────────
  | { type: 'MOVE_CONVERSATION'; conversationId: string; targetStageId: string; actorId: string }
  | { type: 'SEND_MESSAGE'; conversationId: string; text: string; isInternal: boolean }
  | { type: 'CREATE_FUNNEL'; name: string; dbId?: string }
  | { type: 'CREATE_STAGE'; funnelId: string; name: string; dbId?: string }
  // Team / Users
  | { type: 'CREATE_USER'; user: Omit<AppUser, 'id'>; dbId?: string }
  | { type: 'UPDATE_USER'; userId: string; changes: Partial<AppUser> }
  | { type: 'TOGGLE_USER_STATUS'; userId: string }
  // Conversations
  | { type: 'CLOSE_CONVERSATION'; conversationId: string; closeReason: string }
  // Campaigns
  | { type: 'CREATE_CAMPAIGN'; campaign: Omit<Campaign, 'id'>; dbId?: string }
  | { type: 'UPDATE_CAMPAIGN'; campaignId: string; changes: Partial<Campaign> }
  // Pools
  | { type: 'CREATE_POOL'; pool: Omit<Pool, 'id'>; dbId?: string }
  | { type: 'UPDATE_POOL'; poolId: string; changes: Partial<Pool> }
  | { type: 'ADD_USER_TO_POOL'; poolId: string; userId: string }
  | { type: 'REMOVE_USER_FROM_POOL'; poolId: string; userId: string };

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {

    case 'DB_LOADING':
      return { ...state, dbLoading: true, dbError: null };

    case 'DB_ERROR':
      return { ...state, dbLoading: false, dbError: action.message };

    case 'HYDRATE': {
      const firstFunnelId = Object.keys(action.data.funnels)[0] ?? null;
      return {
        ...state,
        ...action.data,
        dbLoading: false,
        dbError: null,
        // Preserve active funnel if it still exists, else pick first
        activeFunnelId: (state.activeFunnelId && action.data.funnels[state.activeFunnelId])
          ? state.activeFunnelId
          : firstFunnelId,
      };
    }

    case 'LOAD_MESSAGES_SUCCESS':
      return {
        ...state,
        messages: { ...state.messages, [action.conversationId]: action.messages },
      };

    case 'SET_ACTIVE_VIEW':
      return { ...state, activeView: action.view };

    case 'SET_ACTIVE_FUNNEL':
      return { ...state, activeFunnelId: action.funnelId };

    case 'SELECT_CONVERSATION':
      return { ...state, selectedConversationId: action.conversationId };

    case 'CLOSE_CONVERSATION': {
      const conv = state.conversations[action.conversationId];
      if (!conv) return state;
      return {
        ...state,
        conversations: {
          ...state.conversations,
          [action.conversationId]: {
            ...conv,
            status: 'closed' as const,
            closeReason: action.closeReason,
            updatedAt: new Date().toISOString(),
          },
        },
        selectedConversationId:
          state.selectedConversationId === action.conversationId
            ? null
            : state.selectedConversationId,
      };
    }

    case 'MOVE_CONVERSATION': {
      const domain = extractDomainState(state);
      const updated = moveConversationToStage(domain, action.conversationId, action.targetStageId, { actorId: action.actorId });
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
        messages: { ...state.messages, [action.conversationId]: [...existing, msg] },
        conversations: {
          ...state.conversations,
          [action.conversationId]: { ...state.conversations[action.conversationId], updatedAt: msg.createdAt },
        },
      };
    }

    case 'CREATE_FUNNEL': {
      const id = action.dbId ?? newId('f');
      return {
        ...state,
        funnels: { ...state.funnels, [id]: { id, name: action.name, stageIds: [] } },
        activeFunnelId: id,
      };
    }

    case 'CREATE_STAGE': {
      const id = action.dbId ?? newId('s');
      const funnel = state.funnels[action.funnelId];
      if (!funnel) return state;
      const stage = {
        id, name: action.name, funnelId: action.funnelId, color: '#6366f1',
        campaignId: null, poolId: null, fixedUserId: null,
        assignmentStrategy: 'none' as const, n8nWebhookUrl: null,
        autoLabels: [], onEnterAutomation: null,
      };
      return {
        ...state,
        stages: { ...state.stages, [id]: stage },
        funnels: { ...state.funnels, [action.funnelId]: { ...funnel, stageIds: [...funnel.stageIds, id] } },
      };
    }

    case 'CREATE_USER': {
      const id = action.dbId ?? newId('u');
      const user: AppUser = { id, ...action.user };
      return { ...state, users: { ...state.users, [id]: user } };
    }

    case 'UPDATE_USER': {
      const existing = state.users[action.userId];
      if (!existing) return state;
      return { ...state, users: { ...state.users, [action.userId]: { ...existing, ...action.changes } } };
    }

    case 'TOGGLE_USER_STATUS': {
      const u = state.users[action.userId];
      if (!u) return state;
      return { ...state, users: { ...state.users, [action.userId]: { ...u, isActive: !u.isActive } } };
    }

    case 'CREATE_CAMPAIGN': {
      const id = action.dbId ?? newId('c');
      const campaign: Campaign = { id, ...action.campaign };
      return { ...state, campaigns: { ...state.campaigns, [id]: campaign } };
    }

    case 'UPDATE_CAMPAIGN': {
      const existing = state.campaigns[action.campaignId];
      if (!existing) return state;
      return { ...state, campaigns: { ...state.campaigns, [action.campaignId]: { ...existing, ...action.changes } } };
    }

    case 'CREATE_POOL': {
      const id = action.dbId ?? newId('pool');
      const pool: Pool = { id, ...action.pool };
      return { ...state, pools: { ...state.pools, [id]: pool } };
    }

    case 'UPDATE_POOL': {
      const existing = state.pools[action.poolId];
      if (!existing) return state;
      return { ...state, pools: { ...state.pools, [action.poolId]: { ...existing, ...action.changes } } };
    }

    case 'ADD_USER_TO_POOL': {
      const pool = state.pools[action.poolId];
      if (!pool || pool.userIds.includes(action.userId)) return state;
      const updated = { ...pool, userIds: [...pool.userIds, action.userId] };
      const user = state.users[action.userId];
      const updatedUser = user && !user.poolIds.includes(action.poolId)
        ? { ...user, poolIds: [...user.poolIds, action.poolId] }
        : user;
      return {
        ...state,
        pools: { ...state.pools, [action.poolId]: updated },
        users: updatedUser ? { ...state.users, [action.userId]: updatedUser } : state.users,
      };
    }

    case 'REMOVE_USER_FROM_POOL': {
      const pool = state.pools[action.poolId];
      if (!pool) return state;
      const updated = { ...pool, userIds: pool.userIds.filter((id) => id !== action.userId) };
      const user = state.users[action.userId];
      const updatedUser = user
        ? { ...user, poolIds: user.poolIds.filter((id) => id !== action.poolId) }
        : user;
      return {
        ...state,
        pools: { ...state.pools, [action.poolId]: updated },
        users: updatedUser ? { ...state.users, [action.userId]: updatedUser } : state.users,
      };
    }

    default:
      return state;
  }
}

function extractDomainState(appState: AppState): MockDataState {
  return {
    funnels: appState.funnels, stages: appState.stages, pools: appState.pools,
    users: appState.users, campaigns: appState.campaigns, contacts: appState.contacts,
    conversations: appState.conversations, messages: appState.messages,
    events: appState.events, automationRuns: appState.automationRuns,
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
    dbLoading: true,   // true until HYDRATE or DB_ERROR
    dbError: null,
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
  useEffect(() => { saveState(extractDomainState(state)); }, [state]);
  return <StoreContext.Provider value={{ state, dispatch }}>{children}</StoreContext.Provider>;
};
