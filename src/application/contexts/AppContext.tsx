import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../../infrastructure/api/supabase';

// Simplificamos los tipos para evitar problemas complejos de Supabase
type Conversation = any;
type Area = any;
type Tag = any;

interface AppContextType {
  conversations: Conversation[];
  areas: Area[];
  tags: Tag[];
  selectedConversationId: string | null;
  selectedConversation: Conversation | null;
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const { userProfile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedConversation = conversations.find(c => c.id === selectedConversationId) || null;

  useEffect(() => {
    if (userProfile) {
      loadInitialData();
      subscribeToChanges();
    }
  }, [userProfile]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        refreshConversations(),
        loadAreas(),
        loadTags()
      ]);
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToChanges = () => {
    const conversationsSubscription = supabase
      .channel('conversations-channel')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'conversations' }, 
        () => refreshConversations()
      )
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'messages' }, 
        () => refreshConversations()
      )
      .subscribe();

    return () => {
      conversationsSubscription.unsubscribe();
    };
  };

  const refreshConversations = async () => {
    if (!userProfile) return;

    const query = supabase
      .from('conversations')
      .select(`
        *,
        contact:contacts(*),
        messages(*),
        current_area:areas(*),
        current_assignee:users(*),
        conversation_tags(tag:tags(*))
      `)
      .eq('organization_id', userProfile.organization_id)
      .order('updated_at', { ascending: false });

    // Apply role-based filters
    if (userProfile.role === 'agent') {
      query.eq('current_assignee_id', userProfile.id);
    } else if (userProfile.role === 'supervisor') {
      // Supervisors see conversations in their areas
      const { data: memberships } = await supabase
        .from('user_area_memberships')
        .select('area_id')
        .eq('user_id', userProfile.id);
      
      if (memberships && memberships.length > 0) {
        const areaIds = memberships.map((m: any) => m.area_id);
        query.in('current_area_id', areaIds);
      }
    }
    // Admins see all conversations

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching conversations:', error);
      return;
    }

    const formattedConversations = data?.map((conv: any) => ({
      ...conv,
      tags: conv.conversation_tags?.map((ct: any) => ct.tag).filter(Boolean) || []
    })) || [];

    setConversations(formattedConversations);
  };

  const loadAreas = async () => {
    if (!userProfile) return;

    const { data } = await supabase
      .from('areas')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .eq('is_active', true)
      .order('name');

    setAreas(data || []);
  };

  const loadTags = async () => {
    if (!userProfile) return;

    const { data } = await supabase
      .from('tags')
      .select('*')
      .eq('organization_id', userProfile.organization_id)
      .eq('is_active', true)
      .order('name');

    setTags(data || []);
  };

  const selectConversation = (id: string) => {
    setSelectedConversationId(id);
  };

  const sendMessage = async (conversationId: string, body: string, isInternal = false) => {
    if (!userProfile) return;

    const messageData: any = {
      conversation_id: conversationId,
      direction: isInternal ? 'internal' : 'outbound',
      sender_type: 'agent',
      sender_user_id: userProfile.id,
      body,
      message_type: 'text'
    };

    const { error } = await (supabase as any).from('messages').insert(messageData);

    if (error) throw error;

    // Update conversation timestamp
    const updateData: any = { updated_at: new Date().toISOString() };
    await (supabase as any)
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    await refreshConversations();
  };

  const assignConversation = async (conversationId: string, userId?: string, areaId?: string) => {
    const updates: any = {
      updated_at: new Date().toISOString()
    };

    if (userId !== undefined) updates.current_assignee_id = userId;
    if (areaId !== undefined) updates.current_area_id = areaId;

    const { error } = await (supabase as any)
      .from('conversations')
      .update(updates)
      .eq('id', conversationId);

    if (error) throw error;

    // Log the assignment
    if (userProfile) {
      const auditData: any = {
        organization_id: userProfile.organization_id,
        actor_user_id: userProfile.id,
        conversation_id: conversationId,
        action: 'conversation_assigned',
        payload: { userId, areaId }
      };
      await supabase.from('audit_logs').insert(auditData);
    }

    await refreshConversations();
  };

  const updateConversationStatus = async (conversationId: string, status: string) => {
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await (supabase as any)
      .from('conversations')
      .update(updateData)
      .eq('id', conversationId);

    if (error) throw error;
    await refreshConversations();
  };

  const addTag = async (conversationId: string, tagId: string) => {
    if (!userProfile) return;

    const tagData: any = {
      conversation_id: conversationId,
      tag_id: tagId,
      added_by: userProfile.id
    };

    const { error } = await supabase
      .from('conversation_tags')
      .insert(tagData);

    if (error) throw error;
    await refreshConversations();
  };

  const removeTag = async (conversationId: string, tagId: string) => {
    const { error } = await supabase
      .from('conversation_tags')
      .delete()
      .eq('conversation_id', conversationId)
      .eq('tag_id', tagId);

    if (error) throw error;
    await refreshConversations();
  };

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
        selectConversation,
        refreshConversations,
        sendMessage,
        assignConversation,
        updateConversationStatus,
        addTag,
        removeTag,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};