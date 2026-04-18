/**
 * Scale DataForSEO — typed helpers for the DataForSEO API.
 * All calls go through /api/admin/scale/seo/proxy to avoid CORS.
 * Credentials are pulled from localStorage "scale-integrations".
 *
 * Includes 24h response caching to save credits.
 */

import { getCredits, useCredits } from './scale-credits';

// ─── Auth ───
function getAuth(): string {
  if (typeof window === 'undefined') throw new Error('DataForSEO: client-side only');
  const raw = window.localStorage.getItem('scale-integrations');
  if (!raw) throw new Error('DataForSEO not connected. Add credentials in Settings → Integrations.');
  const integrations = JSON.parse(raw);
  const creds = integrations.dataforseo;
  if (!creds?.login || !creds?.apiPassword) {
    throw new Error('DataForSEO not connected. Add credentials in Settings → Integrations.');
  }
  return 'Basic ' + btoa(`${creds.login}:${creds.apiPassword}`);
}

// ─── Cache (24h TTL) ───
const CACHE_KEY = 'scale-dfs-cache';
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface CacheEntry { data: unknown; ts: number }

function cacheGet(key: string): unknown | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache: Record<string, CacheEntry> = JSON.parse(raw);
    const entry = cache[key];
    if (!entry) return null;
    if (Date.now() - entry.ts > CACHE_TTL) {
      delete cache[key];
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return null;
    }
    return entry.data;
  } catch { return null; }
}

function cacheSet(key: string, data: unknown) {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    const cache: Record<string, CacheEntry> = raw ? JSON.parse(raw) : {};
    // Evict stale entries
    const now = Date.now();
    for (const k of Object.keys(cache)) {
      if (now - cache[k].ts > CACHE_TTL) delete cache[k];
    }
    cache[key] = { data, ts: now };
    // Limit cache size
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      keys.sort((a, b) => cache[a].ts - cache[b].ts);
      for (let i = 0; i < keys.length - 80; i++) delete cache[keys[i]];
    }
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { /* cache full, skip */ }
}

// ─── Credit costs ───
export const DFS_CREDIT_COSTS: Record<string, number> = {
  keyword_research: 5,
  rank_check: 3,
  serp_analysis: 8,
  site_audit: 50,
  competitor_intel: 15,
  backlinks: 20,
  content_gaps: 15,
};

export class InsufficientCreditsError extends Error {
  constructor(needed: number, have: number) {
    super(`Insufficient credits: need ${needed}, have ${have}`);
    this.name = 'InsufficientCreditsError';
  }
}

export class DfsAuthError extends Error {
  constructor() {
    super('DataForSEO credentials invalid. Update in Settings → Integrations.');
    this.name = 'DfsAuthError';
  }
}

// ─── Core fetch ───
async function dfsPost(endpoint: string, data: unknown[], creditType: string, cacheKey?: string): Promise<unknown> {
  // Check cache first
  const ck = cacheKey || `${endpoint}:${JSON.stringify(data)}`;
  const cached = cacheGet(ck);
  if (cached) return cached;

  // Check credits
  const cost = DFS_CREDIT_COSTS[creditType] || 5;
  const balance = getCredits();
  if (balance < cost) {
    throw new InsufficientCreditsError(cost, balance);
  }

  const auth = getAuth();

  const res = await fetch('/api/admin/scale/seo/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint, data, auth }),
  });

  const json = await res.json();

  // Handle auth errors
  if (json?.status_code === 40001 || json?.status_message?.includes('auth')) {
    throw new DfsAuthError();
  }

  // Handle rate limiting
  if (json?.status_code === 40200 || res.status === 429) {
    throw new Error('Rate limit hit. Please wait 60 seconds and try again.');
  }

  // Deduct credits on success
  useCredits(cost, `DataForSEO: ${creditType}`);

  // Cache the response
  cacheSet(ck, json);

  return json;
}

// ─── Helper to extract results from DFS response shape ───
export function extractResults(response: unknown): unknown[] {
  const r = response as { tasks?: Array<{ result?: unknown[] }> };
  return r?.tasks?.[0]?.result || [];
}

export function extractItems(response: unknown): unknown[] {
  const results = extractResults(response);
  return (results[0] as { items?: unknown[] })?.items || [];
}

// ─── API methods ───
export const dfs = {
  // Keyword Research
  keywordSuggestions: (keyword: string, locationCode = 2124) =>
    dfsPost('/dataforseo_labs/google/keyword_suggestions/live', [{ keyword, location_code: locationCode, language_code: 'en', limit: 50 }], 'keyword_research'),

  keywordsForSite: (site: string, locationCode = 2124) =>
    dfsPost('/dataforseo_labs/google/keywords_for_site/live', [{ target: site, location_code: locationCode, language_code: 'en', limit: 50 }], 'keyword_research'),

  searchVolume: (keywords: string[], locationCode = 2124) =>
    dfsPost('/keywords_data/google_ads/search_volume/live', [{ keywords, location_code: locationCode, language_code: 'en' }], 'keyword_research'),

  // Rank Tracking
  rankedKeywords: (target: string, locationCode = 2124) =>
    dfsPost('/dataforseo_labs/google/ranked_keywords/live', [{ target, location_code: locationCode, language_code: 'en', limit: 100 }], 'rank_check'),

  // SERP Analysis
  serpResults: (keyword: string, locationCode = 2124) =>
    dfsPost('/serp/google/organic/live/advanced', [{ keyword, location_code: locationCode, language_code: 'en', depth: 10 }], 'serp_analysis'),

  // Competitors
  competitors: (target: string, locationCode = 2124) =>
    dfsPost('/dataforseo_labs/google/competitors_domain/live', [{ target, location_code: locationCode, language_code: 'en', limit: 10 }], 'competitor_intel'),

  domainIntersection: (target1: string, target2: string, locationCode = 2124) =>
    dfsPost('/dataforseo_labs/google/domain_intersection/live', [{ target1, target2, location_code: locationCode, language_code: 'en', limit: 50 }], 'content_gaps'),

  // Backlinks
  backlinks: (target: string) =>
    dfsPost('/backlinks/backlinks/live', [{ target, limit: 100, mode: 'as_is' }], 'backlinks'),

  domainRank: (target: string) =>
    dfsPost('/backlinks/summary/live', [{ target }], 'backlinks'),

  // Site Audit
  onPageTaskPost: (target: string, maxPages = 50) =>
    dfsPost('/on_page/task_post', [{ target, max_crawl_pages: maxPages, enable_javascript: true }], 'site_audit'),

  onPageSummary: (taskId: string) =>
    dfsPost('/on_page/summary/' + taskId, [], 'rank_check', `audit-summary-${taskId}`),

  onPagePages: (taskId: string) =>
    dfsPost('/on_page/pages', [{ id: taskId, limit: 100 }], 'rank_check', `audit-pages-${taskId}`),
};
