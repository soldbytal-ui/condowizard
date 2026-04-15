'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  callAIWithFallback,
  ScaleAuthError,
  loadScaleConfig,
  buildBrainPrompt,
  ScaleModelConfig,
} from '@/lib/scale-ai';
import {
  MediaAsset, MediaCategory, MEDIA_CATEGORIES,
  TEMPLATES, CreativeSpec, SavedCreative,
  CHANNEL_CREATIVE_DIMS, VISUAL_CHANNELS,
  loadMedia, ensureSeededMedia, addMediaFromFile,
  renderCreativeToDataUrl,
} from '@/lib/scale-media';

// Shared with the dashboard — change here and the dashboard reflects.
export const SCALE_HISTORY_STORAGE_KEY = 'scale-campaign-history';
type HistoryStatus = 'Generated' | 'Pushed' | 'Failed';
interface ScaleHistoryEntry {
  id: string;
  campaignName: string;
  campaignType: string;       // CampaignType id
  campaignTypeLabel: string;
  channelId: string;
  channelName: string;
  projects: string[];         // target displayNames
  budget: number;
  status: HistoryStatus;
  date: string;               // ISO
}

function appendHistory(entry: ScaleHistoryEntry) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(SCALE_HISTORY_STORAGE_KEY);
    const list: ScaleHistoryEntry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    window.localStorage.setItem(SCALE_HISTORY_STORAGE_KEY, JSON.stringify(list.slice(0, 100)));
  } catch {
    // ignore
  }
}

function updateHistoryStatus(id: string, status: HistoryStatus) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(SCALE_HISTORY_STORAGE_KEY);
    if (!raw) return;
    const list: ScaleHistoryEntry[] = JSON.parse(raw);
    const idx = list.findIndex((e) => e.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], status, date: new Date().toISOString() };
    window.localStorage.setItem(SCALE_HISTORY_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════
type CampaignType =
  | 'pre_construction'
  | 'area_pages'
  | 'community_listings'
  | 'condo_staging'
  | 'short_term_rentals'
  | 'custom';

type TargetKind = 'projects' | 'neighborhoods' | 'communities' | 'none' | 'custom';

interface CampaignTypeMeta {
  id: CampaignType;
  label: string;
  description: string;
  color: string;
  iconPath: string;
  targetKind: TargetKind;
  stepLabel: string;        // label for step 2 when this type is chosen
  promptAngle: string;      // AI system-prompt context specific to this type
}

interface ScaleProject {
  id: string;
  name: string;
  slug?: string;
  neighborhood: string;
  developer: string;
  price: string;
  completion: string;
  floors: number | null;
  units: number | null;
  amenities: string[];
  description?: string;
  buildingType?: string;
  status: string;
  image: string;
  images?: string[];
}

interface ScaleNeighborhood { id: string; name: string; slug: string; landing: string; region: string }
interface ScaleCommunity { id: string; name: string; slug: string }

interface Channel {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  color: string;
  icon: string;
  disabled?: boolean;
  schemaHint: string;
  platformGuide: string;
}

type VariantKey = 'variant_a' | 'variant_b';
type GeneratedVariant = Record<string, unknown>;
interface GenerationResult {
  ok: boolean;
  data?: { variant_a: GeneratedVariant; variant_b: GeneratedVariant };
  error?: string;
  raw?: string;
}
type ResultMap = Record<string, GenerationResult>;

interface TargetRef {
  id: string;
  displayName: string;
  subtitle?: string;
  image?: string;
}

// ═══════════════════════════════════════════════════════════════
// Campaign types
// ═══════════════════════════════════════════════════════════════
const CAMPAIGN_TYPES: CampaignTypeMeta[] = [
  {
    id: 'pre_construction',
    label: 'Pre-Construction Condos',
    description: 'Advertise specific pre-construction projects from your database.',
    color: '#0066FF',
    iconPath: 'M3 20V10l5-4 5 4v10H3z M13 20V6l5-3 3 3v14H13z M3 20h18 M6 14h2 M6 17h2 M17 10h2 M17 14h2 M17 17h2',
    targetKind: 'projects',
    stepLabel: 'Select projects',
    promptAngle:
      'Ad focus: specific pre-construction condo project. Highlight the project\u2019s unique architecture, amenities, price point, deposit structure, and completion timing. Drive registrations for VIP Access / floor plans.',
  },
  {
    id: 'area_pages',
    label: 'Area Pages',
    description: 'Target neighborhood searches — "new condos in King West", "pre-construction Yorkville".',
    color: '#8B5CF6',
    iconPath: 'M12 2a7 7 0 00-7 7c0 4.5 7 13 7 13s7-8.5 7-13a7 7 0 00-7-7z M12 11a2 2 0 100-4 2 2 0 000 4z',
    targetKind: 'neighborhoods',
    stepLabel: 'Select neighborhoods',
    promptAngle:
      'Ad focus: the landing page is a neighborhood hub listing every new condo in that area. Position as the definitive local resource. Emphasize the neighbourhood\u2019s lifestyle, transit, restaurants, and the breadth of projects available. Drive clicks to the neighbourhood page, not a single project.',
  },
  {
    id: 'community_listings',
    label: 'Community Listings',
    description: 'Homes for sale in specific communities — powered by Repliers MLS data.',
    color: '#10B981',
    iconPath: 'M3 12l9-8 9 8v8a2 2 0 01-2 2h-4v-6H10v6H6a2 2 0 01-2-2v-8z',
    targetKind: 'communities',
    stepLabel: 'Select communities',
    promptAngle:
      'Ad focus: live MLS listings in a specific GTA community. Highlight inventory breadth, recent sold comps, and local character. Drive clicks to the live listings feed. Never quote specific prices \u2014 use "from the low $X" style ranges.',
  },
  {
    id: 'condo_staging',
    label: 'Condo Staging',
    description: 'Generate ads for condo staging services in Toronto.',
    color: '#F59E0B',
    iconPath: 'M4 20l6-6 3 3 7-7 M4 20h16 M14 4l4 4 M10 4h8v8',
    targetKind: 'none',
    stepLabel: 'Staging brief',
    promptAngle:
      'Ad focus: professional condo staging services in Toronto. Sell on faster sell times, higher final price, before/after transformation, and full-service logistics (consult, installation, de-stage). CTA: Book a staging consult.',
  },
  {
    id: 'short_term_rentals',
    label: 'Short-Term Rentals',
    description: 'Airbnb & furnished rental condos for investors.',
    color: '#EC4899',
    iconPath: 'M7 11V7a5 5 0 0110 0v4 M5 11h14v10H5z M12 16v2',
    targetKind: 'projects',
    stepLabel: 'Select investment projects',
    promptAngle:
      'Ad focus: investment condos suitable for Toronto\u2019s short-term rental (STR) and furnished-rental markets. Lead with rental yield, cash flow potential, Airbnb/MTR regulation compliance, and assignment potential before closing. Audience: investors, not end-users.',
  },
  {
    id: 'custom',
    label: 'Custom Campaign',
    description: 'Write a custom brief and let AI generate the campaign.',
    color: '#6366F1',
    iconPath: 'M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z',
    targetKind: 'custom',
    stepLabel: 'Custom brief',
    promptAngle:
      'Ad focus: whatever the user described in their custom brief. Follow their wording closely but still respect all Agent Brain rules (tone, legal, banned words).',
  },
];

// ═══════════════════════════════════════════════════════════════
// Toronto neighborhoods (Area Pages)
// ═══════════════════════════════════════════════════════════════
const TORONTO_REGIONS: Record<string, string[]> = {
  Downtown: ['Downtown Core', 'King West', 'Liberty Village', 'Queen West', 'Waterfront', 'CityPlace', 'Fort York', 'Canary District'],
  Midtown: ['Yorkville', 'The Annex', 'Midtown', 'Yonge & Eglinton', 'Forest Hill', 'Rosedale'],
  East: ['Leslieville', 'Riverside', 'Danforth', 'Leaside'],
  West: ['High Park', 'Junction', 'Roncesvalles'],
  Suburbs: ['North York', 'Scarborough', 'Etobicoke'],
  GTA: ['Mississauga', 'Vaughan', 'Richmond Hill', 'Markham', 'Oakville', 'Burlington', 'Hamilton', 'Brampton'],
};

function slugify(s: string) {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const TORONTO_NEIGHBORHOODS: ScaleNeighborhood[] = Object.entries(TORONTO_REGIONS).flatMap(([region, names]) =>
  names.map((name) => ({ id: `n-${slugify(name)}`, name, slug: slugify(name), landing: `condowizard.ca/areas/${slugify(name)}`, region }))
);

// ═══════════════════════════════════════════════════════════════
// GTA communities (Community Listings)
// ═══════════════════════════════════════════════════════════════
const GTA_COMMUNITY_NAMES = [
  'The Beaches', 'Roncesvalles Village', 'Leslieville', 'Riverdale', 'Danforth Village',
  'High Park', 'Bloor West Village', 'The Kingsway', 'Mimico', 'Long Branch',
  'Leaside', 'Davisville Village', 'Summerhill', 'Moore Park', 'Lawrence Park',
  'Bayview Village', 'Don Mills', 'Agincourt', 'Malvern', 'Willowdale',
  'Thornhill', 'Unionville', 'Streetsville', 'Port Credit', 'Oakville Old Town',
  'Burlington Downtown', 'Ancaster', 'Dundas', 'Waterdown', 'Milton Downtown',
];
const GTA_COMMUNITIES: ScaleCommunity[] = GTA_COMMUNITY_NAMES.map((n) => ({ id: `c-${slugify(n)}`, name: n, slug: slugify(n) }));

// ═══════════════════════════════════════════════════════════════
// Fallback projects (used only if fetch to /api/admin/scale/projects itself fails)
// ═══════════════════════════════════════════════════════════════
const FALLBACK_PROJECTS: ScaleProject[] = [
  { id: 'fb-king',      name: 'KING Toronto',    neighborhood: 'King West',        developer: 'Westbank',          price: '$900K – $3.2M',  completion: '2027', floors: 16, units: 514, amenities: ['Rooftop garden', 'Fitness centre'], status: 'PRE_CONSTRUCTION',     image: '' },
  { id: 'fb-walmer',    name: '429 Walmer',      neighborhood: 'Forest Hill',      developer: 'Camrost Felcorp',   price: '$1.4M – $4.8M',  completion: '2026', floors: 12, units: 88,  amenities: ['Concierge', 'Private dining'],      status: 'UNDER_CONSTRUCTION',   image: '' },
  { id: 'fb-bellwoods', name: 'Bellwoods House', neighborhood: 'Trinity Bellwoods',developer: 'Curated Properties', price: '$750K – $2.1M', completion: '2028', floors: 8,  units: 64,  amenities: ['Park-view terrace'],                 status: 'PRE_LAUNCH',           image: '' },
];

// ═══════════════════════════════════════════════════════════════
// Channels
// ═══════════════════════════════════════════════════════════════
const CHANNELS: Channel[] = [
  {
    id: 'google_search', name: 'Google Search', subtitle: 'Full RSA campaign structure',
    description:
      'Generates a complete Google Ads campaign: 15 headlines, 4 descriptions, sitelinks, callouts, keywords (exact + phrase), negatives, and bid / targeting recommendations. Output is API-shaped.',
    color: '#4285F4', icon: 'G',
    schemaHint: `Each variant MUST have:
{
  "headlines": string[15],                  // each ≤30 chars, NO exclamation marks, NO double-spaces
  "headline_pins": { "1": "<project-name-headline>", "2": "<cta-headline>" }, // which headline text to pin to positions 1 and 2
  "keyword_insertion_headlines": string[3], // must use {KeyWord:Default} syntax
  "descriptions": string[4],                // each ≤90 chars
  "paths": { "path1": string, "path2": string }, // each ≤15 chars — show in the display URL
  "keywords_exact": string[15],             // minimum 15 exact-match keywords for this ad group
  "keywords_phrase": string[10],            // minimum 10 phrase-match keywords
  "negatives": string[],                    // include: rental, rent, airbnb, hotel, resale, used, old, cheap, free
  "sitelinks": [ { "title": string (≤25), "description1": string (≤35), "description2": string (≤35), "url_path": string } ]  // exactly 4 sitelinks: Floor Plans, Pricing, Register, Location
  "callouts": string[4],                    // each ≤25 chars — e.g. "No Commission", "VIP Access", "Platinum Pricing", "2027 Occupancy"
  "structured_snippets": { "header": string, "values": string[] }, // e.g. header "Amenities", values the project's top amenities
  "bid_strategy": { "type": "MANUAL_CPC" | "MAXIMIZE_CLICKS" | "TARGET_CPA", "target_cpa_cad"?: number, "max_cpc_cad"?: number, "reason": string },
  "ad_schedule": [ { "days": string, "hours": string } ], // e.g. [{ "days": "MON-FRI", "hours": "07:00-22:00" }, { "days": "SAT-SUN", "hours": "09:00-20:00" }] — Toronto timezone
  "location_targeting": { "include": string[], "radius_km": number, "exclude": string[] }, // include Toronto + 50km; exclude United States
  "device_bid_adjustments": { "mobile_pct": number, "desktop_pct": number, "tablet_pct": number } // mobile should be +20% for real estate
}`,
    platformGuide: `GOOGLE SEARCH (RESPONSIVE SEARCH ADS) EXPERT RULES

Creative constraints
- RSA minimums: 3 headlines + 2 descriptions. Maximums: 15 headlines + 4 descriptions. ALWAYS output 15 headlines + 4 descriptions for ad strength "Excellent".
- Headlines ≤30 chars, descriptions ≤90 chars. Count carefully.
- Never use exclamation marks (against Google editorial policy for RSA).
- Pin headline 1 = always-show project name ("KING Toronto", "429 Walmer", etc.).
- Pin headline 2 = always-show CTA ("Register for VIP Access", "Get Floor Plans").
- Include at least 3 keyword-insertion headlines using the exact syntax {KeyWord:Default} — e.g. {KeyWord:Toronto Condos} lets Google swap the matched keyword in. The Default must work as a standalone headline.

Ad group + keyword structure
- 1 campaign → 1 ad group per project → that ad group contains 15–25+ exact-match keywords, 10+ phrase-match, and a full negative list.
- Exact keywords: include brand ("KING Toronto", "KING Toronto condos"), type ("KING Toronto pre construction"), intent ("KING Toronto floor plans", "KING Toronto price").
- Phrase keywords: neighbourhood-led, e.g. "new condos {neighbourhood}", "pre construction {neighbourhood}", "{neighbourhood} condos for sale".
- Negative keywords (always): rental, rent, airbnb, hotel, resale, used, old, cheap, free. Add more when obvious ("jobs", "careers").

Extensions
- Sitelinks: exactly 4, mandatory set — Floor Plans, Pricing, Register, Location. Title ≤25, each description line ≤35.
- Callouts: at least 4, each ≤25 chars. Typical set: "No Commission", "VIP Access", "Platinum Pricing", "2027 Occupancy" — tailor the completion year to the brief.
- Structured snippet: use header "Amenities" with the project's real amenities.

Bidding (pick based on daily budget)
- < $30/day → Manual CPC with max_cpc_cad ~$2.50.
- $30–$100/day → Maximize Clicks with max_cpc_cad cap to avoid waste.
- ≥ $100/day → Target CPA; recommend target_cpa_cad = $45 for GTA pre-con leads.

Targeting
- Location include: Toronto + 50 km radius. Always exclude United States to stop US bot clicks.
- Ad schedule: weekdays 07:00–22:00, weekends 09:00–20:00 (Toronto timezone).
- Device bid adjustments: mobile +20% (real estate searches skew mobile), desktop 0, tablet -10%.

The output is a complete Google Ads campaign structure JSON that can be pushed to the Google Ads API without further editing.`,
  },
  {
    id: 'google_display', name: 'Google Display', subtitle: 'Responsive display + placements',
    description:
      'Full display campaign: 5 short headlines, 5 long headlines, 5 descriptions, business name, targeting (in-market + affinity + managed placements), and frequency cap.',
    color: '#34A853', icon: 'D',
    schemaHint: `Each variant MUST have:
{
  "short_headlines": string[5],  // each ≤30 chars
  "long_headlines": string[5],   // each ≤90 chars
  "descriptions": string[5],     // each ≤90 chars
  "business_name": "CondoWizard.ca",
  "image_specs": [ { "label": "Landscape 1200x628" | "Square 1200x1200" | "Marketing 1200x628", "prompt": string } ],
  "in_market_audiences": string[],  // "Real Estate", "New Home Construction", "Condominiums", "Investment Properties"
  "affinity_audiences": string[],   // "Property Investors", "Urban Living Enthusiasts"
  "managed_placements": string[],   // suggested sites to target
  "placement_exclusions": string[], // games, dating apps, children's content, etc.
  "frequency_cap": { "impressions": 5, "per": "DAY", "scope": "USER" },
  "cta": string (≤15 chars)
}`,
    platformGuide: `GOOGLE DISPLAY EXPERT RULES

- Responsive display ads auto-adapt to 30+ ad sizes. Short headline ≤30 chars shows most often; long headline ≤90 chars appears on larger placements.
- Always set business_name to "CondoWizard.ca" for the branded footer.
- Image specs (for the creative team): 1200×628 landscape, 1200×1200 square, 1200×628 marketing image. Generate descriptive image prompts that match the project's real architecture, not generic condo stock.
- Audiences:
  - In-market (ready to buy): Real Estate, New Home Construction, Condominiums, Investment Properties.
  - Affinity (interest-level): Property Investors, Urban Living Enthusiasts.
- Managed placements to suggest: blogto.com, torontoist.com, narcity.com/toronto, realestatemagazine.ca.
- Always exclude: Games, dating apps, children's content.
- Frequency cap: 5 impressions per user per day — keeps CPM sane and avoids banner fatigue.`,
  },
  {
    id: 'meta_lead_gen', name: 'Meta Lead Gen', subtitle: 'Facebook + Instagram instant form',
    description:
      'Complete Meta Advantage+ lead gen: primary text, headline, description, CTA button, full lead-form schema, audience stack, placements, CBO budget, and CPL estimate.',
    color: '#1877F2', icon: 'f',
    schemaHint: `Each variant MUST have:
{
  "primary_text": string,            // ≤125 words (best 40–80). Use single \\n line breaks every 1–2 sentences for mobile readability.
  "headline": string,                // ≤40 chars (aim 25–30 for mobile)
  "description": string,             // ≤30 chars (often hidden on mobile — keep the hook in the headline)
  "cta_button": "Sign Up" | "Learn More" | "Get Quote" | "Subscribe" | "Apply Now" | "Register",
  "lead_form": {
    "context_card": { "headline": string, "paragraph": string (includes brokerage: "Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage") },
    "questions": [
      { "type": "FULL_NAME" },
      { "type": "EMAIL" },
      { "type": "PHONE_NUMBER" },
      { "type": "CUSTOM", "label": "What is your budget?", "options": ["Under $500K", "$500K-$750K", "$750K-$1M", "$1M-$1.5M", "$1.5M-$2M", "$2M+"] },
      { "type": "CUSTOM", "label": "When are you looking to buy?", "options": ["Immediately", "1-3 months", "3-6 months", "6-12 months", "12+ months"] }
    ],
    "privacy_policy_url": "https://condowizard.ca/privacy",
    "thank_you_headline": string,
    "thank_you_body": string
  },
  "audience_stack": {
    "interests": string[],           // Real estate, Condominiums, Property investment, Home buying, <project neighbourhood>, Toronto real estate
    "lookalike": { "source": "existing lead list", "ratio_pct": 1 },
    "custom_audience_retargeting": { "source": "website visitors", "window_days": 180 },
    "exclusions": string[],          // existing leads, real estate agents
    "age_min": 25,
    "age_max": 55,
    "location": { "include": string[], "radius_km": 50 }
  },
  "placements": ["Facebook Feed", "Instagram Feed", "Instagram Stories"],
  "disable_audience_network": true,
  "budget_strategy": "CAMPAIGN_BUDGET_OPTIMIZATION",
  "estimated_cpl_cad": { "min": 15, "max": 40, "note": string }
}`,
    platformGuide: `META LEAD GEN EXPERT RULES

- Primary text technical limit is 125 words, but the best-performing Toronto pre-con ads are 40–80 words. Use \\n line breaks every 1–2 sentences so it stays scannable on mobile.
- Headline ≤40 chars — but aim 25–30 so nothing gets cut on mobile feeds.
- Description ≤30 chars; frequently hidden on mobile, so assume the headline does all the work.
- CTA picks that convert for pre-con: "Sign Up" and "Learn More". "Register" works well if the brand is familiar.
- Instant Lead Form must include Full Name, Email, Phone, "What is your budget?" (the 6-tier range), and "When are you looking to buy?" (the 5-tier timeline). The context card always includes the brokerage line.
- Audience stack (pick all that apply):
  - Interest: Real estate, Condominiums, Property investment, Home buying, <specific neighborhood>, Toronto real estate.
  - Lookalike: 1% of your existing lead list.
  - Custom (retargeting): website visitors last 180 days.
  - Exclusions: existing leads, real estate agents (competitors click up your CPA).
  - Age 25–55. Location: GTA + 50 km, or the project's specific neighbourhood.
- Budget: Campaign Budget Optimization (CBO) at campaign level.
- Placements: Facebook Feed + Instagram Feed + Instagram Stories. Disable Audience Network — it hurts lead quality.
- Benchmark CPL for Toronto pre-con: $15 (entry-level product) to $40 (ultra-luxury). Note the expected range in the output based on the project's price tier.`,
  },
  {
    id: 'meta_carousel', name: 'Meta Carousel', subtitle: 'Scrollable 5-card ad',
    description:
      '5-card carousel. Each card is a 1080×1080 image with headline, description, landing URL, and creative prompt. Card 1 is the hero; card 5 is always the CTA.',
    color: '#E1306C', icon: 'C',
    schemaHint: `Each variant MUST have:
{
  "primary_text": string (≤125 chars, prefer 40–80 words),
  "cards": [
    { "slot": "hero",         "image_prompt": string, "headline": string (≤40), "description": string (≤20), "landing_path": string },
    { "slot": "interior",     "image_prompt": string, "headline": string, "description": string, "landing_path": string },
    { "slot": "amenities",    "image_prompt": string, "headline": string, "description": string, "landing_path": string },
    { "slot": "neighborhood", "image_prompt": string, "headline": string, "description": string, "landing_path": string },
    { "slot": "cta",          "image_prompt": string, "headline": string, "description": "Tap to register", "landing_path": "/register" }
  ],
  "cta_button": "Learn More" | "Sign Up" | "Register"
}`,
    platformGuide: `META CAROUSEL EXPERT RULES

- 3–10 cards allowed; the sweet spot is 5.
- Each card: 1080×1080 image, headline ≤40 chars, description ≤20 chars.
- Card sequence drives performance: Hero shot → Suite interior → Amenities → Neighborhood → Register CTA.
- Card 1 determines whether anyone swipes — make it the strongest architectural shot with the boldest headline.
- Card 5 (or whatever last slot) must be the CTA card — directional visual + clear "register/tap" language.
- Keep a consistent visual treatment across cards (same filter, same overlay style, same typography).
- Image prompts should describe real project architecture — never generic stock.`,
  },
  {
    id: 'ig_stories', name: 'Instagram Stories', subtitle: 'Full-screen vertical story',
    description:
      '3–4 slide vertical story with hook → value → proof → CTA. Includes music / motion notes, safe-area rules, and overlay text guidance.',
    color: '#F56040', icon: 'I',
    schemaHint: `Each variant MUST have:
{
  "slides": [
    { "role": "hook",   "duration_sec": 2, "overlay_text": string (≤8 words), "image_prompt": string, "motion_note": string },
    { "role": "value",  "duration_sec": 4, "overlay_text": string (≤8 words), "image_prompt": string, "motion_note": string },
    { "role": "proof",  "duration_sec": 4, "overlay_text": string (≤8 words), "image_prompt": string, "motion_note": string },
    { "role": "cta",    "duration_sec": 3, "overlay_text": "Swipe up", "image_prompt": string, "motion_note": string, "sticker": "SWIPE_UP_ARROW" }
  ],
  "caption": string (≤90 chars),
  "cta_sticker": "Swipe Up" | "Tap to Register" | "See More",
  "music_note": string,
  "safe_area_note": "Top 15% and bottom 20% reserved for UI — overlay text must not appear in those zones."
}`,
    platformGuide: `INSTAGRAM STORIES EXPERT RULES

- Aspect ratio: 9:16 (1080×1920). Each slide ≤15 seconds.
- Overlay text: 6–8 words max per slide, large font, high contrast.
- Safe area: leave the top 15% and bottom 20% clear — Instagram's UI (profile chip, reply bar) covers those zones.
- Slide sequence: Hook (1–2 sec grab) → Value (what's special) → Proof (price / developer / completion) → CTA (swipe up).
- Always end with "Swipe Up" or a directional arrow sticker on the last slide.
- 3–4 slides outperforms 5+. More slides = more drop-off.
- Include a music / motion note — moving or musical stories get ~30% more engagement.`,
  },
  {
    id: 'email', name: 'Email', subtitle: 'CASL-compliant Toronto real estate email',
    description:
      'Subject + preheader + 2–3 paragraph body + CTA + Canadian brokerage footer. Includes send-time recommendation and CASL compliance note.',
    color: '#EA4335', icon: 'E',
    schemaHint: `Each variant MUST have:
{
  "subject": string (≤50 chars, include project name or neighborhood),
  "preheader": string (≤100 chars, complements subject — never repeats it),
  "body_paragraphs": string[3], // structure: hook → project details → CTA paragraph. Max 3 paragraphs.
  "cta_text": string,
  "cta_url": string,
  "footer": "Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082 | Contact@condowizard.ca",
  "unsubscribe_required": true,
  "recommended_send_window": { "days": "TUE-THU", "hours": "10:00-14:00", "timezone": "America/Toronto" },
  "casl_note": "CASL requires express consent from Canadian recipients for commercial emails. Only send to leads who explicitly opted in."
}`,
    platformGuide: `EMAIL EXPERT RULES (TORONTO REAL ESTATE + CASL)

- Subject: ≤50 chars. Always include the project name or neighborhood to lift open rates.
- Preheader: ≤100 chars. Complements the subject — never repeats it (wasted copy).
- Body: 2–3 paragraphs max. Structure: hook → project details (price, completion, one stand-out fact) → CTA paragraph.
- Must include: unsubscribe link (CAN-SPAM + Canadian CASL compliance).
- CASL: commercial emails to Canadian addresses require express consent. Flag this in every output — only leads who explicitly opted in can be contacted.
- Best send window for Toronto real estate: Tuesday–Thursday, 10am–2pm (America/Toronto).
- Mandatory footer: "Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082 | Contact@condowizard.ca".`,
  },
  {
    id: 'tiktok', name: 'TikTok', subtitle: 'Coming soon',
    description: 'TikTok Spark ads are on the roadmap. Check back shortly.',
    color: '#69C9D0', icon: 'T', disabled: true,
    schemaHint: '',
    platformGuide: '',
  },
];

// ═══════════════════════════════════════════════════════════════
// Theme
// ═══════════════════════════════════════════════════════════════
const S = {
  pageBg: '#F5F5F7',
  pageHeading: '#111318',
  pageSubtitle: '#6B7185',
  bg: '#111318',
  surface: '#111318',
  surfaceHover: '#1A1D23',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF',
  accentSoft: 'rgba(0,102,255,0.14)',
  accentStrong: 'rgba(0,102,255,0.22)',
  accentBorder: 'rgba(0,102,255,0.45)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.14)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.12)',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#6B7185',
  textDim: '#555B67',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';

const sectionLabelStyle: React.CSSProperties = {
  fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em',
  color: S.textMuted, fontWeight: 600, marginBottom: 14,
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function statusLabel(s: string) {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function tryParseJson(text: string): unknown | null {
  if (!text) return null;
  const trimmed = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
  try { return JSON.parse(trimmed); } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch {} }
  return null;
}

function csvEscape(v: string | number) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function flattenToRows(obj: unknown, prefix = ''): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  if (Array.isArray(obj)) {
    obj.forEach((item, i) => { out.push(...flattenToRows(item, prefix ? `${prefix}[${i}]` : `[${i}]`)); });
  } else if (obj && typeof obj === 'object') {
    Object.entries(obj as Record<string, unknown>).forEach(([k, v]) => { out.push(...flattenToRows(v, prefix ? `${prefix}.${k}` : k)); });
  } else {
    out.push([prefix, String(obj ?? '')]);
  }
  return out;
}

// Build a system prompt that varies by campaign type.
function buildSystemPrompt(args: {
  campaignMeta: CampaignTypeMeta;
  channel: Channel;
  brain: string;
  project?: ScaleProject;
  neighborhood?: ScaleNeighborhood;
  community?: ScaleCommunity;
  customBrief?: string;
}) {
  const { campaignMeta, channel, brain, project, neighborhood, community, customBrief } = args;

  const base = `You are Scale, the AI ad copywriter for CondoWizard.ca \u2014 a Toronto real estate platform. You generate ad copy for Tal Shelef, Sales Representative at Rare Real Estate Inc.

You write copy that is specific, grounded in the brief below, and compliant with Ontario real estate advertising rules.${brain}

CAMPAIGN TYPE: ${campaignMeta.label}
${campaignMeta.promptAngle}`;

  let brief = '';
  if (project) {
    brief = `
PROJECT BRIEF
- Name: ${project.name}
- Neighbourhood: ${project.neighborhood}
- Developer: ${project.developer}
- Price: ${project.price}
- Completion: ${project.completion}
- Floors / Units: ${project.floors ?? '\u2014'} / ${project.units ?? '\u2014'}
- Amenities: ${project.amenities.join(', ') || '\u2014'}
- Status: ${statusLabel(project.status)}
- Landing page: condowizard.ca/pre-construction/${project.slug || slugify(project.name)}`;
  } else if (neighborhood) {
    brief = `
NEIGHBOURHOOD BRIEF
- Name: ${neighborhood.name}
- Region: ${neighborhood.region}
- Landing page: ${neighborhood.landing}
- Ad intent: pull searchers looking for "new condos in ${neighborhood.name}" or "pre-construction ${neighborhood.name}" into a neighbourhood hub that lists every active project.`;
  } else if (community) {
    brief = `
COMMUNITY BRIEF
- Community: ${community.name}
- Landing page: condowizard.ca/communities/${community.slug}
- Ad intent: live MLS homes for sale in ${community.name}. Highlight inventory breadth and local character, not specific prices.`;
  } else if (customBrief) {
    brief = `
CUSTOM BRIEF (user-provided)
"""
${customBrief.trim()}
"""`;
  } else {
    brief = `
SERVICE BRIEF
- Service: Professional condo staging in Toronto by Tal Shelef's team.
- Value: faster sell times, higher final sale prices, full-service logistics (consult \u2192 install \u2192 de-stage).
- Landing page: condowizard.ca/staging
- CTA: Book a staging consult.`;
  }

  return `${base}
${brief}

CHANNEL: ${channel.name}
${channel.description}

${channel.platformGuide ? `=== ${channel.name.toUpperCase()} PLATFORM EXPERTISE ===
${channel.platformGuide}
=== END PLATFORM EXPERTISE ===
` : ''}
OUTPUT SHAPE
${channel.schemaHint}

TASK
You are writing as a senior ${channel.name} specialist who has shipped hundreds of Toronto real estate campaigns. Apply EVERY rule in the platform expertise above. Hit every character / word limit. Include every required field in the output shape.

Produce TWO variants:
- variant_a leads with BENEFIT / lifestyle angle (architecture, neighbourhood, amenities, how it feels to live there).
- variant_b leads with URGENCY / timing angle (limited suites, completion timing, price tier, platinum access).

Return ONLY a JSON object shaped like:
{
  "variant_a": { ...exactly the output shape above },
  "variant_b": { ...exactly the output shape above }
}

No prose wrapper. No markdown fences. JSON only. If you are not sure about a char limit, stay BELOW it.`;
}

// ═══════════════════════════════════════════════════════════════
// Icons
// ═══════════════════════════════════════════════════════════════
const Check = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 7l3 3 5-5" /></svg>
);
const Search = () => <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="7" cy="7" r="5" /><path d="M11 11l3 3" /></svg>;
const Sparkle = () => <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0l1.5 4.5L13 6l-4.5 1.5L7 12l-1.5-4.5L1 6l4.5-1.5z" /></svg>;
const ArrowRight = () => <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 7h8M8 4l3 3-3 3" /></svg>;
const ArrowLeft = () => <svg width="16" height="16" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M11 7H3M6 4L3 7l3 3" /></svg>;
const Copy = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><rect x="4" y="4" width="8" height="8" rx="1.5" /><path d="M2 10V3a1 1 0 011-1h7" /></svg>;
const Refresh = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M12 7a5 5 0 11-1.5-3.5L12 5M12 2v3H9" /></svg>;
const Download = () => <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M7 2v8M4 7l3 3 3-3M2 12h10" /></svg>;

function CampaignIcon({ path, color, size = 28 }: { path: string; color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {path.split(' M').map((d, i) => <path key={i} d={(i === 0 ? '' : 'M') + d} />)}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step indicator (5 steps; adapts label for step 2 by campaign type)
// ═══════════════════════════════════════════════════════════════
function StepIndicator({
  current, stepLabels, skipStep2, skipCreative,
}: { current: number; stepLabels: string[]; skipStep2: boolean; skipCreative: boolean }) {
  // Build the visible labels, filtering out steps that don't apply to this channel.
  const hidden = new Set<number>();
  if (skipStep2) hidden.add(1);      // index 1 == "Select target"
  if (skipCreative) hidden.add(4);   // index 4 == "Creative"
  const labels = stepLabels.filter((_, i) => !hidden.has(i));
  const countHiddenBelow = (step: number) =>
    Array.from(hidden).filter((i) => i + 1 < step).length;
  const logicalCurrent = current - countHiddenBelow(current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, padding: '24px 0 40px', maxWidth: 1000 }}>
      {labels.map((label, i) => {
        const step = i + 1;
        const completed = step < logicalCurrent;
        const active = step === logicalCurrent;
        return (
          <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i === labels.length - 1 ? '0 0 auto' : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: completed ? S.accent : active ? '#fff' : 'rgba(0,0,0,0.04)',
                border: `1.5px solid ${completed ? S.accent : active ? S.accent : 'rgba(0,0,0,0.12)'}`,
                color: completed ? '#fff' : active ? S.accent : S.pageSubtitle,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, fontFamily: S.mono,
                transition: 'all 0.2s',
              }}>
                {completed ? <Check size={15} /> : step}
              </div>
              <span style={{
                fontSize: 15, fontWeight: 500,
                color: active ? S.pageHeading : completed ? S.pageHeading : S.pageSubtitle,
                whiteSpace: 'nowrap',
              }}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: completed ? S.accent : 'rgba(0,0,0,0.08)', margin: '0 20px', minWidth: 24 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════
export default function CampaignsWizard() {
  // Data
  const [projects, setProjects] = useState<ScaleProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [config, setConfig] = useState<ScaleModelConfig | null>(null);
  const [serverAnthropicAvailable, setServerAnthropicAvailable] = useState<boolean | null>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [campaignType, setCampaignType] = useState<CampaignType | null>(null);
  const [search, setSearch] = useState('');
  const [neighborhoodFilter, setNeighborhoodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customBrief, setCustomBrief] = useState('');
  const [channelId, setChannelId] = useState<string>('google_search');
  const [budget, setBudget] = useState(50);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState({ current: 0, total: 0, currentName: '' });
  const [results, setResults] = useState<ResultMap>({});
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [activeVariant, setActiveVariant] = useState<VariantKey>('variant_a');
  const [copiedKey, setCopiedKey] = useState<string>('');
  const [creatives, setCreatives] = useState<Record<string, SavedCreative[]>>({});
  const cancelRef = useRef(false);
  const historyIdRef = useRef<string>('');
  const searchParams = useSearchParams();

  // Pre-select campaign type from ?type= query param (from dashboard quick actions)
  useEffect(() => {
    const typeParam = searchParams?.get('type');
    if (!typeParam) return;
    const match = CAMPAIGN_TYPES.find((c) => c.id === typeParam);
    if (match && match.id !== campaignType) {
      setCampaignType(match.id);
      setStep(match.targetKind === 'none' ? 3 : 2);
    }
    // Only run once per param change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    setConfig(loadScaleConfig());
    // Probe the server to see if ANTHROPIC_API_KEY is available as a fallback.
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/ai/proxy', { cache: 'no-store' });
        const data = await res.json().catch(() => ({}));
        setServerAnthropicAvailable(Boolean(data?.anthropicConfigured));
      } catch {
        setServerAnthropicAvailable(false);
      }
    })();
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/projects', { cache: 'no-store' });
        const data = await res.json();
        if (Array.isArray(data.projects) && data.projects.length > 0) {
          setProjects(data.projects);
          setUsingFallback(false);
        } else {
          setProjects(FALLBACK_PROJECTS);
          setUsingFallback(true);
        }
      } catch {
        setProjects(FALLBACK_PROJECTS);
        setUsingFallback(true);
      } finally {
        setProjectsLoading(false);
      }
    })();
  }, []);

  const campaignMeta = useMemo(
    () => CAMPAIGN_TYPES.find((c) => c.id === campaignType) || null,
    [campaignType]
  );
  const channel = useMemo(() => CHANNELS.find((c) => c.id === channelId) || CHANNELS[0], [channelId]);
  const skipTargetStep = campaignType === 'condo_staging';
  const skipCreativeStep = !VISUAL_CHANNELS.has(channel.id);

  // Filtered projects for Step 2 (pre_construction, short_term_rentals)
  const neighborhoodOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => { if (p.neighborhood && p.neighborhood !== '—') set.add(p.neighborhood); });
    return Array.from(set).sort();
  }, [projects]);
  const statusOptions = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => { if (p.status) set.add(p.status); });
    return Array.from(set).sort();
  }, [projects]);
  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (neighborhoodFilter !== 'all' && p.neighborhood !== neighborhoodFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (q) {
        const hay = `${p.name} ${p.neighborhood} ${p.developer}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [projects, search, neighborhoodFilter, statusFilter]);

  const filteredNeighborhoods = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return TORONTO_NEIGHBORHOODS;
    return TORONTO_NEIGHBORHOODS.filter((n) => n.name.toLowerCase().includes(q) || n.region.toLowerCase().includes(q));
  }, [search]);

  const filteredCommunities = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return GTA_COMMUNITIES;
    return GTA_COMMUNITIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [search]);

  // Derive the targets the user has selected
  const selectedTargets: TargetRef[] = useMemo(() => {
    if (!campaignMeta) return [];
    if (campaignMeta.targetKind === 'projects') {
      return projects
        .filter((p) => selectedIds.has(p.id))
        .map((p) => ({ id: p.id, displayName: p.name, subtitle: `${p.neighborhood} · ${p.developer}`, image: p.image }));
    }
    if (campaignMeta.targetKind === 'neighborhoods') {
      return TORONTO_NEIGHBORHOODS
        .filter((n) => selectedIds.has(n.id))
        .map((n) => ({ id: n.id, displayName: n.name, subtitle: n.landing }));
    }
    if (campaignMeta.targetKind === 'communities') {
      return GTA_COMMUNITIES
        .filter((c) => selectedIds.has(c.id))
        .map((c) => ({ id: c.id, displayName: c.name, subtitle: `Homes for sale in ${c.name}` }));
    }
    if (campaignMeta.targetKind === 'none') {
      return [{ id: 'staging', displayName: 'Toronto Condo Staging', subtitle: 'Full-service staging' }];
    }
    if (campaignMeta.targetKind === 'custom') {
      const preview = customBrief.trim().slice(0, 80) || 'Custom brief';
      return customBrief.trim() ? [{ id: 'custom', displayName: 'Custom campaign', subtitle: preview }] : [];
    }
    return [];
  }, [campaignMeta, projects, selectedIds, customBrief]);

  const canContinueTargets = selectedTargets.length > 0;

  // Actions
  const pickCampaignType = (id: CampaignType) => {
    if (campaignType !== id) {
      setSelectedIds(new Set());
      setSearch('');
      setNeighborhoodFilter('all');
      setStatusFilter('all');
    }
    setCampaignType(id);
  };

  const toggleId = (id: string) => {
    setSelectedIds((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const selectAllFiltered = () => {
    if (!campaignMeta) return;
    if (campaignMeta.targetKind === 'projects') setSelectedIds(new Set(filteredProjects.map((p) => p.id)));
    if (campaignMeta.targetKind === 'neighborhoods') setSelectedIds(new Set(filteredNeighborhoods.map((n) => n.id)));
    if (campaignMeta.targetKind === 'communities') setSelectedIds(new Set(filteredCommunities.map((c) => c.id)));
  };
  const deselectAll = () => setSelectedIds(new Set());

  const monthlyCost = budget * 30;

  // Auth readiness — true when we can make at least one AI call without the
  // user needing to touch Settings. Three paths:
  //   1) User pasted a key in Settings (any provider).
  //   2) Provider is OpenRouter Free (no key needed).
  //   3) Provider is Anthropic AND the server has ANTHROPIC_API_KEY set.
  const authReady = !!(
    config && (
      config.apiKey ||
      config.provider === 'openrouter_free' ||
      (config.provider === 'anthropic' && serverAnthropicAvailable)
    )
  );
  const authHint = !config
    ? 'Go to the Settings tab to configure your AI provider and API key.'
    : config.provider === 'anthropic'
      ? 'No API key found and no server-side ANTHROPIC_API_KEY is set. Go to the Settings tab to paste your Anthropic key, or ask the platform team to add ANTHROPIC_API_KEY to the environment.'
      : `No API key found for ${config.provider === 'openrouter' ? 'OpenRouter' : config.provider}. Go to the Settings tab to paste your key.`;

  const goNextFromStep = (s: number) => {
    // Step 1 → 3 when staging skips the target step
    if (s === 1 && skipTargetStep) { setStep(3); return; }
    // Step 4 (Configure) → 6 (Review) when channel has no creative step
    if (s === 4 && skipCreativeStep) { setStep(6); return; }
    // Step 5 (Creative) → 6 (Review)
    setStep(s + 1);
  };
  const goBackFromStep = (s: number) => {
    // Step 3 (Channel) back skips target for staging
    if (s === 3 && skipTargetStep) { setStep(1); return; }
    // Step 6 (Review) back skips creative for text-only channels
    if (s === 6 && skipCreativeStep) { setStep(4); return; }
    setStep(s - 1);
  };

  const startGeneration = async () => {
    if (!config || !campaignMeta) return;
    cancelRef.current = false;
    setGenerating(true);
    setResults({});
    setGenProgress({ current: 0, total: selectedTargets.length, currentName: '' });
    // After generation: visual channels go to Creative (5), text-only skip to Review (6).
    setStep(skipCreativeStep ? 6 : 5);

    // Create a history entry up-front so the dashboard shows it immediately.
    const firstProject = selectedTargets[0]?.displayName || 'Campaign';
    const today = new Date().toISOString().slice(0, 10);
    const channelSuffix = channel.id === 'google_display' ? 'Display'
      : channel.id === 'google_search' ? 'Search'
      : channel.name.replace(/\s+/g, '');
    const historyId = `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    historyIdRef.current = historyId;
    appendHistory({
      id: historyId,
      campaignName: `Scale_${firstProject.replace(/[^A-Za-z0-9]/g, '')}_${channelSuffix}_${today}`,
      campaignType: campaignMeta.id,
      campaignTypeLabel: campaignMeta.label,
      channelId: channel.id,
      channelName: channel.name,
      projects: selectedTargets.map((t) => t.displayName),
      budget,
      status: 'Generated',
      date: new Date().toISOString(),
    });

    const brain = buildBrainPrompt();
    const targets = selectedTargets;
    const newResults: ResultMap = {};

    for (let i = 0; i < targets.length; i++) {
      if (cancelRef.current) break;
      const t = targets[i];
      setGenProgress({ current: i, total: targets.length, currentName: t.displayName });

      try {
        const system = buildSystemPromptFor(campaignMeta, channel, brain, t);
        const user = `Generate a ${channel.name} ad for: ${t.displayName}. Return JSON only \u2014 variant_a (benefit-led) and variant_b (urgency-led).`;
        const raw = await callAIWithFallback(config, system, user);
        const parsed = tryParseJson(raw) as { variant_a?: GeneratedVariant; variant_b?: GeneratedVariant } | null;

        if (parsed && parsed.variant_a && parsed.variant_b) {
          newResults[t.id] = { ok: true, data: { variant_a: parsed.variant_a, variant_b: parsed.variant_b }, raw };
        } else {
          newResults[t.id] = { ok: false, error: 'Model did not return valid variant_a / variant_b JSON.', raw };
        }
      } catch (err) {
        const isAuth = err instanceof ScaleAuthError;
        const message = err instanceof Error ? err.message : String(err);
        newResults[t.id] = {
          ok: false,
          error: isAuth
            ? `${message} (Go to the Settings tab to configure your AI provider and API key.)`
            : message,
        };
        // If it's auth, abort the loop — no point blasting all targets.
        if (isAuth) {
          setResults({ ...newResults });
          break;
        }
      }
      setResults({ ...newResults });
    }

    setGenProgress((g) => ({ ...g, current: targets.length, currentName: '' }));
    setGenerating(false);
    if (!cancelRef.current) {
      const firstId = targets[0]?.id;
      if (firstId) setActiveResultId(firstId);
    }
  };

  const buildSystemPromptFor = (
    cm: CampaignTypeMeta,
    ch: Channel,
    brain: string,
    target: TargetRef
  ) => {
    if (cm.targetKind === 'projects') {
      const project = projects.find((p) => p.id === target.id);
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, project });
    }
    if (cm.targetKind === 'neighborhoods') {
      const neighborhood = TORONTO_NEIGHBORHOODS.find((n) => n.id === target.id);
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, neighborhood });
    }
    if (cm.targetKind === 'communities') {
      const community = GTA_COMMUNITIES.find((c) => c.id === target.id);
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, community });
    }
    if (cm.targetKind === 'custom') {
      return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain, customBrief });
    }
    return buildSystemPrompt({ campaignMeta: cm, channel: ch, brain });
  };

  const cancelGeneration = () => { cancelRef.current = true; setGenerating(false); };

  const regenerateOne = async (targetId: string) => {
    if (!config || !campaignMeta) return;
    const target = selectedTargets.find((t) => t.id === targetId);
    if (!target) return;
    setResults((r) => ({ ...r, [targetId]: { ok: false, error: 'Regenerating…' } }));
    const brain = buildBrainPrompt();
    try {
      const system = buildSystemPromptFor(campaignMeta, channel, brain, target);
      const user = `Generate a ${channel.name} ad for: ${target.displayName}. Return JSON only.`;
      const raw = await callAIWithFallback(config, system, user);
      const parsed = tryParseJson(raw) as { variant_a?: GeneratedVariant; variant_b?: GeneratedVariant } | null;
      if (parsed && parsed.variant_a && parsed.variant_b) {
        setResults((r) => ({ ...r, [targetId]: { ok: true, data: { variant_a: parsed.variant_a!, variant_b: parsed.variant_b! }, raw } }));
      } else {
        setResults((r) => ({ ...r, [targetId]: { ok: false, error: 'Model did not return valid JSON.', raw } }));
      }
    } catch (err) {
      const isAuth = err instanceof ScaleAuthError;
      const message = err instanceof Error ? err.message : String(err);
      setResults((r) => ({
        ...r,
        [targetId]: {
          ok: false,
          error: isAuth
            ? `${message} (Go to the Settings tab to configure your AI provider and API key.)`
            : message,
        },
      }));
    }
  };

  const copy = (text: string, key: string) => {
    try { navigator.clipboard?.writeText(text); } catch {}
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 1400);
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ campaignType, channel: channel.id, results, creatives }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scale-${campaignType}-${channel.id}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyCsv = () => {
    const rows: string[] = [['target', 'variant', 'field', 'value'].map(csvEscape).join(',')];
    Object.entries(results).forEach(([tid, r]) => {
      const t = selectedTargets.find((x) => x.id === tid);
      if (!r.ok || !r.data) return;
      (['variant_a', 'variant_b'] as VariantKey[]).forEach((vk) => {
        flattenToRows(r.data![vk]).forEach(([field, value]) => {
          rows.push([t?.displayName || tid, vk, field, value].map(csvEscape).join(','));
        });
      });
    });
    copy(rows.join('\n'), 'csv-all');
  };

  // ══════════════════════════════════════════════════════════════
  // Step labels for the indicator
  // ══════════════════════════════════════════════════════════════
  const stepLabels = [
    'Campaign Type',
    campaignMeta?.stepLabel || 'Select target',
    'Choose Channel',
    'Configure',
    'Creative',
    'Review Output',
    'Push to Ads',
  ];

  return (
    <div style={{ fontFamily: S.font, color: S.textPrimary, fontSize: 16, lineHeight: 1.6 }}>
      <style>{`
        @keyframes sSlideIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes sSpin { to { transform: rotate(360deg); } }
        @keyframes sPulse { 0%,100% { opacity: 1; } 50% { opacity: .55; } }
        .s-card { transition: border-color 0.15s, background 0.15s, transform 0.15s; }
        .s-card:hover:not(.s-disabled) { border-color: ${S.borderHover} !important; }
        .s-btn { transition: all 0.15s; }
        .s-btn:hover:not(:disabled) { filter: brightness(1.08); }
        .s-field { transition: all 0.15s; cursor: pointer; }
        .s-field:hover { background: ${S.surfaceHover} !important; border-color: ${S.borderHover} !important; }
        input[type="range"].s-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; background: ${S.border}; border-radius: 2px; outline: none; }
        input[type="range"].s-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; border-radius: 50%; background: ${S.accent}; cursor: pointer; border: 3px solid ${S.bg}; box-shadow: 0 2px 8px rgba(0,102,255,0.4); }
        input[type="range"].s-slider::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: ${S.accent}; cursor: pointer; border: 3px solid ${S.bg}; box-shadow: 0 2px 8px rgba(0,102,255,0.4); }
        .s-scroll::-webkit-scrollbar { width: 7px; }
        .s-scroll::-webkit-scrollbar-thumb { background: ${S.border}; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 40px 96px', animation: 'sSlideIn 0.25s ease' }}>
        <StepIndicator current={step} stepLabels={stepLabels} skipStep2={skipTargetStep} skipCreative={skipCreativeStep} />

        {usingFallback && step === 2 && campaignMeta?.targetKind === 'projects' && (
          <div style={{
            padding: '14px 18px', borderRadius: 10,
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
            color: '#FDE68A', fontSize: 14, marginBottom: 24,
          }}>
            Showing sample projects — no active projects found in the database.
          </div>
        )}

        {step === 1 && (
          <StepCampaignType
            value={campaignType}
            onPick={pickCampaignType}
            onContinue={() => goNextFromStep(1)}
          />
        )}

        {step === 2 && campaignMeta && (
          <StepTarget
            campaignMeta={campaignMeta}
            projects={filteredProjects}
            totalProjects={projects.length}
            projectsLoading={projectsLoading}
            neighborhoods={filteredNeighborhoods}
            communities={filteredCommunities}
            customBrief={customBrief}
            setCustomBrief={setCustomBrief}
            search={search}
            setSearch={setSearch}
            neighborhoodFilter={neighborhoodFilter}
            setNeighborhoodFilter={setNeighborhoodFilter}
            neighborhoodOptions={neighborhoodOptions}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            statusOptions={statusOptions}
            selectedIds={selectedIds}
            toggleId={toggleId}
            selectAll={selectAllFiltered}
            deselectAll={deselectAll}
            canContinue={canContinueTargets}
            onBack={() => goBackFromStep(2)}
            onContinue={() => goNextFromStep(2)}
          />
        )}

        {step === 3 && (
          <StepChannel
            channelId={channelId}
            onSelect={setChannelId}
            onBack={() => goBackFromStep(3)}
            onContinue={() => goNextFromStep(3)}
          />
        )}

        {step === 4 && campaignMeta && (
          <StepConfigure
            campaignMeta={campaignMeta}
            targets={selectedTargets}
            channel={channel}
            budget={budget}
            setBudget={setBudget}
            monthlyCost={monthlyCost}
            config={config}
            authReady={authReady}
            authHint={authHint}
            onBack={() => goBackFromStep(4)}
            onGenerate={startGeneration}
          />
        )}

        {step === 5 && campaignMeta && !skipCreativeStep && (
          <StepCreative
            channel={channel}
            targets={selectedTargets}
            creatives={creatives}
            onSaveCreatives={(targetId, saved) => setCreatives((prev) => ({ ...prev, [targetId]: saved }))}
            onBack={() => goBackFromStep(5)}
            onContinue={() => setStep(6)}
          />
        )}

        {step === 6 && campaignMeta && (
          <StepReview
            targets={selectedTargets}
            results={results}
            creatives={creatives}
            channel={channel}
            campaignMeta={campaignMeta}
            activeResultId={activeResultId || selectedTargets[0]?.id || null}
            setActiveResultId={setActiveResultId}
            activeVariant={activeVariant}
            setActiveVariant={setActiveVariant}
            copiedKey={copiedKey}
            copy={copy}
            regenerate={regenerateOne}
            exportJson={exportJson}
            copyCsv={copyCsv}
            onBack={() => goBackFromStep(6)}
            onContinue={() => setStep(7)}
          />
        )}

        {step === 7 && campaignMeta && (
          <StepPushAds
            channel={channel}
            campaignMeta={campaignMeta}
            targets={selectedTargets}
            results={results}
            creatives={creatives}
            budget={budget}
            historyId={historyIdRef.current}
            onBack={() => setStep(6)}
          />
        )}
      </div>

      {generating && (
        <GeneratingOverlay
          current={genProgress.current}
          total={genProgress.total}
          currentName={genProgress.currentName}
          onCancel={cancelGeneration}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 1 — Campaign type
// ═══════════════════════════════════════════════════════════════
function StepCampaignType({
  value, onPick, onContinue,
}: {
  value: CampaignType | null;
  onPick: (id: CampaignType) => void;
  onContinue: () => void;
}) {
  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Choose campaign type
      </h1>
      <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 28px', lineHeight: 1.6, maxWidth: 680 }}>
        Scale adapts to what you&apos;re advertising. Pick the kind of campaign and we&apos;ll tailor the data source, targeting, and AI prompt.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {CAMPAIGN_TYPES.map((ct) => {
          const selected = ct.id === value;
          return (
            <button
              key={ct.id}
              onClick={() => onPick(ct.id)}
              className="s-card"
              style={{
                position: 'relative', textAlign: 'left', cursor: 'pointer',
                background: selected ? S.accentSoft : S.surface,
                border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
                borderRadius: 16, padding: 24, fontFamily: S.font, color: S.textPrimary,
                display: 'flex', flexDirection: 'column', gap: 14, minHeight: 190,
                boxShadow: CARD_SHADOW,
              }}
            >
              {selected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: 7, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Check size={13} />
                </div>
              )}
              <div style={{
                width: 52, height: 52, borderRadius: 13,
                background: `${ct.color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CampaignIcon path={ct.iconPath} color={ct.color} size={26} />
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
                {ct.label}
              </div>
              <div style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.6, flex: 1 }}>
                {ct.description}
              </div>
            </button>
          );
        })}
      </div>

      <BottomBar>
        <span style={{ fontSize: 14, color: value ? S.textPrimary : S.textMuted }}>
          {value ? <>Selected: <strong style={{ color: S.white, fontWeight: 600 }}>{CAMPAIGN_TYPES.find((c) => c.id === value)?.label}</strong></> : 'Pick a campaign type to continue'}
        </span>
        <button
          onClick={onContinue}
          disabled={!value}
          className="s-btn"
          style={navButtonStyle('primary', !value)}
        >
          Continue <ArrowRight />
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 2 — Target (dispatches per campaign type)
// ═══════════════════════════════════════════════════════════════
function StepTarget(props: {
  campaignMeta: CampaignTypeMeta;
  projects: ScaleProject[];
  totalProjects: number;
  projectsLoading: boolean;
  neighborhoods: ScaleNeighborhood[];
  communities: ScaleCommunity[];
  customBrief: string;
  setCustomBrief: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  neighborhoodFilter: string;
  setNeighborhoodFilter: (v: string) => void;
  neighborhoodOptions: string[];
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  statusOptions: string[];
  selectedIds: Set<string>;
  toggleId: (id: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  const {
    campaignMeta, projects, totalProjects, projectsLoading,
    neighborhoods, communities, customBrief, setCustomBrief,
    search, setSearch,
    neighborhoodFilter, setNeighborhoodFilter, neighborhoodOptions,
    statusFilter, setStatusFilter, statusOptions,
    selectedIds, toggleId, selectAll, deselectAll,
    canContinue, onBack, onContinue,
  } = props;

  if (campaignMeta.targetKind === 'custom') {
    return (
      <StepCustomBrief
        value={customBrief}
        onChange={setCustomBrief}
        campaignMeta={campaignMeta}
        canContinue={customBrief.trim().length >= 20}
        onBack={onBack}
        onContinue={onContinue}
      />
    );
  }

  // Projects grid
  if (campaignMeta.targetKind === 'projects') {
    const shown = projects.length;
    const anyFilterActive = search || neighborhoodFilter !== 'all' || statusFilter !== 'all';
    const allSelected = projects.length > 0 && projects.every((p) => selectedIds.has(p.id));
    return (
      <div style={{ animation: 'sSlideIn 0.25s ease' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {campaignMeta.id === 'short_term_rentals' ? 'Select investment projects' : 'Select projects to advertise'}
        </h1>
        <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 22px', lineHeight: 1.6 }}>
          {campaignMeta.id === 'short_term_rentals'
            ? 'Pick projects that work as short-term rentals or furnished income properties. Scale tailors the copy to investors.'
            : 'Pick one or more active projects. Scale generates on-brand ad copy for every one you select.'}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
            {projectsLoading
              ? 'Loading…'
              : anyFilterActive
                ? `${shown} of ${totalProjects} projects`
                : `${totalProjects} project${totalProjects === 1 ? '' : 's'} available`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, neighborhood, developer…" />
          <FilterSelect
            label="Neighborhood"
            value={neighborhoodFilter}
            onChange={setNeighborhoodFilter}
            options={[{ value: 'all', label: 'All neighborhoods' }, ...neighborhoodOptions.map((n) => ({ value: n, label: n }))]}
          />
          <FilterSelect
            label="Status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={[{ value: 'all', label: 'All statuses' }, ...statusOptions.map((s) => ({ value: s, label: statusLabel(s) }))]}
          />
          <div style={{ flex: 1 }} />
          <button
            onClick={allSelected ? deselectAll : selectAll}
            className="s-btn"
            style={toolbarBtnStyle()}
          >
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {projectsLoading ? (
          <div style={{ color: S.textMuted, fontSize: 15, padding: 48 }}>Loading projects…</div>
        ) : projects.length === 0 ? (
          <div style={{ color: S.textMuted, fontSize: 15, padding: 48, textAlign: 'center', border: `1px dashed ${S.border}`, borderRadius: 12 }}>
            No projects match these filters.
          </div>
        ) : (
          <div className="s-scroll" style={scrollContainerStyle()}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {projects.map((p) => {
                const selected = selectedIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggleId(p.id)}
                    className="s-card"
                    style={{
                      position: 'relative', textAlign: 'left', cursor: 'pointer',
                      background: selected ? S.accentSoft : S.surface,
                      border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
                      borderRadius: 16, padding: 0, overflow: 'hidden', fontFamily: S.font, color: S.textPrimary,
                      boxShadow: CARD_SHADOW,
                    }}
                  >
                    <div style={{
                      height: 160,
                      backgroundColor: S.surfaceHover,
                      backgroundImage: p.image
                        ? `linear-gradient(to bottom, rgba(11,13,17,0) 40%, rgba(11,13,17,0.55) 100%), url(${p.image})`
                        : `linear-gradient(135deg, rgba(0,102,255,0.12) 0%, rgba(0,212,170,0.08) 100%)`,
                      backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                      position: 'relative', borderBottom: `1px solid ${S.border}`,
                    }}>
                      {!p.image && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.15)', fontSize: 44, fontWeight: 700, fontFamily: S.mono }}>
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ position: 'absolute', top: 14, left: 14 }}>
                        <div style={{
                          width: 24, height: 24, borderRadius: 7,
                          background: selected ? S.accent : 'rgba(0,0,0,0.5)',
                          border: `1.5px solid ${selected ? S.accent : 'rgba(255,255,255,0.35)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                          backdropFilter: 'blur(8px)',
                        }}>
                          {selected && <Check size={13} />}
                        </div>
                      </div>
                      <div style={{
                        position: 'absolute', top: 14, right: 14,
                        padding: '5px 12px', borderRadius: 100,
                        background: 'rgba(16,185,129,0.88)', color: '#fff',
                        fontSize: 12, fontWeight: 600, letterSpacing: '0.02em',
                        backdropFilter: 'blur(6px)',
                      }}>
                        {statusLabel(p.status)}
                      </div>
                    </div>
                    <div style={{ padding: 24 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: S.white, letterSpacing: '-0.01em', marginBottom: 8 }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: 14, color: S.textSecondary, marginBottom: 12 }}>
                        {p.neighborhood} · {p.developer}
                      </div>
                      <div style={{ fontSize: 15, color: '#C8CBD3', fontFamily: S.mono, marginBottom: 14 }}>{p.price}</div>
                      <div style={{ fontSize: 13, color: S.textMuted, display: 'flex', gap: 10, flexWrap: 'wrap', lineHeight: 1.6 }}>
                        <span>Completion {p.completion}</span>
                        <span>·</span>
                        <span>{p.floors ?? '—'} floors</span>
                        <span>·</span>
                        <span>{p.units ?? '—'} units</span>
                        {p.buildingType && (<><span>·</span><span>{p.buildingType}</span></>)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <TargetBottomBar
          count={selectedIds.size}
          noun="project"
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      </div>
    );
  }

  // Neighborhoods
  if (campaignMeta.targetKind === 'neighborhoods') {
    const total = TORONTO_NEIGHBORHOODS.length;
    const shown = neighborhoods.length;
    const grouped = useMemoGroup(neighborhoods);
    const allSelected = neighborhoods.length > 0 && neighborhoods.every((n) => selectedIds.has(n.id));
    return (
      <div style={{ animation: 'sSlideIn 0.25s ease' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Select neighborhoods
        </h1>
        <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 22px', lineHeight: 1.6 }}>
          Each neighborhood ad links to its own hub page at <code style={{ fontFamily: S.mono, fontSize: 14 }}>condowizard.ca/areas/[slug]</code>.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
            {search ? `${shown} of ${total} neighborhoods` : `${total} neighborhoods available`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search neighborhoods…" />
          <div style={{ flex: 1 }} />
          <button onClick={allSelected ? deselectAll : selectAll} className="s-btn" style={toolbarBtnStyle()}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="s-scroll" style={scrollContainerStyle()}>
          {Object.entries(grouped).map(([region, items]) => (
            <div key={region} style={{ marginBottom: 24 }}>
              <div style={{ ...sectionLabelStyle, marginBottom: 12 }}>{region}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                {items.map((n) => {
                  const selected = selectedIds.has(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => toggleId(n.id)}
                      className="s-card"
                      style={cardStyle(selected)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <CheckBox selected={selected} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>{n.name}</div>
                          <div style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono, marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {n.landing}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <TargetBottomBar
          count={selectedIds.size}
          noun="neighborhood"
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      </div>
    );
  }

  // Communities
  if (campaignMeta.targetKind === 'communities') {
    const total = GTA_COMMUNITIES.length;
    const shown = communities.length;
    const allSelected = communities.length > 0 && communities.every((c) => selectedIds.has(c.id));
    return (
      <div style={{ animation: 'sSlideIn 0.25s ease' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Select communities
        </h1>
        <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 22px', lineHeight: 1.6 }}>
          Each ad links to live MLS listings for that community, powered by Repliers.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
            {search ? `${shown} of ${total} communities` : `${total} communities available`}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search communities…" />
          <div style={{ flex: 1 }} />
          <button onClick={allSelected ? deselectAll : selectAll} className="s-btn" style={toolbarBtnStyle()}>
            {allSelected ? 'Deselect all' : 'Select all'}
          </button>
        </div>
        <div className="s-scroll" style={scrollContainerStyle()}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {communities.map((c) => {
              const selected = selectedIds.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleId(c.id)}
                  className="s-card"
                  style={cardStyle(selected)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckBox selected={selected} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>{c.name}</div>
                      <div style={{ fontSize: 14, color: S.textSecondary, marginTop: 4 }}>
                        {c.name} — homes for sale
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <TargetBottomBar
          count={selectedIds.size}
          noun="community"
          canContinue={canContinue}
          onBack={onBack}
          onContinue={onContinue}
        />
      </div>
    );
  }

  return null;
}

// group neighborhoods by region
function useMemoGroup(list: ScaleNeighborhood[]): Record<string, ScaleNeighborhood[]> {
  return useMemo(() => {
    const out: Record<string, ScaleNeighborhood[]> = {};
    list.forEach((n) => {
      if (!out[n.region]) out[n.region] = [];
      out[n.region].push(n);
    });
    return out;
  }, [list]);
}

// ═══════════════════════════════════════════════════════════════
// Step 2 variant — Custom brief
// ═══════════════════════════════════════════════════════════════
function StepCustomBrief({
  value, onChange, campaignMeta, canContinue, onBack, onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  campaignMeta: CampaignTypeMeta;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <div style={{ animation: 'sSlideIn 0.25s ease', maxWidth: 820 }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Write your campaign brief
      </h1>
      <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 24px', lineHeight: 1.6 }}>
        Describe what you want to advertise, who it&apos;s for, and any key angles. Scale will follow your brief and your Agent Brain rules.
      </p>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Example:\n\n"Promote the CondoWizard 30-day trial for new agents. Audience: junior agents in the GTA with fewer than 5 deals closed. Emphasize the MLS feed, AI search, and lead routing. CTA: Start free trial."`}
        style={{
          width: '100%', minHeight: 260, padding: '16px 18px',
          borderRadius: 12, background: S.surface, border: `1px solid ${S.border}`,
          color: S.textPrimary, fontSize: 15, fontFamily: S.font, lineHeight: 1.7, resize: 'vertical', outline: 'none',
        }}
      />
      <div style={{ marginTop: 10, fontSize: 13, color: S.textMuted, display: 'flex', justifyContent: 'space-between' }}>
        <span>Minimum 20 characters. The more detail, the better the output.</span>
        <span style={{ fontFamily: S.mono }}>{value.trim().length} chars</span>
      </div>

      <div style={{ marginTop: 20, padding: 20, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, boxShadow: CARD_SHADOW, color: S.textPrimary }}>
        <div style={sectionLabelStyle}>How this is used</div>
        <div style={{ fontSize: 14, color: '#C8CBD3', lineHeight: 1.7 }}>
          Your brief is prepended to every AI call as the campaign context, alongside the {campaignMeta.label.toLowerCase()} angle and the full Agent Brain knowledge base.
        </div>
      </div>

      <TargetBottomBar
        count={canContinue ? 1 : 0}
        noun="brief"
        canContinue={canContinue}
        onBack={onBack}
        onContinue={onContinue}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 3 — Channel
// ═══════════════════════════════════════════════════════════════
function StepChannel(props: {
  channelId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const { channelId, onSelect, onBack, onContinue } = props;
  const active = CHANNELS.find((c) => c.id === channelId) || CHANNELS[0];

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Choose ad channel
      </h1>
      <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 28px', lineHeight: 1.6 }}>
        Pick where these ads will run. Scale tailors the format and length to each channel&apos;s spec.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 20 }}>
        {CHANNELS.map((ch) => {
          const selected = ch.id === channelId && !ch.disabled;
          return (
            <button
              key={ch.id}
              onClick={() => !ch.disabled && onSelect(ch.id)}
              disabled={ch.disabled}
              className={`s-card ${ch.disabled ? 's-disabled' : ''}`}
              style={{
                position: 'relative', textAlign: 'left',
                background: selected ? S.accentSoft : S.surface,
                border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
                borderRadius: 16, padding: 24,
                cursor: ch.disabled ? 'not-allowed' : 'pointer',
                opacity: ch.disabled ? 0.45 : 1,
                fontFamily: S.font, color: S.textPrimary,
                boxShadow: CARD_SHADOW,
              }}
            >
              {selected && (
                <div style={{ position: 'absolute', top: 16, right: 16, width: 24, height: 24, borderRadius: 7, background: S.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Check size={13} />
                </div>
              )}
              <div style={{
                width: 52, height: 52, borderRadius: 13,
                background: `${ch.color}20`, color: ch.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 700, fontFamily: S.mono, marginBottom: 18,
              }}>
                {ch.icon}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: S.white, marginBottom: 8, letterSpacing: '-0.01em' }}>{ch.name}</div>
              <div style={{ fontSize: 15, color: S.textSecondary, marginBottom: selected ? 14 : 0, lineHeight: 1.6 }}>
                {ch.subtitle}
              </div>
              {selected && (
                <div style={{ fontSize: 14, color: '#C8CBD3', lineHeight: 1.7, paddingTop: 14, borderTop: `1px solid ${S.border}`, marginTop: 4 }}>
                  {ch.description}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <BottomBar>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <button onClick={onContinue} disabled={active.disabled} className="s-btn" style={navButtonStyle('primary', active.disabled)}>
          Continue <ArrowRight />
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 4 — Configure
// ═══════════════════════════════════════════════════════════════
function StepConfigure(props: {
  campaignMeta: CampaignTypeMeta;
  targets: TargetRef[];
  channel: Channel;
  budget: number;
  setBudget: (n: number) => void;
  monthlyCost: number;
  config: ScaleModelConfig | null;
  authReady: boolean;
  authHint: string;
  onBack: () => void;
  onGenerate: () => void;
}) {
  const { campaignMeta, targets, channel, budget, setBudget, monthlyCost, config, authReady, authHint, onBack, onGenerate } = props;
  const total = targets.length;

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Configure campaign
      </h1>
      <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 28px', lineHeight: 1.6 }}>
        Final review before Scale calls the AI.
      </p>

      {!authReady && (
        <div style={{
          background: '#FEF3C7', color: '#7C2D12',
          border: '1px solid #FDE68A', borderRadius: 14, padding: '16px 20px',
          marginBottom: 20, fontSize: 15, lineHeight: 1.55, fontWeight: 500,
        }}>
          <strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>AI provider not configured</strong>
          {authHint}
        </div>
      )}

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: CARD_SHADOW, color: S.textPrimary }}>
        <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', marginBottom: 22 }}>
          <Stat label="Campaign type" value={campaignMeta.label} accent={campaignMeta.color} />
          <Stat label="Targets" value={total.toString()} />
          <Stat label="Channel" value={channel.name} accent={channel.color} />
          <Stat label="Variants" value="2 A/B" />
          <Stat label="Total ads" value={(total * 2).toString()} />
        </div>

        <div style={{ borderTop: `1px solid ${S.border}`, paddingTop: 18 }}>
          <div style={sectionLabelStyle}>Selected {targets.length === 1 ? 'target' : 'targets'}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {targets.map((t) => (
              <span key={t.id} style={{
                padding: '7px 14px', borderRadius: 100, background: S.accentSoft,
                border: `1px solid ${S.accentBorder}`, color: '#93C5FD', fontSize: 13, fontWeight: 500,
              }}>
                {t.displayName}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: CARD_SHADOW, color: S.textPrimary }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
          <div>
            <div style={sectionLabelStyle}>Daily budget per campaign</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: S.white, letterSpacing: '-0.02em' }}>
              ${budget}
              <span style={{ fontSize: 17, color: S.textMuted, fontWeight: 500, marginLeft: 8 }}>/ day</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={sectionLabelStyle}>Est. monthly spend</div>
            <div style={{ fontSize: 26, fontWeight: 600, color: S.textSecondary, fontFamily: S.mono }}>
              ${(monthlyCost * Math.max(1, total)).toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: S.textMuted, marginTop: 4 }}>
              ${monthlyCost.toLocaleString()} × {Math.max(1, total)} target{total === 1 ? '' : 's'}
            </div>
          </div>
        </div>
        <input
          type="range"
          min={10}
          max={200}
          step={5}
          value={budget}
          onChange={(e) => setBudget(parseInt(e.target.value, 10))}
          className="s-slider"
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
          <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>$10</span>
          <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>$200</span>
        </div>
      </div>

      <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 28, marginBottom: 20, boxShadow: CARD_SHADOW, color: S.textPrimary }}>
        <div style={sectionLabelStyle}>Scale will generate</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            `2 full copy variants per ${channel.name} ad`,
            `Variant A leads with benefit & lifestyle; Variant B leads with urgency`,
            `All copy respects your Agent Brain rules (tone, legal, banned words)`,
            `${campaignMeta.label} angle baked into every prompt`,
            `Output structured as JSON — paste directly into ${channel.name} or export CSV`,
          ].map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: '#C8CBD3', lineHeight: 1.6 }}>
              <span style={{ width: 20, height: 20, borderRadius: 6, background: S.accentSoft, color: S.accent, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <Check size={11} />
              </span>
              {item}
            </li>
          ))}
        </ul>
        {config && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${S.border}`, fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
            Using {config.provider} · {config.model}
          </div>
        )}
      </div>

      <BottomBar>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <button
          onClick={onGenerate}
          disabled={!config || total === 0 || !authReady}
          className="s-btn"
          style={{
            padding: '16px 36px', borderRadius: 12,
            background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
            color: S.white, border: 'none', fontSize: 17, fontWeight: 600,
            cursor: !config || total === 0 || !authReady ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 12, fontFamily: S.font,
            opacity: !config || total === 0 || !authReady ? 0.5 : 1,
            boxShadow: '0 6px 22px rgba(0,102,255,0.3)',
          }}
        >
          <Sparkle /> Generate {total} campaign{total === 1 ? '' : 's'}
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 5 — Review
// ═══════════════════════════════════════════════════════════════
function StepReview(props: {
  targets: TargetRef[];
  results: ResultMap;
  creatives: Record<string, SavedCreative[]>;
  channel: Channel;
  campaignMeta: CampaignTypeMeta;
  activeResultId: string | null;
  setActiveResultId: (id: string) => void;
  activeVariant: VariantKey;
  setActiveVariant: (v: VariantKey) => void;
  copiedKey: string;
  copy: (text: string, key: string) => void;
  regenerate: (id: string) => void;
  exportJson: () => void;
  copyCsv: () => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const {
    targets, results, creatives, channel, campaignMeta,
    activeResultId, setActiveResultId,
    activeVariant, setActiveVariant,
    copiedKey, copy, regenerate, exportJson, copyCsv, onBack, onContinue,
  } = props;

  const active = targets.find((t) => t.id === activeResultId) || targets[0];
  const activeResult = active ? results[active.id] : undefined;
  const variantData = activeResult?.ok && activeResult.data ? activeResult.data[activeVariant] : null;
  const okCount = Object.values(results).filter((r) => r.ok).length;

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            Review output
          </h1>
          <p style={{ fontSize: 15, color: S.textSecondary, margin: '10px 0 0' }}>
            {okCount} of {targets.length} generated · {campaignMeta.label} · {channel.name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={copyCsv} className="s-btn" style={headerBtn(copiedKey === 'csv-all' ? 'success' : 'ghost')}>
            <Copy /> {copiedKey === 'csv-all' ? 'Copied!' : 'Copy CSV'}
          </button>
          <button onClick={exportJson} className="s-btn" style={headerBtn('ghost')}>
            <Download /> Export JSON
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, alignItems: 'flex-start' }}>
        <div className="s-scroll" style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 12, maxHeight: 'calc(100vh - 280px)', overflowY: 'auto', boxShadow: CARD_SHADOW, color: S.textPrimary }}>
          {targets.map((t) => {
            const r = results[t.id];
            const isActive = t.id === active?.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveResultId(t.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left',
                  padding: '12px 14px', borderRadius: 9,
                  background: isActive ? S.accentSoft : 'transparent',
                  border: `1px solid ${isActive ? S.accentBorder : 'transparent'}`,
                  cursor: 'pointer', marginBottom: 4, fontFamily: S.font, color: S.textPrimary,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: isActive ? S.white : S.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t.displayName}
                  </div>
                  {t.subtitle && (
                    <div style={{ fontSize: 12, color: S.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>
                      {t.subtitle}
                    </div>
                  )}
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 5,
                  fontFamily: S.mono, flexShrink: 0, marginLeft: 8,
                  background: !r ? 'rgba(255,255,255,0.05)' : r.ok ? S.greenSoft : S.redSoft,
                  color: !r ? S.textMuted : r.ok ? S.green : S.red,
                }}>
                  {!r ? '…' : r.ok ? 'OK' : 'ERR'}
                </span>
              </button>
            );
          })}
        </div>

        <div style={{ minWidth: 0 }}>
          {active && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 4, padding: 5, background: S.surface, border: `1px solid ${S.border}`, borderRadius: 11 }}>
                  {(['variant_a', 'variant_b'] as VariantKey[]).map((v) => {
                    const isA = v === 'variant_a';
                    const isActiveV = v === activeVariant;
                    return (
                      <button
                        key={v}
                        onClick={() => setActiveVariant(v)}
                        style={{
                          padding: '11px 22px', borderRadius: 9,
                          background: isActiveV ? S.accent : 'transparent',
                          color: isActiveV ? S.white : S.textSecondary,
                          border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
                          display: 'flex', alignItems: 'center', gap: 8,
                        }}
                      >
                        Variant {isA ? 'A' : 'B'}
                        <span style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>
                          · {isA ? 'benefit' : 'urgency'}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {activeResult?.ok && activeResult.data && (
                    <button
                      className="s-btn"
                      onClick={() => {
                        const section = activeResult.data![activeVariant];
                        copy(JSON.stringify(section, null, 2), `copy-all-${active.id}-${activeVariant}`);
                      }}
                      style={headerBtn(copiedKey === `copy-all-${active.id}-${activeVariant}` ? 'success' : 'ghost')}
                    >
                      <Copy /> {copiedKey === `copy-all-${active.id}-${activeVariant}` ? 'Copied!' : 'Copy all'}
                    </button>
                  )}
                  <button onClick={() => regenerate(active.id)} className="s-btn" style={headerBtn('ghost')}>
                    <Refresh /> Regenerate
                  </button>
                </div>
              </div>

              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, minHeight: 260, boxShadow: CARD_SHADOW, color: S.textPrimary }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
                      {active.displayName}
                    </div>
                    {active.subtitle && (
                      <div style={{ fontSize: 13, color: S.textMuted, marginTop: 3 }}>
                        {channel.name} · {active.subtitle}
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {activeVariant.replace('_', ' ')}
                  </span>
                </div>

                {!activeResult && (
                  <div style={{ color: S.textMuted, fontSize: 14 }}>Waiting for generation…</div>
                )}
                {activeResult && !activeResult.ok && (
                  <div style={{ padding: 20, background: S.redSoft, border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: S.red, marginBottom: 8 }}>Generation failed</div>
                    <div style={{ fontSize: 13, color: '#FCA5A5', fontFamily: S.mono, lineHeight: 1.6, marginBottom: 14 }}>
                      {activeResult.error}
                    </div>
                    <button onClick={() => regenerate(active.id)} className="s-btn" style={navButtonStyle('primary')}>
                      <Refresh /> Retry
                    </button>
                  </div>
                )}
                {activeResult?.ok && variantData && (
                  <VariantRenderer
                    data={variantData}
                    keyPrefix={`${active.id}-${activeVariant}`}
                    copy={copy}
                    copiedKey={copiedKey}
                  />
                )}

                {/* Creative thumbnails for this target */}
                {active && creatives[active.id] && creatives[active.id].length > 0 && (
                  <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${S.border}` }}>
                    <div style={sectionLabelStyle}>Creative</div>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {creatives[active.id].map((c) => (
                        <div key={c.id} style={{
                          display: 'flex', flexDirection: 'column', gap: 6,
                          background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`,
                          borderRadius: 11, padding: 10,
                        }}>
                          <img
                            src={c.dataUrl}
                            alt={c.slot || 'creative'}
                            style={{
                              width: 150, height: 150, objectFit: 'cover',
                              borderRadius: 8, background: '#000',
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, textTransform: 'capitalize' }}>
                              {c.slot || 'creative'}
                            </span>
                            <a
                              href={c.dataUrl}
                              download={`scale-creative-${active.id}-${c.slot || 'hero'}.png`}
                              style={{ fontSize: 12, color: S.accent, textDecoration: 'none', fontFamily: S.font }}
                            >
                              Download
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomBar>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
            <ArrowLeft /> Back
          </button>
          <span style={{ color: S.textMuted, fontSize: 13, fontFamily: S.mono }}>
            {okCount} / {targets.length} OK
          </span>
        </div>
        <button
          onClick={onContinue}
          disabled={okCount === 0}
          className="s-btn"
          style={navButtonStyle('primary', okCount === 0)}
        >
          Continue <ArrowRight />
        </button>
      </BottomBar>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 6 — Push to Google Ads
// ═══════════════════════════════════════════════════════════════
interface PushState {
  kind: 'idle' | 'pushing' | 'success' | 'error';
  response?: {
    campaignId: string;
    adGroupId: string;
    adId: string;
    customerId: string;
    note?: string;
  };
  error?: string;
}

function StepPushAds({
  channel, campaignMeta, targets, results, creatives, budget, historyId, onBack,
}: {
  channel: Channel;
  campaignMeta: CampaignTypeMeta;
  targets: TargetRef[];
  results: ResultMap;
  creatives: Record<string, SavedCreative[]>;
  budget: number;
  historyId: string;
  onBack: () => void;
}) {
  const isGoogle = channel.id === 'google_search' || channel.id === 'google_display';
  const pushable = targets.filter((t) => results[t.id]?.ok);

  // Campaign names are auto-generated per target but editable.
  const today = new Date().toISOString().slice(0, 10);
  const autoName = (t: TargetRef) =>
    `Scale_${t.displayName.replace(/[^A-Za-z0-9]/g, '')}_${channel.id === 'google_display' ? 'Display' : 'Search'}_${today}`;

  const [names, setNames] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    pushable.forEach((t) => { map[t.id] = autoName(t); });
    return map;
  });

  const [pushStates, setPushStates] = useState<Record<string, PushState>>({});
  const [googleStatus, setGoogleStatus] = useState<{ connected: boolean; email?: string | null; customerId?: string | null } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/google/status', { cache: 'no-store' });
        setGoogleStatus(await res.json());
      } catch {
        setGoogleStatus({ connected: false });
      }
    })();
  }, []);

  const updateName = (id: string, v: string) =>
    setNames((n) => ({ ...n, [id]: v }));

  const pushOne = async (target: TargetRef) => {
    const result = results[target.id];
    if (!result?.ok || !result.data) return;
    setPushStates((p) => ({ ...p, [target.id]: { kind: 'pushing' } }));

    const a = result.data.variant_a as Record<string, unknown>;
    const b = result.data.variant_b as Record<string, unknown>;
    const headlines = dedupStrings([
      ...toStringArray(a?.headlines),
      ...toStringArray(b?.headlines),
      ...singletonString(a?.headline),
      ...singletonString(b?.headline),
    ]);
    const descriptions = dedupStrings([
      ...toStringArray(a?.descriptions),
      ...toStringArray(b?.descriptions),
      ...singletonString(a?.tagline),
      ...singletonString(b?.tagline),
      ...singletonString(a?.primaryText),
      ...singletonString(b?.primaryText),
      ...singletonString(a?.description),
      ...singletonString(b?.description),
    ]);
    const [neighborhood] = (target.subtitle || '').split('·').map((s) => s.trim());
    const finalUrl = inferFinalUrl(campaignMeta, target);

    try {
      const res = await fetch('/api/admin/scale/google/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignName: names[target.id] || autoName(target),
          projectName: target.displayName,
          neighborhood,
          dailyBudget: budget,
          finalUrl,
          headlines,
          descriptions,
          channelType: channel.id === 'google_display' ? 'DISPLAY' : 'SEARCH',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setPushStates((p) => ({
          ...p,
          [target.id]: { kind: 'error', error: data.error || `HTTP ${res.status}` },
        }));
        if (historyId) updateHistoryStatus(historyId, 'Failed');
        return;
      }
      setPushStates((p) => ({
        ...p,
        [target.id]: {
          kind: 'success',
          response: {
            campaignId: data.campaignId,
            adGroupId: data.adGroupId,
            adId: data.adId,
            customerId: data.customerId,
            note: data.note,
          },
        },
      }));
      if (historyId) updateHistoryStatus(historyId, 'Pushed');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setPushStates((p) => ({ ...p, [target.id]: { kind: 'error', error: message } }));
      if (historyId) updateHistoryStatus(historyId, 'Failed');
    }
  };

  const confirmAndPush = (target: TargetRef) => {
    setConfirming(null);
    pushOne(target);
  };

  if (!isGoogle) {
    return (
      <div style={{ animation: 'sSlideIn 0.25s ease' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Push to Ads
        </h1>
        <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 24px', lineHeight: 1.6 }}>
          Ad platform integration for <strong style={{ color: S.white }}>{channel.name}</strong> is not wired up yet.
        </p>
        <div style={{
          background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 36, textAlign: 'center', boxShadow: CARD_SHADOW, color: S.textPrimary,
        }}>
          <div style={{ fontSize: 40, marginBottom: 14 }}>✦</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: S.white, marginBottom: 8 }}>
            Coming soon — Meta Ads integration
          </div>
          <div style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
            For now, copy the JSON from Review and paste into Meta Ads Manager. Scale will push directly once the Meta Graph API integration ships.
          </div>
        </div>
        <BottomBar>
          <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
            <ArrowLeft /> Back to review
          </button>
        </BottomBar>
      </div>
    );
  }

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Push to Google Ads
      </h1>
      <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 24px', lineHeight: 1.6 }}>
        Creates a real campaign in your Google Ads account. Campaigns are created in <strong style={{ color: S.white }}>PAUSED</strong> state — you un-pause from the Google Ads UI.
      </p>

      {googleStatus && !googleStatus.connected && (
        <div style={{
          padding: 22, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          color: '#FDE68A', borderRadius: 12, fontSize: 14, lineHeight: 1.6, marginBottom: 24,
        }}>
          You&apos;re not connected to Google Ads yet.{' '}
          <a href="/admin/scale/settings" style={{ color: '#FDE68A', textDecoration: 'underline' }}>
            Connect in Settings
          </a>{' '}
          before pushing.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {pushable.map((target) => {
          const state = pushStates[target.id] || { kind: 'idle' } as PushState;
          const result = results[target.id];
          const a = (result?.data?.variant_a || {}) as Record<string, unknown>;
          const b = (result?.data?.variant_b || {}) as Record<string, unknown>;
          const headlines = dedupStrings([
            ...toStringArray(a?.headlines), ...toStringArray(b?.headlines),
            ...singletonString(a?.headline), ...singletonString(b?.headline),
          ]);
          const descriptions = dedupStrings([
            ...toStringArray(a?.descriptions), ...toStringArray(b?.descriptions),
            ...singletonString(a?.tagline), ...singletonString(b?.tagline),
            ...singletonString(a?.primaryText), ...singletonString(b?.primaryText),
            ...singletonString(a?.description), ...singletonString(b?.description),
          ]);
          const finalUrl = inferFinalUrl(campaignMeta, target);

          return (
            <div key={target.id} style={{
              background: S.surface, border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, boxShadow: CARD_SHADOW, color: S.textPrimary,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 18 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: S.white, letterSpacing: '-0.01em', marginBottom: 4 }}>
                    {target.displayName}
                  </div>
                  {target.subtitle && (
                    <div style={{ fontSize: 14, color: S.textMuted, marginBottom: 14 }}>{target.subtitle}</div>
                  )}

                  <div style={{ ...sectionLabelStyle, marginTop: 12 }}>Campaign name</div>
                  <input
                    type="text"
                    value={names[target.id] || ''}
                    onChange={(e) => updateName(target.id, e.target.value)}
                    disabled={state.kind === 'pushing' || state.kind === 'success'}
                    style={{
                      width: '100%', padding: '14px 16px', borderRadius: 10,
                      background: S.surfaceHover, border: `1px solid ${S.border}`,
                      color: S.textPrimary, fontSize: 16, fontFamily: S.mono, outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20,
                padding: 22, background: S.surfaceHover, borderRadius: 12, marginBottom: 20,
              }}>
                <Stat label="Daily budget" value={`$${budget}`} />
                <Stat label="Ad groups" value="1" />
                <Stat label="Headlines" value={headlines.length.toString()} />
                <Stat label="Descriptions" value={descriptions.length.toString()} />
              </div>

              <div style={{ fontSize: 14, color: S.textMuted, marginBottom: 20, fontFamily: S.mono, wordBreak: 'break-all', lineHeight: 1.6 }}>
                Final URL: {finalUrl}
              </div>

              {creatives[target.id] && creatives[target.id].length > 0 && (
                <div style={{ marginBottom: 20, padding: 16, background: 'rgba(255,255,255,0.02)', border: `1px dashed ${S.border}`, borderRadius: 11 }}>
                  <div style={{ fontSize: 13, color: S.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Creative assets ({creatives[target.id].length})
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {creatives[target.id].map((c) => (
                      <img
                        key={c.id}
                        src={c.dataUrl}
                        alt={c.slot || 'creative'}
                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, background: '#000' }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 12, color: S.textMuted, lineHeight: 1.5 }}>
                    Upload ad images to Google Ads manually — image push coming soon.
                  </div>
                </div>
              )}

              {state.kind === 'idle' && (
                <button
                  onClick={() => setConfirming(target.id)}
                  disabled={!googleStatus?.connected || headlines.length < 3 || descriptions.length < 2}
                  className="s-btn"
                  style={{
                    padding: '14px 32px', borderRadius: 12,
                    background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
                    color: S.white, border: 'none', fontSize: 17, fontWeight: 600,
                    cursor: !googleStatus?.connected ? 'not-allowed' : 'pointer',
                    opacity: !googleStatus?.connected ? 0.5 : 1,
                    display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: S.font,
                    boxShadow: '0 6px 22px rgba(0,102,255,0.3)',
                  }}
                >
                  Push live →
                </button>
              )}

              {state.kind === 'pushing' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, color: S.textSecondary, fontSize: 15 }}>
                  <span style={{
                    display: 'inline-block', width: 18, height: 18,
                    border: `2.5px solid ${S.border}`, borderTopColor: S.accent, borderRadius: '50%',
                    animation: 'sSpin 0.9s linear infinite',
                  }} />
                  Creating campaign in Google Ads…
                </div>
              )}

              {state.kind === 'success' && state.response && (
                <div style={{
                  padding: 22, background: S.greenSoft, border: '1px solid rgba(16,185,129,0.3)',
                  borderRadius: 12, color: '#D1FAE5', fontSize: 15, lineHeight: 1.6,
                }}>
                  <div style={{ fontWeight: 700, color: S.green, fontSize: 17, marginBottom: 8 }}>
                    Campaign created!
                  </div>
                  <div style={{ fontFamily: S.mono, fontSize: 14, marginBottom: 12 }}>
                    Campaign ID: {state.response.campaignId}
                  </div>
                  {state.response.note && (
                    <div style={{ fontSize: 14, color: '#A7F3D0', marginBottom: 12 }}>
                      {state.response.note}
                    </div>
                  )}
                  <a
                    href={`https://ads.google.com/aw/campaigns?campaignId=${state.response.campaignId}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 14, color: S.green, fontWeight: 500,
                      textDecoration: 'underline',
                    }}
                  >
                    Open in Google Ads →
                  </a>
                </div>
              )}

              {state.kind === 'error' && (
                <div style={{
                  padding: 22, background: S.redSoft, border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: 12,
                }}>
                  <div style={{ fontWeight: 700, color: S.red, fontSize: 16, marginBottom: 8 }}>
                    Push failed
                  </div>
                  <div style={{ fontFamily: S.mono, fontSize: 14, color: '#FCA5A5', lineHeight: 1.7, marginBottom: 14, wordBreak: 'break-word' }}>
                    {state.error}
                  </div>
                  <button
                    onClick={() => pushOne(target)}
                    className="s-btn"
                    style={navButtonStyle('primary')}
                  >
                    <Refresh /> Retry
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <BottomBar>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>
          {Object.values(pushStates).filter((s) => s.kind === 'success').length} / {pushable.length} pushed
        </span>
      </BottomBar>

      {confirming && (() => {
        const target = pushable.find((t) => t.id === confirming);
        if (!target) return null;
        return (
          <ConfirmModal
            title="Push live to Google Ads?"
            body={
              <>
                This will create a real campaign in your Google Ads account
                {googleStatus?.customerId && <> (<span style={{ fontFamily: S.mono }}>{googleStatus.customerId}</span>)</>}.
                <br /><br />
                <strong style={{ color: S.white }}>{names[target.id] || autoName(target)}</strong>
                <br />
                Daily budget: <strong style={{ color: S.white }}>${budget}</strong>
                <br /><br />
                Campaign will be created in <strong style={{ color: S.white }}>PAUSED</strong> state.
              </>
            }
            onCancel={() => setConfirming(null)}
            onConfirm={() => confirmAndPush(target)}
          />
        );
      })()}
    </div>
  );
}

function ConfirmModal({
  title, body, onCancel, onConfirm,
}: {
  title: string;
  body: React.ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10001,
      background: 'rgba(11,13,17,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: S.font,
    }}>
      <div style={{
        width: 480, maxWidth: '92vw',
        background: S.bg, border: `1px solid ${S.border}`, borderRadius: 16,
        padding: 32, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: S.white, marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.65, marginBottom: 24 }}>{body}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} className="s-btn" style={navButtonStyle('ghost')}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="s-btn"
            style={{
              padding: '12px 28px', borderRadius: 11,
              background: 'linear-gradient(135deg, #0066FF 0%, #00D4AA 100%)',
              color: S.white, border: 'none', fontSize: 15, fontWeight: 600,
              cursor: 'pointer', fontFamily: S.font,
            }}
          >
            Yes, push live
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Step 5 — Creative generator (visual channels only)
// ═══════════════════════════════════════════════════════════════
interface ChannelSlotDef { id: string; label: string; width: number; height: number }

function slotsForChannel(channelId: string): ChannelSlotDef[] {
  const base = CHANNEL_CREATIVE_DIMS[channelId];
  if (channelId === 'meta_carousel') {
    return Array.from({ length: 5 }, (_, i) => ({
      id: `card_${i + 1}`, label: `Card ${i + 1}`,
      width: 1080, height: 1080,
    }));
  }
  if (channelId === 'ig_stories') {
    return Array.from({ length: 3 }, (_, i) => ({
      id: `slide_${i + 1}`, label: `Slide ${i + 1}`,
      width: 1080, height: 1920,
    }));
  }
  if (channelId === 'google_display') {
    return [
      { id: 'landscape', label: 'Landscape 1200×628', width: 1200, height: 628 },
      { id: 'square',    label: 'Square 1080×1080',   width: 1080, height: 1080 },
    ];
  }
  // meta_lead_gen + default
  return [{ id: 'hero', label: 'Hero', width: base?.width ?? 1080, height: base?.height ?? 1080 }];
}

function defaultSpec(slot: ChannelSlotDef, project: TargetRef, logoUrl: string | null, accent: string): CreativeSpec {
  return {
    template: 'minimal',
    imageDataUrl: null,
    logoDataUrl: logoUrl,
    headline: project.displayName,
    subtitle: project.subtitle || '',
    cta: 'Register Now',
    showLogo: true,
    textColor: 'light',
    accentColor: accent,
    fontScale: 'medium',
    footer: 'Tal Shelef | Rare Real Estate Inc.',
    width: slot.width,
    height: slot.height,
  };
}

interface WorkingSlot { slot: ChannelSlotDef; spec: CreativeSpec; previewDataUrl: string | null; rendering: boolean }

function StepCreative({
  channel, targets, creatives, onSaveCreatives, onBack, onContinue,
}: {
  channel: Channel;
  targets: TargetRef[];
  creatives: Record<string, SavedCreative[]>;
  onSaveCreatives: (targetId: string, saved: SavedCreative[]) => void;
  onBack: () => void;
  onContinue: () => void;
}) {
  const [activeTargetId, setActiveTargetId] = useState<string>(targets[0]?.id || '');
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [imageTab, setImageTab] = useState<'project' | 'brand' | 'upload'>('project');
  const [brandCategoryFilter, setBrandCategoryFilter] = useState<'all' | MediaCategory>('all');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Per-target slot working copy: { [targetId]: WorkingSlot[] }
  const [workingByTarget, setWorkingByTarget] = useState<Record<string, WorkingSlot[]>>({});
  const [activeSlotId, setActiveSlotId] = useState<string>('');

  const slots = useMemo(() => slotsForChannel(channel.id), [channel.id]);
  const activeTarget = targets.find((t) => t.id === activeTargetId);
  const logoAsset = useMemo(() => media.find((m) => m.category === 'logo'), [media]);

  // Load media + project images
  useEffect(() => {
    setMedia(ensureSeededMedia());
    (async () => {
      try {
        const res = await fetch('/api/admin/scale/projects', { cache: 'no-store' });
        const data = await res.json();
        const imgs: string[] = [];
        (data.projects as Array<{ image?: string; images?: string[] }> || []).forEach((p) => {
          if (p.image) imgs.push(p.image);
          (p.images || []).forEach((i) => imgs.push(i));
        });
        setProjectImages(Array.from(new Set(imgs)));
      } catch { /* ignore */ }
    })();
  }, []);

  // Seed working slots for every target the first time we see them
  useEffect(() => {
    setWorkingByTarget((prev) => {
      const next = { ...prev };
      targets.forEach((t) => {
        if (!next[t.id]) {
          next[t.id] = slots.map((s) => ({
            slot: s,
            spec: defaultSpec(s, t, logoAsset?.dataUrl ?? null, '#0066FF'),
            previewDataUrl: null,
            rendering: false,
          }));
        }
      });
      return next;
    });
    if (!activeSlotId && slots.length > 0) setActiveSlotId(slots[0].id);
  }, [targets, slots, logoAsset]);

  // If user has a saved logo, patch in-flight specs (for slots with showLogo + no logo).
  useEffect(() => {
    if (!logoAsset) return;
    setWorkingByTarget((prev) => {
      const next: typeof prev = {};
      for (const [tid, ws] of Object.entries(prev)) {
        next[tid] = ws.map((w) => ({ ...w, spec: { ...w.spec, logoDataUrl: w.spec.logoDataUrl ?? logoAsset.dataUrl } }));
      }
      return next;
    });
  }, [logoAsset?.id]);

  const workingSlots = workingByTarget[activeTargetId] || [];
  const activeWorking = workingSlots.find((w) => w.slot.id === activeSlotId);

  const patchActiveSpec = (patch: Partial<CreativeSpec>) => {
    if (!activeTarget || !activeWorking) return;
    setWorkingByTarget((prev) => {
      const list = [...(prev[activeTargetId] || [])];
      const idx = list.findIndex((w) => w.slot.id === activeSlotId);
      if (idx < 0) return prev;
      list[idx] = { ...list[idx], spec: { ...list[idx].spec, ...patch }, previewDataUrl: list[idx].previewDataUrl };
      return { ...prev, [activeTargetId]: list };
    });
  };

  // Debounced preview render
  useEffect(() => {
    if (!activeWorking || !activeTarget) return;
    if (!activeWorking.spec.imageDataUrl) return;
    const t = setTimeout(async () => {
      try {
        const url = await renderCreativeToDataUrl(activeWorking.spec);
        setWorkingByTarget((prev) => {
          const list = [...(prev[activeTargetId] || [])];
          const idx = list.findIndex((w) => w.slot.id === activeSlotId);
          if (idx < 0) return prev;
          list[idx] = { ...list[idx], previewDataUrl: url, rendering: false };
          return { ...prev, [activeTargetId]: list };
        });
      } catch { /* ignore */ }
    }, 250);
    return () => clearTimeout(t);
  }, [activeWorking?.spec, activeTargetId, activeSlotId]);

  const handleUpload = async (files: FileList | File[]) => {
    for (const f of Array.from(files)) {
      try {
        const asset = await addMediaFromFile(f, 'project_photo');
        setMedia((m) => [asset, ...m]);
        patchActiveSpec({ imageDataUrl: asset.dataUrl });
      } catch (err) {
        alert(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const saveAllForTarget = async () => {
    if (!activeTarget) return;
    const slotsWork = workingSlots;
    const saved: SavedCreative[] = [];
    for (const w of slotsWork) {
      if (!w.spec.imageDataUrl) continue;  // skip empty slots
      try {
        const dataUrl = await renderCreativeToDataUrl(w.spec);
        saved.push({
          id: `creative_${activeTargetId}_${w.slot.id}`,
          slot: w.slot.id,
          spec: w.spec,
          dataUrl,
          createdAt: new Date().toISOString(),
        });
      } catch { /* skip */ }
    }
    onSaveCreatives(activeTargetId, saved);
  };

  const filteredBrandAssets = brandCategoryFilter === 'all'
    ? media
    : media.filter((m) => m.category === brandCategoryFilter);

  return (
    <div style={{ animation: 'sSlideIn 0.25s ease' }}>
      <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        Ad creative
      </h1>
      <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 24px', lineHeight: 1.6 }}>
        Build your ad visuals. Pick images, choose a template, preview the result.
      </p>

      {/* Target tabs (which project/target are we building creative for) */}
      {targets.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
          {targets.map((t) => {
            const active = t.id === activeTargetId;
            const savedCount = creatives[t.id]?.length || 0;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTargetId(t.id)}
                style={{
                  padding: '10px 18px', borderRadius: 10,
                  background: active ? S.accent : '#fff',
                  border: `1px solid ${active ? S.accent : 'rgba(0,0,0,0.12)'}`,
                  color: active ? '#fff' : S.pageHeading,
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                }}
              >
                {t.displayName}
                {savedCount > 0 && (
                  <span style={{
                    fontSize: 11, padding: '2px 7px', borderRadius: 100,
                    background: active ? 'rgba(255,255,255,0.25)' : S.accentSoft,
                    color: active ? '#fff' : S.accent,
                    fontFamily: S.mono,
                  }}>
                    {savedCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Slot tabs (cards / slides / formats) */}
      {slots.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
          {slots.map((s) => {
            const active = s.id === activeSlotId;
            const hasImage = workingSlots.find((w) => w.slot.id === s.id)?.spec.imageDataUrl;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSlotId(s.id)}
                style={{
                  padding: '9px 14px', borderRadius: 9,
                  background: active ? S.accentSoft : '#fff',
                  border: `1px solid ${active ? S.accentBorder : 'rgba(0,0,0,0.12)'}`,
                  color: active ? S.accent : S.pageHeading,
                  fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                }}
              >
                {s.label} {hasImage && <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.accent }} />}
              </button>
            );
          })}
        </div>
      )}

      <div style={{
        display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)',
        gap: 20, alignItems: 'flex-start',
      }}>
        {/* LEFT — image picker */}
        <div style={{
          background: S.surface, color: S.textPrimary,
          border: `1px solid ${S.border}`, borderRadius: 16,
          padding: 20, boxShadow: CARD_SHADOW,
        }}>
          <div style={sectionLabelStyle}>Select image</div>

          <div style={{ display: 'inline-flex', padding: 4, borderRadius: 11, background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, marginBottom: 14 }}>
            {(['project', 'brand', 'upload'] as const).map((tab) => {
              const labelMap: Record<string, string> = { project: 'Project', brand: 'Brand Assets', upload: 'Upload New' };
              const active = imageTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setImageTab(tab)}
                  style={{
                    padding: '7px 14px', borderRadius: 8,
                    background: active ? S.accent : 'transparent',
                    color: active ? '#fff' : S.textSecondary,
                    border: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, fontFamily: S.font,
                  }}
                >
                  {labelMap[tab]}
                </button>
              );
            })}
          </div>

          {imageTab === 'project' && (
            <div>
              {projectImages.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: S.textMuted, border: `1px dashed ${S.border}`, borderRadius: 11 }}>
                  No project images found — upload or use brand assets.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, maxHeight: 440, overflowY: 'auto' }}>
                  {projectImages.map((url) => (
                    <ImageThumb
                      key={url}
                      url={url}
                      selected={activeWorking?.spec.imageDataUrl === url}
                      onClick={() => patchActiveSpec({ imageDataUrl: url })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {imageTab === 'brand' && (
            <div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                {(['all', ...MEDIA_CATEGORIES.map((c) => c.id)] as const).map((c) => {
                  const active = brandCategoryFilter === c;
                  const label = c === 'all' ? 'All' : MEDIA_CATEGORIES.find((x) => x.id === c)!.label;
                  return (
                    <button
                      key={c}
                      onClick={() => setBrandCategoryFilter(c)}
                      style={{
                        padding: '5px 10px', borderRadius: 6,
                        background: active ? S.accentSoft : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${active ? S.accentBorder : S.border}`,
                        color: active ? '#93C5FD' : S.textSecondary,
                        fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {filteredBrandAssets.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', fontSize: 13, color: S.textMuted, border: `1px dashed ${S.border}`, borderRadius: 11 }}>
                  No assets in this category.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8, maxHeight: 440, overflowY: 'auto' }}>
                  {filteredBrandAssets.map((a) => (
                    <ImageThumb
                      key={a.id}
                      url={a.dataUrl}
                      selected={activeWorking?.spec.imageDataUrl === a.dataUrl}
                      onClick={() => patchActiveSpec({ imageDataUrl: a.dataUrl })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {imageTab === 'upload' && (
            <div>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
                style={{
                  padding: 32, textAlign: 'center',
                  border: `2px dashed ${S.borderHover}`, borderRadius: 12,
                  cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
                }}
              >
                <div style={{ fontSize: 32, marginBottom: 8 }}>⬆</div>
                <div style={{ fontSize: 14, color: S.textSecondary }}>Drop images here or click to browse</div>
                <div style={{ fontSize: 12, color: S.textMuted, marginTop: 6 }}>Saved to your media library automatically.</div>
                <input
                  ref={fileInputRef} type="file" accept="image/*" multiple
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.currentTarget.value = ''; }}
                />
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — template + preview + controls */}
        <div style={{
          background: S.surface, color: S.textPrimary,
          border: `1px solid ${S.border}`, borderRadius: 16,
          padding: 20, boxShadow: CARD_SHADOW,
        }}>
          {/* Templates */}
          <div style={sectionLabelStyle}>Template</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 8, marginBottom: 18 }}>
            {TEMPLATES.map((t) => {
              const active = activeWorking?.spec.template === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => patchActiveSpec({ template: t.id })}
                  style={{
                    padding: 10, borderRadius: 10,
                    background: active ? S.accentSoft : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${active ? S.accentBorder : S.border}`,
                    color: active ? '#fff' : S.textPrimary,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: S.textMuted, lineHeight: 1.45 }}>{t.description}</div>
                </button>
              );
            })}
          </div>

          {/* Preview */}
          <div style={sectionLabelStyle}>Live preview</div>
          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: 18, background: '#000', borderRadius: 12, marginBottom: 18,
            minHeight: 240,
          }}>
            {activeWorking ? (
              <CreativePreview working={activeWorking} />
            ) : (
              <div style={{ color: S.textMuted, fontSize: 14, alignSelf: 'center' }}>Pick an image to preview.</div>
            )}
          </div>

          {/* Controls */}
          {activeWorking && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <LabeledInput label="Headline" value={activeWorking.spec.headline} onChange={(v) => patchActiveSpec({ headline: v })} />
              <LabeledInput label="Subtitle" value={activeWorking.spec.subtitle} onChange={(v) => patchActiveSpec({ subtitle: v })} />
              <LabeledInput label="CTA" value={activeWorking.spec.cta} onChange={(v) => patchActiveSpec({ cta: v })} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <LabeledPick
                  label="Text color"
                  value={activeWorking.spec.textColor}
                  onChange={(v) => patchActiveSpec({ textColor: v as 'light' | 'dark' })}
                  options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }]}
                />
                <LabeledPick
                  label="Font size"
                  value={activeWorking.spec.fontScale}
                  onChange={(v) => patchActiveSpec({ fontScale: v as 'small' | 'medium' | 'large' })}
                  options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]}
                />
                <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 12, color: S.textMuted, fontWeight: 500 }}>Accent color</span>
                  <input
                    type="color" value={activeWorking.spec.accentColor}
                    onChange={(e) => patchActiveSpec({ accentColor: e.target.value })}
                    style={{ width: '100%', height: 42, padding: 0, border: `1px solid ${S.border}`, borderRadius: 10, background: 'transparent', cursor: 'pointer' }}
                  />
                </label>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={activeWorking.spec.showLogo}
                  onChange={(e) => patchActiveSpec({ showLogo: e.target.checked })}
                  style={{ accentColor: S.accent }}
                />
                <span style={{ fontSize: 14, color: S.textPrimary }}>Show logo corner</span>
                {logoAsset && (
                  <span style={{ fontSize: 12, color: S.textMuted, marginLeft: 'auto' }}>
                    Using: {logoAsset.name}
                  </span>
                )}
              </label>
            </div>
          )}
        </div>
      </div>

      <BottomBar>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button onClick={saveAllForTarget} className="s-btn" style={navButtonStyle('ghost')}>
            Save creatives for this target
          </button>
          <button onClick={onContinue} className="s-btn" style={navButtonStyle('primary')}>
            Continue <ArrowRight />
          </button>
        </div>
      </BottomBar>
    </div>
  );
}

function CreativePreview({ working }: { working: WorkingSlot }) {
  const { spec, previewDataUrl } = working;
  const ratio = spec.width / spec.height;
  const maxW = 360;
  const maxH = 460;
  let w = maxW;
  let h = w / ratio;
  if (h > maxH) { h = maxH; w = h * ratio; }
  return (
    <div style={{
      width: w, height: h,
      borderRadius: 10, overflow: 'hidden',
      background: '#0B0D11',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      {previewDataUrl ? (
        <img src={previewDataUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : spec.imageDataUrl ? (
        <div style={{ color: S.textMuted, fontSize: 13 }}>Rendering…</div>
      ) : (
        <div style={{ color: S.textMuted, fontSize: 13, textAlign: 'center', padding: 20 }}>
          Select an image to see the preview.
        </div>
      )}
    </div>
  );
}

function ImageThumb({ url, selected, onClick }: { url: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', padding: 0, background: 'transparent',
        border: `2px solid ${selected ? S.accent : 'transparent'}`,
        borderRadius: 9, overflow: 'hidden', cursor: 'pointer',
        aspectRatio: '1 / 1',
      }}
    >
      <img src={url} alt="thumb" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      {selected && (
        <span style={{
          position: 'absolute', top: 4, right: 4,
          width: 18, height: 18, borderRadius: 6,
          background: S.accent, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
        }}>
          ✓
        </span>
      )}
    </button>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: S.textMuted, fontWeight: 500 }}>{label}</span>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '10px 12px', borderRadius: 9,
          background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`,
          color: S.textPrimary, fontSize: 14, fontFamily: S.font, outline: 'none',
        }}
      />
    </label>
  );
}

function LabeledPick({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, color: S.textMuted, fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(255,255,255,0.03)', border: `1px solid ${S.border}`, borderRadius: 9 }}>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1, padding: '7px 10px', borderRadius: 7,
              background: value === o.value ? S.accent : 'transparent',
              color: value === o.value ? '#fff' : S.textSecondary,
              border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: S.font,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </label>
  );
}

// Helpers for Step 6
function toStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x : '')).filter(Boolean);
}
function singletonString(v: unknown): string[] {
  return typeof v === 'string' && v.trim() ? [v] : [];
}
function dedupStrings(xs: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  xs.forEach((x) => {
    const k = x.trim();
    if (!k || seen.has(k)) return;
    seen.add(k);
    out.push(k);
  });
  return out;
}
function inferFinalUrl(campaignMeta: CampaignTypeMeta, target: TargetRef): string {
  if (campaignMeta.targetKind === 'projects') {
    return `https://condowizard.ca/pre-construction/${slugify(target.displayName)}`;
  }
  if (campaignMeta.targetKind === 'neighborhoods') {
    // subtitle is the full landing URL
    if (target.subtitle?.startsWith('condowizard.ca')) {
      return `https://${target.subtitle}`;
    }
    return `https://condowizard.ca/areas/${slugify(target.displayName)}`;
  }
  if (campaignMeta.targetKind === 'communities') {
    return `https://condowizard.ca/communities/${slugify(target.displayName)}`;
  }
  if (campaignMeta.id === 'condo_staging') return 'https://condowizard.ca/staging';
  return 'https://condowizard.ca';
}

// ═══════════════════════════════════════════════════════════════
// Variant field renderer
// ═══════════════════════════════════════════════════════════════
function VariantRenderer({
  data, keyPrefix, copy, copiedKey,
}: {
  data: Record<string, unknown>;
  keyPrefix: string;
  copy: (text: string, key: string) => void;
  copiedKey: string;
}) {
  const entries = Object.entries(data);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {entries.map(([field, value]) => (
        <FieldBlock
          key={field}
          field={field}
          value={value}
          keyId={`${keyPrefix}-${field}`}
          copy={copy}
          copiedKey={copiedKey}
        />
      ))}
    </div>
  );
}

function FieldBlock({
  field, value, keyId, copy, copiedKey,
}: {
  field: string;
  value: unknown;
  keyId: string;
  copy: (text: string, key: string) => void;
  copiedKey: string;
}) {
  const label = field.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

  if (Array.isArray(value)) {
    return (
      <div>
        <div style={sectionLabelStyle}>{label}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {value.map((item, i) => {
            if (item && typeof item === 'object') {
              return (
                <div key={i} style={{ padding: 16, borderRadius: 10, background: S.surfaceHover, border: `1px solid ${S.border}` }}>
                  <div style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Item {i + 1}
                  </div>
                  <VariantRenderer data={item as Record<string, unknown>} keyPrefix={`${keyId}-${i}`} copy={copy} copiedKey={copiedKey} />
                </div>
              );
            }
            const text = String(item);
            const k = `${keyId}-${i}`;
            return <CopyableRow key={i} text={text} onCopy={() => copy(text, k)} copied={copiedKey === k} index={i + 1} />;
          })}
        </div>
      </div>
    );
  }

  if (value && typeof value === 'object') {
    return (
      <div>
        <div style={sectionLabelStyle}>{label}</div>
        <div style={{ padding: 16, borderRadius: 10, background: S.surfaceHover, border: `1px solid ${S.border}` }}>
          <VariantRenderer data={value as Record<string, unknown>} keyPrefix={keyId} copy={copy} copiedKey={copiedKey} />
        </div>
      </div>
    );
  }

  const text = String(value ?? '');
  return (
    <div>
      <div style={sectionLabelStyle}>{label}</div>
      <CopyableRow text={text} onCopy={() => copy(text, keyId)} copied={copiedKey === keyId} />
    </div>
  );
}

function CopyableRow({
  text, onCopy, copied, index,
}: { text: string; onCopy: () => void; copied: boolean; index?: number }) {
  return (
    <div
      className="s-field"
      onClick={onCopy}
      style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16,
        padding: '16px 18px', borderRadius: 11,
        background: S.surfaceHover, border: `1px solid ${S.border}`,
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {index != null && (
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono, paddingTop: 2, flexShrink: 0 }}>{index}.</span>
        )}
        <div style={{ fontSize: 15, color: '#E2E4E9', lineHeight: 1.65, fontFamily: S.mono, wordBreak: 'break-word' }}>
          {text}
        </div>
      </div>
      <span style={{
        fontSize: 13, padding: '5px 12px', borderRadius: 7, flexShrink: 0, fontFamily: S.mono,
        color: copied ? S.green : S.textMuted,
        background: copied ? S.greenSoft : 'transparent',
        border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : S.border}`,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <Copy /> {copied ? 'Copied' : 'Copy'}
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Generating overlay
// ═══════════════════════════════════════════════════════════════
function GeneratingOverlay({
  current, total, currentName, onCancel,
}: { current: number; total: number; currentName: string; onCancel: () => void }) {
  const pct = total === 0 ? 0 : Math.round(((current + (currentName ? 0.5 : 1)) / total) * 100);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(11,13,17,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: S.font,
    }}>
      <div style={{
        width: 460, maxWidth: '90vw',
        background: S.bg, border: `1px solid ${S.border}`, borderRadius: 18,
        padding: 36, textAlign: 'center',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          width: 60, height: 60, margin: '0 auto 24px',
          border: `3px solid ${S.border}`, borderTopColor: S.accent, borderRadius: '50%',
          animation: 'sSpin 0.9s linear infinite',
        }} />
        <div style={{ fontSize: 22, fontWeight: 700, color: S.white, letterSpacing: '-0.01em', marginBottom: 8 }}>
          Generating campaigns
        </div>
        <div style={{ fontSize: 14, color: S.textSecondary, marginBottom: 24, minHeight: 20 }}>
          {currentName ? <>Working on <span style={{ color: S.white, fontWeight: 500 }}>{currentName}</span>…</> : 'Preparing…'}
        </div>

        <div style={{ height: 7, borderRadius: 4, background: S.border, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, #0066FF 0%, #00D4AA 100%)',
            transition: 'width 0.5s ease',
          }} />
        </div>
        <div style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, marginBottom: 26 }}>
          {Math.min(current + 1, total)} / {total}
        </div>

        <button
          onClick={onCancel}
          className="s-btn"
          style={{
            padding: '11px 22px', borderRadius: 9, background: 'transparent',
            border: `1px solid ${S.border}`, color: S.textSecondary,
            fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared bits
// ═══════════════════════════════════════════════════════════════
function BottomBar({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, marginTop: 36,
      paddingTop: 22, paddingBottom: 22,
      borderTop: `1px solid rgba(0,0,0,0.08)`,
      background: `linear-gradient(to top, ${S.pageBg} 60%, rgba(245,245,247,0.7))`,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 14,
    }}>
      {children}
    </div>
  );
}

function TargetBottomBar({
  count, noun, canContinue, onBack, onContinue,
}: {
  count: number;
  noun: string;
  canContinue: boolean;
  onBack: () => void;
  onContinue: () => void;
}) {
  return (
    <BottomBar>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={onBack} className="s-btn" style={navButtonStyle('ghost')}>
          <ArrowLeft /> Back
        </button>
        <span style={{ color: count ? S.textPrimary : S.textMuted, fontSize: 14 }}>
          <strong style={{ color: S.white, fontWeight: 600 }}>{count}</strong>{' '}
          {noun}{count === 1 ? '' : 's'} selected
        </span>
      </div>
      <button onClick={onContinue} disabled={!canContinue} className="s-btn" style={navButtonStyle('primary', !canContinue)}>
        Continue <ArrowRight />
      </button>
    </BottomBar>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, color: S.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent || S.white, letterSpacing: '-0.01em' }}>
        {value}
      </div>
    </div>
  );
}

function CheckBox({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 24, height: 24, borderRadius: 7,
      background: selected ? S.accent : 'transparent',
      border: `1.5px solid ${selected ? S.accent : 'rgba(255,255,255,0.2)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
    }}>
      {selected && <Check size={13} />}
    </div>
  );
}

function cardStyle(selected: boolean): React.CSSProperties {
  return {
    position: 'relative', textAlign: 'left', cursor: 'pointer',
    background: selected ? S.accentSoft : S.surface,
    border: `1.5px solid ${selected ? S.accentBorder : S.border}`,
    borderRadius: 16, padding: 20, fontFamily: S.font, color: S.textPrimary,
    boxShadow: CARD_SHADOW,
  };
}

function scrollContainerStyle(): React.CSSProperties {
  return {
    maxHeight: 'calc(100vh - 420px)',
    minHeight: 320,
    overflowY: 'auto',
    paddingRight: 8,
    marginRight: -8,
  };
}

function toolbarBtnStyle(): React.CSSProperties {
  return {
    padding: '12px 20px', borderRadius: 10,
    background: '#fff', border: `1px solid rgba(0,0,0,0.12)`,
    color: S.pageHeading, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  };
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: S.pageSubtitle, display: 'flex' }}>
        <Search />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '14px 16px 14px 42px', borderRadius: 11,
          background: '#fff', border: `1px solid rgba(0,0,0,0.12)`,
          color: S.pageHeading, fontSize: 15, fontFamily: S.font, outline: 'none',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      />
    </div>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  const active = value !== 'all';
  return (
    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <span style={{
        position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
        fontSize: 12, color: S.pageSubtitle, fontWeight: 500, pointerEvents: 'none', letterSpacing: '0.02em',
      }}>
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          padding: `12px 34px 12px ${label.length * 6.4 + 26}px`,
          borderRadius: 11,
          background: active ? 'rgba(0,102,255,0.08)' : '#fff',
          border: `1px solid ${active ? S.accentBorder : 'rgba(0,0,0,0.12)'}`,
          color: active ? S.accent : S.pageHeading,
          fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font, outline: 'none',
          minWidth: 200,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#fff', color: S.pageHeading }}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{
        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
        pointerEvents: 'none', color: S.pageSubtitle, display: 'flex',
      }}>
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 4l2.5 2.5L7.5 4" /></svg>
      </span>
    </label>
  );
}

function navButtonStyle(variant: 'primary' | 'ghost', disabled?: boolean): React.CSSProperties {
  if (variant === 'primary') {
    return {
      padding: '13px 30px', borderRadius: 11,
      background: disabled ? S.surfaceHover : S.accent,
      color: disabled ? S.textMuted : S.white,
      border: 'none', fontSize: 16, fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'flex', alignItems: 'center', gap: 10, fontFamily: S.font,
    };
  }
  return {
    padding: '12px 22px', borderRadius: 11,
    background: '#fff', border: `1px solid rgba(0,0,0,0.12)`,
    color: S.pageHeading, fontSize: 15, fontWeight: 500,
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, fontFamily: S.font,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  };
}

function headerBtn(variant: 'ghost' | 'success'): React.CSSProperties {
  return {
    padding: '11px 18px', borderRadius: 9,
    background: variant === 'success' ? S.greenSoft : S.surface,
    border: `1px solid ${variant === 'success' ? 'rgba(16,185,129,0.3)' : S.border}`,
    color: variant === 'success' ? S.green : S.textPrimary,
    fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font,
    display: 'flex', alignItems: 'center', gap: 8,
    boxShadow: CARD_SHADOW,
  };
}
