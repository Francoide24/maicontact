export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {

      // ── organizations ───────────────────────────────────────────────────────
      organizations: {
        Row:    { id: string; name: string; created_at: string }
        Insert: { id?: string; name: string; created_at?: string }
        Update: { id?: string; name?: string; created_at?: string }
      }

      // ── users ───────────────────────────────────────────────────────────────
      users: {
        Row: {
          id: string
          organization_id: string
          name: string
          email: string
          role: 'admin' | 'supervisor' | 'agent'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string          // must match auth.users.id
          organization_id: string
          name: string
          email: string
          role?: 'admin' | 'supervisor' | 'agent'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          email?: string
          role?: 'admin' | 'supervisor' | 'agent'
          is_active?: boolean
          created_at?: string
        }
      }

      // ── funnels ─────────────────────────────────────────────────────────────
      funnels: {
        Row: {
          id: string
          organization_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          created_at?: string
        }
      }

      // ── pools ───────────────────────────────────────────────────────────────
      pools: {
        Row: {
          id: string
          organization_id: string
          name: string
          strategy: 'round_robin' | 'least_loaded' | 'manual'
          max_open_per_user: number
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          strategy?: 'round_robin' | 'least_loaded' | 'manual'
          max_open_per_user?: number
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          strategy?: 'round_robin' | 'least_loaded' | 'manual'
          max_open_per_user?: number
          created_at?: string
        }
      }

      // ── pool_users ──────────────────────────────────────────────────────────
      pool_users: {
        Row:    { pool_id: string; user_id: string }
        Insert: { pool_id: string; user_id: string }
        Update: { pool_id?: string; user_id?: string }
      }

      // ── campaigns ───────────────────────────────────────────────────────────
      campaigns: {
        Row: {
          id: string
          organization_id: string
          name: string
          funnel_id: string | null
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          funnel_id?: string | null
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          funnel_id?: string | null
          active?: boolean
          created_at?: string
        }
      }

      // ── campaign_pools ──────────────────────────────────────────────────────
      campaign_pools: {
        Row:    { campaign_id: string; pool_id: string }
        Insert: { campaign_id: string; pool_id: string }
        Update: { campaign_id?: string; pool_id?: string }
      }

      // ── stages ──────────────────────────────────────────────────────────────
      stages: {
        Row: {
          id: string
          funnel_id: string
          name: string
          color: string
          position: number
          campaign_id: string | null
          pool_id: string | null
          fixed_user_id: string | null
          assignment_strategy: 'round_robin' | 'fixed' | 'none'
          n8n_webhook_url: string | null
          auto_labels: string[]
          on_enter_automation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          funnel_id: string
          name: string
          color?: string
          position?: number
          campaign_id?: string | null
          pool_id?: string | null
          fixed_user_id?: string | null
          assignment_strategy?: 'round_robin' | 'fixed' | 'none'
          n8n_webhook_url?: string | null
          auto_labels?: string[]
          on_enter_automation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          funnel_id?: string
          name?: string
          color?: string
          position?: number
          campaign_id?: string | null
          pool_id?: string | null
          fixed_user_id?: string | null
          assignment_strategy?: 'round_robin' | 'fixed' | 'none'
          n8n_webhook_url?: string | null
          auto_labels?: string[]
          on_enter_automation?: string | null
          created_at?: string
        }
      }

      // ── contacts ────────────────────────────────────────────────────────────
      contacts: {
        Row: {
          id: string
          organization_id: string
          display_name: string | null
          phone: string | null
          email: string | null
          rut: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          display_name?: string | null
          phone?: string | null
          email?: string | null
          rut?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          display_name?: string | null
          phone?: string | null
          email?: string | null
          rut?: string | null
          created_at?: string
        }
      }

      // ── conversations ────────────────────────────────────────────────────────
      conversations: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          funnel_id: string | null
          stage_id: string | null
          campaign_id: string | null
          channel: string
          external_thread_id: string | null
          current_assignee_id: string | null
          status: 'new' | 'open' | 'waiting' | 'closed'
          priority: 'alta' | 'media' | 'baja'
          labels: string[]
          sla_due_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id: string
          funnel_id?: string | null
          stage_id?: string | null
          campaign_id?: string | null
          channel?: string
          external_thread_id?: string | null
          current_assignee_id?: string | null
          status?: 'new' | 'open' | 'waiting' | 'closed'
          priority?: 'alta' | 'media' | 'baja'
          labels?: string[]
          sla_due_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string
          funnel_id?: string | null
          stage_id?: string | null
          campaign_id?: string | null
          channel?: string
          external_thread_id?: string | null
          current_assignee_id?: string | null
          status?: 'new' | 'open' | 'waiting' | 'closed'
          priority?: 'alta' | 'media' | 'baja'
          labels?: string[]
          sla_due_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }

      // ── messages ────────────────────────────────────────────────────────────
      messages: {
        Row: {
          id: string
          conversation_id: string
          direction: 'inbound' | 'outbound' | 'internal' | 'event'
          sender_type: 'contact' | 'agent' | 'bot' | 'system'
          sender_user_id: string | null
          external_message_id: string | null
          body: string | null
          message_type: string
          delivery_status: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          direction: 'inbound' | 'outbound' | 'internal' | 'event'
          sender_type: 'contact' | 'agent' | 'bot' | 'system'
          sender_user_id?: string | null
          external_message_id?: string | null
          body?: string | null
          message_type?: string
          delivery_status?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          direction?: 'inbound' | 'outbound' | 'internal' | 'event'
          sender_type?: 'contact' | 'agent' | 'bot' | 'system'
          sender_user_id?: string | null
          external_message_id?: string | null
          body?: string | null
          message_type?: string
          delivery_status?: string | null
          created_at?: string
        }
      }

      // ── audit_logs ──────────────────────────────────────────────────────────
      audit_logs: {
        Row: {
          id: string
          organization_id: string
          actor_user_id: string | null
          conversation_id: string | null
          action: string
          payload: Json
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          actor_user_id?: string | null
          conversation_id?: string | null
          action: string
          payload?: Json
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          actor_user_id?: string | null
          conversation_id?: string | null
          action?: string
          payload?: Json
          created_at?: string
        }
      }

      // ── integrations ────────────────────────────────────────────────────────
      integrations: {
        Row: {
          id: string
          organization_id: string
          provider: string
          status: string
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          provider: string
          status?: string
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          provider?: string
          status?: string
          config?: Json
          created_at?: string
          updated_at?: string
        }
      }

      // ── tags ────────────────────────────────────────────────────────────────
      tags: {
        Row: {
          id: string
          organization_id: string
          name: string
          color: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          color?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          color?: string | null
          is_active?: boolean
          created_at?: string
        }
      }

      // ── conversation_tags ───────────────────────────────────────────────────
      conversation_tags: {
        Row: {
          conversation_id: string
          tag_id: string
          added_by: string | null
          added_at: string
        }
        Insert: {
          conversation_id: string
          tag_id: string
          added_by?: string | null
          added_at?: string
        }
        Update: {
          conversation_id?: string
          tag_id?: string
          added_by?: string | null
          added_at?: string
        }
      }

    }
    Views:     { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums:     { [_ in never]: never }
  }
}
