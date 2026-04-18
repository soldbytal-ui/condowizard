'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  VOICE_TEMPLATES, VOICE_OPTIONS, TRIGGER_OPTIONS, INFO_FIELDS, COMPLIANCE_ITEMS,
  loadVoiceAgents, saveVoiceAgents, type VoiceAgent, type VoiceTemplate,
} from '@/lib/scale-voice-scripts';
import { isConnected as isIntegrationConnected } from '@/lib/scale-integrations';

// ─── Design tokens ───
const INK = '#0B0D11', INK2 = '#141414', INK3 = '#1A1D25';
const PAPER = '#F3F0E8', ACCENT = '#FF4A1C', ACCENT_DIM = 'rgba(255,74,28,0.10)';
const LINE = 'rgba(255,255,255,0.07)', MUTED = '#8B8FA3', GREEN = '#10B981';
const FH = "'Fraunces', Georgia, serif", FB = "'Inter Tight', -apple-system, sans-serif", FM = "'JetBrains Mono', monospace";

const btn1: React.CSSProperties = { padding: '10px 22px', borderRadius: 9, background: ACCENT, border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB };
const btn2: React.CSSProperties = { padding: '8px 18px', borderRadius: 8, background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FB };
const inp: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 9, background: INK3, border: `1px solid ${LINE}`, color: PAPER, fontSize: 13, fontFamily: FB, outline: 'none' };

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function VoiceAgentsPage() {
  const [agents, setAgents] = useState<VoiceAgent[]>([]);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [vapiConnected, setVapiConnected] = useState(false);

  useEffect(() => {
    setAgents(loadVoiceAgents());
    setVapiConnected(isIntegrationConnected('vapi'));
  }, []);

  const persist = useCallback((next: VoiceAgent[]) => { setAgents(next); saveVoiceAgents(next); }, []);

  const toggleStatus = (id: string) => {
    persist(agents.map((a) => a.id === id ? { ...a, status: a.status === 'active' ? 'paused' as const : 'active' as const } : a));
  };

  const deleteAgent = (id: string) => {
    persist(agents.filter((a) => a.id !== id));
  };

  const activeCount = agents.filter((a) => a.status === 'active').length;
  const totalCalls = agents.reduce((s, a) => s + a.callsMade, 0);
  const avgDur = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.avgDuration, 0) / agents.length) : 0;
  const avgSuccess = agents.length > 0 ? Math.round(agents.reduce((s, a) => s + a.successRate, 0) / agents.length) : 0;

  return (
    <div style={{ fontFamily: FB, color: PAPER, background: INK, minHeight: '100%' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .va-card { transition: all 0.15s; }
        .va-card:hover { border-color: rgba(255,255,255,0.12) !important; transform: translateY(-1px); }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: 1200, margin: '0 auto', animation: 'fadeIn 0.25s ease' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: FH, fontSize: 32, fontWeight: 400, letterSpacing: '-0.03em', margin: '0 0 8px', color: PAPER }}>Voice Agents</h1>
            <p style={{ fontSize: 14, color: MUTED, margin: 0, lineHeight: 1.6, maxWidth: 600 }}>
              AI agents that call leads for you. Qualify inbound leads, confirm showings, re-engage cold leads — all without lifting a finger.
            </p>
          </div>
          <button onClick={() => setWizardOpen(true)} style={btn1}>+ Create voice agent</button>
        </div>

        {!vapiConnected && (
          <div style={{ background: INK2, borderRadius: 12, border: `1px solid ${LINE}`, padding: 16, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, color: MUTED }}>Connect Vapi.ai in Settings to create and deploy voice agents.</div>
            <a href="/admin/scale/settings" style={{ fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: FM, textDecoration: 'none' }}>SETTINGS →</a>
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Active agents', value: String(activeCount) },
            { label: 'Calls made', value: String(totalCalls) },
            { label: 'Avg duration', value: avgDur > 0 ? `${Math.floor(avgDur / 60)}m ${avgDur % 60}s` : '—' },
            { label: 'Booking rate', value: avgSuccess > 0 ? `${avgSuccess}%` : '—' },
          ].map((s) => (
            <div key={s.label} style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 20, textAlign: 'center' }}>
              <div style={{ fontFamily: FH, fontSize: 28, fontWeight: 400, color: PAPER, letterSpacing: '-0.03em' }}>{s.value}</div>
              <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Agent grid */}
        {agents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📞</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: PAPER, marginBottom: 6 }}>No voice agents yet</div>
            <div style={{ fontSize: 13, marginBottom: 20 }}>Create your first AI caller to start qualifying leads automatically.</div>
            <button onClick={() => setWizardOpen(true)} style={btn1}>+ Create voice agent</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {agents.map((agent) => {
              const tpl = VOICE_TEMPLATES.find((t) => t.id === agent.templateId);
              const voice = VOICE_OPTIONS.find((v) => v.id === agent.voiceId);
              return (
                <div key={agent.id} className="va-card" style={{ background: INK2, borderRadius: 14, border: `1px solid ${LINE}`, padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${ACCENT}, #FF8C42)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FH, fontSize: 18, fontStyle: 'italic', color: '#fff', flexShrink: 0 }}>
                      {tpl?.icon || 'V'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: FH, fontSize: 18, fontWeight: 400, color: PAPER, letterSpacing: '-0.02em' }}>{agent.name}</div>
                      <div style={{ fontSize: 11, color: MUTED }}>{tpl?.description || 'Custom voice agent'}</div>
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: FM, color: agent.status === 'active' ? GREEN : MUTED }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: agent.status === 'active' ? GREEN : MUTED }} />
                      {agent.status === 'active' ? 'Active' : 'Paused'}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {[
                      { label: 'Calls', value: String(agent.callsMade) },
                      { label: 'Avg', value: agent.avgDuration > 0 ? `${Math.floor(agent.avgDuration / 60)}m` : '—' },
                      { label: 'Success', value: agent.successRate > 0 ? `${agent.successRate}%` : '—' },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: 'center', padding: '6px 0' }}>
                        <div style={{ fontFamily: FM, fontSize: 14, fontWeight: 600, color: PAPER }}>{s.value}</div>
                        <div style={{ fontFamily: FM, fontSize: 9, color: MUTED, textTransform: 'uppercase' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: MUTED }}>
                    Voice: {voice?.name || 'Default'} · Trigger: {TRIGGER_OPTIONS.find((t) => t.id === agent.trigger)?.label?.split(' ').slice(0, 3).join(' ') || agent.trigger}
                  </div>

                  {agent.lastCallAt && (
                    <div style={{ fontFamily: FM, fontSize: 10, color: MUTED }}>Last call: {new Date(agent.lastCallAt).toLocaleDateString()}</div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button onClick={() => toggleStatus(agent.id)} style={{ ...btn2, flex: 1, fontSize: 11 }}>
                      {agent.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => deleteAgent(agent.id)} style={{ ...btn2, flex: 1, fontSize: 11, color: '#EF4444', borderColor: 'rgba(239,68,68,0.3)' }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {wizardOpen && (
        <CreateWizard
          onClose={() => setWizardOpen(false)}
          onCreated={(agent) => { persist([...agents, agent]); setWizardOpen(false); }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Create Wizard
// ═══════════════════════════════════════════════════════════════
function CreateWizard({ onClose, onCreated }: { onClose: () => void; onCreated: (a: VoiceAgent) => void }) {
  const [step, setStep] = useState(1);
  const totalSteps = 7;

  // Step 1: Template
  const [templateId, setTemplateId] = useState('');
  // Step 2: Profile
  const [name, setName] = useState('');
  const [voiceId, setVoiceId] = useState(VOICE_OPTIONS[0].id);
  // Step 3: System prompt
  const [systemPrompt, setSystemPrompt] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  // Step 4: Info fields
  const [infoFields, setInfoFields] = useState<Set<string>>(new Set());
  // Step 5: Objections
  const [objections, setObjections] = useState<Array<{ objection: string; response: string }>>([]);
  // Step 6: Trigger
  const [trigger, setTrigger] = useState('manual');
  const [maxDuration, setMaxDuration] = useState(300);
  // Step 7: Compliance
  const [compliance, setCompliance] = useState<Set<number>>(new Set());
  const [creating, setCreating] = useState(false);

  const selectTemplate = (tpl: VoiceTemplate) => {
    setTemplateId(tpl.id);
    setName(tpl.name === 'Custom' ? '' : `${tpl.name} AI`);
    setSystemPrompt(tpl.systemPrompt);
    setFirstMessage(tpl.firstMessage);
    setInfoFields(new Set(tpl.informationToCollect));
    setObjections([...tpl.objectionHandlers]);
    setMaxDuration(tpl.maxDuration);
    setStep(2);
  };

  const voiceName = VOICE_OPTIONS.find((v) => v.id === voiceId)?.name || 'Default';
  const allCompliance = compliance.size === COMPLIANCE_ITEMS.length;

  const handleCreate = async () => {
    setCreating(true);
    // Try to create on Vapi if connected
    let vapiAssistantId: string | null = null;
    try {
      const raw = localStorage.getItem('scale-integrations');
      const vapi = raw ? JSON.parse(raw).vapi : null;
      if (vapi?.privateKey) {
        const res = await fetch('/api/admin/scale/voice-agents/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            vapiPrivateKey: vapi.privateKey,
            config: { name, voiceId, systemPrompt, firstMessage, maxDuration },
          }),
        });
        const data = await res.json();
        if (data.success) vapiAssistantId = data.assistant?.id || null;
      }
    } catch { /* best effort */ }

    const agent: VoiceAgent = {
      id: uid(),
      name: name || 'Voice Agent',
      templateId,
      voiceId,
      voiceName,
      systemPrompt,
      firstMessage,
      trigger,
      maxDuration,
      status: 'active',
      vapiAssistantId,
      callsMade: 0,
      avgDuration: 0,
      successRate: 0,
      lastCallAt: null,
      createdAt: new Date().toISOString(),
    };
    onCreated(agent);
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FB }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: INK2, border: `1px solid ${LINE}`, borderRadius: 20, width: 680, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', padding: 32, color: PAPER, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: MUTED, fontSize: 20, cursor: 'pointer', padding: 8 }}>×</button>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? ACCENT : 'rgba(255,255,255,0.06)' }} />
          ))}
        </div>

        {/* ── STEP 1: Template ── */}
        {step === 1 && (
          <div>
            <h2 style={{ fontFamily: FH, fontSize: 24, fontWeight: 400, margin: '0 0 6px', color: PAPER }}>Choose a template</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>Pre-built scripts optimized for real estate. Or start custom.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {VOICE_TEMPLATES.map((tpl) => (
                <button key={tpl.id} onClick={() => selectTemplate(tpl)} style={{
                  background: INK3, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16,
                  textAlign: 'left', cursor: 'pointer', color: PAPER, display: 'flex', gap: 12, alignItems: 'flex-start',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: ACCENT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FH, fontSize: 16, fontStyle: 'italic', color: ACCENT, flexShrink: 0 }}>
                    {tpl.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{tpl.name}</div>
                    <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.4 }}>{tpl.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Profile ── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontFamily: FH, fontSize: 24, fontWeight: 400, margin: '0 0 6px' }}>Agent profile</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 20px' }}>Name your agent and choose a voice.</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>Agent name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lead Qualifier AI" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 10 }}>Voice (ElevenLabs)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                {VOICE_OPTIONS.map((v) => (
                  <button key={v.id} onClick={() => setVoiceId(v.id)} style={{
                    background: voiceId === v.id ? ACCENT_DIM : INK3, border: `1px solid ${voiceId === v.id ? ACCENT : LINE}`,
                    borderRadius: 10, padding: '10px 14px', textAlign: 'left', cursor: 'pointer', color: PAPER,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: v.gender === 'F' ? 'rgba(236,72,153,0.12)' : 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: v.gender === 'F' ? '#EC4899' : '#3B82F6', fontFamily: FM, fontWeight: 700, flexShrink: 0 }}>
                      {v.gender}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{v.name}</div>
                      <div style={{ fontSize: 10, color: MUTED }}>{v.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setStep(1)} style={btn2}>Back</button>
              <button onClick={() => setStep(3)} disabled={!name.trim()} style={{ ...btn1, opacity: name.trim() ? 1 : 0.5 }}>Next</button>
            </div>
          </div>
        )}

        {/* ── STEP 3: System prompt ── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontFamily: FH, fontSize: 24, fontWeight: 400, margin: '0 0 6px' }}>Script & instructions</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>Edit the system prompt that controls your agent&apos;s behavior.</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>First message (opener)</label>
              <textarea value={firstMessage} onChange={(e) => setFirstMessage(e.target.value)} rows={2} style={{ ...inp, resize: 'vertical' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>System prompt</label>
              <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={12} style={{ ...inp, resize: 'vertical', fontFamily: FM, fontSize: 12, lineHeight: 1.6 }} />
            </div>
            <div style={{ fontSize: 10, color: MUTED, marginTop: 8 }}>
              Variables: {'{leadName}'}, {'{projectName}'}, {'{neighborhood}'}, {'{budget}'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setStep(2)} style={btn2}>Back</button>
              <button onClick={() => setStep(4)} style={btn1}>Next</button>
            </div>
          </div>
        )}

        {/* ── STEP 4: Information to collect ── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontFamily: FH, fontSize: 24, fontWeight: 400, margin: '0 0 6px' }}>Information to collect</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>What should the agent actively ask about?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {INFO_FIELDS.map((f) => (
                <label key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, background: infoFields.has(f.id) ? ACCENT_DIM : INK3, border: `1px solid ${infoFields.has(f.id) ? 'rgba(255,74,28,0.2)' : LINE}`, cursor: 'pointer' }}>
                  <input type="checkbox" checked={infoFields.has(f.id)} onChange={() => {
                    const next = new Set(infoFields);
                    next.has(f.id) ? next.delete(f.id) : next.add(f.id);
                    setInfoFields(next);
                  }} style={{ accentColor: ACCENT }} />
                  <span style={{ fontSize: 13, color: PAPER }}>{f.label}</span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setStep(3)} style={btn2}>Back</button>
              <button onClick={() => setStep(5)} style={btn1}>Next</button>
            </div>
          </div>
        )}

        {/* ── STEP 5: Objection handling ── */}
        {step === 5 && (
          <div>
            <h2 style={{ fontFamily: FH, fontSize: 24, fontWeight: 400, margin: '0 0 6px' }}>Objection handling</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>How should the agent handle common pushbacks?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {objections.map((obj, i) => (
                <div key={i} style={{ background: INK3, borderRadius: 10, border: `1px solid ${LINE}`, padding: 14 }}>
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Lead says:</div>
                  <input value={obj.objection} onChange={(e) => { const n = [...objections]; n[i] = { ...n[i], objection: e.target.value }; setObjections(n); }} style={{ ...inp, marginBottom: 8, fontSize: 12 }} />
                  <div style={{ fontSize: 12, color: MUTED, marginBottom: 6 }}>Agent responds:</div>
                  <textarea value={obj.response} onChange={(e) => { const n = [...objections]; n[i] = { ...n[i], response: e.target.value }; setObjections(n); }} rows={2} style={{ ...inp, fontSize: 12, resize: 'vertical' }} />
                </div>
              ))}
              <button onClick={() => setObjections([...objections, { objection: '', response: '' }])} style={{ ...btn2, alignSelf: 'flex-start' }}>+ Add objection</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setStep(4)} style={btn2}>Back</button>
              <button onClick={() => setStep(6)} style={btn1}>Next</button>
            </div>
          </div>
        )}

        {/* ── STEP 6: Triggers ── */}
        {step === 6 && (
          <div>
            <h2 style={{ fontFamily: FH, fontSize: 24, fontWeight: 400, margin: '0 0 6px' }}>Triggers & schedule</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>When should this agent make calls?</p>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>Trigger</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TRIGGER_OPTIONS.map((t) => (
                  <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: trigger === t.id ? ACCENT_DIM : INK3, border: `1px solid ${trigger === t.id ? 'rgba(255,74,28,0.25)' : LINE}`, cursor: 'pointer' }}>
                    <input type="radio" name="trigger" checked={trigger === t.id} onChange={() => setTrigger(t.id)} style={{ accentColor: ACCENT }} />
                    <span style={{ fontSize: 13, color: PAPER }}>{t.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>Max call duration (seconds)</label>
              <input type="number" value={maxDuration} onChange={(e) => setMaxDuration(Number(e.target.value))} min={60} max={600} style={{ ...inp, width: 160 }} />
              <span style={{ fontSize: 11, color: MUTED, marginLeft: 8 }}>{Math.floor(maxDuration / 60)}m {maxDuration % 60}s</span>
            </div>
            <div style={{ background: INK3, borderRadius: 10, border: `1px solid ${LINE}`, padding: 14, fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
              Calling hours: 9am – 8pm local time · Max attempts: 3 (2h, then 24h) · Respect Do Not Call lists
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button onClick={() => setStep(5)} style={btn2}>Back</button>
              <button onClick={() => setStep(7)} style={btn1}>Next</button>
            </div>
          </div>
        )}

        {/* ── STEP 7: Compliance & Launch ── */}
        {step === 7 && (
          <div>
            <h2 style={{ fontFamily: FH, fontSize: 24, fontWeight: 400, margin: '0 0 6px' }}>Compliance & launch</h2>
            <p style={{ fontSize: 13, color: MUTED, margin: '0 0 16px' }}>Review and accept the compliance requirements before activating.</p>

            {/* Summary */}
            <div style={{ background: INK3, borderRadius: 12, border: `1px solid ${LINE}`, padding: 16, marginBottom: 20 }}>
              <div style={{ fontFamily: FM, fontSize: 10, color: MUTED, textTransform: 'uppercase', marginBottom: 10 }}>AGENT SUMMARY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13 }}>
                <div><span style={{ color: MUTED }}>Name:</span> <span style={{ color: PAPER, fontWeight: 600 }}>{name}</span></div>
                <div><span style={{ color: MUTED }}>Voice:</span> <span style={{ color: PAPER }}>{voiceName}</span></div>
                <div><span style={{ color: MUTED }}>Template:</span> <span style={{ color: PAPER }}>{VOICE_TEMPLATES.find((t) => t.id === templateId)?.name || 'Custom'}</span></div>
                <div><span style={{ color: MUTED }}>Trigger:</span> <span style={{ color: PAPER }}>{TRIGGER_OPTIONS.find((t) => t.id === trigger)?.label?.split(' ').slice(0, 4).join(' ')}</span></div>
                <div><span style={{ color: MUTED }}>Max duration:</span> <span style={{ color: PAPER }}>{Math.floor(maxDuration / 60)}m</span></div>
                <div><span style={{ color: MUTED }}>Fields:</span> <span style={{ color: PAPER }}>{infoFields.size} items</span></div>
              </div>
            </div>

            {/* Cost estimate */}
            <div style={{ background: 'rgba(255,74,28,0.06)', borderRadius: 10, border: '1px solid rgba(255,74,28,0.15)', padding: 14, marginBottom: 20, fontSize: 12, color: MUTED }}>
              <strong style={{ color: PAPER }}>Cost estimate:</strong> Average call ≈ $0.65 · At 20 calls/day ≈ $13/day · ~35 credits per call
            </div>

            {/* Compliance checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
              {COMPLIANCE_ITEMS.map((item, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: compliance.has(i) ? 'rgba(16,185,129,0.06)' : INK3, border: `1px solid ${compliance.has(i) ? 'rgba(16,185,129,0.2)' : LINE}`, cursor: 'pointer' }}>
                  <input type="checkbox" checked={compliance.has(i)} onChange={() => {
                    const n = new Set(compliance);
                    n.has(i) ? n.delete(i) : n.add(i);
                    setCompliance(n);
                  }} style={{ accentColor: GREEN, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: PAPER, lineHeight: 1.5 }}>{item}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setStep(6)} style={btn2}>Back</button>
              <button onClick={handleCreate} disabled={!allCompliance || creating} style={{ ...btn1, background: allCompliance && !creating ? GREEN : 'rgba(255,255,255,0.05)', color: allCompliance && !creating ? '#fff' : MUTED, cursor: allCompliance && !creating ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: 8 }}>
                {creating ? (
                  <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} /> Creating...</>
                ) : (
                  'Activate Agent'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
