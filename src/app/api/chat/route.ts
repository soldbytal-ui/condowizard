import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const REPLIERS_API_KEY = process.env.REPLIERS_API_KEY;
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const REPLIERS_BASE = 'https://api.repliers.io';

// ─────────────────────────────────────────────────────────────
// Context builders — pull live data from Repliers + Supabase
// based on what the user is actually asking about.
// ─────────────────────────────────────────────────────────────

async function repliersGet(pathWithQuery: string, revalidate = 300): Promise<any | null> {
  if (!REPLIERS_API_KEY) return null;
  try {
    const res = await fetch(`${REPLIERS_BASE}${pathWithQuery}`, {
      headers: { 'REPLIERS-API-KEY': REPLIERS_API_KEY },
      next: { revalidate },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchMlsListing(mlsNumber: string): Promise<string> {
  const listing = await repliersGet(`/listings/${mlsNumber}?boardId=91`, 600);
  if (!listing || typeof listing !== 'object') return '';
  const a = listing.address || {};
  const d = listing.details || {};
  const unit = a.unitNumber ? `#${a.unitNumber} · ` : '';
  const streetLine = [a.streetNumber, a.streetName, a.streetSuffix].filter(Boolean).join(' ').trim();
  const address = `${unit}${streetLine}, ${a.city || 'Toronto'}`;
  const beds = d.numBedrooms != null ? String(d.numBedrooms) : '—';
  const bedsPlus = d.numBedroomsPlus ? `+${d.numBedroomsPlus}` : '';
  const baths = d.numBathrooms != null ? String(d.numBathrooms) : '—';
  const sqft = d.sqft || '—';
  const price = listing.listPrice ? `$${Number(listing.listPrice).toLocaleString()}` : 'Contact';
  const soldPrice = listing.soldPrice ? `$${Number(listing.soldPrice).toLocaleString()}` : null;
  const maint = listing.condominium?.fees?.maintenance || d.maintenanceFee;
  const parts = [
    `MLS ${listing.mlsNumber || mlsNumber}`,
    `Address: ${address}`,
    `Status: ${listing.status || 'A'}${listing.lastStatus ? ` (${listing.lastStatus})` : ''}`,
    `Price: ${price}${soldPrice ? ` — Sold ${soldPrice}` : ''}`,
    `Beds: ${beds}${bedsPlus} · Baths: ${baths} · Sqft: ${sqft}`,
    `Type: ${d.propertyType || d.type || '—'}${d.style ? ` (${d.style})` : ''}`,
    `Neighbourhood: ${a.neighborhood || a.community || '—'}`,
    `DOM: ${listing.daysOnMarket ?? '—'}`,
    maint ? `Maintenance: $${maint}/mo` : null,
    listing.taxes?.annualAmount ? `Taxes: $${Number(listing.taxes.annualAmount).toLocaleString()}/yr` : null,
    d.description ? `Description: ${String(d.description).slice(0, 400)}` : null,
    `Detail page: /listing/${listing.mlsNumber || mlsNumber}`,
  ].filter(Boolean);
  return `\n\nLISTING ${mlsNumber} (live from Repliers):\n${parts.join('\n')}`;
}

async function fetchMarketStats(): Promise<string> {
  const data = await repliersGet(
    `/listings?city=Toronto&status=A&type=sale&statistics=avg-listPrice,med-listPrice,cnt-available&listings=false&resultsPerPage=1&boardId=91`,
    600
  );
  if (!data) return '';
  const s = data.statistics || {};
  const avg = s.listPrice?.avg;
  const med = s.listPrice?.med;
  const active = data.count || 0;
  const lines = [
    `Toronto active listings: ${active.toLocaleString()}`,
    med != null ? `Median list price: $${Math.round(med).toLocaleString()}` : null,
    avg != null ? `Average list price: $${Math.round(avg).toLocaleString()}` : null,
  ].filter(Boolean);
  if (!lines.length) return '';
  return `\n\nTORONTO MARKET SNAPSHOT (live, active for-sale):\n${lines.join('\n')}\nFull dashboard: /market`;
}

async function fetchNeighbourhoodCounts(hint?: string): Promise<string> {
  // If the user mentioned a specific neighbourhood, look it up directly.
  if (hint) {
    const data = await repliersGet(
      `/listings?city=Toronto&status=A&type=sale&neighborhood=${encodeURIComponent(hint)}&statistics=avg-listPrice,med-listPrice,cnt-available&listings=false&resultsPerPage=1&boardId=91`,
      600
    );
    if (data && (data.count ?? 0) > 0) {
      const s = data.statistics || {};
      const lines = [
        `${hint}: ${data.count} active listings`,
        s.listPrice?.med ? `Median list: $${Math.round(s.listPrice.med).toLocaleString()}` : null,
        s.listPrice?.avg ? `Average list: $${Math.round(s.listPrice.avg).toLocaleString()}` : null,
      ].filter(Boolean);
      return `\n\nNEIGHBOURHOOD "${hint}" (live):\n${lines.join('\n')}\nBrowse: /search?tab=sale&neighborhood=${encodeURIComponent(hint)}`;
    }
  }
  // Fallback: top-20 Toronto neighbourhoods by active count.
  const data = await repliersGet(
    `/listings?city=Toronto&status=A&type=sale&aggregates=address.neighborhood&listings=false&resultsPerPage=1&boardId=91`,
    900
  );
  if (!data) return '';
  const hoods = data.aggregates?.address?.neighborhood || {};
  const entries = Object.entries(hoods)
    .filter(([, v]) => typeof v === 'number')
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 20);
  if (!entries.length) return '';
  const lines = entries.map(([name, count]) => `${name}: ${count} active`);
  return `\n\nTORONTO NEIGHBOURHOODS (top 20 by active for-sale count):\n${lines.join('\n')}`;
}

async function fetchSearchResults(userMsg: string): Promise<string> {
  // Repliers NLP returns a structured search interpretation with a `request.url`
  // we can then hit to get the actual listings.
  if (!REPLIERS_API_KEY) return '';
  try {
    const nlpRes = await fetch(`${REPLIERS_BASE}/nlp`, {
      method: 'POST',
      headers: { 'REPLIERS-API-KEY': REPLIERS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userMsg }),
    });
    if (!nlpRes.ok) return '';
    const nlp = await nlpRes.json();
    const url: string | undefined = nlp?.request?.url;
    if (!url) return '';
    // Cap results, ensure boardId, small page.
    const glue = url.includes('?') ? '&' : '?';
    const listRes = await fetch(`${url}${glue}resultsPerPage=5&boardId=91&hasImages=true`, {
      headers: { 'REPLIERS-API-KEY': REPLIERS_API_KEY },
      next: { revalidate: 300 },
    });
    if (!listRes.ok) return '';
    const data = await listRes.json();
    const listings: any[] = data.listings || [];
    if (!listings.length) {
      return `\n\nSEARCH RESULTS: 0 matches. Repliers NLP interpretation:\n${JSON.stringify(nlp?.summary || nlp?.request?.query || {}, null, 2)}`;
    }
    const lines = listings.slice(0, 5).map((l, i) => {
      const a = l.address || {};
      const d = l.details || {};
      const unit = a.unitNumber ? `#${a.unitNumber} ` : '';
      const street = [a.streetNumber, a.streetName, a.streetSuffix].filter(Boolean).join(' ').trim();
      const price = l.listPrice ? `$${Number(l.listPrice).toLocaleString()}` : '—';
      const beds = d.numBedrooms != null ? `${d.numBedrooms}bd` : '';
      const baths = d.numBathrooms != null ? `${d.numBathrooms}ba` : '';
      const sqft = d.sqft ? `${d.sqft} sqft` : '';
      const specs = [beds, baths, sqft].filter(Boolean).join(' · ');
      return `${i + 1}. ${price} — ${unit}${street}, ${a.city || 'Toronto'}${a.neighborhood ? ` (${a.neighborhood})` : ''} — ${specs} — MLS ${l.mlsNumber} — /listing/${l.mlsNumber}`;
    });
    return `\n\nSEARCH RESULTS (Repliers NLP, ${data.count} total, showing first 5):\n${lines.join('\n')}\nFull search: /search`;
  } catch {
    return '';
  }
}

async function fetchPreconProjects(userMsg: string): Promise<string> {
  // Uses the same Supabase table the homepage / new-condos page read from.
  const { data } = await supabase
    .from('projects')
    .select('name, slug, status, category, priceMin, priceMax, floors, totalUnits, estCompletion, neighborhood:neighborhoods(name), developer:developers(name)')
    .neq('status', 'COMPLETED')
    .neq('status', 'ARCHIVED')
    .order('updatedAt', { ascending: false })
    .limit(25);
  const rows = data || [];
  if (!rows.length) return '';
  // Optional light filter by neighbourhood/developer keyword in user's message.
  const q = userMsg.toLowerCase();
  const filtered = rows.filter((p: any) => {
    const bag = [p.name, p.neighborhood?.name, p.developer?.name].filter(Boolean).join(' ').toLowerCase();
    return q.split(/\W+/).filter(w => w.length > 3).some(w => bag.includes(w));
  });
  const use = (filtered.length ? filtered : rows).slice(0, 12);
  const lines = use.map((p: any) => {
    const price = p.priceMin
      ? `From $${Math.round(p.priceMin / 1000)}K${p.priceMax ? ` – $${Math.round(p.priceMax / 1000)}K` : ''}`
      : 'Pricing TBD';
    const size = [p.floors ? `${p.floors} floors` : null, p.totalUnits ? `${p.totalUnits} units` : null].filter(Boolean).join(' · ');
    return `- ${p.name} · ${p.neighborhood?.name || 'Toronto'}${p.developer?.name ? ` · by ${p.developer.name}` : ''} · ${p.status} · Occ. ${p.estCompletion || 'TBD'} · ${price}${size ? ` · ${size}` : ''} — /properties/${p.slug}`;
  });
  return `\n\nPRE-CONSTRUCTION PROJECTS (${filtered.length ? 'matched to your query' : 'latest'}):\n${lines.join('\n')}\nBrowse all: /new-condos`;
}

// ─────────────────────────────────────────────────────────────
// Intent detection — cheap keyword checks decide which context
// builders to run. Kept intentionally forgiving; false positives
// are cheap because Claude ignores irrelevant context.
// ─────────────────────────────────────────────────────────────

const NEIGHBOURHOODS: Array<{ name: string; keys: string[] }> = [
  { name: 'Annex', keys: ['annex'] },
  { name: 'King West', keys: ['king west', 'kingwest'] },
  { name: 'Liberty Village', keys: ['liberty village', 'liberty'] },
  { name: 'Yorkville', keys: ['yorkville'] },
  { name: 'Waterfront Communities C1', keys: ['waterfront', 'harbourfront', 'cityplace', 'fort york'] },
  { name: 'Willowdale East', keys: ['willowdale'] },
  { name: 'North York', keys: ['north york'] },
  { name: 'Leslieville', keys: ['leslieville'] },
  { name: 'Leaside', keys: ['leaside'] },
  { name: 'Yonge-Eglinton', keys: ['yonge and eglinton', 'yonge-eglinton', 'yonge eglinton'] },
  { name: 'High Park-Swansea', keys: ['high park'] },
  { name: 'Bay Street Corridor', keys: ['bay street corridor', 'bay corridor'] },
  { name: 'Niagara', keys: ['niagara'] },
  { name: 'Mimico', keys: ['mimico'] },
  { name: 'Scarborough', keys: ['scarborough'] },
  { name: 'Etobicoke', keys: ['etobicoke'] },
  { name: 'Mississauga', keys: ['mississauga'] },
  { name: 'Vaughan', keys: ['vaughan'] },
  { name: 'Markham', keys: ['markham'] },
];

function extractNeighbourhood(msg: string): string | undefined {
  const lc = msg.toLowerCase();
  for (const n of NEIGHBOURHOODS) {
    if (n.keys.some((k) => lc.includes(k))) return n.name;
  }
  return undefined;
}

function detectIntent(msg: string) {
  const lc = msg.toLowerCase();
  const mls = msg.match(/\b([CWENX])(\d{5,9})\b/i);
  const asksHood =
    /\b(neighbourhood|neighborhood|area|community)\b/.test(lc) ||
    NEIGHBOURHOODS.some((n) => n.keys.some((k) => lc.includes(k)));
  const asksMarket =
    /\b(average|median|market|stats|statistics|how much|worth|prices?|affordable|expensive|cheapest)\b/.test(lc);
  const asksSearch =
    /\b(find|show me|show us|looking for|search|need|want)\b/.test(lc) ||
    /\b(bed|bedroom|bath|bathroom|condo|house|apartment|apt|townhouse|townhome|semi|detached)\b/.test(lc) ||
    /\b(under|below|less than|around|about|budget|price)\s*\$?/.test(lc) ||
    /\b(rent|rental|lease|buy|for sale)\b/.test(lc);
  const asksPrecon =
    /\b(pre[- ]?construction|precon|new condo|new build|new development|upcoming|launching|assignment)\b/.test(lc);
  const asksAirbnb = /\b(airbnb|short[- ]?term|str|str-friendly|rental investment)\b/.test(lc);
  const asksSell =
    /\b(sell|selling|list my|list our|home evaluation|market evaluation|staging)\b/.test(lc);
  return {
    mlsNumber: mls ? `${mls[1].toUpperCase()}${mls[2]}` : null,
    asksHood,
    asksMarket,
    asksSearch,
    asksPrecon,
    asksAirbnb,
    asksSell,
    hoodName: extractNeighbourhood(msg),
  };
}

// ─────────────────────────────────────────────────────────────
// Route handler — keeps the existing SSE streaming contract that
// ChatWidget.tsx already understands.
// ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Chat is not configured. ANTHROPIC_API_KEY is missing.' }),
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

  const lastUserMsg: string = messages.filter((m: any) => m.role === 'user').pop()?.content || '';
  const intent = detectIntent(lastUserMsg);

  // Fan out to the relevant context builders in parallel. Each returns a
  // string block (possibly empty) that we join for the Claude context.
  const jobs: Array<Promise<string>> = [];
  if (intent.mlsNumber) jobs.push(fetchMlsListing(intent.mlsNumber));
  if (intent.asksMarket) jobs.push(fetchMarketStats());
  if (intent.asksHood) jobs.push(fetchNeighbourhoodCounts(intent.hoodName));
  if (intent.asksSearch && !intent.mlsNumber) jobs.push(fetchSearchResults(lastUserMsg));
  if (intent.asksPrecon) jobs.push(fetchPreconProjects(lastUserMsg));

  const contextBlocks = jobs.length ? await Promise.all(jobs) : [];
  let context = contextBlocks.filter(Boolean).join('');

  if (intent.asksAirbnb) {
    context += `\n\nAIRBNB / SHORT-TERM RENTAL: CondoWizard maintains a ranked list of Toronto condo buildings by City of Toronto STR registrations at /airbnb-friendly. Toronto STR bylaws restrict registration to a principal residence; investment-only STR is generally not permitted.`;
  }

  if (intent.asksSell) {
    context += `\n\nSELLER PATH: Tal Shelef (Sales Representative, Rare Real Estate Inc.) handles the full listing process. Book a seller consultation at /staging#consultation or call 647-890-4082.`;
  }

  const systemPrompt = `You are the CondoWizard AI assistant — a Toronto real estate expert on CondoWizard.ca. You represent Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage (1701 Avenue Rd, Toronto ON, 647-890-4082, Contact@condowizard.ca).

Your role:
- Answer questions about Toronto real estate using ONLY the DATA CONTEXT provided in the user's message (below). Do not fabricate MLS numbers, addresses, prices, or availability.
- Prefer concrete listings and projects from the context. When you mention one, format the link as [Anchor Text](/path).
- If the context is empty for a question, explain what you can help with and point to the right page: /search (MLS), /new-condos (pre-construction), /sold, /market, /neighborhood/[slug], /staging (seller), /airbnb-friendly, /contact-us.
- Use Canadian spelling (neighbourhood, centre, colour).
- Toronto specifics: TRREB MLS, HST rebate on pre-con, assignment sales, interim occupancy fees, TTC/GO Transit, VOW rules on sold prices.
- Never guarantee price appreciation or investment returns. Suggest professional advice for financial decisions.
- Keep responses to 2–3 short paragraphs. Longer only if the user explicitly asks for detail or comparison.
- Disclose that CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage — briefly, only when relevant (contact/selling/sold data questions).

Available site sections:
- /search — MLS listings (buy/rent, all types)
- /sold — Recently sold data (VOW-gated)
- /new-condos — Pre-construction projects
- /neighborhood/[slug] — Neighbourhood profiles
- /market — Live market dashboard
- /building/[slug] — Building profiles
- /listing/[MLS] — MLS listing detail
- /airbnb-friendly — STR-friendly buildings
- /blog — Buyer guides
- /staging — Seller services
- /contact-us — Contact Tal directly`;

  const userWithContext = context
    ? `${lastUserMsg}\n\n--- DATA CONTEXT (live from Repliers + Supabase — use this, do not repeat raw dumps) ---${context}`
    : lastUserMsg;

  // Rebuild the message list with the context injected into the LAST user turn only.
  const modelMessages = messages.map((m: any, i: number, arr: any[]) => {
    const isLastUser = i === arr.length - 1 && m.role === 'user';
    return { role: m.role, content: isLastUser ? userWithContext : m.content };
  });

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      system: systemPrompt,
      messages: modelMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Anthropic API error:', response.status, errText.slice(0, 500));
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
