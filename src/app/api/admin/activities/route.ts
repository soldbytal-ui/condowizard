import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

    const { data, error } = await supabase
      .from('deal_activities')
      .select('*, agent:agents(name)')
      .eq('leadId', leadId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId, type, content, duration } = await request.json();
    if (!leadId || !type) return NextResponse.json({ error: 'leadId and type required' }, { status: 400 });

    const { data, error } = await supabase.from('deal_activities').insert({
      leadId,
      agentId: session.id,
      type,
      content: content || null,
      duration: duration || null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Activity creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
