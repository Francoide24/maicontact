/**
 * DataLoader — monta una sola vez dentro de AppShell.
 * Responsabilidades:
 *   1. Fetch inicial de datos org desde Supabase → dispatch HYDRATE
 *   2. Expone `useDbActions` para que los componentes disparen mutaciones
 *      que escriben a Supabase Y al store local simultáneamente
 *   3. (futuro) Subscripción Realtime
 */
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from '../application/contexts/AuthContext';
import { useStore } from '../state/store';
import {
  loadOrgData,
  dbCreateFunnel,
  dbCreateStage,
  dbMoveConversation,
  dbSendMessage,
  dbLoadMessages,
  dbCloseConversation,
  dbCreateCampaign,
  dbUpdateCampaign,
  dbCreatePool,
  dbUpdatePool,
  dbAddUserToPool,
  dbRemoveUserFromPool,
} from '../infrastructure/api/db';
import { apiCreateUser, apiUpdateUser } from '../infrastructure/api/usersApi';
import type { Campaign, Pool, AppUser } from '../data/mockData';
import { getPermissionsForRole } from '../application/services/rbac';

// ─── Context ─────────────────────────────────────────────────────────────────

export interface CreateUserInput {
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'agent';
  password?: string;
  campaignIds?: string[];
  poolIds?: string[];
  maxOpenConversations?: number;
}

interface DbActions {
  createFunnel: (name: string) => Promise<void>;
  createStage: (funnelId: string, name: string) => Promise<void>;
  moveConversation: (convId: string, stageId: string) => Promise<void>;
  sendMessage: (convId: string, text: string, isInternal: boolean) => Promise<void>;
  loadMessagesForConversation: (convId: string) => Promise<void>;
  createCampaign: (campaign: Omit<Campaign, 'id'>) => Promise<void>;
  updateCampaign: (id: string, changes: Partial<Campaign>) => Promise<void>;
  createPool: (pool: Omit<Pool, 'id'>) => Promise<void>;
  updatePool: (id: string, changes: Partial<Pool>) => Promise<void>;
  addUserToPool: (poolId: string, userId: string) => Promise<void>;
  removeUserFromPool: (poolId: string, userId: string) => Promise<void>;
  closeConversation: (convId: string, closeReason: string) => Promise<void>;
  // Real user operations via Pages Function
  createUser: (input: CreateUserInput) => Promise<void>;
  updateUser: (userId: string, changes: { name?: string; role?: 'admin' | 'supervisor' | 'agent'; is_active?: boolean }) => Promise<void>;
  toggleUserStatus: (userId: string, currentlyActive: boolean) => Promise<void>;
}

const DbActionsContext = createContext<DbActions | undefined>(undefined);

export const useDbActions = (): DbActions => {
  const ctx = useContext(DbActionsContext);
  if (!ctx) throw new Error('useDbActions must be used within DataLoader');
  return ctx;
};

// ─── Component ───────────────────────────────────────────────────────────────

export const DataLoader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { state, dispatch } = useStore();
  const loaded = useRef(false);

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser?.organizationId || loaded.current) return;
    loaded.current = true;

    dispatch({ type: 'DB_LOADING' });

    loadOrgData(currentUser.organizationId).then((data) => {
      if (data) {
        dispatch({ type: 'HYDRATE', data });
      } else {
        dispatch({ type: 'DB_ERROR', message: 'No se pudo cargar los datos. Verifica la conexión.' });
      }
    });
  }, [currentUser?.organizationId, dispatch]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const orgId = currentUser?.organizationId ?? '';
  const userId = currentUser?.id ?? '';

  const actions: DbActions = {

    async createFunnel(name) {
      // Optimistic: dispatch inmediato con id temporal
      dispatch({ type: 'CREATE_FUNNEL', name });
      // Write to DB and swap id if needed (simple approach: re-hydrate is fine for funnels)
      const dbId = await dbCreateFunnel(orgId, name);
      if (dbId) {
        // Re-fetch to sync real UUIDs — avoids id drift
        const fresh = await loadOrgData(orgId);
        if (fresh) dispatch({ type: 'HYDRATE', data: fresh });
      }
    },

    async createStage(funnelId, name) {
      const position = Object.values(state.stages).filter((s) => s.funnelId === funnelId).length;
      dispatch({ type: 'CREATE_STAGE', funnelId, name });
      const dbId = await dbCreateStage(funnelId, name, position);
      if (dbId) {
        const fresh = await loadOrgData(orgId);
        if (fresh) dispatch({ type: 'HYDRATE', data: fresh });
      }
    },

    async moveConversation(convId, stageId) {
      dispatch({ type: 'MOVE_CONVERSATION', conversationId: convId, targetStageId: stageId, actorId: userId });
      await dbMoveConversation(convId, stageId);
    },

    async sendMessage(convId, text, isInternal) {
      dispatch({ type: 'SEND_MESSAGE', conversationId: convId, text, isInternal });
      await dbSendMessage(convId, text, isInternal, userId);
    },

    async closeConversation(convId, closeReason) {
      dispatch({ type: 'CLOSE_CONVERSATION', conversationId: convId, closeReason });
      await dbCloseConversation(convId, closeReason);
    },

    async loadMessagesForConversation(convId) {
      if (state.messages[convId]?.length) return; // already loaded
      const messages = await dbLoadMessages(convId);
      dispatch({ type: 'LOAD_MESSAGES_SUCCESS', conversationId: convId, messages });
    },

    async createCampaign(campaign) {
      dispatch({ type: 'CREATE_CAMPAIGN', campaign });
      const dbId = await dbCreateCampaign(orgId, campaign.name, campaign.funnelId);
      if (dbId) {
        const fresh = await loadOrgData(orgId);
        if (fresh) dispatch({ type: 'HYDRATE', data: fresh });
      }
    },

    async updateCampaign(id, changes) {
      dispatch({ type: 'UPDATE_CAMPAIGN', campaignId: id, changes });
      await dbUpdateCampaign(id, {
        name: changes.name,
        active: changes.active,
        funnel_id: changes.funnelId,
        channels: changes.channels,
        user_ids: changes.userIds,
      });
    },

    async createPool(pool) {
      dispatch({ type: 'CREATE_POOL', pool });
      const dbId = await dbCreatePool(orgId, pool.name, pool.strategy);
      if (dbId) {
        const fresh = await loadOrgData(orgId);
        if (fresh) dispatch({ type: 'HYDRATE', data: fresh });
      }
    },

    async updatePool(id, changes) {
      dispatch({ type: 'UPDATE_POOL', poolId: id, changes });
      await dbUpdatePool(id, {
        name: changes.name,
        strategy: changes.strategy,
        max_open_per_user: changes.maxOpenPerUser,
      });
    },

    async addUserToPool(poolId, userId_) {
      dispatch({ type: 'ADD_USER_TO_POOL', poolId, userId: userId_ });
      await dbAddUserToPool(poolId, userId_);
    },

    async removeUserFromPool(poolId, userId_) {
      dispatch({ type: 'REMOVE_USER_FROM_POOL', poolId, userId: userId_ });
      await dbRemoveUserFromPool(poolId, userId_);
    },

    // ── Real user operations via Pages Function ───────────────────────────
    async createUser(input) {
      const result = await apiCreateUser({
        email: input.email,
        name: input.name,
        role: input.role,
        password: input.password,
      });
      // Add to local store with the real UUID from Supabase
      dispatch({
        type: 'CREATE_USER',
        user: {
          name: result.name,
          email: result.email,
          role: result.role,
          permissions: getPermissionsForRole(result.role),
          isActive: true,
          campaignIds: input.campaignIds ?? [],
          poolIds: input.poolIds ?? [],
          maxOpenConversations: input.maxOpenConversations ?? 15,
        },
        dbId: result.id,
      } as Parameters<typeof dispatch>[0]);
      // Re-hydrate to sync users from DB
      const fresh = await loadOrgData(orgId);
      if (fresh) dispatch({ type: 'HYDRATE', data: fresh });
    },

    async updateUser(userId_, changes) {
      // Optimistic local update
      dispatch({ type: 'UPDATE_USER', userId: userId_, changes: {
        name: changes.name,
        role: changes.role,
        isActive: changes.is_active,
        ...(changes.role ? { permissions: getPermissionsForRole(changes.role) } : {}),
      }});
      await apiUpdateUser(userId_, changes);
    },

    async toggleUserStatus(userId_, currentlyActive) {
      dispatch({ type: 'TOGGLE_USER_STATUS', userId: userId_ });
      await apiUpdateUser(userId_, { is_active: !currentlyActive });
    },
  };

  return (
    <DbActionsContext.Provider value={actions}>
      {children}
    </DbActionsContext.Provider>
  );
};
