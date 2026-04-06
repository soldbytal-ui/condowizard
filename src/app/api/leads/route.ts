import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const leadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  projectId: z.string().optional(),
  neighborhoodId: z.string().optional(),
  message: z.string().optional(),
  source: z.string().optional(),
});

async function autoAssignAgent(neighborhoodId: string | null | undefined): Promise<string | null> {
  if (!neighborhoodId) return null;

  // Get the neighborhood slug
  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('slug')
    .eq('id', neighborhoodId)
    .single();

  if (!neighborhood) return null;

  // Find active agents who cover this neighborhood
  const { data: agents } = await supabase
    .from('agents')
    .select('id, neighborhoods')
    .eq('isActive', true)
    .eq('role', 'agent');

  const matchingAgents = (agents || []).filter(
    (a: any) => Array.isArray(a.neighborhoods) && a.neighborhoods.includes(neighborhood.slug)
  );

  if (matchingAgents.length === 0) return null;

  // Round-robin: pick the agent with fewest current leads
  const { data: leadCounts } = await supabase
    .from('leads')
    .select('assignedAgentId')
    .in('assignedAgentId', matchingAgents.map(a => a.id));

  const counts: Record<string, number> = {};
  for (const a of matchingAgents) counts[a.id] = 0;
  for (const l of leadCounts || []) {
    if (l.assignedAgentId) counts[l.assignedAgentId] = (counts[l.assignedAgentId] || 0) + 1;
  }

  // Pick agent with fewest leads
  const sorted = matchingAgents.sort((a, b) => (counts[a.id] || 0) - (counts[b.id] || 0));
  return sorted[0]?.id || null;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = leadSchema.parse(body);

    // Auto-assign agent based on neighborhood
    let assignedAgentId: string | null = null;

    // If a projectId is provided, get its neighborhoodId
    let neighborhoodId = data.neighborhoodId;
    if (data.projectId && !neighborhoodId) {
      const { data: project } = await supabase
        .from('projects')
        .select('neighborhoodId')
        .eq('id', data.projectId)
        .single();
      if (project) neighborhoodId = project.neighborhoodId;
    }

    assignedAgentId = await autoAssignAgent(neighborhoodId);

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        projectId: data.projectId || null,
        neighborhoodId: data.neighborhoodId || null,
        message: data.message || null,
        source: data.source || 'inquiry',
        assignedAgentId,
        status: 'new',
        priority: 'warm',
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Lead creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
