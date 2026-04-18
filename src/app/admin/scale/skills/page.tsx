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

type SkillCategory = 'all' | 'engineering' | 'marketing' | 'operations' | 'content' | 'real_estate';

interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  categoryLabel: string;
  icon: string;
  credits: number;
  tools: string;
  enabled: boolean;
}

const ALL_SKILLS: Skill[] = [
  // Engineering
  { id: 'repo-intel', name: 'repo-intel', description: 'Analyzes codebase structure, maps dependencies, and identifies patterns for context-aware code generation.', category: 'engineering', categoryLabel: 'Engineering', icon: 'R', credits: 5, tools: 'ast-parser, tree-sitter', enabled: true },
  { id: 'systematic-debugging', name: 'systematic-debugging', description: 'Structured bug finding and fixing using bisect, log analysis, and hypothesis testing.', category: 'engineering', categoryLabel: 'Engineering', icon: 'D', credits: 8, tools: 'debugger, log-parser', enabled: true },
  { id: 'test-driven-development', name: 'test-driven-development', description: 'Writes tests before code. Ensures coverage thresholds and regression-free deployments.', category: 'engineering', categoryLabel: 'Engineering', icon: 'T', credits: 10, tools: 'jest, vitest, playwright', enabled: false },
  { id: 'code-review', name: 'code-review', description: 'Reviews PRs with senior-level feedback on architecture, performance, security, and style.', category: 'engineering', categoryLabel: 'Engineering', icon: 'C', credits: 6, tools: 'github-api, diff-parser', enabled: true },

  // Marketing
  { id: 'google-ads-expert', name: 'google-ads-expert', description: 'Full Google Ads campaign knowledge — RSA, display, Performance Max, bid strategies, and quality score optimization.', category: 'marketing', categoryLabel: 'Content & Marketing', icon: 'G', credits: 12, tools: 'google-ads-api', enabled: true },
  { id: 'meta-ads-expert', name: 'meta-ads-expert', description: 'Meta platform best practices — lead gen forms, Advantage+, carousel, stories, and audience stacking.', category: 'marketing', categoryLabel: 'Content & Marketing', icon: 'M', credits: 12, tools: 'meta-marketing-api', enabled: true },
  { id: 'seo-content-writer', name: 'seo-content-writer', description: 'SEO-optimized content with keyword integration, schema markup, and internal linking strategy.', category: 'marketing', categoryLabel: 'Content & Marketing', icon: 'S', credits: 15, tools: 'dataforseo, serp-api', enabled: true },
  { id: 'real-estate-compliance', name: 'real-estate-compliance', description: 'RECO-compliant copy for Ontario real estate. Ensures brokerage disclosure, no guaranteed returns, and proper disclaimers.', category: 'marketing', categoryLabel: 'Content & Marketing', icon: 'R', credits: 8, tools: 'reco-rules-engine', enabled: true },
  { id: 'email-nurture-writer', name: 'email-nurture-writer', description: 'Drip sequence copywriting with CASL compliance, personalization tokens, and send-time optimization.', category: 'marketing', categoryLabel: 'Content & Marketing', icon: 'E', credits: 20, tools: 'mailchimp-api, hubspot-api', enabled: false },

  // Operations
  { id: 'orchestrate-review', name: 'orchestrate-review', description: 'Manages review cycles between agents. Routes approvals, tracks iterations, and enforces quality gates.', category: 'operations', categoryLabel: 'Operations', icon: 'O', credits: 4, tools: 'task-queue, approval-flow', enabled: true },
  { id: 'discover-tasks', name: 'discover-tasks', description: 'Scans project for work that needs doing. Identifies stale branches, open issues, and unfinished migrations.', category: 'operations', categoryLabel: 'Operations', icon: 'D', credits: 6, tools: 'github-api, jira-api', enabled: true },
  { id: 'lead-qualifier', name: 'lead-qualifier', description: 'Scores and routes incoming leads based on budget, timeline, location preferences, and engagement signals.', category: 'operations', categoryLabel: 'Operations', icon: 'L', credits: 3, tools: 'crm-api, scoring-model', enabled: true },
  { id: 'budget-optimizer', name: 'budget-optimizer', description: 'Reallocates ad spend to winners. Pauses underperformers, scales high-ROAS campaigns, and suggests bid adjustments.', category: 'operations', categoryLabel: 'Operations', icon: 'B', credits: 5, tools: 'google-ads-api, meta-api', enabled: false },

  // Content
  { id: 'brainstorming', name: 'brainstorming', description: 'Structured ideation sessions. Generates angles, hooks, and concepts for campaigns and content.', category: 'content', categoryLabel: 'Content', icon: 'B', credits: 4, tools: 'ideation-engine', enabled: true },
  { id: 'writing-plans', name: 'writing-plans', description: 'Creates content calendars and outlines. Maps topics to keywords, audience segments, and funnel stages.', category: 'content', categoryLabel: 'Content', icon: 'W', credits: 6, tools: 'calendar-api, keyword-db', enabled: true },
  { id: 'blog-post-writer', name: 'blog-post-writer', description: 'Full blog posts with SEO optimization, internal links, meta descriptions, and schema markup.', category: 'content', categoryLabel: 'Content', icon: 'B', credits: 18, tools: 'seo-engine, cms-api', enabled: false },
  { id: 'social-media-posts', name: 'social-media-posts', description: 'Platform-optimized social content. Tailors copy, hashtags, and CTAs for each social network.', category: 'content', categoryLabel: 'Content', icon: 'S', credits: 8, tools: 'social-apis', enabled: true },

  // Real Estate Specific
  { id: 'toronto-market-analyst', name: 'toronto-market-analyst', description: 'GTA market data and insights. Median prices, rental yields, absorption rates, and trend analysis by neighborhood.', category: 'real_estate', categoryLabel: 'Real Estate', icon: 'T', credits: 10, tools: 'repliers-api, treb-data', enabled: true },
  { id: 'pre-construction-copy', name: 'pre-construction-copy', description: 'Expert pre-con ad and content generation. Knows deposit structures, assignment clauses, and VIP access language.', category: 'real_estate', categoryLabel: 'Real Estate', icon: 'P', credits: 12, tools: 'project-db, brain-rules', enabled: true },
  { id: 'neighborhood-research', name: 'neighborhood-research', description: 'Deep neighborhood data for area pages. Transit scores, school ratings, demographics, amenities, and development pipeline.', category: 'real_estate', categoryLabel: 'Real Estate', icon: 'N', credits: 15, tools: 'dataforseo, census-api, walkscore', enabled: true },
];

const CATEGORIES: { id: SkillCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'marketing', label: 'Content & Marketing' },
  { id: 'operations', label: 'Operations' },
  { id: 'content', label: 'Content' },
  { id: 'real_estate', label: 'Real Estate' },
];

type SortMode = 'popular' | 'recent' | 'cost';

export default function SkillsPage() {
  const [category, setCategory] = useState<SkillCategory>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortMode>('popular');
  const [skills, setSkills] = useState(ALL_SKILLS);

  const toggleSkill = (id: string) => {
    setSkills((prev) => prev.map((s) => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const filtered = skills
    .filter((s) => category === 'all' || s.category === category)
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'cost') return a.credits - b.credits;
      if (sort === 'recent') return b.id.localeCompare(a.id); // proxy
      return Number(b.enabled) - Number(a.enabled); // popular = enabled first
    });

  const enabledCount = skills.filter((s) => s.enabled).length;

  return (
    <div style={{ padding: '0', fontFamily: FONT_BODY, color: PAPER, background: INK, minHeight: '100%' }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        .skill-card { transition: all 0.15s ease; }
        .skill-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-1px); }
      `}</style>

      {/* Banner */}
      <div style={{
        background: `linear-gradient(135deg, ${ACCENT} 0%, #FF8C42 50%, #FFB347 100%)`,
        padding: '40px 32px', color: '#fff',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', animation: 'slideIn 0.25s ease' }}>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 36, fontWeight: 400, margin: '0 0 8px', lineHeight: 1.2 }}>
            The <em style={{ fontStyle: 'italic' }}>Open</em> Agent Skills Ecosystem
          </h1>
          <p style={{ fontSize: 15, margin: '0 0 20px', opacity: 0.9, lineHeight: 1.6, maxWidth: 600 }}>
            Give your agents superpowers. Install pre-built workflows, knowledge modules, and integrations.
          </p>
          <div style={{ fontFamily: FONT_HEADING, fontSize: 40, fontWeight: 400 }}>
            {enabledCount} <span style={{ fontSize: 16, opacity: 0.8, fontFamily: FONT_BODY }}>skills installed</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto' }}>
        {/* Search + Sort */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            style={{
              flex: 1, minWidth: 200, padding: '10px 16px', borderRadius: 9,
              background: INK2, border: `1px solid ${LINE}`, color: PAPER,
              fontSize: 13, fontFamily: FONT_BODY, outline: 'none',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            {(['popular', 'recent', 'cost'] as SortMode[]).map((s) => (
              <button
                key={s}
                onClick={() => setSort(s)}
                style={{
                  padding: '8px 14px', borderRadius: 7, border: 'none',
                  background: sort === s ? ACCENT_DIM : 'transparent',
                  color: sort === s ? ACCENT : MUTED,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_MONO,
                  textTransform: 'capitalize',
                }}
              >
                {s === 'cost' ? 'Credit Cost' : s === 'recent' ? 'Recently Added' : 'Popular'}
              </button>
            ))}
          </div>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              style={{
                padding: '7px 16px', borderRadius: 20,
                background: category === cat.id ? ACCENT_DIM : 'transparent',
                border: `1px solid ${category === cat.id ? 'rgba(255,74,28,0.3)' : LINE}`,
                color: category === cat.id ? ACCENT : MUTED,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Skills grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map((skill) => (
            <div
              key={skill.id}
              className="skill-card"
              style={{
                background: INK2, borderRadius: 14, padding: 20,
                border: `1px solid ${LINE}`, position: 'relative',
              }}
            >
              {/* Icon + category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: ACCENT_DIM,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: FONT_HEADING, fontStyle: 'italic', fontSize: 16,
                  color: ACCENT,
                }}>
                  {skill.icon}
                </div>
                <span style={{
                  fontFamily: FONT_MONO, fontSize: 9, textTransform: 'uppercase',
                  letterSpacing: '0.08em', color: MUTED,
                }}>
                  {skill.categoryLabel}
                </span>
              </div>

              {/* Name + description */}
              <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
                {skill.name}
              </div>
              <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, marginBottom: 14, minHeight: 40 }}>
                {skill.description}
              </div>

              {/* Footer: tools + credits + toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED }}>{skill.tools}</span>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginLeft: 10 }}>
                    {skill.credits} credits/run
                  </span>
                </div>
                {/* Toggle */}
                <button
                  onClick={() => toggleSkill(skill.id)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none',
                    background: skill.enabled ? '#10B981' : 'rgba(255,255,255,0.08)',
                    cursor: 'pointer', position: 'relative', transition: 'background 0.15s',
                    flexShrink: 0,
                  }}
                >
                  <div style={{
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 3,
                    left: skill.enabled ? 21 : 3,
                    transition: 'left 0.15s',
                  }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
