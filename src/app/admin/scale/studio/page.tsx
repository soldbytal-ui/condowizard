'use client';

import { useState, useRef, useEffect } from 'react';
import { callAIWithFallback, loadScaleConfig, buildBrainPrompt } from '@/lib/scale-ai';
import { useCredits, estimateCost } from '@/lib/scale-credits';

const INK   = '#0B0D11';
const INK2  = '#141720';
const INK3  = '#1A1D25';
const PAPER = '#E8E4DF';
const ACCENT = '#FF4A1C';
const ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE  = 'rgba(255,255,255,0.07)';
const MUTED = '#8B8FA3';
const FONT_HEADING = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const SEED_MESSAGES: ChatMessage[] = [
  { id: 'm1', role: 'user', content: 'Add a testimonials section to the homepage' },
  { id: 'm2', role: 'assistant', content: 'Adding testimonials section… I generated 3 testimonial cards using your existing styling. Authors are generic placeholders — swap with your real clients before publishing.\n\nFiles modified:\n• src/app/page.tsx — added TestimonialsSection component\n• src/components/home/Testimonials.tsx — new component\n\nEach card shows: photo, name, role, and a short quote. The layout uses a 3-column grid that collapses to a single column on mobile.' },
  { id: 'm3', role: 'user', content: 'Make the CTA button larger and change it to orange' },
];

const STUDIO_SYSTEM_PROMPT = `You are Scale Studio, an AI website editor for CondoWizard.ca — a Toronto pre-construction condo platform.

Describe code changes clearly but don't actually modify files yet — this is a preview feature. Always mention which files would be modified and offer to generate the actual diff.

When the user describes a change:
1. Acknowledge what you'll do
2. List the specific files that would be modified
3. Describe the changes in detail
4. Mention any considerations (responsive, accessibility, etc.)

Keep responses concise but thorough. Use bullet points for file changes.`;

export default function StudioPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(SEED_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true); // Start with typing indicator for seed
  const [creditsUsed, setCreditsUsed] = useState(47);
  const [cacheRate] = useState(92);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate typing for the last seed message
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', content: input.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const config = loadScaleConfig();
      const brain = buildBrainPrompt();
      const history = messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const response = await callAIWithFallback(config, STUDIO_SYSTEM_PROMPT + brain, userMsg.content, history);
      const cost = estimateCost('studio');
      useCredits(cost, `Studio edit: ${userMsg.content.slice(0, 60)}`);
      setCreditsUsed((c) => c + cost);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: response }]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'assistant', content: `Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: FONT_BODY, color: PAPER }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,80%,100% { transform:translateY(0); } 40% { transform:translateY(-4px); } }
      `}</style>

      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: `1px solid ${LINE}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 400, margin: 0, color: PAPER }}>
            Scale Studio
          </h1>
          <span style={{
            fontFamily: FONT_MONO, fontSize: 9, fontWeight: 700,
            padding: '3px 8px', borderRadius: 4,
            background: '#F59E0B', color: '#111',
            letterSpacing: '0.04em',
          }}>
            BETA
          </span>
        </div>
        <p style={{ fontSize: 13, color: MUTED, margin: '6px 0 0', lineHeight: 1.5 }}>
          Describe changes to condowizard.ca in plain English. Scale&apos;s engineering agent implements them. Review and deploy.
        </p>
      </div>

      {/* Two-panel layout */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* LEFT — Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${LINE}` }}>
          <div style={{ padding: '12px 18px', borderBottom: `1px solid ${LINE}`, fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Describe a change
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  padding: '10px 14px', borderRadius: 12,
                  background: msg.role === 'user' ? ACCENT : INK2,
                  color: msg.role === 'user' ? '#fff' : PAPER,
                  fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap',
                  border: msg.role === 'user' ? 'none' : `1px solid ${LINE}`,
                }}
              >
                {msg.content}
              </div>
            ))}

            {/* Typing indicator */}
            {loading && (
              <div style={{
                alignSelf: 'flex-start', padding: '10px 14px', borderRadius: 12,
                background: INK2, border: `1px solid ${LINE}`,
                display: 'flex', gap: 4, alignItems: 'center',
              }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: MUTED,
                    animation: `bounce 1.2s infinite ${i * 0.15}s`,
                  }} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '12px 18px', borderTop: `1px solid ${LINE}`, display: 'flex', gap: 10 }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Describe a change..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 9,
                background: INK2, border: `1px solid ${LINE}`, color: PAPER,
                fontSize: 13, fontFamily: FONT_BODY, outline: 'none',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                padding: '10px 20px', borderRadius: 9,
                background: ACCENT, border: 'none', color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: FONT_BODY, opacity: loading || !input.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>

        {/* RIGHT — Preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: INK3 }}>
          {/* Browser chrome */}
          <div style={{
            padding: '10px 16px', borderBottom: `1px solid ${LINE}`,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#F59E0B' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10B981' }} />
            </div>
            <div style={{
              flex: 1, padding: '5px 14px', borderRadius: 6,
              background: INK2, border: `1px solid ${LINE}`,
              fontFamily: FONT_MONO, fontSize: 11, color: MUTED,
            }}>
              condowizard.ca · preview
            </div>
          </div>

          {/* Fake preview */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            <div style={{
              background: INK, borderRadius: 12, border: `1px solid ${LINE}`,
              overflow: 'hidden',
            }}>
              {/* Hero */}
              <div style={{ padding: '40px 28px', textAlign: 'center', background: 'linear-gradient(180deg, #141720 0%, #0B0D11 100%)' }}>
                <div style={{ fontFamily: FONT_HEADING, fontSize: 14, color: ACCENT, marginBottom: 16, letterSpacing: '0.02em' }}>
                  CondoWizard
                </div>
                <h2 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 400, color: PAPER, margin: '0 0 10px', lineHeight: 1.3 }}>
                  Toronto pre-construction,<br />with the numbers to back it up.
                </h2>
                <p style={{ fontSize: 12, color: MUTED, margin: '0 0 20px', lineHeight: 1.5 }}>
                  Data-driven insights on 340+ active pre-construction<br />condos in the Greater Toronto Area.
                </p>
                <button style={{
                  padding: '10px 22px', borderRadius: 8,
                  background: ACCENT, border: 'none', color: '#fff',
                  fontSize: 13, fontWeight: 600, cursor: 'default', fontFamily: FONT_BODY,
                }}>
                  Browse projects →
                </button>
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: `1px solid ${LINE}` }}>
                {[
                  { num: '340+', label: 'Active projects' },
                  { num: '5.8%', label: 'Avg rental yield' },
                  { num: '$612K', label: 'Median price' },
                ].map((stat) => (
                  <div key={stat.label} style={{
                    padding: '18px 12px', textAlign: 'center',
                    borderRight: `1px solid ${LINE}`,
                  }}>
                    <div style={{ fontFamily: FONT_HEADING, fontSize: 20, color: '#fff', marginBottom: 4 }}>{stat.num}</div>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 9, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{
        padding: '12px 24px', borderTop: `1px solid ${LINE}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: INK2, flexShrink: 0,
      }}>
        <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>
          Session cost · <span style={{ color: PAPER }}>{creditsUsed} credits used</span> · <span style={{ color: '#10B981' }}>{cacheRate}% cached</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={{
            padding: '8px 18px', borderRadius: 8,
            background: 'transparent', border: `1px solid ${LINE}`,
            color: MUTED, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
          }}>
            Revert changes
          </button>
          <button style={{
            padding: '8px 18px', borderRadius: 8,
            background: ACCENT, border: 'none',
            color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY,
          }}>
            Deploy to production →
          </button>
        </div>
      </div>
    </div>
  );
}
