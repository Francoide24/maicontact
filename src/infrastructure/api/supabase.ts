import { createClient } from '@supabase/supabase-js';
import { config } from '../config/environment';
import type { Database } from '../../domain/types/database';

export const supabase = createClient<Database>(
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

export type SupabaseClient = typeof supabase;