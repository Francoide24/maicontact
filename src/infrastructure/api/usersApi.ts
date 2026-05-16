/**
 * Cliente frontend para /api/users (Pages Function).
 * Adjunta el JWT de sesión Supabase como Bearer token.
 * La service_role key NUNCA llega al cliente — vive solo en la Pages Function.
 */
import { getSupabaseClient } from './supabase';

async function getSessionToken(): Promise<string> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase no configurado');
  const { data } = await client.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sin sesión activa');
  return token;
}

export interface CreateUserPayload {
  email: string;
  name: string;
  role: 'admin' | 'supervisor' | 'agent';
  password?: string;
}

export interface UpdateUserPayload {
  name?: string;
  role?: 'admin' | 'supervisor' | 'agent';
  is_active?: boolean;
}

export interface UserApiResult {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'supervisor' | 'agent';
}

export async function apiCreateUser(payload: CreateUserPayload): Promise<UserApiResult> {
  const token = await getSessionToken();

  const res = await fetch('/api/users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `Error ${res.status}`);
  }

  return res.json() as Promise<UserApiResult>;
}

export async function apiUpdateUser(userId: string, payload: UpdateUserPayload): Promise<void> {
  const token = await getSessionToken();

  const res = await fetch(`/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(body.error ?? `Error ${res.status}`);
  }
}
