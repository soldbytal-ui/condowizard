import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId } = await request.json();
    if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

    // Verify agent has access to this lead
    const { data: lead } = await supabase.from('leads').select('id, name, phone, assignedAgentId').eq('id', leadId).single();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (session.role !== 'admin' && lead.assignedAgentId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Implement Twilio Proxy call
    // const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // const proxyService = twilioClient.proxy.v1.services(process.env.TWILIO_PROXY_SERVICE_SID);
    // ... create session, add participants, initiate call

    // Log the call activity
    await supabase.from('deal_activities').insert({
      leadId,
      agentId: session.id,
      type: 'call',
      content: `Call initiated to ${lead.name}`,
    });

    return NextResponse.json({
      success: true,
      message: 'Call initiated (Twilio integration pending — add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PROXY_SERVICE_SID to env)',
    });
  } catch (error) {
    console.error('Call error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
