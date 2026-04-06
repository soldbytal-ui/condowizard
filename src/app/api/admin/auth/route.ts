import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { signToken, verifyPassword, verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const { data: agent, error } = await supabase
      .from('agents')
      .select('id, email, name, passwordHash, role, isActive')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !agent) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!agent.isActive) {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
    }

    const valid = await verifyPassword(password, agent.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      id: agent.id,
      email: agent.email,
      name: agent.name,
      role: agent.role,
    });

    // Update last login
    await supabase.from('agents').update({ lastLoginAt: new Date().toISOString() }).eq('id', agent.id);

    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { id: agent.id, email: agent.email, name: agent.name, role: agent.role },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ user: null });

    const session = verifyToken(token);
    if (!session) return NextResponse.json({ user: null });

    return NextResponse.json({ user: session });
  } catch {
    return NextResponse.json({ user: null });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true });
}
