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
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
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
          id?: string
          organization_id: string
          name: string
          email: string
          role: 'admin' | 'supervisor' | 'agent'
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
      areas: {
        Row: {
          id: string
          organization_id: string
          name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      user_area_memberships: {
        Row: {
          user_id: string
          area_id: string
          can_receive_assignments: boolean
          daily_capacity: number
        }
        Insert: {
          user_id: string
          area_id: string
          can_receive_assignments?: boolean
          daily_capacity?: number
        }
        Update: {
          user_id?: string
          area_id?: string
          can_receive_assignments?: boolean
          daily_capacity?: number
        }
      }
      contacts: {
        Row: {
          id: string
          organization_id: string
          display_name: string | null
          phone: string | null
          rut: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          display_name?: string | null
          phone?: string | null
          rut?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          display_name?: string | null
          phone?: string | null
          rut?: string | null
          email?: string | null
          created_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          organization_id: string
          contact_id: string
          channel: string
          external_thread_id: string | null
          current_area_id: string | null
          current_assignee_id: string | null
          status: 'new' | 'open' | 'waiting' | 'closed'
          bot_status: string
          priority: string
          sla_due_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          contact_id: string
          channel: string
          external_thread_id?: string | null
          current_area_id?: string | null
          current_assignee_id?: string | null
          status: 'new' | 'open' | 'waiting' | 'closed'
          bot_status?: string
          priority?: string
          sla_due_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          contact_id?: string
          channel?: string
          external_thread_id?: string | null
          current_area_id?: string | null
          current_assignee_id?: string | null
          status?: 'new' | 'open' | 'waiting' | 'closed'
          bot_status?: string
          priority?: string
          sla_due_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
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
      transfers: {
        Row: {
          id: string
          conversation_id: string
          from_area_id: string | null
          to_area_id: string | null
          from_user_id: string | null
          to_user_id: string | null
          reason: string
          ai_summary: string | null
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          from_area_id?: string | null
          to_area_id?: string | null
          from_user_id?: string | null
          to_user_id?: string | null
          reason: string
          ai_summary?: string | null
          created_by: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          from_area_id?: string | null
          to_area_id?: string | null
          from_user_id?: string | null
          to_user_id?: string | null
          reason?: string
          ai_summary?: string | null
          created_by?: string
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          organization_id: string
          area_id: string | null
          name: string
          category: string | null
          color: string | null
          is_global: boolean
          is_active: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          area_id?: string | null
          name: string
          category?: string | null
          color?: string | null
          is_global?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          area_id?: string | null
          name?: string
          category?: string | null
          color?: string | null
          is_global?: boolean
          is_active?: boolean
          created_by?: string | null
          created_at?: string
        }
      }
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}