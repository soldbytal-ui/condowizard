import { Pool } from 'pg';

let _pool: Pool | null = null;

// Postgres connection pool for server-side reads/writes that bypass RLS.
// Uses DATABASE_URL (Supabase pooler / direct). Keep the pool small — Supabase
// pgbouncer limits concurrent statements.
export function getPool(): Pool {
  if (_pool) return _pool;
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error('DATABASE_URL is not set');
  _pool = new Pool({
    connectionString: cs,
    max: 4,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return _pool;
}

export async function query<T = any>(text: string, params: unknown[] = []): Promise<T[]> {
  const pool = getPool();
  const res = await pool.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = any>(text: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}
