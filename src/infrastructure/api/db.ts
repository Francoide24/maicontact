/**
 * Capa de acceso a datos — mapea filas Supabase a tipos de dominio.
 * Todas las funciones retornan null / [] en caso de error; nunca lanzan.
 */
import { getSupabaseClient } from './supabase';
import { getPermissionsForRole } from '../../application/services/rbac';
import type {
  Funnel, Stage, Pool, Campaign, AppUser,
  Contact, Conversation, Message, MockDataState,
} from '../../data/mockData';

// ─── Helpers ────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sb(): any {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase not configured');
  return client;
}

// ─── LOAD (fetch completo de la org al montar) ───────────────────────────────

export interface OrgData extends Pick<MockDataState,
  'funnels' | 'stages' | 'pools' | 'campaigns' | 'users' |
  'contacts' | 'conversations' | 'messages'
> {}

export async function loadOrgData(orgId: string): Promise<OrgData | null> {
  try {
    const client = sb();

    const [
      { data: funnelRows },
      { data: stageRows },
      { data: poolRows },
      { data: poolUserRows },
      { data: campaignRows },
      { data: campaignPoolRows },
      { data: userRows },
      { data: contactRows },
      { data: convRows },
    ] = await Promise.all([
      client.from('funnels').select('*').eq('organization_id', orgId),
      client.from('stages').select('*').order('position'),
      client.from('pools').select('*').eq('organization_id', orgId),
      client.from('pool_users').select('pool_id, user_id'),
      client.from('campaigns').select('*').eq('organization_id', orgId),
      client.from('campaign_pools').select('campaign_id, pool_id'),
      client.from('users').select('*').eq('organization_id', orgId),
      client.from('contacts').select('*').eq('organization_id', orgId),
      client.from('conversations').select('*').eq('organization_id', orgId).neq('status', 'closed'),
    ]);

    // Funnels — build stageIds from stages
    const stagesByFunnel: Record<string, string[]> = {};
    for (const s of stageRows ?? []) {
      if (!stagesByFunnel[s.funnel_id]) stagesByFunnel[s.funnel_id] = [];
      stagesByFunnel[s.funnel_id].push(s.id);
    }
    const funnels: Record<string, Funnel> = {};
    for (const f of funnelRows ?? []) {
      funnels[f.id] = { id: f.id, name: f.name, stageIds: stagesByFunnel[f.id] ?? [] };
    }

    // Stages
    const stages: Record<string, Stage> = {};
    for (const s of stageRows ?? []) {
      // Only include stages that belong to this org's funnels
      if (!funnels[s.funnel_id]) continue;
      stages[s.id] = {
        id: s.id,
        name: s.name,
        funnelId: s.funnel_id,
        color: s.color ?? '#6366f1',
        campaignId: s.campaign_id ?? null,
        poolId: s.pool_id ?? null,
        fixedUserId: s.fixed_user_id ?? null,
        assignmentStrategy: (s.assignment_strategy as Stage['assignmentStrategy']) ?? 'none',
        n8nWebhookUrl: s.n8n_webhook_url ?? null,
        autoLabels: s.auto_labels ?? [],
        onEnterAutomation: s.on_enter_automation ?? null,
      };
    }

    // Pools — build userIds from pool_users
    const usersByPool: Record<string, string[]> = {};
    for (const pu of poolUserRows ?? []) {
      if (!usersByPool[pu.pool_id]) usersByPool[pu.pool_id] = [];
      usersByPool[pu.pool_id].push(pu.user_id);
    }
    // Campaigns in each pool (reverse of campaign_pools)
    const campaignsByPool: Record<string, string[]> = {};
    for (const cp of campaignPoolRows ?? []) {
      if (!campaignsByPool[cp.pool_id]) campaignsByPool[cp.pool_id] = [];
      campaignsByPool[cp.pool_id].push(cp.campaign_id);
    }
    const pools: Record<string, Pool> = {};
    for (const p of poolRows ?? []) {
      pools[p.id] = {
        id: p.id,
        name: p.name,
        strategy: (p.strategy as Pool['strategy']) ?? 'round_robin',
        maxOpenPerUser: p.max_open_per_user ?? 15,
        userIds: usersByPool[p.id] ?? [],
        campaignIds: campaignsByPool[p.id] ?? [],
      };
    }

    // Campaigns — build poolIds from campaign_pools
    const poolsByCampaign: Record<string, string[]> = {};
    for (const cp of campaignPoolRows ?? []) {
      if (!poolsByCampaign[cp.campaign_id]) poolsByCampaign[cp.campaign_id] = [];
      poolsByCampaign[cp.campaign_id].push(cp.pool_id);
    }
    // stageIds from stages that reference this campaign
    const stagesByCampaign: Record<string, string[]> = {};
    for (const s of stageRows ?? []) {
      if (!s.campaign_id) continue;
      if (!stagesByCampaign[s.campaign_id]) stagesByCampaign[s.campaign_id] = [];
      stagesByCampaign[s.campaign_id].push(s.id);
    }
    const campaigns: Record<string, Campaign> = {};
    for (const c of campaignRows ?? []) {
      campaigns[c.id] = {
        id: c.id,
        name: c.name,
        funnelId: c.funnel_id ?? null,
        active: c.active ?? true,
        stageIds: stagesByCampaign[c.id] ?? [],
        poolIds: poolsByCampaign[c.id] ?? [],
        userIds: c.user_ids ?? [],
        channels: c.channels ?? [],
      };
    }

    // Users
    const users: Record<string, AppUser> = {};
    for (const u of userRows ?? []) {
      const role = u.role as AppUser['role'];
      users[u.id] = {
        id: u.id,
        name: u.name,
        email: u.email,
        role,
        permissions: getPermissionsForRole(role),
        isActive: u.is_active ?? true,
        campaignIds: [],     // not stored separately — derived if needed
        poolIds: [],         // filled below
        maxOpenConversations: 15,
      };
    }
    // Fill poolIds on users from pool_users
    for (const pu of poolUserRows ?? []) {
      if (users[pu.user_id]) {
        users[pu.user_id].poolIds.push(pu.pool_id);
      }
    }

    // Contacts
    const contacts: Record<string, Contact> = {};
    for (const c of contactRows ?? []) {
      contacts[c.id] = {
        id: c.id,
        name: c.display_name ?? '(sin nombre)',
        phone: c.phone ?? '',
        channel: 'whatsapp',
      };
    }

    // Conversations
    const conversations: Record<string, Conversation> = {};
    for (const c of convRows ?? []) {
      conversations[c.id] = {
        id: c.id,
        contactId: c.contact_id,
        stageId: c.stage_id ?? '',
        funnelId: c.funnel_id ?? '',
        assigneeId: c.current_assignee_id ?? null,
        campaignId: c.campaign_id ?? null,
        labels: c.labels ?? [],
        priority: (c.priority as Conversation['priority']) ?? 'media',
        status: (c.status === 'closed' ? 'closed' : 'open') as Conversation['status'],
        closeReason: c.close_reason ?? null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    }

    // Messages — load only for open conversations (lazy load per conv in chat)
    const messages: Record<string, Message[]> = {};

    return { funnels, stages, pools, campaigns, users, contacts, conversations, messages };
  } catch (err) {
    console.error('[db] loadOrgData failed:', err);
    return null;
  }
}

// ─── FUNNELS ─────────────────────────────────────────────────────────────────

export async function dbCreateFunnel(orgId: string, name: string): Promise<string | null> {
  try {
    const { data, error } = await sb().from('funnels').insert({ organization_id: orgId, name }).select('id').single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[db] createFunnel:', err);
    return null;
  }
}

// ─── STAGES ──────────────────────────────────────────────────────────────────

export async function dbCreateStage(funnelId: string, name: string, position: number): Promise<string | null> {
  try {
    const { data, error } = await sb()
      .from('stages')
      .insert({ funnel_id: funnelId, name, position, color: '#6366f1', assignment_strategy: 'none' })
      .select('id').single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[db] createStage:', err);
    return null;
  }
}

// ─── CONVERSATIONS ───────────────────────────────────────────────────────────

export async function dbCloseConversation(convId: string, closeReason: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('conversations')
      .update({ status: 'closed', close_reason: closeReason, updated_at: new Date().toISOString() })
      .eq('id', convId);
    if (error) throw error;
  } catch (err) {
    console.error('[db] closeConversation:', err);
  }
}

export async function dbMoveConversation(convId: string, stageId: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('conversations')
      .update({ stage_id: stageId, updated_at: new Date().toISOString() })
      .eq('id', convId);
    if (error) throw error;
  } catch (err) {
    console.error('[db] moveConversation:', err);
  }
}

// ─── MESSAGES ────────────────────────────────────────────────────────────────

export async function dbLoadMessages(convId: string): Promise<Message[]> {
  try {
    const { data, error } = await sb()
      .from('messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at');
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((m: any) => ({
      id: m.id,
      conversationId: m.conversation_id,
      type: m.direction === 'internal' ? 'internal_note' as const : 'text' as const,
      sender: m.sender_type === 'contact' ? 'contact' as const : 'agent' as const,
      text: m.body ?? '',
      createdAt: m.created_at,
    }));
  } catch (err) {
    console.error('[db] loadMessages:', err);
    return [];
  }
}

export async function dbSendMessage(
  convId: string,
  text: string,
  isInternal: boolean,
  senderUserId: string,
): Promise<string | null> {
  try {
    const { data, error } = await sb()
      .from('messages')
      .insert({
        conversation_id: convId,
        direction: isInternal ? 'internal' : 'outbound',
        sender_type: 'agent',
        sender_user_id: senderUserId,
        body: text,
        message_type: 'text',
      })
      .select('id').single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[db] sendMessage:', err);
    return null;
  }
}

// ─── CAMPAIGNS ───────────────────────────────────────────────────────────────

export async function dbCreateCampaign(orgId: string, name: string, funnelId: string | null): Promise<string | null> {
  try {
    const { data, error } = await sb()
      .from('campaigns')
      .insert({ organization_id: orgId, name, funnel_id: funnelId, active: true })
      .select('id').single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[db] createCampaign:', err);
    return null;
  }
}

export async function dbUpdateCampaign(id: string, changes: { name?: string; active?: boolean; funnel_id?: string | null; channels?: string[]; user_ids?: string[] }): Promise<void> {
  try {
    const { error } = await sb().from('campaigns').update(changes).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('[db] updateCampaign:', err);
  }
}

// ─── POOLS ───────────────────────────────────────────────────────────────────

export async function dbCreatePool(orgId: string, name: string, strategy: string): Promise<string | null> {
  try {
    const { data, error } = await sb()
      .from('pools')
      .insert({ organization_id: orgId, name, strategy })
      .select('id').single();
    if (error) throw error;
    return data.id;
  } catch (err) {
    console.error('[db] createPool:', err);
    return null;
  }
}

export async function dbUpdatePool(id: string, changes: { name?: string; strategy?: string; max_open_per_user?: number }): Promise<void> {
  try {
    const { error } = await sb().from('pools').update(changes).eq('id', id);
    if (error) throw error;
  } catch (err) {
    console.error('[db] updatePool:', err);
  }
}

export async function dbAddUserToPool(poolId: string, userId: string): Promise<void> {
  try {
    const { error } = await sb().from('pool_users').insert({ pool_id: poolId, user_id: userId });
    if (error && error.code !== '23505') throw error; // ignore duplicate
  } catch (err) {
    console.error('[db] addUserToPool:', err);
  }
}

export async function dbRemoveUserFromPool(poolId: string, userId: string): Promise<void> {
  try {
    const { error } = await sb()
      .from('pool_users')
      .delete()
      .eq('pool_id', poolId)
      .eq('user_id', userId);
    if (error) throw error;
  } catch (err) {
    console.error('[db] removeUserFromPool:', err);
  }
}
