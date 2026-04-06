import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { leadId, message } = await request.json();
    if (!leadId || !message) return NextResponse.json({ error: 'leadId and message required' }, { status: 400 });

    const { data: lead } = await supabase.from('leads').select('id, name, phone, assignedAgentId').eq('id', leadId).single();
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (session.role !== 'admin' && lead.assignedAgentId !== session.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // TODO: Implement Twilio SMS
    // const twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilioClient.messages.create({ body: message, to: lead.phone, from: process.env.TWILIO_PHONE_NUMBER });

    await supabase.from('deal_activities').insert({
      leadId,
      agentId: session.id,
      type: 'sms',
      content: message,
    });

    return NextResponse.json({
      success: true,
      message: 'SMS sent (Twilio integration pending)',
    });
  } catch (error) {
    console.error('SMS error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
