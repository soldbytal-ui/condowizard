/**
 * Scale Auth — JWT-based session management for multi-tenant SaaS.
 * Uses jose for JWT (Edge-compatible), bcryptjs for password hashing.
 */

import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'scale-dev-secret-change-in-production');
const COOKIE_NAME = 'scale-session';

export interface ScaleSession {
  userId: string;
  email: string;
  name: string;
  tenantId?: string;
  isSuperAdmin: boolean;
  impersonatingTenant?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: ScaleSession): Promise<string> {
  const token = await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<ScaleSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as ScaleSession;
  } catch {
    return null;
  }
}

export async function requireSuperAdmin(): Promise<ScaleSession> {
  const session = await getSession();
  if (!session?.isSuperAdmin) {
    throw new Error('Unauthorized — super admin required');
  }
  return session;
}

export async function requireTenantAccess(tenantId: string): Promise<ScaleSession> {
  const session = await getSession();
  if (!session) throw new Error('Not authenticated');
  if (session.isSuperAdmin) return session; // Super admin can access any tenant
  if (session.tenantId !== tenantId) throw new Error('Unauthorized — wrong tenant');
  return session;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Parse session from a raw token string (for middleware use). */
export async function parseToken(token: string): Promise<ScaleSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as ScaleSession;
  } catch {
    return null;
  }
}
