/**
 * Cloudflare Pages Function — /api/users
 *
 * Maneja creación y actualización de usuarios operacionales.
 * Requiere SUPABASE_SERVICE_ROLE_KEY como secret en Cloudflare Pages.
 *
 * Variables de entorno necesarias (server-side, nunca VITE_):
 *   SUPABASE_URL             — misma URL que VITE_SUPABASE_URL
 *   SUPABASE_ANON_KEY        — para verificar el JWT del caller
 *   SUPABASE_SERVICE_ROLE_KEY — para operaciones de admin en auth.users
 */

interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

// ─── CORS helper ──────────────────────────────────────────────────────────────

function corsHeaders(origin: string | null) {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Methods': 'POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

function err(message: string, status = 400, origin: string | null = null) {
  return json({ error: message }, status, origin);
}

// ─── Auth verification ────────────────────────────────────────────────────────

async function verifyCallerIsAdmin(
  token: string,
  supabaseUrl: string,
  anonKey: string,
): Promise<{ id: string; organizationId: string } | null> {
  // Verify token via Supabase Auth REST
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  });
  if (!res.ok) return null;
  const authUser = await res.json() as { id: string };

  // Check role in public.users — use the user's own JWT so RLS resuelve auth.uid()
  const dbRes = await fetch(
    `${supabaseUrl}/rest/v1/users?id=eq.${authUser.id}&select=id,organization_id,role,is_active`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
        'Content-Type': 'application/json',
      },
    },
  );
  if (!dbRes.ok) return null;
  const rows = await dbRes.json() as Array<{ id: string; organization_id: string; role: string; is_active: boolean }>;
  const row = rows[0];
  if (!row || row.role !== 'admin' || !row.is_active) return null;

  return { id: row.id, organizationId: row.organization_id };
}

// ─── CORS preflight ───────────────────────────────────────────────────────────

export async function onRequestOptions(context: { request: Request }) {
  const origin = context.request.headers.get('Origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

// ─── POST /api/users — create user ───────────────────────────────────────────

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  // 1. Extract Bearer token
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return err('Unauthorized', 401, origin);

  // 2. Verify caller is admin
  const caller = await verifyCallerIsAdmin(token, env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  if (!caller) return err('Forbidden: solo admins pueden crear usuarios', 403, origin);

  // 3. Parse body
  let body: { email?: string; name?: string; role?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return err('Body inválido', 400, origin);
  }

  const { email, name, role, password } = body;
  if (!email || !name || !role) return err('email, name y role son requeridos', 400, origin);
  if (!['admin', 'supervisor', 'agent'].includes(role)) return err('role inválido', 400, origin);

  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = env.SUPABASE_URL;

  // 4. Create user in Supabase Auth (service_role)
  const authPayload: Record<string, unknown> = {
    email,
    email_confirm: true,
    user_metadata: { name },
  };
  if (password) authPayload.password = password;

  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(authPayload),
  });

  if (!createRes.ok) {
    const detail = await createRes.json() as { message?: string };
    return err(detail.message ?? 'Error al crear usuario en Auth', createRes.status, origin);
  }

  const newAuthUser = await createRes.json() as { id: string };

  // 5. Insert into public.users
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      id: newAuthUser.id,
      organization_id: caller.organizationId,
      name,
      email,
      role,
      is_active: true,
    }),
  });

  if (!insertRes.ok) {
    // Auth user was created but DB insert failed — log and report
    const detail = await insertRes.json() as { message?: string };
    return err(
      `Usuario creado en Auth (${newAuthUser.id}) pero no en public.users: ${detail.message ?? 'error desconocido'}`,
      500,
      origin,
    );
  }

  const inserted = (await insertRes.json() as unknown[])[0] as { id: string; name: string; email: string; role: string };
  return json({ id: inserted.id, name: inserted.name, email: inserted.email, role: inserted.role }, 201, origin);
}

// ─── PATCH /api/users/:id — update role / is_active ──────────────────────────

export async function onRequestPatch(context: { request: Request; env: Env; params: { id?: string } }) {
  const { request, env, params } = context;
  const origin = request.headers.get('Origin');

  const userId = params?.id;
  if (!userId) return err('id de usuario requerido en la URL', 400, origin);

  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return err('Unauthorized', 401, origin);

  const caller = await verifyCallerIsAdmin(token, env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  if (!caller) return err('Forbidden', 403, origin);

  let body: { name?: string; role?: string; is_active?: boolean };
  try {
    body = await request.json();
  } catch {
    return err('Body inválido', 400, origin);
  }

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined)      patch.name      = body.name;
  if (body.role !== undefined)      patch.role      = body.role;
  if (body.is_active !== undefined) patch.is_active = body.is_active;
  if (Object.keys(patch).length === 0) return err('Nada que actualizar', 400, origin);

  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = env.SUPABASE_URL;

  const updateRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      apikey: serviceKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(patch),
  });

  if (!updateRes.ok) {
    const detail = await updateRes.json() as { message?: string };
    return err(detail.message ?? 'Error al actualizar', updateRes.status, origin);
  }

  // If deactivating: ban the user in Supabase Auth
  if (body.is_active === false) {
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ban_duration: '87600h' }), // 10 years = effectively disabled
    });
  }

  // If re-activating: unban
  if (body.is_active === true) {
    await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        apikey: serviceKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ban_duration: 'none' }),
    });
  }

  const rows = await updateRes.json() as unknown[];
  return json(rows[0] ?? { ok: true }, 200, origin);
}
