import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const agentId = searchParams.get('agentId');
    const search = searchParams.get('search');

    let query = supabase
      .from('leads')
      .select('*, project:projects(name, slug), neighborhood:neighborhoods(name, slug), assignedAgent:agents(id, name, email)')
      .order('createdAt', { ascending: false });

    // Agents can only see their own leads
    if (session.role !== 'admin') {
      query = query.eq('assignedAgentId', session.id);
    } else if (agentId) {
      query = query.eq('assignedAgentId', agentId);
    }

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    // Mask phone numbers for agents
    const leads = (data || []).map(lead => ({
      ...lead,
      phone: session.role === 'admin' ? lead.phone : lead.phone ? '***-***-' + lead.phone.slice(-4) : null,
    }));

    return NextResponse.json(leads);
  } catch (error) {
    console.error('Leads error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });

    // Agents can only update their assigned leads
    if (session.role !== 'admin') {
      const { data: lead } = await supabase.from('leads').select('assignedAgentId').eq('id', id).single();
      if (lead?.assignedAgentId !== session.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      // Agents cannot change assignedAgentId or see phone
      delete updates.assignedAgentId;
      delete updates.phone;
    }

    updates.updatedAt = new Date().toISOString();
    if (updates.status === 'contacted' && !updates.contactedAt) {
      updates.contactedAt = new Date().toISOString();
    }
    if (updates.status === 'closed' || updates.status === 'lost') {
      updates.closedAt = new Date().toISOString();
    }

    const { data, error } = await supabase.from('leads').update(updates).eq('id', id).select().single();
    if (error) throw error;

    // Log status change
    if (updates.status) {
      await supabase.from('deal_activities').insert({
        leadId: id,
        agentId: session.id,
        type: 'status_change',
        content: `Status changed to ${updates.status}`,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
