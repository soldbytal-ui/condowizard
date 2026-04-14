'use client';

import { useState, useEffect, useRef } from 'react';
import {
  callAI,
  loadScaleConfig,
  buildBrainPrompt,
  SCALE_BRAIN_STORAGE_KEY,
  ScaleModelConfig,
  ScaleChatMessage,
} from '@/lib/scale-ai';

// ─── Types ───
interface BrainEntry { id: string; text: string; active: boolean }
interface BrainCategory {
  id: string;
  label: string;
  icon: string;
  color: string;
  description: string;
  entries: BrainEntry[];
}
interface ChatMessage { role: 'user' | 'assistant'; text: string }

// ─── Default knowledge base categories ───
const DEFAULT_CATEGORIES: BrainCategory[] = [
  {
    id: 'tone',
    label: 'Tone & voice',
    icon: 'T',
    color: '#8B5CF6',
    description: 'How the agent should sound. Personality, energy level, formality.',
    entries: [
      { id: 't1', text: 'Write like a confident Toronto real estate insider — not salesy, not stiff. Think: knowledgeable friend who happens to sell condos.', active: true },
      { id: 't2', text: 'Use short punchy sentences for headlines. Longer flowing copy for descriptions. Never use exclamation marks in Google Ads.', active: true },
      { id: 't3', text: "Avoid generic phrases like 'luxury living', 'world-class amenities', 'state-of-the-art'. Be specific about what makes each project different.", active: true },
    ],
  },
  {
    id: 'legal',
    label: 'Legal & compliance',
    icon: 'L',
    color: '#EF4444',
    description: 'RECO requirements, disclaimers, brokerage info that must appear in every ad.',
    entries: [
      { id: 'l1', text: "Every ad must include brokerage identification: 'Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage'", active: true },
      { id: 'l2', text: "Never guarantee investment returns or appreciation. Use 'potential' or 'historically' when discussing value.", active: true },
      { id: 'l3', text: 'All pricing is approximate and subject to change. Include this disclaimer when showing specific price points.', active: true },
      { id: 'l4', text: 'RECO requires the brokerage name on all advertising. Rare Real Estate Inc. must appear. 1701 Avenue Rd, Toronto, ON M5M 3Y3.', active: true },
      { id: 'l5', text: 'Do not make claims about school rankings or crime statistics in ads — these are regulated claims in Ontario real estate advertising.', active: true },
    ],
  },
  {
    id: 'process',
    label: 'Processes & workflows',
    icon: 'P',
    color: '#0EA5E9',
    description: 'How campaigns should be structured, naming conventions, approval flows.',
    entries: [
      { id: 'p1', text: 'Google Search campaigns: always use exact match as primary, phrase match as secondary. Never broad match for pre-construction keywords.', active: true },
      { id: 'p2', text: 'Meta campaigns: always A/B test lifestyle angle vs investment angle. Run both for 7 days before picking a winner.', active: true },
      { id: 'p3', text: 'Campaign naming convention: [Channel]_[ProjectName]_[Variant]_[Date] — e.g. GSEARCH_KingToronto_A_2026-04', active: true },
      { id: 'p4', text: 'All lead gen forms must capture: Full Name, Email, Phone, Budget Range, Timeline to Purchase. Optional: Current Housing Situation.', active: true },
    ],
  },
  {
    id: 'brand',
    label: 'Brand & style',
    icon: 'B',
    color: '#F59E0B',
    description: 'Visual guidelines, preferred phrases, brand words, things to avoid.',
    entries: [
      { id: 'b1', text: 'CondoWizard brand colors: Blue #0066FF, Dark #1A1A2E, Green #10B981. Use blue as primary CTA color in display ads.', active: true },
      { id: 'b2', text: 'Landing page is always condowizard.ca/projects/[slug]. Never link to external developer sites in paid ads.', active: true },
      { id: 'b3', text: "Preferred CTA phrases: 'Register for VIP Access', 'Get Floor Plans & Pricing', 'Book Your Suite'. Avoid: 'Buy Now', 'Act Fast', 'Don't Miss Out'.", active: true },
    ],
  },
  {
    id: 'audience',
    label: 'Audience & targeting',
    icon: 'A',
    color: '#10B981',
    description: "Who we're targeting, demographics, psychographics, exclusions.",
    entries: [
      { id: 'a1', text: 'Primary audience: 28-45 year old professionals in the GTA earning $80K+. Mix of first-time buyers and investors.', active: true },
      { id: 'a2', text: 'Secondary audience: diaspora investors (Hong Kong, Middle East, South Asia) looking at Toronto as a safe market. Target with English + relevant language ads.', active: true },
      { id: 'a3', text: "Always exclude: people who just moved (< 6 months), current renters searching for apartments (they're not buying), real estate agents (competitors clicking our ads).", active: true },
    ],
  },
  {
    id: 'market',
    label: 'Market knowledge',
    icon: 'M',
    color: '#EC4899',
    description: 'Toronto market context, neighborhood insights, talking points the agent should know.',
    entries: [
      { id: 'm1', text: "Toronto average condo price downtown is ~$750K (2026). Use this as context when positioning projects as 'below market' or 'premium'.", active: true },
      { id: 'm2', text: 'Key selling points for GTA pre-construction: 10% deposit structure spread over 2-3 years, potential HST rebate on primary residence, assignment potential before closing.', active: true },
      { id: 'm3', text: 'Transit is a major selling point. Always mention nearest TTC subway station, streetcar line, or GO Transit station. Distance in minutes, not km.', active: true },
      { id: 'm4', text: 'Mention Walk Score / Transit Score when available. Toronto buyers care deeply about walkability.', active: true },
    ],
  },
  {
    id: 'banned',
    label: 'Banned words & phrases',
    icon: 'X',
    color: '#6B7280',
    description: 'Words and phrases the agent must never use.',
    entries: [
      { id: 'x1', text: "Never use: 'once in a lifetime', 'exclusive opportunity', 'guaranteed returns', 'hottest market', 'you can't afford to miss'", active: true },
      { id: 'x2', text: "Never use: 'cheap', 'affordable housing' (sounds negative), 'bargain', 'steal'. Use 'attainable' or 'well-priced' instead.", active: true },
      { id: 'x3', text: 'Never reference competitors by name (Strata, HouseSigma, Zoocasa) in ad copy.', active: true },
      { id: 'x4', text: "Never use 'crypto', 'bitcoin', 'NFT' or any web3 references in real estate ads.", active: true },
    ],
  },
];

// ─── Icons ───
const Plus = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>;
const Trash = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 4h10M5 4V3a1 1 0 011-1h2a1 1 0 011 1v1M4 4v8a1 1 0 001 1h4a1 1 0 001-1V4"/></svg>;
const Save = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M11 13H3a1 1 0 01-1-1V2a1 1 0 011-1h6l3 3v8a1 1 0 01-1 1z"/><path d="M9 13V8H5v5M5 1v3h3"/></svg>;
const Copy = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="4" y="4" width="8" height="8" rx="1.5"/><path d="M2 10V3a1 1 0 011-1h7"/></svg>;
const Eye = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"/><circle cx="7" cy="7" r="2"/></svg>;
const EyeOff = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 2l10 10M5.5 5.5a2 2 0 002.8 2.8M1 7s2-3.5 5-4M8.5 3.3C12 4.5 13 7 13 7s-2.5 4-6 4c-.8 0-1.5-.1-2.2-.4"/></svg>;
const Sparkle = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><path d="M7 0l1.5 4.5L13 6l-4.5 1.5L7 12l-1.5-4.5L1 6l4.5-1.5z" opacity="0.9"/></svg>;
const Chat = () => <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1z"/></svg>;

const S = {
  bg: '#0B0D11', surface: 'rgba(255,255,255,0.02)', surfaceHover: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)', borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF', accentSoft: 'rgba(0,102,255,0.08)', accentBorder: 'rgba(0,102,255,0.35)',
  green: '#10B981', greenSoft: 'rgba(16,185,129,0.1)',
  textPrimary: '#E2E4E9', textSecondary: '#8B8FA3', textMuted: '#555B67', textDim: '#3A3F4B', white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif", mono: "'JetBrains Mono', monospace",
};

export default function AgentBrain() {
  const [categories, setCategories] = useState<BrainCategory[]>(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<string>('tone');
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState('');
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState<ScaleModelConfig | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setConfig(loadScaleConfig());
    try {
      const raw = window.localStorage.getItem(SCALE_BRAIN_STORAGE_KEY);
      if (raw) {
        const loaded = JSON.parse(raw);
        if (Array.isArray(loaded) && loaded.length > 0) setCategories(loaded);
      }
    } catch {}
  }, []);

  const save = () => {
    try {
      window.localStorage.setItem(SCALE_BRAIN_STORAGE_KEY, JSON.stringify(categories));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        window.localStorage.setItem(SCALE_BRAIN_STORAGE_KEY, JSON.stringify(categories));
      } catch {}
    }, 800);
    return () => clearTimeout(timer);
  }, [categories]);

  const activeCat = categories.find((c) => c.id === activeCategory);
  const activeEntries = activeCat?.entries || [];

  const addEntry = () => {
    if (!newEntry.trim()) return;
    setCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory
          ? { ...c, entries: [...c.entries, { id: `${c.id}-${Date.now()}`, text: newEntry.trim(), active: true }] }
          : c
      )
    );
    setNewEntry('');
    textareaRef.current?.focus();
  };

  const deleteEntry = (entryId: string) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === activeCategory ? { ...c, entries: c.entries.filter((e) => e.id !== entryId) } : c))
    );
  };

  const toggleEntry = (entryId: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory
          ? { ...c, entries: c.entries.map((e) => (e.id === entryId ? { ...e, active: !e.active } : e)) }
          : c
      )
    );
  };

  const updateEntry = (entryId: string, newText: string) => {
    setCategories((prev) =>
      prev.map((c) =>
        c.id === activeCategory
          ? { ...c, entries: c.entries.map((e) => (e.id === entryId ? { ...e, text: newText } : e)) }
          : c
      )
    );
    setEditingEntry(null);
  };

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const id = newCategoryName.trim().toLowerCase().replace(/\s+/g, '_');
    setCategories((prev) => [
      ...prev,
      {
        id,
        label: newCategoryName.trim(),
        icon: newCategoryName.trim()[0].toUpperCase(),
        color: '#6366F1',
        description: '',
        entries: [],
      },
    ]);
    setActiveCategory(id);
    setNewCategoryName('');
    setShowNewCategory(false);
  };

  const deleteCategory = (catId: string) => {
    if (categories.length <= 1) return;
    setCategories((prev) => prev.filter((c) => c.id !== catId));
    if (activeCategory === catId) setActiveCategory(categories[0]?.id);
  };

  const brainPrompt = buildBrainPrompt(categories);

  const copyBrainPrompt = () => {
    navigator.clipboard?.writeText(brainPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading || !config) return;
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: userMsg }]);
    setChatLoading(true);

    try {
      const systemPrompt = `You are Scale's internal ad copy agent for CondoWizard.ca — a Toronto pre-construction condo platform operated by Tal Shelef, Sales Representative at Rare Real Estate Inc.

You have been trained with a knowledge base of rules, tone guidelines, legal requirements, and processes. Follow them strictly when generating any ad content, answering questions, or giving advice.
${brainPrompt}
When the user asks you to generate ad copy, test a headline, or review content, apply ALL active rules from your knowledge base. Be direct and helpful.`;

      const history: ScaleChatMessage[] = chatMessages.map((m) => ({
        role: m.role,
        content: m.text,
      }));
      const reply = await callAI(config, systemPrompt, userMsg, history);
      setChatMessages((prev) => [...prev, { role: 'assistant', text: reply || 'No response.' }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setChatMessages((prev) => [...prev, { role: 'assistant', text: `Error: ${message}` }]);
    }
    setChatLoading(false);
  };

  const totalEntries = categories.reduce((sum, c) => sum + c.entries.length, 0);
  const activeCount = categories.reduce((sum, c) => sum + c.entries.filter((e) => e.active).length, 0);

  return (
    <div style={{ color: S.textPrimary, fontFamily: S.font }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        .brain-card:hover { border-color: ${S.borderHover} !important; }
        .brain-entry:hover { background: ${S.surfaceHover} !important; }
        textarea:focus, input:focus { border-color: ${S.accent} !important; outline: none; }
        ::selection { background: rgba(0,102,255,0.3); }
      `}</style>

      {/* Page header */}
      <div style={{ padding: '24px 36px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>Agent brain</h1>
          <p style={{ fontSize: 14, color: S.textMuted, margin: '6px 0 0', lineHeight: 1.6 }}>Knowledge base injected into every AI call</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: S.textMuted, fontFamily: S.mono }}>{activeCount}/{totalEntries} rules active</span>
          <button onClick={() => setShowChat(!showChat)} style={{ padding: '10px 20px', borderRadius: 8, background: showChat ? S.accentSoft : S.surfaceHover, border: `1px solid ${showChat ? S.accentBorder : S.border}`, color: showChat ? S.accent : S.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Chat /> Test agent
          </button>
          <button onClick={() => setShowPreview(!showPreview)} style={{ padding: '10px 20px', borderRadius: 8, background: S.surfaceHover, border: `1px solid ${S.border}`, color: S.textSecondary, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Eye /> Preview prompt
          </button>
          <button onClick={save} style={{ padding: '10px 20px', borderRadius: 8, background: saved ? S.greenSoft : S.accent, border: 'none', color: S.white, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }}>
            <Save /> {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 60px - 71px)' }}>
        {/* Sidebar — categories */}
        <div style={{ width: 260, borderRight: `1px solid ${S.border}`, padding: '20px 14px', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: S.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, padding: '0 10px' }}>Categories</div>
          {categories.map((cat) => {
            const count = cat.entries.filter((e) => e.active).length;
            return (
              <div key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{
                  padding: '12px 14px', borderRadius: 9, cursor: 'pointer', marginBottom: 6,
                  background: activeCategory === cat.id ? S.accentSoft : 'transparent',
                  border: `1px solid ${activeCategory === cat.id ? S.accentBorder : 'transparent'}`,
                  transition: 'all 0.12s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${cat.color}20`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700 }}>{cat.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: activeCategory === cat.id ? S.white : S.textSecondary }}>{cat.label}</div>
                    <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{count} rule{count !== 1 ? 's' : ''} active</div>
                  </div>
                </div>
              </div>
            );
          })}
          {showNewCategory ? (
            <div style={{ padding: '8px 12px' }}>
              <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                placeholder="Category name..." autoFocus
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, background: S.surface, border: `1px solid ${S.border}`, color: S.textPrimary, fontSize: 12, fontFamily: S.font }} />
              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                <button onClick={addCategory} style={{ flex: 1, padding: '5px', borderRadius: 4, background: S.accent, border: 'none', color: S.white, fontSize: 11, cursor: 'pointer', fontFamily: S.font }}>Add</button>
                <button onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }} style={{ flex: 1, padding: '5px', borderRadius: 4, background: S.surfaceHover, border: `1px solid ${S.border}`, color: S.textMuted, fontSize: 11, cursor: 'pointer', fontFamily: S.font }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewCategory(true)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'transparent', border: `1px dashed ${S.border}`, color: S.textMuted, fontSize: 12, cursor: 'pointer', fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <Plus /> Add category
            </button>
          )}
        </div>

        {/* Main content — entries */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
          {activeCat && (
            <div style={{ animation: 'slideIn 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${activeCat.color}20`, color: activeCat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700 }}>{activeCat.icon}</div>
                    <h2 style={{ fontSize: 22, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.02em' }}>{activeCat.label}</h2>
                  </div>
                  {activeCat.description && <p style={{ fontSize: 15, color: '#6B7185', margin: 0, maxWidth: 560, lineHeight: 1.6 }}>{activeCat.description}</p>}
                </div>
                {categories.length > 1 && (
                  <button onClick={() => { if (confirm(`Delete "${activeCat.label}" and all its entries?`)) deleteCategory(activeCat.id); }}
                    style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', color: '#F87171', fontSize: 13, cursor: 'pointer', fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Trash /> Delete category
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {activeEntries.map((entry, i) => (
                  <div key={entry.id} className="brain-entry"
                    style={{
                      background: S.surface, border: `1px solid ${S.border}`, borderRadius: 11, padding: '18px 20px',
                      opacity: entry.active ? 1 : 0.4, transition: 'all 0.15s',
                      borderLeft: `3px solid ${entry.active ? activeCat.color : 'transparent'}`,
                    }}>
                    {editingEntry === entry.id ? (
                      <div>
                        <textarea
                          defaultValue={entry.text}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              updateEntry(entry.id, (e.target as HTMLTextAreaElement).value);
                            }
                            if (e.key === 'Escape') setEditingEntry(null);
                          }}
                          style={{ width: '100%', minHeight: 76, padding: '12px 14px', borderRadius: 8, background: S.surfaceHover, border: `1px solid ${S.accent}`, color: S.textPrimary, fontSize: 14, fontFamily: S.font, resize: 'vertical', lineHeight: 1.7 }}
                          autoFocus
                        />
                        <div style={{ fontSize: 12, color: S.textMuted, marginTop: 6 }}>Enter to save · Escape to cancel</div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                        <div onClick={() => setEditingEntry(entry.id)} style={{ flex: 1, cursor: 'text', fontSize: 14, color: '#C8CBD3', lineHeight: 1.7 }}>
                          <span style={{ color: S.textMuted, fontSize: 12, marginRight: 8, fontFamily: S.mono }}>{i + 1}.</span>
                          {entry.text}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => toggleEntry(entry.id)} title={entry.active ? 'Disable' : 'Enable'}
                            style={{ padding: 6, borderRadius: 5, background: 'transparent', border: 'none', color: entry.active ? S.green : S.textMuted, cursor: 'pointer' }}>
                            {entry.active ? <Eye /> : <EyeOff />}
                          </button>
                          <button onClick={() => deleteEntry(entry.id)} title="Delete"
                            style={{ padding: 6, borderRadius: 5, background: 'transparent', border: 'none', color: S.textMuted, cursor: 'pointer' }}>
                            <Trash />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new entry */}
              <div style={{ background: S.surface, border: `1px solid ${S.border}`, borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, color: S.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Add new rule</div>
                <textarea
                  ref={textareaRef}
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addEntry(); } }}
                  placeholder={`Teach the agent something about ${activeCat.label.toLowerCase()}...`}
                  style={{ width: '100%', minHeight: 64, padding: '14px 16px', borderRadius: 10, background: S.surfaceHover, border: `1px solid ${S.border}`, color: S.textPrimary, fontSize: 14, fontFamily: S.font, resize: 'vertical', lineHeight: 1.7 }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <span style={{ fontSize: 13, color: S.textMuted }}>Enter to add · Shift+Enter for new line</span>
                  <button onClick={addEntry} disabled={!newEntry.trim()}
                    style={{ padding: '10px 22px', borderRadius: 8, background: newEntry.trim() ? S.accent : S.surfaceHover, border: 'none', color: newEntry.trim() ? S.white : S.textDim, fontSize: 14, fontWeight: 600, cursor: newEntry.trim() ? 'pointer' : 'not-allowed', fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Plus /> Add rule
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prompt preview panel */}
        {showPreview && (
          <div style={{ width: 380, borderLeft: `1px solid ${S.border}`, overflowY: 'auto', animation: 'slideIn 0.2s ease', flexShrink: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: S.white }}>System prompt preview</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={copyBrainPrompt} style={{ padding: '4px 10px', borderRadius: 4, background: S.surfaceHover, border: `1px solid ${S.border}`, color: copied ? S.green : S.textSecondary, fontSize: 11, cursor: 'pointer', fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Copy /> {copied ? 'Copied!' : 'Copy'}
                </button>
                <button onClick={() => setShowPreview(false)} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 11, color: S.textMuted, marginBottom: 8 }}>Injected into every AI call Scale makes:</div>
              <pre style={{ fontSize: 11, color: '#C8CBD3', fontFamily: S.mono, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: S.surfaceHover, padding: 16, borderRadius: 8, border: `1px solid ${S.border}`, maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                {brainPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* Chat panel */}
        {showChat && (
          <div style={{ width: 400, borderLeft: `1px solid ${S.border}`, display: 'flex', flexDirection: 'column', animation: 'slideIn 0.2s ease', flexShrink: 0 }}>
            <div style={{ padding: '16px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 14, fontWeight: 600, color: S.white }}>Test agent</span>
                <div style={{ fontSize: 11, color: S.textMuted }}>Chat uses your knowledge base</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setChatMessages([])} style={{ padding: '4px 10px', borderRadius: 4, background: S.surfaceHover, border: `1px solid ${S.border}`, color: S.textSecondary, fontSize: 11, cursor: 'pointer', fontFamily: S.font }}>Clear</button>
                <button onClick={() => setShowChat(false)} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 16 }}>×</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {chatMessages.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: S.textMuted }}>
                  <div style={{ marginBottom: 12 }}><Sparkle /></div>
                  <div style={{ fontSize: 13, marginBottom: 16 }}>Test your agent with its knowledge base loaded. Try:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {['Write a Google headline for KING Toronto', "Review this copy: 'Luxury living awaits!'", 'What are the legal rules you follow?', 'Generate 5 Meta headlines for 429 Walmer'].map((q) => (
                      <button key={q} onClick={() => { setChatInput(q); chatInputRef.current?.focus(); }}
                        style={{ padding: '8px 12px', borderRadius: 6, background: S.surface, border: `1px solid ${S.border}`, color: '#C8CBD3', fontSize: 12, cursor: 'pointer', fontFamily: S.font, textAlign: 'left' }}>{q}</button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '85%', padding: '10px 14px', borderRadius: 10,
                    background: msg.role === 'user' ? S.accent : S.surface,
                    border: msg.role === 'user' ? 'none' : `1px solid ${S.border}`,
                    fontSize: 13, color: msg.role === 'user' ? S.white : '#C8CBD3',
                    lineHeight: 1.5, whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: 'flex', gap: 4, padding: '8px 14px' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: S.textMuted, animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
            </div>

            <div style={{ padding: '12px 20px', borderTop: `1px solid ${S.border}` }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={chatInputRef}
                  type="text" value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                  placeholder="Ask the agent something..."
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: S.surface, border: `1px solid ${S.border}`, color: S.textPrimary, fontSize: 13, fontFamily: S.font }}
                />
                <button onClick={sendChat} disabled={!chatInput.trim() || chatLoading}
                  style={{ padding: '10px 16px', borderRadius: 8, background: chatInput.trim() && !chatLoading ? S.accent : S.surfaceHover, border: 'none', color: chatInput.trim() && !chatLoading ? S.white : S.textDim, fontSize: 13, fontWeight: 600, cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'not-allowed', fontFamily: S.font }}>
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
