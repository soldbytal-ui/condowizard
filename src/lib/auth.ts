import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { supabase } from './supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'cw-admin-secret-key-change-in-production';

export type AgentSession = {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'agent';
};

export function signToken(payload: AgentSession): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AgentSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AgentSession;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AgentSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<AgentSession> {
  const session = await getSession();
  if (!session) throw new Error('Unauthorized');
  return session;
}

export async function requireAdmin(): Promise<AgentSession> {
  const session = await requireSession();
  if (session.role !== 'admin') throw new Error('Forbidden');
  return session;
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
