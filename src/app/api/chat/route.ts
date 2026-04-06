import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Chat is not configured. Please add ANTHROPIC_API_KEY to environment variables.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { messages } = await req.json();
  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 400 });
  }

  // Rate limit: max 20 messages
  if (messages.filter((m: any) => m.role === 'user').length > 20) {
    return new Response(
      JSON.stringify({ error: 'Message limit reached. Please submit your info for personalized help from a licensed agent.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch project catalog for context
  const { data: projects } = await supabase
    .from('projects')
    .select('name, slug, status, category, priceMin, priceMax, floors, estCompletion, address, neighborhoodId, neighborhood:neighborhoods(name, slug), developer:developers(name)')
    .order('name')
    .limit(200);

  const projectSummary = (projects || []).map((p: any) =>
    `- ${p.name} | ${p.neighborhood?.name || 'Toronto'} | ${p.status} | ${p.priceMin ? `$${(p.priceMin/1000000).toFixed(1)}M` : 'TBD'}-${p.priceMax ? `$${(p.priceMax/1000000).toFixed(1)}M` : 'TBD'} | ${p.floors || '?'} floors | ${p.estCompletion || 'TBD'} | ${p.developer?.name || 'TBD'} | /properties/${p.slug}`
  ).join('\n');

  const systemPrompt = `You are the CondoWizard AI assistant. You help users find pre-construction condos, townhomes, and homes in the Greater Toronto Area (GTA).

AVAILABLE PROJECTS (${(projects || []).length} total):
${projectSummary}

RULES:
- When recommending projects, ALWAYS include: project name, neighborhood, price range, estimated completion, and a link formatted as [Project Name](/properties/slug)
- Be concise, friendly, and helpful. Use short paragraphs.
- You represent CondoWizard.ca, operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage.
- If users ask for investment advice or legal guidance, remind them to consult with a licensed real estate professional.
- Never guarantee returns, appreciation, or investment outcomes.
- Mention relevant Toronto details: TTC access, GO Transit connections, nearby landmarks, Ontario buying process (HST rebate, occupancy fees, assignment sales).
- If asked about a project not on the list, say you don't have information on it and suggest they contact the team.
- When comparing projects, use a brief table or bullet format.
- For neighborhood questions, mention the relevant neighborhood page: /new-condos-[slug]
- Keep responses under 300 words unless the user asks for detailed comparisons.
- Always end recommendations with: "Would you like me to help you narrow down your search?"
- Prices are in Canadian dollars (CAD).`;

  // Call Anthropic API with streaming
  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: any) => ({
        role: m.role,
        content: m.content,
      })),
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Anthropic API error:', error);
    return new Response(
      JSON.stringify({ error: 'Sorry, I encountered an error. Please try again.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) { controller.close(); return; }
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`));
              }
            } catch {}
          }
        }
      }

      controller.enqueue(encoder.encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
