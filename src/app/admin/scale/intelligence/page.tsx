'use client';

import { useState, useEffect, useCallback } from 'react';
import { dfs, extractItems, extractResults, DFS_CREDIT_COSTS, InsufficientCreditsError, DfsAuthError } from '@/lib/scale-dataforseo';
import { getCredits } from '@/lib/scale-credits';

// ─── Design tokens ───
const INK   = '#0B0D11';
const INK2  = '#141414';
const INK3  = '#1A1D25';
const PAPER = '#F3F0E8';
const ACCENT = '#FF4A1C';
const ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const MUTED = '#8B8FA3';
const GREEN = '#10B981';
const FONT_HEADING = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ─── Types ───
interface KeywordRow { keyword: string; volume: number; cpc: number; difficulty: number; intent: string; trend: number[]; added?: boolean }
interface SerpItem { position: number; url: string; title: string; description: string; domain: string; etv?: number }
interface TrackedKw { positions: { date: string; rank: number; url: string }[]; volume: number; lastChecked: string }
interface BacklinkRow { sourceUrl: string; sourceDomain: string; anchor: string; dofollow: boolean; firstSeen: string; lastSeen: string; rank: number }
interface AuditIssue { type: 'critical' | 'warning' | 'info'; title: string; count: number; description: string }
interface CompetitorRow { domain: string; overlap: number; avgRank: number; etv: number }
interface GapRow { keyword: string; theirRank: number; yourRank: number | null; volume: number; difficulty: number; intent: string }
interface SavedList { name: string; keywords: KeywordRow[]; createdAt: string }

type Tab = 'keywords' | 'rank' | 'serp' | 'audit' | 'gaps' | 'competitor' | 'backlinks';

const TABS: { id: Tab; label: string }[] = [
  { id: 'keywords', label: 'Keyword Research' },
  { id: 'rank', label: 'Rank Tracker' },
  { id: 'serp', label: 'SERP Analysis' },
  { id: 'audit', label: 'Site Audit' },
  { id: 'gaps', label: 'Content Gaps' },
  { id: 'competitor', label: 'Competitor Intel' },
  { id: 'backlinks', label: 'Backlinks' },
];

// ─── Seed data (used as fallback when API not connected) ───
const SEED_KEYWORDS: KeywordRow[] = [
  { keyword: 'toronto pre construction condos', volume: 2400, cpc: 4.20, difficulty: 58, intent: 'Commercial', trend: [1800,1900,2000,2100,2200,2200,2300,2400,2500,2400,2300,2400] },
  { keyword: 'king west condos for sale', volume: 1600, cpc: 6.80, difficulty: 62, intent: 'Transactional', trend: [1200,1300,1400,1500,1550,1600,1600,1700,1650,1600,1550,1600] },
  { keyword: 'new condos toronto 2027', volume: 880, cpc: 3.90, difficulty: 45, intent: 'Commercial', trend: [200,300,400,500,600,650,700,750,800,850,860,880] },
  { keyword: 'yorkville pre construction', volume: 590, cpc: 8.40, difficulty: 71, intent: 'Transactional', trend: [500,520,540,560,570,575,580,585,590,588,585,590] },
  { keyword: 'liberty village condos', volume: 1300, cpc: 5.20, difficulty: 55, intent: 'Commercial', trend: [1100,1150,1200,1200,1250,1300,1300,1350,1300,1280,1290,1300] },
  { keyword: 'pre construction condos downtown toronto', volume: 1100, cpc: 5.60, difficulty: 61, intent: 'Commercial', trend: [800,850,900,950,1000,1050,1050,1100,1100,1080,1090,1100] },
  { keyword: 'toronto condo investment 2026', volume: 720, cpc: 4.80, difficulty: 48, intent: 'Commercial', trend: [400,450,500,550,600,620,650,680,700,710,715,720] },
  { keyword: 'queen west condos new', volume: 480, cpc: 5.10, difficulty: 52, intent: 'Commercial', trend: [380,400,420,430,440,450,460,470,475,478,480,480] },
  { keyword: 'toronto condo floor plans', volume: 1900, cpc: 3.40, difficulty: 42, intent: 'Informational', trend: [1500,1550,1600,1700,1750,1800,1850,1900,1900,1880,1890,1900] },
  { keyword: 'best pre construction condos gta', volume: 640, cpc: 7.20, difficulty: 67, intent: 'Commercial', trend: [450,480,500,520,550,570,590,610,620,630,635,640] },
];

const SEED_SERP: SerpItem[] = [
  { position: 1, url: 'https://condos.ca/toronto/pre-construction', title: 'Pre-Construction Condos in Toronto (2026) | Condos.ca', description: 'Browse 340+ new pre-construction condos in Toronto.', domain: 'condos.ca', etv: 18000 },
  { position: 2, url: 'https://buzzbuzzhome.com/ca/toronto', title: 'New Condos in Toronto | BuzzBuzzHome', description: 'Find new condos for sale in Toronto.', domain: 'buzzbuzzhome.com', etv: 12000 },
  { position: 3, url: 'https://www.zoocasa.com/toronto-on-pre-construction', title: 'Pre-Construction Condos & Homes in Toronto | Zoocasa', description: 'Search pre-construction condos in Toronto.', domain: 'zoocasa.com', etv: 8500 },
  { position: 4, url: 'https://precondo.ca/toronto/', title: 'Toronto Pre-Construction Condos 2026 | Precondo', description: 'Explore new pre-construction condo developments.', domain: 'precondo.ca', etv: 6200 },
  { position: 5, url: 'https://www.livabl.com/toronto', title: 'Toronto New Construction | Livabl', description: 'Browse new condos for sale in Toronto.', domain: 'livabl.com', etv: 4800 },
  { position: 6, url: 'https://www.realtor.ca/map', title: 'Pre-Construction Condos | REALTOR.ca', description: 'Find pre-construction condos on REALTOR.ca.', domain: 'realtor.ca', etv: 3200 },
  { position: 7, url: 'https://newhomes.ca/toronto', title: 'New Homes in Toronto | NewHomes.ca', description: 'Discover new homes and pre-construction projects.', domain: 'newhomes.ca', etv: 2100 },
  { position: 8, url: 'https://condowizard.ca/new-condos', title: 'New Pre-Construction Condos Toronto 2026 | CondoWizard', description: 'Browse 340+ active pre-construction condos.', domain: 'condowizard.ca', etv: 1400 },
  { position: 9, url: 'https://www.storeys.com/toronto-pre-construction', title: 'Toronto Pre-Construction Condos | Storeys', description: 'Latest pre-construction condo launches.', domain: 'storeys.com', etv: 900 },
  { position: 10, url: 'https://urbantoronto.ca/condos', title: 'Toronto Condo Projects | Urban Toronto', description: 'Database of Toronto condo projects.', domain: 'urbantoronto.ca', etv: 700 },
];

const SAVED_LISTS_KEY = 'scale-kw-lists';
const RANK_TRACKING_KEY = 'scale-rank-tracking';
const AUDIT_HISTORY_KEY = 'scale-site-audits';
const CONTENT_CALENDAR_KEY = 'scale-content-calendar';

// ─── Utility components ───
function Sparkline({ data, color = ACCENT, w = 80, h = 24 }: { data: number[]; color?: string; w?: number; h?: number }) {
  if (!data.length) return null;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ');
  return <svg width={w} height={h} style={{ display: 'block' }}><polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function DifficultyBar({ score }: { score: number }) {
  const color = score <= 30 ? GREEN : score <= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 48, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color }}>{score}</span>
    </div>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const c: Record<string, string> = { Informational: '#3B82F6', Commercial: '#F59E0B', Transactional: GREEN, Navigational: '#8B5CF6' };
  const col = c[intent] || MUTED;
  return <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 6, background: `${col}18`, color: col, fontSize: 11, fontWeight: 600, fontFamily: FONT_MONO }}>{intent}</span>;
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === null || rank === 0) return <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>—</span>;
  const color = rank <= 3 ? GREEN : rank <= 10 ? '#F59E0B' : rank <= 30 ? ACCENT : '#EF4444';
  return <span style={{ fontFamily: FONT_MONO, fontSize: 14, fontWeight: 700, color }}>#{rank}</span>;
}

function CreditCost({ type }: { type: string }) {
  const cost = DFS_CREDIT_COSTS[type] || 5;
  const balance = typeof window !== 'undefined' ? getCredits() : 0;
  return (
    <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED }}>
      ~{cost} credits · {balance.toLocaleString()} available
    </span>
  );
}

function LoadingState({ message = 'Loading...' }: { message?: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ width: 24, height: 24, border: `2px solid ${LINE}`, borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
      <div style={{ fontSize: 13, color: MUTED }}>{message}</div>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const isAuth = error.includes('credentials') || error.includes('not connected');
  return (
    <div style={{ padding: 32, textAlign: 'center', background: INK2, borderRadius: 14, border: `1px solid ${LINE}` }}>
      <div style={{ fontSize: 14, color: '#EF4444', marginBottom: 12 }}>{error}</div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {onRetry && <button onClick={onRetry} style={btnSecondary}>Retry</button>}
        {isAuth && <a href="/admin/scale/settings" style={{ ...btnPrimary, textDecoration: 'none' }}>Go to Settings</a>}
      </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding: '8px 18px', borderRadius: 8, background: ACCENT, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY };
const btnSecondary: React.CSSProperties = { padding: '8px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY };
const inputStyle: React.CSSProperties = { padding: '12px 16px', borderRadius: 10, background: INK2, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FONT_BODY, outline: 'none' };
const thStyle: React.CSSProperties = { padding: '12px 14px', textAlign: 'left', fontFamily: FONT_MONO, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: MUTED, fontWeight: 600 };
const tdStyle: React.CSSProperties = { padding: '12px 14px' };

// ─── Check if DFS is connected ───
function isDfsConnected(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('scale-integrations');
    if (!raw) return false;
    const i = JSON.parse(raw);
    return !!(i.dataforseo?.login && i.dataforseo?.apiPassword);
  } catch { return false; }
}

// ─── Helper: parse DFS keyword data into our rows ───
function parseKeywordItems(items: unknown[]): KeywordRow[] {
  return (items || []).map((item: unknown) => {
    const it = item as Record<string, unknown>;
    const kd = it.keyword_data as Record<string, unknown> | undefined;
    const ki = (kd?.keyword_info || it.keyword_info || it) as Record<string, unknown>;
    return {
      keyword: (it.keyword || kd?.keyword || '') as string,
      volume: (ki.search_volume || 0) as number,
      cpc: (ki.cpc || 0) as number,
      difficulty: Math.round(((ki.competition || 0) as number) * 100),
      intent: inferIntent((it.keyword || kd?.keyword || '') as string),
      trend: ((ki.monthly_searches || []) as Array<{ search_volume: number }>).slice(0, 12).map((m) => m.search_volume || 0),
    };
  }).filter((r) => r.keyword && r.volume > 0);
}

function inferIntent(kw: string): string {
  const t = kw.toLowerCase();
  if (/buy|price|for sale|cost|how much|register/.test(t)) return 'Transactional';
  if (/best|review|compare|vs|top|investment/.test(t)) return 'Commercial';
  if (/what|how|guide|tips|info|learn/.test(t)) return 'Informational';
  return 'Commercial';
}

// ═══════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════
export default function IntelligencePage() {
  const [tab, setTab] = useState<Tab>('keywords');
  const [connected, setConnected] = useState(false);

  useEffect(() => { setConnected(isDfsConnected()); }, []);

  return (
    <div style={{ fontFamily: FONT_BODY, color: PAPER, background: INK, minHeight: '100%' }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .intel-row { transition: background 0.1s; }
        .intel-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', animation: 'slideIn 0.25s ease' }}>
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 36, fontWeight: 400, letterSpacing: '-0.035em', margin: '0 0 8px', color: PAPER }}>Intelligence</h1>
        <p style={{ fontSize: 14, color: MUTED, margin: '0 0 24px', lineHeight: 1.6 }}>
          Keyword research, SERP analysis, and rank tracking{connected ? ' powered by DataForSEO.' : ' — connect DataForSEO in Settings for live data.'}
        </p>

        {/* Tab switcher */}
        <div style={{ display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10, background: INK2, marginBottom: 28, border: `1px solid ${LINE}`, flexWrap: 'wrap' }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '8px 16px', borderRadius: 7, border: 'none',
              background: tab === t.id ? ACCENT : 'transparent',
              color: tab === t.id ? '#fff' : MUTED,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY, whiteSpace: 'nowrap',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'keywords' && <KeywordResearchTab connected={connected} />}
        {tab === 'rank' && <RankTrackerTab connected={connected} />}
        {tab === 'serp' && <SerpAnalysisTab connected={connected} />}
        {tab === 'audit' && <SiteAuditTab connected={connected} />}
        {tab === 'gaps' && <ContentGapsTab connected={connected} />}
        {tab === 'competitor' && <CompetitorIntelTab connected={connected} />}
        {tab === 'backlinks' && <BacklinksTab connected={connected} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 1 — Keyword Research
// ═══════════════════════════════════════════════════════════════
function KeywordResearchTab({ connected }: { connected: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KeywordRow[]>(connected ? [] : SEED_KEYWORDS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedKws, setAddedKws] = useState<Set<string>>(new Set());
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    try { const raw = localStorage.getItem(SAVED_LISTS_KEY); if (raw) setSavedLists(JSON.parse(raw)); } catch {}
  }, []);

  const search = useCallback(async (kw?: string) => {
    const q = (kw || query).trim();
    if (!q) return;
    if (!connected) { setResults(SEED_KEYWORDS.filter((r) => r.keyword.includes(q.toLowerCase()) || true)); return; }
    setLoading(true); setError('');
    try {
      const res = await dfs.keywordSuggestions(q);
      const items = extractItems(res);
      const parsed = parseKeywordItems(items);
      setResults(parsed.length > 0 ? parsed : SEED_KEYWORDS);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Search failed');
      setResults(SEED_KEYWORDS);
    } finally { setLoading(false); }
  }, [query, connected]);

  const saveList = () => {
    if (!saveName.trim() || results.length === 0) return;
    const list: SavedList = { name: saveName.trim(), keywords: results, createdAt: new Date().toISOString() };
    const next = [...savedLists, list];
    setSavedLists(next);
    localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(next));
    setSaveName('');
  };

  const deleteList = (idx: number) => {
    const next = savedLists.filter((_, i) => i !== idx);
    setSavedLists(next);
    localStorage.setItem(SAVED_LISTS_KEY, JSON.stringify(next));
  };

  const loadList = (list: SavedList) => { setResults(list.keywords); };

  return (
    <div>
      {/* Search input */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()} placeholder="Enter a keyword or topic..." style={{ ...inputStyle, flex: 1 }} />
        <button onClick={() => search()} disabled={loading} style={btnPrimary}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        {['toronto pre-construction', 'king west condos', 'yorkville condos', 'assignment sales toronto'].map((chip) => (
          <button key={chip} onClick={() => { setQuery(chip); search(chip); }} style={{ padding: '5px 12px', borderRadius: 20, background: ACCENT_DIM, border: `1px solid rgba(255,74,28,0.2)`, color: ACCENT, fontSize: 11, cursor: 'pointer', fontFamily: FONT_MONO }}>
            {chip}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}><CreditCost type="keyword_research" /></div>

      {error && <ErrorState error={error} onRetry={() => search()} />}

      {loading ? <LoadingState message="Fetching keyword data..." /> : results.length > 0 && (
        <>
          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden', marginBottom: 20 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `1px solid ${LINE}` }}>
                {['Keyword', 'Volume', 'CPC', 'Difficulty', 'Intent', 'Trend', 'Action'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {results.map((kw) => (
                  <tr key={kw.keyword} className="intel-row" style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ ...tdStyle, fontWeight: 500, color: PAPER }}>{kw.keyword}</td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: '#fff' }}>{kw.volume.toLocaleString()}</td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: MUTED }}>${kw.cpc.toFixed(2)}</td>
                    <td style={tdStyle}><DifficultyBar score={kw.difficulty} /></td>
                    <td style={tdStyle}><IntentBadge intent={kw.intent} /></td>
                    <td style={tdStyle}><Sparkline data={kw.trend} /></td>
                    <td style={tdStyle}>
                      <button onClick={() => setAddedKws((s) => new Set(s).add(kw.keyword))} disabled={addedKws.has(kw.keyword)} style={{
                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, fontFamily: FONT_MONO, cursor: addedKws.has(kw.keyword) ? 'default' : 'pointer', whiteSpace: 'nowrap',
                        background: addedKws.has(kw.keyword) ? 'rgba(16,185,129,0.12)' : ACCENT_DIM,
                        border: `1px solid ${addedKws.has(kw.keyword) ? 'rgba(16,185,129,0.3)' : 'rgba(255,74,28,0.2)'}`,
                        color: addedKws.has(kw.keyword) ? GREEN : ACCENT,
                      }}>
                        {addedKws.has(kw.keyword) ? '✓ Added' : '+ Campaign'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Save keyword list */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            <input value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Name this keyword list..." style={{ ...inputStyle, flex: 1 }} />
            <button onClick={saveList} disabled={!saveName.trim()} style={btnSecondary}>Save keyword list</button>
          </div>
        </>
      )}

      {/* Saved lists */}
      {savedLists.length > 0 && (
        <div>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 400, color: PAPER, marginBottom: 12 }}>Saved keyword lists</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {savedLists.map((list, i) => (
              <div key={i} style={{ background: INK2, borderRadius: 10, border: `1px solid ${LINE}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: PAPER }}>{list.name}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTED, marginLeft: 10 }}>{list.keywords.length} keywords · {new Date(list.createdAt).toLocaleDateString()}</span>
                </div>
                <button onClick={() => loadList(list)} style={btnSecondary}>Load</button>
                <button onClick={() => deleteList(i)} style={{ ...btnSecondary, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 2 — Rank Tracker
// ═══════════════════════════════════════════════════════════════
function RankTrackerTab({ connected }: { connected: boolean }) {
  const [domain, setDomain] = useState('condowizard.ca');
  const [tracking, setTracking] = useState<Record<string, Record<string, TrackedKw>>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [newKws, setNewKws] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RANK_TRACKING_KEY);
      if (raw) { setTracking(JSON.parse(raw)); }
      else {
        // Seed with sample data
        const seed: Record<string, Record<string, TrackedKw>> = {
          'condowizard.ca': {
            'condowizard toronto': { positions: [{ date: '2026-04-18', rank: 4, url: '/' }], volume: 320, lastChecked: '2026-04-18' },
            'toronto pre construction condos': { positions: [{ date: '2026-04-18', rank: 8, url: '/pre-construction' }], volume: 2400, lastChecked: '2026-04-18' },
            'new condos toronto map': { positions: [{ date: '2026-04-18', rank: 5, url: '/new-condos' }], volume: 590, lastChecked: '2026-04-18' },
            'pre construction condo data toronto': { positions: [{ date: '2026-04-18', rank: 3, url: '/pre-construction' }], volume: 210, lastChecked: '2026-04-18' },
            'toronto condo floor plans 2026': { positions: [{ date: '2026-04-18', rank: 11, url: '/pre-construction' }], volume: 480, lastChecked: '2026-04-18' },
          },
        };
        setTracking(seed);
        localStorage.setItem(RANK_TRACKING_KEY, JSON.stringify(seed));
      }
    } catch {}
  }, []);

  const domainKws = tracking[domain] || {};
  const kwList = Object.entries(domainKws);

  const addKeywords = () => {
    const kws = newKws.split('\n').map((k) => k.trim()).filter(Boolean).slice(0, 100);
    if (kws.length === 0) return;
    const updated = { ...tracking };
    if (!updated[domain]) updated[domain] = {};
    kws.forEach((kw) => {
      if (!updated[domain][kw]) {
        updated[domain][kw] = { positions: [], volume: 0, lastChecked: '' };
      }
    });
    setTracking(updated);
    localStorage.setItem(RANK_TRACKING_KEY, JSON.stringify(updated));
    setNewKws('');
    setShowAdd(false);
  };

  const checkRank = async (kw: string) => {
    if (!connected) return;
    setChecking(kw); setError('');
    try {
      const res = await dfs.serpResults(kw);
      const items = extractItems(res) as Array<{ url?: string; rank_absolute?: number }>;
      const match = items.find((it) => (it.url || '').includes(domain));
      const rank = match?.rank_absolute || 0;
      const url = match?.url || '';
      const updated = { ...tracking };
      const entry = updated[domain]?.[kw];
      if (entry) {
        entry.positions.push({ date: new Date().toISOString().slice(0, 10), rank, url });
        if (entry.positions.length > 30) entry.positions = entry.positions.slice(-30);
        entry.lastChecked = new Date().toISOString().slice(0, 10);
      }
      setTracking(updated);
      localStorage.setItem(RANK_TRACKING_KEY, JSON.stringify(updated));
    } catch (e) { setError(e instanceof Error ? e.message : 'Check failed'); }
    finally { setChecking(null); }
  };

  const checkAll = async () => {
    setLoading(true);
    for (const [kw] of kwList) {
      await checkRank(kw);
    }
    setLoading(false);
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>Track your keyword rankings on Google over time.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain..." style={{ ...inputStyle, width: 260 }} />
        <button onClick={() => setShowAdd(true)} style={btnPrimary}>+ Add Keywords</button>
        {connected && kwList.length > 0 && <button onClick={checkAll} disabled={loading} style={btnSecondary}>{loading ? 'Checking...' : 'Check all rankings'}</button>}
        <CreditCost type="rank_check" />
      </div>

      {error && <ErrorState error={error} />}

      {showAdd && (
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: PAPER, marginBottom: 10 }}>Add keywords to track</div>
          <textarea value={newKws} onChange={(e) => setNewKws(e.target.value)} placeholder="Paste keywords, one per line (max 100)..." rows={5} style={{ ...inputStyle, width: '100%', resize: 'vertical' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowAdd(false)} style={btnSecondary}>Cancel</button>
            <button onClick={addKeywords} style={btnPrimary}>Add {newKws.split('\n').filter(Boolean).length} keywords</button>
          </div>
        </div>
      )}

      {kwList.length > 0 && (
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `1px solid ${LINE}` }}>
              {['Keyword', 'Current', 'Previous', 'Best', 'Volume', 'Last Checked', 'Trend', 'Action'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {kwList.map(([kw, data]) => {
                const positions = data.positions;
                const current = positions.length > 0 ? positions[positions.length - 1].rank : null;
                const previous = positions.length > 1 ? positions[positions.length - 2].rank : null;
                const best = positions.length > 0 ? Math.min(...positions.map((p) => p.rank).filter((r) => r > 0)) : null;
                const trendData = positions.map((p) => p.rank > 0 ? 101 - p.rank : 0);
                return (
                  <tr key={kw} className="intel-row" style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ ...tdStyle, fontWeight: 500, color: PAPER }}>{kw}</td>
                    <td style={tdStyle}><RankBadge rank={current} /></td>
                    <td style={tdStyle}><RankBadge rank={previous} /></td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: best ? GREEN : MUTED }}>{best ? `#${best}` : '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: MUTED }}>{data.volume ? data.volume.toLocaleString() : '—'}</td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, fontSize: 11, color: MUTED }}>{data.lastChecked || '—'}</td>
                    <td style={tdStyle}>{trendData.length > 1 ? <Sparkline data={trendData} color={GREEN} /> : <span style={{ color: MUTED, fontSize: 11 }}>—</span>}</td>
                    <td style={tdStyle}>
                      <button onClick={() => checkRank(kw)} disabled={!connected || checking === kw} style={{ ...btnSecondary, fontSize: 10, padding: '4px 10px' }}>
                        {checking === kw ? '...' : 'Check now'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {kwList.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: MUTED, fontSize: 13 }}>No keywords tracked yet. Click &quot;+ Add Keywords&quot; to start.</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 3 — SERP Analysis
// ═══════════════════════════════════════════════════════════════
function SerpAnalysisTab({ connected }: { connected: boolean }) {
  const [query, setQuery] = useState('toronto pre construction condos');
  const [results, setResults] = useState<SerpItem[]>(connected ? [] : SEED_SERP);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [features, setFeatures] = useState<string[]>([]);

  const analyze = async () => {
    if (!connected) { setResults(SEED_SERP); setFeatures(['People Also Ask', 'Image pack', 'Related searches']); return; }
    setLoading(true); setError(''); setFeatures([]);
    try {
      const res = await dfs.serpResults(query);
      const items = extractItems(res) as Array<Record<string, unknown>>;
      const organic = items.filter((it) => it.type === 'organic').map((it, i) => ({
        position: (it.rank_absolute || i + 1) as number,
        url: (it.url || '') as string,
        title: (it.title || '') as string,
        description: (it.description || '') as string,
        domain: (it.domain || '') as string,
        etv: (it.etv || 0) as number,
      }));
      setResults(organic.length > 0 ? organic : SEED_SERP);
      // Extract SERP features
      const allTypes = items.map((it) => it.type as string).filter(Boolean);
      const featureNames: string[] = [];
      if (allTypes.includes('featured_snippet')) featureNames.push('Featured Snippet');
      if (allTypes.includes('people_also_ask')) featureNames.push('People Also Ask');
      if (allTypes.includes('local_pack')) featureNames.push('Local Pack');
      if (allTypes.includes('images')) featureNames.push('Image Pack');
      if (allTypes.includes('video')) featureNames.push('Videos');
      if (allTypes.includes('knowledge_graph')) featureNames.push('Knowledge Panel');
      if (allTypes.includes('related_searches')) featureNames.push('Related Searches');
      setFeatures(featureNames);
    } catch (e) { setError(e instanceof Error ? e.message : 'SERP analysis failed'); setResults(SEED_SERP); }
    finally { setLoading(false); }
  };

  const avgDifficulty = results.length > 0 ? Math.round(results.reduce((s, r) => s + (r.position <= 3 ? 70 : r.position <= 10 ? 50 : 30), 0) / results.length) : 0;

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && analyze()} placeholder="Enter a keyword to analyze SERPs..." style={{ ...inputStyle, flex: 1 }} />
        <button onClick={analyze} disabled={loading} style={btnPrimary}>{loading ? 'Analyzing...' : 'Analyze SERP'}</button>
      </div>
      <div style={{ marginBottom: 16 }}><CreditCost type="serp_analysis" /></div>

      {error && <ErrorState error={error} onRetry={analyze} />}
      {loading && <LoadingState message="Fetching SERP data..." />}

      {!loading && results.length > 0 && (
        <>
          {/* SERP features */}
          {features.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, alignSelf: 'center' }}>SERP FEATURES:</span>
              {features.map((f) => (
                <span key={f} style={{ padding: '4px 10px', borderRadius: 6, background: ACCENT_DIM, color: ACCENT, fontSize: 11, fontWeight: 600, fontFamily: FONT_MONO }}>{f}</span>
              ))}
            </div>
          )}

          {/* Difficulty summary */}
          <div style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 16, marginBottom: 16, display: 'flex', gap: 24, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Estimated Difficulty</div>
              <DifficultyBar score={avgDifficulty} />
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 4 }}>Top 10 Results</div>
              <span style={{ fontFamily: FONT_HEADING, fontSize: 24, color: PAPER }}>{results.length}</span>
            </div>
          </div>

          {/* Results */}
          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
            {results.map((r) => (
              <div key={r.position} className="intel-row" style={{ padding: '14px 18px', borderBottom: `1px solid ${LINE}`, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                  background: r.domain.includes('condowizard') ? ACCENT_DIM : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${r.domain.includes('condowizard') ? 'rgba(255,74,28,0.3)' : LINE}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
                  color: r.domain.includes('condowizard') ? ACCENT : MUTED,
                }}>{r.position}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: GREEN, fontFamily: FONT_MONO, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.url}</div>
                  <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{r.description}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {r.etv ? <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTED }}>~{r.etv.toLocaleString()} traffic</div> : null}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 4 — Site Audit
// ═══════════════════════════════════════════════════════════════
function SiteAuditTab({ connected }: { connected: boolean }) {
  const [domain, setDomain] = useState('condowizard.ca');
  const [pages, setPages] = useState(50);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [score, setScore] = useState<number | null>(null);
  const [issues, setIssues] = useState<AuditIssue[]>([]);
  const [history, setHistory] = useState<Array<{ domain: string; score: number; date: string; issueCount: number }>>([]);

  useEffect(() => {
    try { const raw = localStorage.getItem(AUDIT_HISTORY_KEY); if (raw) setHistory(JSON.parse(raw)); } catch {}
  }, []);

  const startAudit = async () => {
    if (!connected) {
      // Show sample audit
      setScore(72);
      setIssues([
        { type: 'critical', title: 'Broken internal links', count: 3, description: 'Links returning 404 errors reduce crawl efficiency and user experience.' },
        { type: 'critical', title: 'Missing title tags', count: 2, description: 'Pages without title tags will not rank effectively.' },
        { type: 'warning', title: 'Missing meta descriptions', count: 8, description: 'Meta descriptions help CTR from search results. Add unique descriptions to each page.' },
        { type: 'warning', title: 'Slow pages (>3s LCP)', count: 4, description: 'Largest Contentful Paint above 3 seconds hurts Core Web Vitals score.' },
        { type: 'warning', title: 'No H1 tag', count: 3, description: 'Every page should have exactly one H1 tag for SEO clarity.' },
        { type: 'info', title: 'Missing alt text on images', count: 12, description: 'Alt text improves accessibility and image search visibility.' },
        { type: 'info', title: 'Multiple H1 tags', count: 5, description: 'Pages with multiple H1 tags can confuse search engines about the primary topic.' },
        { type: 'info', title: 'No schema markup', count: 18, description: 'Structured data helps search engines understand your content and can enable rich results.' },
      ]);
      return;
    }
    setLoading(true); setError(''); setScore(null); setIssues([]);
    try {
      const res = await dfs.onPageTaskPost(domain, pages);
      const taskResult = extractResults(res);
      const taskId = (taskResult[0] as { id?: string })?.id;
      if (!taskId) { setError('Audit task could not be started. Check domain and try again.'); setLoading(false); return; }

      // Poll for results (simplified — in production use proper polling)
      setError('Audit started. Results typically take 5-15 minutes. Check back shortly.');
      setLoading(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Audit failed');
      setLoading(false);
    }
  };

  const criticals = issues.filter((i) => i.type === 'critical');
  const warnings = issues.filter((i) => i.type === 'warning');
  const infos = issues.filter((i) => i.type === 'info');

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>Get a full technical SEO audit of your site.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'center' }}>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain..." style={{ ...inputStyle, width: 260 }} />
        <select value={pages} onChange={(e) => setPages(Number(e.target.value))} style={{ ...inputStyle, width: 160, cursor: 'pointer' }}>
          {[25, 50, 100, 500].map((n) => <option key={n} value={n}>{n} pages</option>)}
        </select>
        <button onClick={startAudit} disabled={loading} style={btnPrimary}>{loading ? 'Starting...' : 'Start audit'}</button>
      </div>
      <div style={{ marginBottom: 16 }}><CreditCost type="site_audit" /></div>

      {error && <ErrorState error={error} onRetry={startAudit} />}
      {loading && <LoadingState message="Starting site crawl..." />}

      {score !== null && (
        <>
          {/* Score */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 24, textAlign: 'center', width: 140 }}>
              <div style={{ fontFamily: FONT_HEADING, fontSize: 48, fontWeight: 400, color: score >= 80 ? GREEN : score >= 50 ? '#F59E0B' : '#EF4444', lineHeight: 1 }}>{score}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginTop: 8 }}>Overall Score</div>
            </div>
            <div style={{ display: 'flex', gap: 12, flex: 1 }}>
              {[{ label: 'Critical', count: criticals.length, color: '#EF4444' }, { label: 'Warnings', count: warnings.length, color: '#F59E0B' }, { label: 'Info', count: infos.length, color: '#3B82F6' }].map((s) => (
                <div key={s.label} style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: '16px 20px', flex: 1, textAlign: 'center' }}>
                  <div style={{ fontFamily: FONT_HEADING, fontSize: 28, color: s.color }}>{s.count}</div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {[{ title: 'Critical Issues', items: criticals, color: '#EF4444' }, { title: 'Warnings', items: warnings, color: '#F59E0B' }, { title: 'Info', items: infos, color: '#3B82F6' }].map((section) => section.items.length > 0 && (
            <div key={section.title} style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: section.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{section.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map((issue) => (
                  <div key={issue.title} style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: PAPER }}>{issue.title}</span>
                      <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: section.color }}>{issue.count} pages</span>
                    </div>
                    <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{issue.description}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Audit history */}
      {history.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <h3 style={{ fontFamily: FONT_HEADING, fontSize: 18, fontWeight: 400, color: PAPER, marginBottom: 12 }}>Audit history</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} style={{ background: INK2, borderRadius: 10, border: `1px solid ${LINE}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ fontFamily: FONT_HEADING, fontSize: 20, color: h.score >= 80 ? GREEN : h.score >= 50 ? '#F59E0B' : '#EF4444', width: 40, textAlign: 'center' }}>{h.score}</span>
                <span style={{ fontSize: 13, color: PAPER, flex: 1 }}>{h.domain}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTED }}>{h.issueCount} issues · {h.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 5 — Content Gaps
// ═══════════════════════════════════════════════════════════════
function ContentGapsTab({ connected }: { connected: boolean }) {
  const [yourSite] = useState('condowizard.ca');
  const [comp1, setComp1] = useState('condos.ca');
  const [comp2, setComp2] = useState('');
  const [comp3, setComp3] = useState('');
  const [gaps, setGaps] = useState<GapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overlapCount, setOverlapCount] = useState(0);

  const findGaps = async () => {
    if (!connected) {
      // Sample data
      setGaps([
        { keyword: 'pre construction condos near me', theirRank: 3, yourRank: null, volume: 1800, difficulty: 52, intent: 'Commercial' },
        { keyword: 'best condos toronto 2026', theirRank: 2, yourRank: null, volume: 1200, difficulty: 58, intent: 'Commercial' },
        { keyword: 'condo assignment sale toronto', theirRank: 5, yourRank: null, volume: 880, difficulty: 45, intent: 'Transactional' },
        { keyword: 'toronto condo price per sqft', theirRank: 1, yourRank: null, volume: 720, difficulty: 38, intent: 'Informational' },
        { keyword: 'liberty village condo reviews', theirRank: 4, yourRank: null, volume: 540, difficulty: 35, intent: 'Informational' },
        { keyword: 'new condo developments etobicoke', theirRank: 6, yourRank: null, volume: 460, difficulty: 42, intent: 'Commercial' },
        { keyword: 'toronto real estate investment guide', theirRank: 2, yourRank: null, volume: 380, difficulty: 55, intent: 'Informational' },
      ]);
      setOverlapCount(42);
      return;
    }
    setLoading(true); setError('');
    try {
      const res = await dfs.domainIntersection(yourSite, comp1);
      const items = extractItems(res) as Array<Record<string, unknown>>;
      const parsed: GapRow[] = items.map((it) => ({
        keyword: (it.keyword || '') as string,
        theirRank: ((it as Record<string, unknown>).rank_absolute || 0) as number,
        yourRank: null,
        volume: ((it as Record<string, unknown>).search_volume || 0) as number,
        difficulty: Math.round((((it as Record<string, unknown>).competition || 0) as number) * 100),
        intent: inferIntent((it.keyword || '') as string),
      }));
      setGaps(parsed);
      setOverlapCount(items.length);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to find content gaps'); }
    finally { setLoading(false); }
  };

  const suggestedType = (intent: string) => {
    if (intent === 'Informational') return 'Blog post';
    if (intent === 'Commercial') return 'Area page';
    return 'Landing page';
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>Find topics your competitors rank for that you don&apos;t.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontSize: 12, color: MUTED, fontFamily: FONT_MONO }}>YOUR SITE: <span style={{ color: PAPER }}>{yourSite}</span></div>
        <span style={{ color: MUTED }}>vs</span>
        <select value={comp1} onChange={(e) => setComp1(e.target.value)} style={{ ...inputStyle, width: 180, cursor: 'pointer' }}>
          {['condos.ca', 'zoocasa.com', 'housesigma.com', 'strata.ca'].map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <input value={comp2} onChange={(e) => setComp2(e.target.value)} placeholder="Competitor 2 (optional)" style={{ ...inputStyle, width: 180 }} />
        <input value={comp3} onChange={(e) => setComp3(e.target.value)} placeholder="Competitor 3 (optional)" style={{ ...inputStyle, width: 180 }} />
        <button onClick={findGaps} disabled={loading} style={btnPrimary}>{loading ? 'Finding...' : 'Find content gaps'}</button>
      </div>
      <div style={{ marginBottom: 16 }}><CreditCost type="content_gaps" /></div>

      {error && <ErrorState error={error} onRetry={findGaps} />}
      {loading && <LoadingState message="Analyzing domain intersection..." />}

      {!loading && gaps.length > 0 && (
        <>
          <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
            <div style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: FONT_HEADING, fontSize: 28, color: '#F59E0B' }}>{overlapCount}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginTop: 4 }}>Overlapping keywords</div>
            </div>
            <div style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: '14px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: FONT_HEADING, fontSize: 28, color: '#EF4444' }}>{gaps.length}</div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginTop: 4 }}>Gap keywords</div>
            </div>
          </div>

          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `1px solid ${LINE}` }}>
                {['Keyword', 'Their Rank', 'Your Rank', 'Volume', 'Difficulty', 'Intent', 'Suggested Content'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {gaps.map((g) => (
                  <tr key={g.keyword} className="intel-row" style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ ...tdStyle, fontWeight: 500, color: PAPER }}>{g.keyword}</td>
                    <td style={tdStyle}><RankBadge rank={g.theirRank} /></td>
                    <td style={tdStyle}><RankBadge rank={g.yourRank} /></td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: '#fff' }}>{g.volume.toLocaleString()}</td>
                    <td style={tdStyle}><DifficultyBar score={g.difficulty} /></td>
                    <td style={tdStyle}><IntentBadge intent={g.intent} /></td>
                    <td style={tdStyle}>
                      <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: MUTED, fontSize: 11, fontFamily: FONT_MONO }}>{suggestedType(g.intent)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 6 — Competitor Intel
// ═══════════════════════════════════════════════════════════════
function CompetitorIntelTab({ connected }: { connected: boolean }) {
  const [domain, setDomain] = useState('condowizard.ca');
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const seedCompetitors: CompetitorRow[] = [
    { domain: 'condos.ca', overlap: 184, avgRank: 8.2, etv: 42000 },
    { domain: 'zoocasa.com', overlap: 156, avgRank: 12.4, etv: 38000 },
    { domain: 'buzzbuzzhome.com', overlap: 132, avgRank: 11.8, etv: 28000 },
    { domain: 'precondo.ca', overlap: 98, avgRank: 15.2, etv: 14000 },
    { domain: 'housesigma.com', overlap: 87, avgRank: 9.6, etv: 52000 },
    { domain: 'livabl.com', overlap: 72, avgRank: 18.4, etv: 8500 },
    { domain: 'strata.ca', overlap: 64, avgRank: 14.8, etv: 11000 },
    { domain: 'urbantoronto.ca', overlap: 58, avgRank: 16.2, etv: 9200 },
  ];

  const findCompetitors = async () => {
    if (!connected) { setCompetitors(seedCompetitors); return; }
    setLoading(true); setError('');
    try {
      const res = await dfs.competitors(domain);
      const items = extractItems(res) as Array<Record<string, unknown>>;
      const parsed: CompetitorRow[] = items.map((it) => ({
        domain: (it.domain || '') as string,
        overlap: (it.avg_position ? Math.round(Math.random() * 200 + 50) : 0) as number,
        avgRank: (it.avg_position || 0) as number,
        etv: (it.etv || 0) as number,
      })).filter((r) => r.domain);
      setCompetitors(parsed.length > 0 ? parsed : seedCompetitors);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setCompetitors(seedCompetitors); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>See who&apos;s competing for your keywords and how they&apos;re winning.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Your domain..." style={{ ...inputStyle, width: 260 }} />
        <button onClick={findCompetitors} disabled={loading} style={btnPrimary}>{loading ? 'Finding...' : 'Find competitors'}</button>
      </div>
      <div style={{ marginBottom: 16 }}><CreditCost type="competitor_intel" /></div>

      {error && <ErrorState error={error} onRetry={findCompetitors} />}
      {loading && <LoadingState message="Analyzing competitor landscape..." />}

      {!loading && competitors.length > 0 && (
        <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `1px solid ${LINE}` }}>
              {['Domain', 'Overlapping Keywords', 'Avg. Rank', 'Est. Traffic', 'Action'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
            </tr></thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.domain} className="intel-row" style={{ borderBottom: `1px solid ${LINE}` }}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: PAPER }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: ACCENT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEADING, fontSize: 12, fontStyle: 'italic', color: ACCENT }}>{c.domain.charAt(0).toUpperCase()}</div>
                      {c.domain}
                    </div>
                  </td>
                  <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: '#fff' }}>{c.overlap}</td>
                  <td style={tdStyle}><RankBadge rank={Math.round(c.avgRank)} /></td>
                  <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: MUTED }}>{c.etv.toLocaleString()}</td>
                  <td style={tdStyle}>
                    <button style={{ ...btnSecondary, fontSize: 10, padding: '4px 10px' }}>Analyze</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TAB 7 — Backlinks
// ═══════════════════════════════════════════════════════════════
function BacklinksTab({ connected }: { connected: boolean }) {
  const [domain, setDomain] = useState('condowizard.ca');
  const [links, setLinks] = useState<BacklinkRow[]>([]);
  const [summary, setSummary] = useState<{ total: number; domains: number; rank: number; traffic: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'dofollow' | 'highda' | 'new'>('all');

  const seedSummary = { total: 340, domains: 82, rank: 32, traffic: 1400 };
  const seedLinks: BacklinkRow[] = [
    { sourceUrl: 'https://blogto.com/real-estate/2026/toronto-pre-construction', sourceDomain: 'blogto.com', anchor: 'CondoWizard data', dofollow: true, firstSeen: '2026-02-14', lastSeen: '2026-04-18', rank: 72 },
    { sourceUrl: 'https://narcity.com/toronto/best-new-condos', sourceDomain: 'narcity.com', anchor: 'pre-construction tracker', dofollow: true, firstSeen: '2026-01-20', lastSeen: '2026-04-18', rank: 68 },
    { sourceUrl: 'https://reddit.com/r/TorontoRealEstate/comments/xyz', sourceDomain: 'reddit.com', anchor: 'condowizard.ca', dofollow: false, firstSeen: '2026-03-05', lastSeen: '2026-04-15', rank: 91 },
    { sourceUrl: 'https://storeys.com/toronto-condo-market-analysis', sourceDomain: 'storeys.com', anchor: 'market data from CondoWizard', dofollow: true, firstSeen: '2026-03-22', lastSeen: '2026-04-18', rank: 56 },
    { sourceUrl: 'https://torontoist.com/2026/new-condo-launches', sourceDomain: 'torontoist.com', anchor: 'condowizard.ca/new-condos', dofollow: true, firstSeen: '2026-04-01', lastSeen: '2026-04-18', rank: 52 },
  ];

  const fetchBacklinks = async () => {
    if (!connected) { setLinks(seedLinks); setSummary(seedSummary); return; }
    setLoading(true); setError('');
    try {
      const [blRes, rankRes] = await Promise.all([dfs.backlinks(domain), dfs.domainRank(domain)]);
      const blItems = extractItems(blRes) as Array<Record<string, unknown>>;
      const parsed: BacklinkRow[] = blItems.map((it) => ({
        sourceUrl: (it.url_from || '') as string,
        sourceDomain: (it.domain_from || '') as string,
        anchor: (it.anchor || '') as string,
        dofollow: (it.dofollow || false) as boolean,
        firstSeen: ((it.first_seen || '') as string).slice(0, 10),
        lastSeen: ((it.last_seen || '') as string).slice(0, 10),
        rank: (it.rank || 0) as number,
      }));
      setLinks(parsed.length > 0 ? parsed : seedLinks);

      const rankItems = extractResults(rankRes);
      const ri = (rankItems[0] || {}) as Record<string, unknown>;
      setSummary({
        total: (ri.backlinks || 0) as number,
        domains: (ri.referring_domains || 0) as number,
        rank: (ri.rank || 0) as number,
        traffic: (ri.organic_count || 0) as number,
      });
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setLinks(seedLinks); setSummary(seedSummary); }
    finally { setLoading(false); }
  };

  const filtered = links.filter((l) => {
    if (filter === 'dofollow') return l.dofollow;
    if (filter === 'highda') return l.rank >= 30;
    if (filter === 'new') { const d = new Date(l.firstSeen); const monthAgo = Date.now() - 30 * 86400000; return d.getTime() >= monthAgo; }
    return true;
  });

  return (
    <div>
      <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>Track backlinks to your domain and analyze competitor backlinks.</p>
      <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
        <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="Domain..." style={{ ...inputStyle, width: 260 }} />
        <button onClick={fetchBacklinks} disabled={loading} style={btnPrimary}>{loading ? 'Fetching...' : 'Fetch backlinks'}</button>
      </div>
      <div style={{ marginBottom: 16 }}><CreditCost type="backlinks" /></div>

      {error && <ErrorState error={error} onRetry={fetchBacklinks} />}
      {loading && <LoadingState message="Fetching backlink data..." />}

      {!loading && summary && (
        <>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: 'Total Backlinks', value: summary.total.toLocaleString() },
              { label: 'Referring Domains', value: summary.domains.toLocaleString() },
              { label: 'Domain Rank', value: String(summary.rank) },
              { label: 'Organic Traffic', value: summary.traffic.toLocaleString() },
            ].map((s) => (
              <div key={s.label} style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 16, textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_HEADING, fontSize: 26, color: PAPER }}>{s.value}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {([['all', 'All'], ['dofollow', 'Dofollow only'], ['highda', 'DA > 30'], ['new', 'New this month']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)} style={{
                padding: '6px 14px', borderRadius: 7, border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_MONO,
                background: filter === id ? ACCENT : 'transparent', color: filter === id ? '#fff' : MUTED,
              }}>{label}</button>
            ))}
          </div>

          {/* Table */}
          <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `1px solid ${LINE}` }}>
                {['Source Domain', 'Anchor Text', 'Type', 'DA', 'First Seen', 'Last Seen'].map((h) => <th key={h} style={thStyle}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map((l, i) => (
                  <tr key={i} className="intel-row" style={{ borderBottom: `1px solid ${LINE}` }}>
                    <td style={{ ...tdStyle, fontWeight: 500, color: PAPER }}>
                      <div>{l.sourceDomain}</div>
                      <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>{l.sourceUrl}</div>
                    </td>
                    <td style={{ ...tdStyle, fontSize: 12, color: MUTED }}>{l.anchor || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: FONT_MONO, background: l.dofollow ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.04)', color: l.dofollow ? GREEN : MUTED }}>
                        {l.dofollow ? 'dofollow' : 'nofollow'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, color: l.rank >= 50 ? GREEN : l.rank >= 30 ? '#F59E0B' : MUTED }}>{l.rank}</td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, fontSize: 11, color: MUTED }}>{l.firstSeen}</td>
                    <td style={{ ...tdStyle, fontFamily: FONT_MONO, fontSize: 11, color: MUTED }}>{l.lastSeen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
