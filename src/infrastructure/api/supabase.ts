import { createClient, type SupabaseClient as SupabaseJsClient } from '@supabase/supabase-js';
import { config } from '../config/environment';
import type { Database } from '../../domain/types/database';

export type SupabaseClient = SupabaseJsClient<Database>;

export const isSupabaseConfigured = Boolean(
  config.supabase.url && config.supabase.anonKey
);

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;

  if (!supabaseClient) {
    supabaseClient = createClient<Database>(
      config.supabase.url,
      config.supabase.anonKey,
      {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    );
  }

  return supabaseClient;
}
