'use client';

import { useState } from 'react';

const INK   = '#0B0D11';
const INK2  = '#141414';
const INK3  = '#1A1D25';
const PAPER = '#F3F0E8';
const ACCENT = '#FF4A1C';
const ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const MUTED = '#8B8FA3';
const FONT_HEADING = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ─── Types ───
interface KeywordResult {
  keyword: string;
  volume: number;
  cpc: number;
  difficulty: number;
  intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational';
  trend: number[];
}

interface SerpResult {
  position: number;
  url: string;
  title: string;
  metaDescription: string;
  domainAuthority: number;
  backlinks: number;
}

interface TrackedKeyword {
  keyword: string;
  currentPosition: number;
  previousPosition: number;
  bestPosition: number;
  lastChecked: string;
}

interface CompetitorData {
  domain: string;
  topKeywords: { keyword: string; position: number; volume: number }[];
  backlinks: number;
  topPages: { url: string; traffic: number }[];
}

// ─── Sample data ───
const SEED_KEYWORDS: KeywordResult[] = [
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

const SEED_SERP: SerpResult[] = [
  { position: 1, url: 'https://condos.ca/toronto/pre-construction', title: 'Pre-Construction Condos in Toronto (2026) | Condos.ca', metaDescription: 'Browse 340+ new pre-construction condos in Toronto. Compare pricing, floor plans, and developers. Register for VIP access.', domainAuthority: 68, backlinks: 4200 },
  { position: 2, url: 'https://buzzbuzzhome.com/ca/toronto', title: 'New Condos in Toronto | BuzzBuzzHome', metaDescription: 'Find new condos for sale in Toronto. Explore pre-construction developments, pricing, photos & more.', domainAuthority: 64, backlinks: 3800 },
  { position: 3, url: 'https://www.zoocasa.com/toronto-on-pre-construction', title: 'Pre-Construction Condos & Homes in Toronto | Zoocasa', metaDescription: 'Search pre-construction condos in Toronto. View floor plans, pricing, neighborhood details.', domainAuthority: 62, backlinks: 3100 },
  { position: 4, url: 'https://precondo.ca/toronto/', title: 'Toronto Pre-Construction Condos 2026 | Precondo', metaDescription: 'Explore new pre-construction condo developments in Toronto. VIP access, floor plans, pricing.', domainAuthority: 55, backlinks: 1900 },
  { position: 5, url: 'https://www.livabl.com/toronto', title: 'Toronto New Construction & Pre-Construction Condos | Livabl', metaDescription: 'Browse new condos for sale in Toronto. Find pre-construction developments and filter by price.', domainAuthority: 53, backlinks: 1600 },
  { position: 6, url: 'https://www.realtor.ca/map', title: 'Pre-Construction Condos for Sale in Toronto | REALTOR.ca', metaDescription: 'Find pre-construction condos listed on REALTOR.ca.', domainAuthority: 82, backlinks: 12000 },
  { position: 7, url: 'https://newhomes.ca/toronto', title: 'New Homes & Pre-Construction in Toronto | NewHomes.ca', metaDescription: 'Discover new homes and pre-construction projects in Toronto. Compare pricing and register.', domainAuthority: 48, backlinks: 890 },
  { position: 8, url: 'https://condowizard.ca/new-condos', title: 'New Pre-Construction Condos Toronto 2026 | CondoWizard', metaDescription: 'Browse 340+ active pre-construction condos in Toronto. Data-driven insights, floor plans, pricing.', domainAuthority: 32, backlinks: 340 },
  { position: 9, url: 'https://www.storeys.com/toronto-pre-construction', title: 'Toronto Pre-Construction Condos | Storeys', metaDescription: 'Latest pre-construction condo launches in Toronto.', domainAuthority: 56, backlinks: 2100 },
  { position: 10, url: 'https://urbantoronto.ca/condos', title: 'Toronto Condo Projects | Urban Toronto', metaDescription: 'Database of Toronto condo projects in various stages of development.', domainAuthority: 58, backlinks: 2400 },
];

const TRACKED_KEYWORDS: TrackedKeyword[] = [
  { keyword: 'condowizard toronto', currentPosition: 4, previousPosition: 6, bestPosition: 3, lastChecked: '2026-04-14' },
  { keyword: 'toronto pre construction condos', currentPosition: 8, previousPosition: 9, bestPosition: 7, lastChecked: '2026-04-14' },
  { keyword: 'new condos toronto map', currentPosition: 5, previousPosition: 5, bestPosition: 4, lastChecked: '2026-04-14' },
  { keyword: 'pre construction condo data toronto', currentPosition: 3, previousPosition: 4, bestPosition: 2, lastChecked: '2026-04-14' },
  { keyword: 'toronto condo floor plans 2026', currentPosition: 11, previousPosition: 14, bestPosition: 9, lastChecked: '2026-04-14' },
];

const COMPETITOR_DATA: Record<string, CompetitorData> = {
  'condos.ca': {
    domain: 'condos.ca',
    topKeywords: [
      { keyword: 'toronto condos for sale', position: 1, volume: 5400 },
      { keyword: 'pre construction condos toronto', position: 1, volume: 2400 },
      { keyword: 'condos near me toronto', position: 2, volume: 1800 },
      { keyword: 'king west condos', position: 3, volume: 1600 },
      { keyword: 'yorkville condos', position: 2, volume: 1200 },
    ],
    backlinks: 42000,
    topPages: [
      { url: '/toronto/pre-construction', traffic: 18000 },
      { url: '/toronto/king-west', traffic: 4200 },
      { url: '/toronto/yorkville', traffic: 3600 },
    ],
  },
  'zoocasa.com': {
    domain: 'zoocasa.com',
    topKeywords: [
      { keyword: 'toronto homes for sale', position: 2, volume: 6800 },
      { keyword: 'pre construction toronto', position: 3, volume: 2400 },
      { keyword: 'toronto real estate', position: 4, volume: 8200 },
      { keyword: 'condos downtown toronto', position: 5, volume: 1400 },
      { keyword: 'toronto condo market', position: 3, volume: 900 },
    ],
    backlinks: 38000,
    topPages: [
      { url: '/toronto-on-real-estate', traffic: 22000 },
      { url: '/toronto-on-pre-construction', traffic: 5400 },
      { url: '/blog/toronto-market-report', traffic: 3100 },
    ],
  },
};

// ─── Mini Sparkline component ───
function Sparkline({ data, color = ACCENT }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 24;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Difficulty bar ───
function DifficultyBar({ score }: { score: number }) {
  const color = score <= 30 ? '#10B981' : score <= 60 ? '#F59E0B' : '#EF4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width: 48, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, borderRadius: 3, background: color }} />
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 12, color }}>{score}</span>
    </div>
  );
}

// ─── Intent badge ───
function IntentBadge({ intent }: { intent: string }) {
  const colors: Record<string, string> = {
    Informational: '#3B82F6', Commercial: '#F59E0B', Transactional: '#10B981', Navigational: '#8B5CF6',
  };
  const c = colors[intent] || MUTED;
  return (
    <span style={{
      display: 'inline-block', padding: '3px 8px', borderRadius: 6,
      background: `${c}18`, color: c, fontSize: 11, fontWeight: 600, fontFamily: FONT_MONO,
    }}>
      {intent}
    </span>
  );
}

type Tab = 'keywords' | 'serp' | 'rank' | 'competitor';

export default function IntelligencePage() {
  const [tab, setTab] = useState<Tab>('keywords');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(true); // Pre-populated
  const [serpQuery, setSerpQuery] = useState('toronto pre construction condos');
  const [competitorDomain, setCompetitorDomain] = useState('condos.ca');
  const [addedKeywords, setAddedKeywords] = useState<Set<string>>(new Set());

  const TABS: { id: Tab; label: string }[] = [
    { id: 'keywords', label: 'Keyword Research' },
    { id: 'serp', label: 'SERP Analysis' },
    { id: 'rank', label: 'Rank Tracker' },
    { id: 'competitor', label: 'Competitor Intel' },
  ];

  const compData = COMPETITOR_DATA[competitorDomain] ?? COMPETITOR_DATA['condos.ca'];

  return (
    <div style={{ padding: '28px 32px', fontFamily: FONT_BODY, color: PAPER, maxWidth: 1200, margin: '0 auto' }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .intel-row:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>

      <div style={{ animation: 'slideIn 0.25s ease' }}>
        <h1 style={{ fontFamily: FONT_HEADING, fontSize: 36, fontWeight: 400, letterSpacing: '-0.035em', margin: '0 0 8px', color: PAPER }}>
          Intelligence
        </h1>
        <p style={{ fontSize: 15, color: MUTED, margin: '0 0 28px', lineHeight: 1.6 }}>
          Keyword research, SERP analysis, and rank tracking powered by DataForSEO.
        </p>

        {/* Tab switcher */}
        <div style={{
          display: 'inline-flex', gap: 4, padding: 4, borderRadius: 10,
          background: INK2, marginBottom: 28, border: `1px solid ${LINE}`,
        }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: '8px 18px', borderRadius: 7, border: 'none',
                background: tab === t.id ? ACCENT : 'transparent',
                color: tab === t.id ? '#fff' : MUTED,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: FONT_BODY, transition: 'all 0.12s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ═══ KEYWORD RESEARCH TAB ═══ */}
        {tab === 'keywords' && (
          <div>
            {/* Search input */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && setHasSearched(true)}
                placeholder="Enter a keyword or topic..."
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 10,
                  background: INK2, border: `1px solid ${LINE}`, color: PAPER,
                  fontSize: 14, fontFamily: FONT_BODY, outline: 'none',
                }}
              />
              <button
                onClick={() => setHasSearched(true)}
                style={{
                  padding: '14px 28px', borderRadius: 10,
                  background: ACCENT, border: 'none', color: '#fff',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
                }}
              >
                Analyze
              </button>
            </div>

            {/* Seed keyword chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {['toronto pre-construction', 'king west condos', 'pre-construction downtown toronto'].map((chip) => (
                <button
                  key={chip}
                  onClick={() => { setSearchQuery(chip); setHasSearched(true); }}
                  style={{
                    padding: '6px 14px', borderRadius: 20,
                    background: ACCENT_DIM, border: `1px solid rgba(255,74,28,0.2)`,
                    color: ACCENT, fontSize: 12, cursor: 'pointer', fontFamily: FONT_MONO,
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* TODO: Connect to DataForSEO API — user will add API key in Settings */}

            {/* Results table */}
            {hasSearched && (
              <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                      {['Keyword', 'Volume', 'CPC', 'Difficulty', 'Intent', 'Trend', 'Action'].map((h) => (
                        <th key={h} style={{
                          padding: '12px 14px', textAlign: 'left',
                          fontFamily: FONT_MONO, fontSize: 10, textTransform: 'uppercase',
                          letterSpacing: '0.08em', color: MUTED, fontWeight: 600,
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SEED_KEYWORDS.map((kw) => (
                      <tr key={kw.keyword} className="intel-row" style={{ borderBottom: `1px solid ${LINE}`, transition: 'background 0.1s' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 500, color: PAPER }}>{kw.keyword}</td>
                        <td style={{ padding: '12px 14px', fontFamily: FONT_MONO, color: '#fff' }}>{kw.volume.toLocaleString()}</td>
                        <td style={{ padding: '12px 14px', fontFamily: FONT_MONO, color: MUTED }}>${kw.cpc.toFixed(2)}</td>
                        <td style={{ padding: '12px 14px' }}><DifficultyBar score={kw.difficulty} /></td>
                        <td style={{ padding: '12px 14px' }}><IntentBadge intent={kw.intent} /></td>
                        <td style={{ padding: '12px 14px' }}><Sparkline data={kw.trend} /></td>
                        <td style={{ padding: '12px 14px' }}>
                          <button
                            onClick={() => setAddedKeywords((s) => new Set(s).add(kw.keyword))}
                            disabled={addedKeywords.has(kw.keyword)}
                            style={{
                              padding: '5px 12px', borderRadius: 6,
                              background: addedKeywords.has(kw.keyword) ? 'rgba(16,185,129,0.12)' : ACCENT_DIM,
                              border: `1px solid ${addedKeywords.has(kw.keyword) ? 'rgba(16,185,129,0.3)' : 'rgba(255,74,28,0.2)'}`,
                              color: addedKeywords.has(kw.keyword) ? '#10B981' : ACCENT,
                              fontSize: 11, fontWeight: 600, cursor: addedKeywords.has(kw.keyword) ? 'default' : 'pointer',
                              fontFamily: FONT_MONO, whiteSpace: 'nowrap',
                            }}
                          >
                            {addedKeywords.has(kw.keyword) ? '✓ Added' : '+ Campaign'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ═══ SERP ANALYSIS TAB ═══ */}
        {tab === 'serp' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <input
                value={serpQuery}
                onChange={(e) => setSerpQuery(e.target.value)}
                placeholder="Enter a keyword to analyze SERPs..."
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 10,
                  background: INK2, border: `1px solid ${LINE}`, color: PAPER,
                  fontSize: 14, fontFamily: FONT_BODY, outline: 'none',
                }}
              />
              <button style={{
                padding: '14px 28px', borderRadius: 10,
                background: ACCENT, border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
              }}>
                Analyze SERP
              </button>
            </div>

            <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>
                  Top 10 results for &ldquo;{serpQuery}&rdquo;
                </span>
                <button style={{
                  padding: '6px 14px', borderRadius: 7, background: INK3,
                  border: `1px solid ${LINE}`, color: MUTED, fontSize: 11,
                  fontWeight: 600, cursor: 'pointer', fontFamily: FONT_MONO,
                }}>
                  Export SERP data
                </button>
              </div>
              {SEED_SERP.map((result) => (
                <div key={result.position} className="intel-row" style={{ padding: '14px 18px', borderBottom: `1px solid ${LINE}`, transition: 'background 0.1s' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 7,
                      background: result.url.includes('condowizard') ? ACCENT_DIM : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${result.url.includes('condowizard') ? 'rgba(255,74,28,0.3)' : LINE}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: FONT_MONO, fontSize: 11, fontWeight: 700,
                      color: result.url.includes('condowizard') ? ACCENT : MUTED, flexShrink: 0,
                    }}>
                      {result.position}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 3 }}>
                        {result.title}
                      </div>
                      <div style={{ fontSize: 12, color: '#10B981', fontFamily: FONT_MONO, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {result.url}
                      </div>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                        {result.metaDescription}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTED, marginBottom: 4 }}>
                        DA: <span style={{ color: '#fff' }}>{result.domainAuthority}</span>
                      </div>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTED }}>
                        Links: <span style={{ color: '#fff' }}>{result.backlinks.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ RANK TRACKER TAB ═══ */}
        {tab === 'rank' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>
                Tracking {TRACKED_KEYWORDS.length} keywords for condowizard.ca
              </div>
              <button style={{
                padding: '10px 20px', borderRadius: 9, background: ACCENT,
                border: 'none', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', fontFamily: FONT_BODY,
              }}>
                + Track keyword
              </button>
            </div>

            <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${LINE}` }}>
                    {['Keyword', 'Current', 'Previous', 'Best', 'Change', 'Last Checked'].map((h) => (
                      <th key={h} style={{
                        padding: '12px 14px', textAlign: 'left',
                        fontFamily: FONT_MONO, fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.08em', color: MUTED, fontWeight: 600,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRACKED_KEYWORDS.map((kw) => {
                    const change = kw.previousPosition - kw.currentPosition;
                    return (
                      <tr key={kw.keyword} className="intel-row" style={{ borderBottom: `1px solid ${LINE}` }}>
                        <td style={{ padding: '12px 14px', fontWeight: 500, color: PAPER }}>{kw.keyword}</td>
                        <td style={{ padding: '12px 14px', fontFamily: FONT_MONO, fontWeight: 700, color: '#fff', fontSize: 16 }}>#{kw.currentPosition}</td>
                        <td style={{ padding: '12px 14px', fontFamily: FONT_MONO, color: MUTED }}>#{kw.previousPosition}</td>
                        <td style={{ padding: '12px 14px', fontFamily: FONT_MONO, color: '#10B981' }}>#{kw.bestPosition}</td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            fontFamily: FONT_MONO, fontSize: 12, fontWeight: 600,
                            color: change > 0 ? '#10B981' : change < 0 ? '#EF4444' : MUTED,
                          }}>
                            {change > 0 ? `▲ ${change}` : change < 0 ? `▼ ${Math.abs(change)}` : '—'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>{kw.lastChecked}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Weekly rank chart placeholder */}
            <div style={{
              marginTop: 24, background: INK2, borderRadius: 14,
              border: `1px solid ${LINE}`, padding: 24, textAlign: 'center',
            }}>
              <div style={{ fontFamily: FONT_MONO, fontSize: 11, color: MUTED, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Weekly Rank Changes
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12, height: 120 }}>
                {[4, 6, 5, 3, 5, 8, 5, 4].map((v, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: 32, height: v * 12, borderRadius: 4,
                      background: `linear-gradient(180deg, ${ACCENT}, rgba(255,74,28,0.3))`,
                    }} />
                    <span style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED }}>W{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ COMPETITOR INTEL TAB ═══ */}
        {tab === 'competitor' && (
          <div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <input
                value={competitorDomain}
                onChange={(e) => setCompetitorDomain(e.target.value)}
                placeholder="Enter competitor domain..."
                style={{
                  flex: 1, padding: '14px 18px', borderRadius: 10,
                  background: INK2, border: `1px solid ${LINE}`, color: PAPER,
                  fontSize: 14, fontFamily: FONT_BODY, outline: 'none',
                }}
              />
              <button style={{
                padding: '14px 28px', borderRadius: 10,
                background: ACCENT, border: 'none', color: '#fff',
                fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
              }}>
                Analyze
              </button>
            </div>

            {/* Comparison targets */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {['condos.ca', 'zoocasa.com'].map((d) => (
                <button
                  key={d}
                  onClick={() => setCompetitorDomain(d)}
                  style={{
                    padding: '6px 14px', borderRadius: 20,
                    background: competitorDomain === d ? ACCENT_DIM : 'transparent',
                    border: `1px solid ${competitorDomain === d ? 'rgba(255,74,28,0.3)' : LINE}`,
                    color: competitorDomain === d ? ACCENT : MUTED,
                    fontSize: 12, cursor: 'pointer', fontFamily: FONT_MONO,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
              <div style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 18, textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_HEADING, fontSize: 28, color: '#fff' }}>{compData.backlinks.toLocaleString()}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 4, textTransform: 'uppercase' }}>Total Backlinks</div>
              </div>
              <div style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 18, textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_HEADING, fontSize: 28, color: '#fff' }}>{compData.topKeywords.length}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 4, textTransform: 'uppercase' }}>Top Keywords</div>
              </div>
              <div style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 18, textAlign: 'center' }}>
                <div style={{ fontFamily: FONT_HEADING, fontSize: 28, color: '#fff' }}>{compData.topPages.length}</div>
                <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 4, textTransform: 'uppercase' }}>Top Pages</div>
              </div>
            </div>

            {/* Top keywords */}
            <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden', marginBottom: 20 }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${LINE}`, fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Top Keywords — {compData.domain}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <tbody>
                  {compData.topKeywords.map((kw) => (
                    <tr key={kw.keyword} className="intel-row" style={{ borderBottom: `1px solid ${LINE}` }}>
                      <td style={{ padding: '10px 18px', fontWeight: 500, color: PAPER }}>{kw.keyword}</td>
                      <td style={{ padding: '10px 14px', fontFamily: FONT_MONO, color: '#10B981' }}>#{kw.position}</td>
                      <td style={{ padding: '10px 14px', fontFamily: FONT_MONO, color: MUTED }}>{kw.volume.toLocaleString()} vol</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top pages */}
            <div style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, overflow: 'hidden' }}>
              <div style={{ padding: '12px 18px', borderBottom: `1px solid ${LINE}`, fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Top Pages — {compData.domain}
              </div>
              {compData.topPages.map((page) => (
                <div key={page.url} className="intel-row" style={{ padding: '10px 18px', borderBottom: `1px solid ${LINE}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: '#10B981' }}>{page.url}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>{page.traffic.toLocaleString()} est. traffic/mo</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
