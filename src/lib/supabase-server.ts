import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Anon-key client for server-side JWT verification (auth.getUser) only.
// No session persistence in a server context.
let _anonServer: SupabaseClient | null = null;
export function getSupabaseAnonServer(): SupabaseClient {
  if (_anonServer) return _anonServer;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  _anonServer = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return _anonServer;
}

// Read the current user from a request's Authorization: Bearer <access_token> header.
// Returns null for anonymous requests.
export async function getUserFromRequest(req: Request): Promise<{ id: string; email: string | null } | null> {
  const auth = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!auth) return null;
  const token = auth.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;
  try {
    const supa = getSupabaseAnonServer();
    const { data, error } = await supa.auth.getUser(token);
    if (error || !data?.user) return null;
    return { id: data.user.id, email: data.user.email ?? null };
  } catch {
    return null;
  }
}
