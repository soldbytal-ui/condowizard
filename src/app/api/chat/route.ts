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

  if (messages.filter((m: any) => m.role === 'user').length > 20) {
    return new Response(
      JSON.stringify({ error: 'Message limit reached. Please submit your info for personalized help from a licensed agent.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Fetch project catalog for pre-con context
  const { data: projects } = await supabase
    .from('projects')
    .select('name, slug, status, category, priceMin, priceMax, floors, estCompletion, address, neighborhoodId, neighborhood:neighborhoods(name, slug), developer:developers(name)')
    .order('name')
    .limit(200);

  const projectSummary = (projects || []).map((p: any) =>
    `- ${p.name} | ${p.neighborhood?.name || 'Toronto'} | ${p.status} | ${p.priceMin ? `$${(p.priceMin/1000000).toFixed(1)}M` : 'TBD'}-${p.priceMax ? `$${(p.priceMax/1000000).toFixed(1)}M` : 'TBD'} | ${p.floors || '?'} floors | ${p.estCompletion || 'TBD'} | ${p.developer?.name || 'TBD'} | /properties/${p.slug}`
  ).join('\n');

  // Check if the latest user message looks like a property search
  const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
  let nlpContext = '';

  // Try Repliers NLP for property search queries
  if (/\b(find|search|show|looking|want|need|condo|house|apartment|bedroom|bed|bath|under|over|near|in |price|rent|lease)\b/i.test(lastUserMsg)) {
    try {
      const nlpRes = await fetch('https://api.repliers.io/nlp', {
        method: 'POST',
        headers: {
          'REPLIERS-API-KEY': process.env.REPLIERS_API_KEY || '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: lastUserMsg }),
      });
      if (nlpRes.ok) {
        const nlpData = await nlpRes.json();
        nlpContext = `\n\nREPLIERS NLP SEARCH RESULT (structured interpretation of user's query):\n${JSON.stringify(nlpData, null, 2)}\nUse this to help the user. If it contains search parameters, describe what you found and suggest they visit /search with appropriate filters.`;
      }
    } catch {}
  }

  const systemPrompt = `You are CondoWizard AI, a Toronto real estate assistant on CondoWizard.ca. You help buyers find properties, understand the Toronto market, and navigate the Ontario buying process. You work with Tal Shelef, Sales Representative at Rare Real Estate Inc. (1701 Avenue Rd, Toronto, ON M5M 3Y3, 647-890-4082).

You have access to live MLS data through the Repliers API. When a user asks to find properties, use the NLP interpretation provided below to give real results and suggest they visit the search page for full results.

You can answer questions about: pre-construction vs resale, HST rebates, assignment sales, occupancy fees, deposit structures, the Ontario buying process, TRREB market data, neighborhood comparisons, mortgage calculations, and investment analysis.

AVAILABLE PRE-CONSTRUCTION PROJECTS (${(projects || []).length} total):
${projectSummary}

KEY PAGES ON THE SITE:
- /search — MLS listings search (buy/rent)
- /search?tab=precon — Pre-construction projects
- /sold — Sold data
- /market — Market stats
- /neighborhood/[slug] — Neighborhood pages (e.g. /neighborhood/king-west)
- /properties/[slug] — Pre-construction project detail
- /listing/[mlsNumber] — MLS listing detail
- /contact-us — Contact page${nlpContext}

RULES:
- When recommending pre-con projects, include: name, neighborhood, price range, completion, and a link as [Name](/properties/slug)
- For MLS searches, describe what they're looking for and link to /search with appropriate filters
- Be concise, friendly, and helpful. Use short paragraphs.
- If users ask for investment advice, remind them to consult a licensed professional.
- Never guarantee returns or appreciation.
- Mention Toronto details: TTC/GO Transit, HST rebate, occupancy fees, assignment sales when relevant.
- Keep responses under 300 words unless detailed comparison requested.
- Prices are in Canadian dollars (CAD).
- Always disclose that Tal Shelef is a licensed Sales Representative at Rare Real Estate Inc.`;

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
