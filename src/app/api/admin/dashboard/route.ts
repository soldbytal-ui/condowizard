import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const isAdmin = session.role === 'admin';
    const agentFilter = isAdmin ? {} : { assignedAgentId: session.id };

    let query = supabase.from('leads').select('id, status, dealValue, createdAt, assignedAgentId', { count: 'exact' });
    if (!isAdmin) query = query.eq('assignedAgentId', session.id);
    const { data: leads, count: totalLeads } = await query;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const leadsThisWeek = (leads || []).filter(l => new Date(l.createdAt) >= weekAgo).length;
    const closedLeads = (leads || []).filter(l => l.status === 'closed').length;
    const conversionRate = totalLeads && totalLeads > 0 ? Math.round((closedLeads / totalLeads) * 100) : 0;
    const pipeline = (leads || []).filter(l => l.dealValue && l.status !== 'lost').reduce((sum, l) => sum + (l.dealValue || 0), 0);
    const revenue = (leads || []).filter(l => l.status === 'closed').reduce((sum, l) => sum + (l.dealValue || 0), 0);

    const statusCounts: Record<string, number> = {};
    for (const l of leads || []) {
      statusCounts[l.status || 'new'] = (statusCounts[l.status || 'new'] || 0) + 1;
    }

    let agentCount = 0;
    if (isAdmin) {
      const { count } = await supabase.from('agents').select('*', { count: 'exact', head: true }).eq('isActive', true);
      agentCount = count || 0;
    }

    return NextResponse.json({
      totalLeads: totalLeads || 0,
      leadsThisWeek,
      closedLeads,
      conversionRate,
      pipeline,
      revenue,
      statusCounts,
      agentCount,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
