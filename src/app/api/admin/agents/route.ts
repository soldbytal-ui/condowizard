import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession, hashPassword } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, email, phone, avatarUrl, bio, licenseNumber, brokerage, neighborhoods, role, isActive, createdAt, lastLoginAt')
      .order('name');

    if (error) throw error;

    // Get lead counts per agent
    const { data: leadCounts } = await supabase
      .from('leads')
      .select('assignedAgentId, status');

    const agentStats: Record<string, { total: number; closed: number; pipeline: number }> = {};
    for (const l of leadCounts || []) {
      if (!l.assignedAgentId) continue;
      if (!agentStats[l.assignedAgentId]) agentStats[l.assignedAgentId] = { total: 0, closed: 0, pipeline: 0 };
      agentStats[l.assignedAgentId].total++;
      if (l.status === 'closed') agentStats[l.assignedAgentId].closed++;
      if (l.status !== 'closed' && l.status !== 'lost') agentStats[l.assignedAgentId].pipeline++;
    }

    const agentsWithStats = (agents || []).map(a => ({
      ...a,
      stats: agentStats[a.id] || { total: 0, closed: 0, pipeline: 0 },
    }));

    return NextResponse.json(agentsWithStats);
  } catch (error) {
    console.error('Agents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { name, email, password, phone, bio, licenseNumber, brokerage, neighborhoods, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const { data, error } = await supabase.from('agents').insert({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || null,
      bio: bio || null,
      licenseNumber: licenseNumber || null,
      brokerage: brokerage || null,
      neighborhoods: neighborhoods || [],
      role: role || 'agent',
      isActive: true,
    }).select('id, name, email, role').single();

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Agent creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { id, password, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });

    if (password) {
      updates.passwordHash = await hashPassword(password);
    }

    const { data, error } = await supabase.from('agents').update(updates).eq('id', id).select().single();
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Agent update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
