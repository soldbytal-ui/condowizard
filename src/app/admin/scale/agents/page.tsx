'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Agent, AgentStatus, AgentTask, AgentTool, AuditEntry, HeartbeatSchedule,
  TaskPriority, TaskStatus,
  ALL_TOOLS, HEARTBEAT_LABELS,
  loadAgents, saveAgents, loadTasks, saveTasks, loadAudit, appendAudit,
  ensureSeeded, isHeartbeatDue, nextHeartbeatDue,
  runHeartbeat, uid,
  totalCompletedTasks, totalInProgressTasks, totalSpend,
} from '@/lib/scale-agents';
import { loadScaleConfig, ScaleModelConfig } from '@/lib/scale-ai';

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
  surfaceInner: 'rgba(255,255,255,0.04)',
  border: 'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#0066FF',
  accentSoft: 'rgba(0,102,255,0.14)',
  accentBorder: 'rgba(0,102,255,0.4)',
  green: '#10B981',
  greenSoft: 'rgba(16,185,129,0.14)',
  amber: '#F59E0B',
  amberSoft: 'rgba(245,158,11,0.14)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.14)',
  textPrimary: '#E2E4E9',
  textSecondary: '#8B8FA3',
  textMuted: '#6B7185',
  white: '#fff',
  font: "'DM Sans', -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
};
const CARD_SHADOW = '0 2px 12px rgba(0,0,0,0.08)';

// ═══════════════════════════════════════════════════════════════
// Status + priority styling
// ═══════════════════════════════════════════════════════════════
const STATUS_COLORS: Record<AgentStatus, { dot: string; label: string }> = {
  active:   { dot: S.green,                  label: 'Active' },
  paused:   { dot: S.amber,                  label: 'Paused' },
  inactive: { dot: 'rgba(255,255,255,0.3)',  label: 'Inactive' },
};

const TASK_STATUS_COLORS: Record<TaskStatus, { bg: string; color: string; border: string; label: string }> = {
  queued:          { bg: 'rgba(255,255,255,0.05)', color: S.textSecondary, border: S.border,              label: 'Queued' },
  in_progress:     { bg: S.accentSoft,              color: '#93C5FD',      border: S.accentBorder,         label: 'In Progress' },
  completed:       { bg: S.greenSoft,               color: S.green,        border: 'rgba(16,185,129,0.4)', label: 'Completed' },
  failed:          { bg: S.redSoft,                 color: S.red,          border: 'rgba(239,68,68,0.4)',  label: 'Failed' },
  needs_approval:  { bg: S.amberSoft,               color: '#FCD34D',      border: 'rgba(245,158,11,0.4)', label: 'Needs Approval' },
};

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    '#6B7185',
  medium: '#0066FF',
  high:   '#F59E0B',
  urgent: '#EF4444',
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function agentInitials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join('') || '?';
}

function agentColor(id: string): string {
  const palette = ['#0066FF', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#F43F5E'];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

// ═══════════════════════════════════════════════════════════════
// Main page
// ═══════════════════════════════════════════════════════════════
export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [config, setConfig] = useState<ScaleModelConfig | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [view, setView] = useState<'org' | 'grid'>('org');
  const [addOpen, setAddOpen] = useState(false);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [newTaskOpen, setNewTaskOpen] = useState(false);

  // Task-queue filters
  const [taskFilterAgent, setTaskFilterAgent] = useState<string>('all');
  const [taskFilterStatus, setTaskFilterStatus] = useState<string>('all');
  const [taskFilterPriority, setTaskFilterPriority] = useState<string>('all');

  // Heartbeat state
  const [heartbeatingId, setHeartbeatingId] = useState<string | null>(null);
  const [heartbeatFlash, setHeartbeatFlash] = useState<{ kind: 'ok' | 'err'; message: string } | null>(null);

  // Initial load — seed if empty
  useEffect(() => {
    const { agents, tasks } = ensureSeeded();
    setAgents(agents);
    setTasks(tasks);
    setAudit(loadAudit());
    setConfig(loadScaleConfig());
    setHydrated(true);
  }, []);

  const refresh = useCallback(() => {
    setAgents(loadAgents());
    setTasks(loadTasks());
    setAudit(loadAudit());
  }, []);

  // ── Derived stats ──────────────────────────────────────────
  const activeAgentCount = agents.filter((a) => a.status === 'active').length;
  const completed = totalCompletedTasks(tasks);
  const inProgress = totalInProgressTasks(tasks);
  const spend = totalSpend(agents);
  const dueNow = agents.filter(isHeartbeatDue);

  const activeAgent = useMemo(
    () => agents.find((a) => a.id === activeAgentId) || null,
    [agents, activeAgentId]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskFilterAgent !== 'all' && t.assignedTo !== taskFilterAgent) return false;
      if (taskFilterStatus !== 'all' && t.status !== taskFilterStatus) return false;
      if (taskFilterPriority !== 'all' && t.priority !== taskFilterPriority) return false;
      return true;
    });
  }, [tasks, taskFilterAgent, taskFilterStatus, taskFilterPriority]);

  // ── Agent mutations ────────────────────────────────────────
  const addAgent = (agent: Agent) => {
    const next = [agent, ...loadAgents()];
    saveAgents(next);
    appendAudit({ agentId: agent.id, actionType: 'agent_created', summary: `Created ${agent.name}` });
    refresh();
    setAddOpen(false);
    setActiveAgentId(agent.id);
  };

  const updateAgent = (patch: Partial<Agent> & { id: string }) => {
    const next = loadAgents().map((a) => a.id === patch.id ? { ...a, ...patch } : a);
    saveAgents(next);
    appendAudit({ agentId: patch.id, actionType: 'agent_edited', summary: `Updated agent settings` });
    refresh();
  };

  const deleteAgent = (id: string) => {
    saveAgents(loadAgents().filter((a) => a.id !== id));
    // Unassign tasks belonging to the deleted agent (mark as failed).
    const nextTasks = loadTasks().map((t) =>
      t.assignedTo === id && t.status !== 'completed'
        ? { ...t, status: 'failed' as TaskStatus, output: (t.output || '') + '\n[Agent removed]' }
        : t
    );
    saveTasks(nextTasks);
    refresh();
    if (activeAgentId === id) setActiveAgentId(null);
  };

  // ── Task mutations ─────────────────────────────────────────
  const addTask = (input: { title: string; description: string; assignedTo: string; priority: TaskPriority; dueDate: string | null }) => {
    const task: AgentTask = {
      id: uid('task'),
      title: input.title,
      description: input.description,
      assignedTo: input.assignedTo,
      status: 'queued',
      priority: input.priority,
      output: null,
      tokensUsed: 0,
      costUsd: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      dueDate: input.dueDate,
      parentTaskId: null,
    };
    const next = [task, ...loadTasks()];
    saveTasks(next);
    appendAudit({ agentId: input.assignedTo, actionType: 'task_created', summary: `New task: ${input.title}` });
    refresh();
  };

  const setTaskStatus = (taskId: string, status: TaskStatus) => {
    const next = loadTasks().map((t) => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        status,
        startedAt: t.startedAt ?? (status === 'in_progress' ? new Date().toISOString() : t.startedAt),
        completedAt: status === 'completed' ? new Date().toISOString() : t.completedAt,
      };
    });
    saveTasks(next);
    const task = next.find((t) => t.id === taskId);
    if (task) {
      appendAudit({
        agentId: task.assignedTo,
        actionType: status === 'completed' ? 'task_approved' : status === 'failed' ? 'task_rejected' : 'task_created',
        summary: `Task "${task.title}" → ${TASK_STATUS_COLORS[status].label}`,
      });
    }
    refresh();
  };

  // ── Heartbeat ──────────────────────────────────────────────
  const triggerHeartbeat = async (agentId: string) => {
    setHeartbeatingId(agentId);
    setHeartbeatFlash(null);
    const res = await runHeartbeat(agentId);
    refresh();
    setHeartbeatingId(null);
    if (res.ok) {
      setHeartbeatFlash({ kind: 'ok', message: `Heartbeat complete — ${res.report}` });
    } else {
      setHeartbeatFlash({ kind: 'err', message: `Heartbeat failed: ${res.error || res.report}` });
    }
    setTimeout(() => setHeartbeatFlash(null), 5000);
  };

  if (!hydrated) {
    return (
      <div style={{ padding: 40, color: S.pageSubtitle, fontFamily: S.font, background: S.pageBg, minHeight: '100%' }}>
        Loading agents…
      </div>
    );
  }

  return (
    <div style={{ background: S.pageBg, minHeight: '100%', fontFamily: S.font, color: S.pageHeading, fontSize: 16, lineHeight: 1.6 }}>
      <style>{`
        @keyframes sFadeIn { from { opacity:0; transform:translateY(8px);} to { opacity:1; transform:translateY(0);} }
        @keyframes sSlideRight { from { transform: translateX(100%);} to { transform: translateX(0);} }
        @keyframes sSpin { to { transform: rotate(360deg); } }
        .ag-card:hover { border-color: ${S.borderHover} !important; }
        .ag-row:hover { background: ${S.surfaceHover} !important; }
        .ag-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
        .ag-scroll::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.12); border-radius: 4px; }
      `}</style>

      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '32px 40px 96px', animation: 'sFadeIn 0.25s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', marginBottom: 36 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              AI Agents
            </h1>
            <p style={{ fontSize: 17, color: S.pageSubtitle, margin: '12px 0 0', lineHeight: 1.6, maxWidth: 720 }}>
              Your autonomous workforce. Agents run on schedules, execute tasks, and report back.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {dueNow.length > 0 && (
              <span style={{
                padding: '9px 14px', borderRadius: 10,
                background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
                color: S.pageHeading, fontSize: 14, fontFamily: S.font,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.amber }} />
                {dueNow.length} heartbeat{dueNow.length === 1 ? '' : 's'} due
              </span>
            )}
            <button
              onClick={() => setAddOpen(true)}
              style={{
                padding: '13px 28px', borderRadius: 11,
                background: S.accent, color: S.white, border: 'none',
                fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
                display: 'inline-flex', alignItems: 'center', gap: 10,
                boxShadow: '0 6px 20px rgba(0,102,255,0.25)',
              }}
            >
              + Add Agent
            </button>
          </div>
        </div>

        {heartbeatFlash && (
          <div style={{
            marginBottom: 20, padding: '14px 18px', borderRadius: 12,
            background: heartbeatFlash.kind === 'ok' ? S.greenSoft : S.redSoft,
            border: `1px solid ${heartbeatFlash.kind === 'ok' ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`,
            color: heartbeatFlash.kind === 'ok' ? S.green : S.red,
            fontSize: 15, fontFamily: S.font,
          }}>
            {heartbeatFlash.message}
          </div>
        )}

        {/* Stats */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20, marginBottom: 40,
        }}>
          <StatCard label="Active Agents" value={activeAgentCount.toString()} subtitle={`of ${agents.length} total`} />
          <StatCard label="Tasks Completed" value={completed.toString()} subtitle="all-time" accent={S.green} />
          <StatCard label="Tasks In Progress" value={inProgress.toString()} subtitle="now running / pending approval" accent={S.accent} />
          <StatCard label="Total Spend" value={`$${spend.toFixed(2)}`} subtitle="this month (estimated)" mono />
        </section>

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22 }}>
          <div style={{
            display: 'inline-flex', padding: 4, borderRadius: 11,
            background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          }}>
            {(['org', 'grid'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '9px 20px', borderRadius: 8,
                  background: view === v ? S.accent : 'transparent',
                  color: view === v ? S.white : S.pageHeading,
                  border: 'none', cursor: 'pointer',
                  fontSize: 14, fontWeight: 500, fontFamily: S.font,
                }}
              >
                {v === 'org' ? 'Org Chart' : 'Grid'}
              </button>
            ))}
          </div>
        </div>

        {/* Org chart or grid */}
        {view === 'org' ? (
          <OrgChart agents={agents} tasks={tasks} onPick={setActiveAgentId} />
        ) : (
          <AgentGrid
            agents={agents}
            tasks={tasks}
            onPick={setActiveAgentId}
            heartbeatingId={heartbeatingId}
            onHeartbeat={triggerHeartbeat}
          />
        )}

        {/* Task queue */}
        <section style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: S.pageHeading, margin: 0, letterSpacing: '-0.015em' }}>
              Task queue
            </h2>
            <button
              onClick={() => setNewTaskOpen(true)}
              style={{
                padding: '11px 22px', borderRadius: 10,
                background: '#fff', border: '1px solid rgba(0,0,0,0.12)',
                color: S.pageHeading, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                fontFamily: S.font,
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              + New task
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
            <FilterSelect
              value={taskFilterAgent}
              onChange={setTaskFilterAgent}
              options={[{ value: 'all', label: 'All agents' }, ...agents.map((a) => ({ value: a.id, label: a.name }))]}
              width={180}
            />
            <FilterSelect
              value={taskFilterStatus}
              onChange={setTaskFilterStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'queued', label: 'Queued' },
                { value: 'in_progress', label: 'In Progress' },
                { value: 'completed', label: 'Completed' },
                { value: 'failed', label: 'Failed' },
                { value: 'needs_approval', label: 'Needs Approval' },
              ]}
            />
            <FilterSelect
              value={taskFilterPriority}
              onChange={setTaskFilterPriority}
              options={[
                { value: 'all', label: 'All priorities' },
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
            />
          </div>

          <TaskQueue
            tasks={filteredTasks}
            agents={agents}
            onPickAgent={setActiveAgentId}
            onApprove={(id) => setTaskStatus(id, 'completed')}
            onReject={(id) => setTaskStatus(id, 'failed')}
          />
        </section>

        {/* Modals and slide-overs */}
        {addOpen && (
          <AgentEditorModal
            mode="create"
            agents={agents}
            onClose={() => setAddOpen(false)}
            onSave={(draft) => addAgent({
              id: uid('agent'),
              ...draft,
              budgetUsed: 0,
              budgetResetAt: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
              lastHeartbeat: null,
              createdAt: new Date().toISOString(),
            })}
          />
        )}

        {activeAgent && (
          <AgentDetailPanel
            agent={activeAgent}
            agents={agents}
            tasks={tasks.filter((t) => t.assignedTo === activeAgent.id)}
            audit={audit.filter((a) => a.agentId === activeAgent.id)}
            config={config}
            heartbeating={heartbeatingId === activeAgent.id}
            onClose={() => setActiveAgentId(null)}
            onHeartbeat={() => triggerHeartbeat(activeAgent.id)}
            onUpdate={(patch) => updateAgent({ id: activeAgent.id, ...patch })}
            onDelete={() => {
              if (confirm(`Delete ${activeAgent.name}? Open tasks will be marked failed.`)) {
                deleteAgent(activeAgent.id);
              }
            }}
            onAddTask={(input) => addTask({ ...input, assignedTo: activeAgent.id })}
            onApprove={(id) => setTaskStatus(id, 'completed')}
            onReject={(id) => setTaskStatus(id, 'failed')}
          />
        )}

        {newTaskOpen && (
          <NewTaskModal
            agents={agents}
            onClose={() => setNewTaskOpen(false)}
            onSave={(input) => { addTask(input); setNewTaskOpen(false); }}
          />
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Stat card
// ═══════════════════════════════════════════════════════════════
function StatCard({ label, value, subtitle, accent, mono }: { label: string; value: string; subtitle: string; accent?: string; mono?: boolean }) {
  return (
    <div style={{
      background: S.surface, color: S.textPrimary,
      border: `1px solid ${S.border}`, borderRadius: 16, padding: 28,
      boxShadow: CARD_SHADOW,
    }}>
      <div style={{ fontSize: 15, color: S.textSecondary, marginBottom: 14, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 36, fontWeight: 700, color: accent || S.white, letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.1, fontFamily: mono ? S.mono : S.font }}>
        {value}
      </div>
      <div style={{ fontSize: 14, color: S.textMuted }}>{subtitle}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Filter select (light theme)
// ═══════════════════════════════════════════════════════════════
function FilterSelect({
  value, onChange, options, width = 200,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  width?: number;
}) {
  const active = value !== 'all';
  return (
    <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          padding: '12px 36px 12px 16px', borderRadius: 11,
          background: active ? 'rgba(0,102,255,0.10)' : '#fff',
          border: `1px solid ${active ? S.accentBorder : 'rgba(0,0,0,0.12)'}`,
          color: active ? S.accent : S.pageHeading,
          fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: S.font, outline: 'none',
          minWidth: width,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: '#fff', color: S.pageHeading }}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: S.pageSubtitle, display: 'flex' }}>
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 4l2.5 2.5L7.5 4" /></svg>
      </span>
    </label>
  );
}

// ═══════════════════════════════════════════════════════════════
// Org Chart
// ═══════════════════════════════════════════════════════════════
function OrgChart({ agents, tasks, onPick }: { agents: Agent[]; tasks: AgentTask[]; onPick: (id: string) => void }) {
  // Build levels — top = reportsTo === null
  const byParent = useMemo(() => {
    const map = new Map<string | null, Agent[]>();
    agents.forEach((a) => {
      const key = a.reportsTo || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    });
    return map;
  }, [agents]);

  const roots = byParent.get(null) || [];

  const renderNode = (agent: Agent, isRoot = false): React.ReactNode => {
    const children = byParent.get(agent.id) || [];
    const taskCount = tasks.filter((t) => t.assignedTo === agent.id && t.status !== 'completed' && t.status !== 'failed').length;
    return (
      <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <OrgNode agent={agent} taskCount={taskCount} onClick={() => onPick(agent.id)} />
        {children.length > 0 && (
          <>
            <div style={{ width: 1.5, height: 24, background: 'rgba(0,0,0,0.18)' }} />
            <div style={{
              position: 'relative',
              display: 'flex', gap: 24,
              paddingTop: 0,
            }}>
              {children.length > 1 && (
                <div style={{
                  position: 'absolute', top: 0, left: '10%', right: '10%', height: 1.5,
                  background: 'rgba(0,0,0,0.18)',
                }} />
              )}
              {children.map((child) => (
                <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {children.length > 1 && <div style={{ width: 1.5, height: 18, background: 'rgba(0,0,0,0.18)' }} />}
                  {renderNode(child)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  if (roots.length === 0) {
    return (
      <div style={{
        background: S.surface, color: S.textPrimary,
        border: `1px solid ${S.border}`, borderRadius: 16, padding: 40,
        boxShadow: CARD_SHADOW, textAlign: 'center',
      }}>
        No agents yet. Click <strong>+ Add Agent</strong> to create your first one.
      </div>
    );
  }

  return (
    <div className="ag-scroll" style={{ overflowX: 'auto', paddingBottom: 12 }}>
      <div style={{
        minWidth: 'max-content',
        background: '#fff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: '40px 24px', boxShadow: CARD_SHADOW,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
          {/* Board node */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{
              padding: '12px 22px', borderRadius: 11,
              background: '#F5F5F7', border: '1px dashed rgba(0,0,0,0.16)',
              color: S.pageHeading, fontSize: 14, fontWeight: 600, letterSpacing: '0.02em',
            }}>
              Board (You)
            </div>
            <div style={{ width: 1.5, height: 24, background: 'rgba(0,0,0,0.18)' }} />
            {/* Line spanning roots */}
            <div style={{ position: 'relative', display: 'flex', gap: 28 }}>
              {roots.length > 1 && (
                <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1.5, background: 'rgba(0,0,0,0.18)' }} />
              )}
              {roots.map((r) => (
                <div key={r.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {roots.length > 1 && <div style={{ width: 1.5, height: 18, background: 'rgba(0,0,0,0.18)' }} />}
                  {renderNode(r, true)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrgNode({ agent, taskCount, onClick }: { agent: Agent; taskCount: number; onClick: () => void }) {
  const color = agentColor(agent.id);
  const statusMeta = STATUS_COLORS[agent.status];
  return (
    <button
      onClick={onClick}
      className="ag-card"
      style={{
        background: S.surface, color: S.textPrimary,
        border: `1px solid ${S.border}`, borderRadius: 14,
        padding: '14px 18px', minWidth: 220,
        cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center',
        boxShadow: CARD_SHADOW, fontFamily: S.font, textAlign: 'left',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: `${color}26`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, flexShrink: 0,
      }}>
        {agentInitials(agent.name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: S.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {agent.name}
          </span>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusMeta.dot, flexShrink: 0 }} title={statusMeta.label} />
        </div>
        <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.role.split('—')[0].split('.')[0].slice(0, 46)}
        </div>
      </div>
      <span style={{
        fontSize: 12, fontFamily: S.mono, padding: '3px 9px', borderRadius: 100,
        background: 'rgba(255,255,255,0.05)', color: S.textSecondary,
        flexShrink: 0,
      }}>
        {taskCount}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// Agent Grid
// ═══════════════════════════════════════════════════════════════
function AgentGrid({
  agents, tasks, onPick, heartbeatingId, onHeartbeat,
}: {
  agents: Agent[]; tasks: AgentTask[]; onPick: (id: string) => void;
  heartbeatingId: string | null; onHeartbeat: (id: string) => void;
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
      {agents.map((a) => {
        const agentTasks = tasks.filter((t) => t.assignedTo === a.id);
        const completed = agentTasks.filter((t) => t.status === 'completed').length;
        const pending = agentTasks.filter((t) => t.status === 'queued' || t.status === 'in_progress' || t.status === 'needs_approval').length;
        const budgetPct = Math.min(100, Math.round((a.budgetUsed / Math.max(0.01, a.budgetMonthly)) * 100));
        const color = agentColor(a.id);
        const status = STATUS_COLORS[a.status];
        const heartbeating = heartbeatingId === a.id;

        return (
          <div
            key={a.id}
            className="ag-card"
            style={{
              background: S.surface, color: S.textPrimary,
              border: `1px solid ${S.border}`, borderRadius: 16, padding: 24,
              boxShadow: CARD_SHADOW, display: 'flex', flexDirection: 'column', gap: 14,
              fontFamily: S.font,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12,
                background: `${color}26`, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, flexShrink: 0,
              }}>
                {agentInitials(a.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.white, letterSpacing: '-0.01em' }}>
                  {a.name}
                </div>
                <div style={{ fontSize: 14, color: S.textMuted, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {a.role.split('—')[0].trim()}
                </div>
              </div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 10px', borderRadius: 100,
                background: 'rgba(255,255,255,0.04)',
                color: S.textSecondary, fontSize: 12, fontWeight: 600,
                border: `1px solid ${S.border}`,
              }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: status.dot }} />
                {status.label}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '14px 0', borderTop: `1px solid ${S.border}`, borderBottom: `1px solid ${S.border}` }}>
              <MiniStat label="Done" value={completed.toString()} />
              <MiniStat label="Pending" value={pending.toString()} />
              <MiniStat label="Cost" value={`$${a.budgetUsed.toFixed(2)}`} mono />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: S.textMuted, marginBottom: 6 }}>
                <span>Budget</span>
                <span style={{ fontFamily: S.mono }}>${a.budgetUsed.toFixed(2)} / ${a.budgetMonthly.toFixed(2)}</span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                <div style={{
                  width: `${budgetPct}%`, height: '100%',
                  background: budgetPct > 85 ? S.red : budgetPct > 60 ? S.amber : S.accent,
                  transition: 'width 0.3s ease',
                }} />
              </div>
            </div>

            <div style={{ fontSize: 13, color: S.textMuted, display: 'flex', justifyContent: 'space-between' }}>
              <span>Last heartbeat</span>
              <span style={{ fontFamily: S.mono, color: S.textSecondary }}>{timeAgo(a.lastHeartbeat)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button
                onClick={() => onPick(a.id)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: 9,
                  background: S.accent, color: S.white, border: 'none',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
                }}
              >
                View
              </button>
              <button
                onClick={() => onHeartbeat(a.id)}
                disabled={heartbeating || a.status !== 'active'}
                style={{
                  padding: '10px 14px', borderRadius: 9,
                  background: S.surfaceInner, border: `1px solid ${S.border}`,
                  color: S.textSecondary, fontSize: 14, fontWeight: 500,
                  cursor: heartbeating || a.status !== 'active' ? 'not-allowed' : 'pointer',
                  opacity: heartbeating || a.status !== 'active' ? 0.5 : 1,
                  fontFamily: S.font, display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                {heartbeating ? (
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${S.border}`, borderTopColor: S.accent, borderRadius: '50%', animation: 'sSpin 0.9s linear infinite' }} />
                ) : '⚡'}
                {heartbeating ? 'Running' : 'Heartbeat'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MiniStat({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: S.white, fontFamily: mono ? S.mono : S.font }}>{value}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Task queue table
// ═══════════════════════════════════════════════════════════════
function TaskQueue({
  tasks, agents, onPickAgent, onApprove, onReject,
}: {
  tasks: AgentTask[];
  agents: Agent[];
  onPickAgent: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div style={{
      background: S.surface, color: S.textPrimary,
      border: `1px solid ${S.border}`, borderRadius: 16, overflow: 'hidden',
      boxShadow: CARD_SHADOW,
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: S.font }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${S.border}` }}>
              {['Task', 'Assigned To', 'Status', 'Priority', 'Created', 'Updated'].map((h) => (
                <th key={h} style={{
                  textAlign: 'left', fontSize: 13, fontWeight: 600,
                  color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em',
                  padding: '14px 16px', whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: S.textMuted, fontSize: 14 }}>
                  No tasks match these filters.
                </td>
              </tr>
            ) : tasks.map((t) => {
              const agent = agents.find((a) => a.id === t.assignedTo);
              const isExpanded = expanded === t.id;
              const status = TASK_STATUS_COLORS[t.status];
              return (
                <>
                  <tr
                    key={t.id}
                    className="ag-row"
                    onClick={() => setExpanded(isExpanded ? null : t.id)}
                    style={{ borderBottom: `1px solid ${S.border}`, cursor: 'pointer' }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: 15, fontWeight: 600, color: S.white, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.title}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 14, color: S.textSecondary, whiteSpace: 'nowrap' }}>
                      {agent ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); onPickAgent(agent.id); }}
                          style={{ background: 'none', border: 'none', color: S.accent, cursor: 'pointer', padding: 0, fontFamily: S.font, fontSize: 14 }}
                        >
                          {agent.name}
                        </button>
                      ) : <span style={{ color: S.textMuted }}>—</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: '4px 10px', borderRadius: 100,
                        background: status.bg, color: status.color,
                        fontSize: 12, fontWeight: 600,
                        border: `1px solid ${status.border}`,
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <PriorityPill priority={t.priority} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: S.textMuted, fontFamily: S.mono, whiteSpace: 'nowrap' }}>
                      {timeAgo(t.createdAt)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 13, color: S.textMuted, fontFamily: S.mono, whiteSpace: 'nowrap' }}>
                      {timeAgo(t.completedAt ?? t.startedAt ?? t.createdAt)}
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} style={{ padding: '18px 22px', background: S.surfaceInner, borderBottom: `1px solid ${S.border}` }}>
                        <div style={{ fontSize: 14, color: S.textSecondary, lineHeight: 1.65, marginBottom: 12 }}>
                          {t.description}
                        </div>
                        {t.output && (
                          <pre style={{
                            margin: 0, background: 'rgba(0,0,0,0.25)', padding: 14, borderRadius: 10,
                            fontSize: 13, color: '#C8CBD3', fontFamily: S.mono, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                            maxHeight: 300, overflowY: 'auto', border: `1px solid ${S.border}`,
                          }}>
                            {t.output}
                          </pre>
                        )}
                        {t.status === 'needs_approval' && (
                          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                            <button onClick={(e) => { e.stopPropagation(); onApprove(t.id); }} style={approveBtn()}>
                              Approve
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onReject(t.id); }} style={rejectBtn()}>
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PriorityPill({ priority }: { priority: TaskPriority }) {
  const color = PRIORITY_COLORS[priority];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 100,
      background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`,
      color: S.textSecondary, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
      {priority}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// Agent detail slide-over
// ═══════════════════════════════════════════════════════════════
function AgentDetailPanel({
  agent, agents, tasks, audit, config, heartbeating,
  onClose, onHeartbeat, onUpdate, onDelete, onAddTask, onApprove, onReject,
}: {
  agent: Agent;
  agents: Agent[];
  tasks: AgentTask[];
  audit: AuditEntry[];
  config: ScaleModelConfig | null;
  heartbeating: boolean;
  onClose: () => void;
  onHeartbeat: () => void;
  onUpdate: (patch: Partial<Agent>) => void;
  onDelete: () => void;
  onAddTask: (input: { title: string; description: string; priority: TaskPriority; dueDate: string | null }) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [editing, setEditing] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [tab, setTab] = useState<'tasks' | 'audit'>('tasks');

  const parent = agent.reportsTo ? agents.find((a) => a.id === agent.reportsTo) : null;
  const budgetPct = Math.min(100, Math.round((agent.budgetUsed / Math.max(0.01, agent.budgetMonthly)) * 100));
  const color = agentColor(agent.id);
  const statusMeta = STATUS_COLORS[agent.status];
  const nextDue = nextHeartbeatDue(agent);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(2px)',
        display: 'flex', justifyContent: 'flex-end',
        fontFamily: S.font,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560, maxWidth: '100vw', height: '100%',
          background: S.bg, color: S.textPrimary,
          borderLeft: `1px solid ${S.border}`,
          boxShadow: '-12px 0 40px rgba(0,0,0,0.4)',
          overflowY: 'auto',
          animation: 'sSlideRight 0.25s ease',
        }}
      >
        {/* Header */}
        <div style={{ padding: '28px 28px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', minWidth: 0 }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14,
                background: `${color}26`, color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 700, flexShrink: 0,
              }}>
                {agentInitials(agent.name)}
              </div>
              <div style={{ minWidth: 0 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.015em' }}>
                  {agent.name}
                </h2>
                <div style={{ fontSize: 14, color: S.textMuted, marginTop: 4 }}>
                  {agent.role.split('—')[0].trim()}
                </div>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 4 }}>×</button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 100,
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`,
              color: S.textSecondary, fontSize: 12, fontWeight: 600,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: statusMeta.dot }} />
              {statusMeta.label}
            </span>
            <button
              onClick={onHeartbeat}
              disabled={heartbeating || agent.status !== 'active' || !config?.apiKey && config?.provider !== 'openrouter_free'}
              style={{
                padding: '8px 14px', borderRadius: 9,
                background: S.accent, color: S.white, border: 'none',
                fontSize: 13, fontWeight: 600,
                cursor: heartbeating ? 'not-allowed' : 'pointer',
                opacity: heartbeating || agent.status !== 'active' ? 0.6 : 1,
                fontFamily: S.font, display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              {heartbeating ? (
                <>
                  <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid rgba(255,255,255,0.35)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'sSpin 0.9s linear infinite' }} />
                  Running…
                </>
              ) : '⚡ Run heartbeat'}
            </button>
            <button onClick={() => setEditing(!editing)} style={tinyGhostBtn()}>
              {editing ? 'Cancel edit' : 'Edit'}
            </button>
            <button onClick={onDelete} style={{ ...tinyGhostBtn(), color: S.red, borderColor: 'rgba(239,68,68,0.25)' }}>
              Delete
            </button>
          </div>

          {/* Meta grid */}
          <div style={{
            background: S.surfaceInner, border: `1px solid ${S.border}`, borderRadius: 12,
            padding: 16,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
          }}>
            <MetaRow label="Reports to" value={parent?.name || 'Board (You)'} />
            <MetaRow label="Model" value={agent.model} mono />
            <MetaRow label="Heartbeat" value={HEARTBEAT_LABELS[agent.heartbeatSchedule]} />
            <MetaRow label="Last run" value={timeAgo(agent.lastHeartbeat)} />
            <MetaRow label="Next due" value={nextDue ? timeAgo(nextDue) : 'Manual only'} />
            <MetaRow label="Auto-approve" value={agent.autoApprove ? 'Yes' : 'No'} accent={agent.autoApprove ? S.green : undefined} />
          </div>

          {/* Budget */}
          <div style={{ marginTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: S.textMuted }}>
              <span>Budget this month</span>
              <span style={{ fontFamily: S.mono, color: S.textSecondary }}>
                ${agent.budgetUsed.toFixed(2)} / ${agent.budgetMonthly.toFixed(2)}
              </span>
            </div>
            <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
              <div style={{
                width: `${budgetPct}%`, height: '100%',
                background: budgetPct > 85 ? S.red : budgetPct > 60 ? S.amber : S.accent,
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>

          {/* Tools */}
          <div style={{ marginTop: 20 }}>
            <div style={sectionLabelStyle()}>Enabled tools</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {agent.tools.length === 0 && (
                <span style={{ fontSize: 13, color: S.textMuted }}>No tools enabled.</span>
              )}
              {agent.tools.map((t) => {
                const meta = ALL_TOOLS.find((x) => x.id === t);
                return (
                  <span key={t} style={{
                    padding: '5px 11px', borderRadius: 100,
                    background: S.accentSoft, color: '#93C5FD',
                    fontSize: 12, fontWeight: 500,
                    border: `1px solid ${S.accentBorder}`,
                  }}>
                    {meta?.label ?? t}
                  </span>
                );
              })}
            </div>
          </div>

          {/* System prompt */}
          <div style={{ marginTop: 18 }}>
            <button
              onClick={() => setShowPrompt(!showPrompt)}
              style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                color: S.textMuted, fontSize: 13, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: S.font,
              }}
            >
              System prompt {showPrompt ? '▾' : '▸'}
            </button>
            {showPrompt && (
              <pre style={{
                marginTop: 10, padding: 14, borderRadius: 10,
                background: 'rgba(0,0,0,0.25)', border: `1px solid ${S.border}`,
                fontSize: 13, color: '#C8CBD3', fontFamily: S.mono,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 220, overflowY: 'auto', lineHeight: 1.6,
              }}>
                {agent.systemPrompt}
              </pre>
            )}
          </div>

          {editing && (
            <AgentEditInline
              agent={agent}
              agents={agents}
              onCancel={() => setEditing(false)}
              onSave={(patch) => { onUpdate(patch); setEditing(false); }}
            />
          )}
        </div>

        {/* Tasks + audit tabs */}
        <div style={{ padding: '0 28px 28px' }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 14, padding: 4, background: S.surfaceInner, borderRadius: 10, border: `1px solid ${S.border}`, width: 'fit-content' }}>
            {(['tasks', 'audit'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '8px 16px', borderRadius: 8,
                  background: tab === t ? S.accent : 'transparent',
                  color: tab === t ? S.white : S.textSecondary,
                  border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 600, fontFamily: S.font,
                }}
              >
                {t === 'tasks' ? `Tasks (${tasks.length})` : `Audit (${audit.length})`}
              </button>
            ))}
          </div>

          {tab === 'tasks' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
                <button onClick={() => setAssignOpen(!assignOpen)} style={tinyPrimaryBtn()}>
                  {assignOpen ? 'Cancel' : '+ Assign task'}
                </button>
              </div>

              {assignOpen && (
                <InlineNewTaskForm
                  onCancel={() => setAssignOpen(false)}
                  onSave={(input) => { onAddTask(input); setAssignOpen(false); }}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {tasks.length === 0 && (
                  <div style={{ padding: 24, textAlign: 'center', color: S.textMuted, fontSize: 14, border: `1px dashed ${S.border}`, borderRadius: 11 }}>
                    No tasks assigned yet.
                  </div>
                )}
                {tasks.map((t) => (
                  <TaskCard key={t.id} task={t} onApprove={onApprove} onReject={onReject} />
                ))}
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {audit.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: S.textMuted, fontSize: 14, border: `1px dashed ${S.border}`, borderRadius: 11 }}>
                  No audit entries yet.
                </div>
              )}
              {audit.map((a) => (
                <div key={a.id} style={{
                  background: S.surfaceInner, border: `1px solid ${S.border}`,
                  borderRadius: 10, padding: 14,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: S.white }}>{a.summary}</span>
                    <span style={{ fontSize: 12, color: S.textMuted, fontFamily: S.mono, whiteSpace: 'nowrap' }}>{timeAgo(a.timestamp)}</span>
                  </div>
                  {a.detail && (
                    <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.55, fontFamily: S.mono, marginTop: 4, wordBreak: 'break-word' }}>
                      {a.detail}
                    </div>
                  )}
                  {(a.tokensUsed != null || a.costUsd != null) && (
                    <div style={{ fontSize: 12, color: S.textMuted, marginTop: 8, fontFamily: S.mono }}>
                      {a.tokensUsed ? `${a.tokensUsed} tokens` : ''}
                      {a.tokensUsed && a.costUsd != null ? ' · ' : ''}
                      {a.costUsd != null ? `$${a.costUsd.toFixed(4)}` : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 500,
        color: accent || S.textPrimary, fontFamily: mono ? S.mono : S.font,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Task card (inside agent detail)
// ═══════════════════════════════════════════════════════════════
function TaskCard({ task, onApprove, onReject }: { task: AgentTask; onApprove: (id: string) => void; onReject: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const status = TASK_STATUS_COLORS[task.status];
  return (
    <div style={{
      background: S.surfaceInner, border: `1px solid ${S.border}`,
      borderRadius: 11, padding: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: S.white, marginBottom: 6 }}>{task.title}</div>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 8 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '3px 10px', borderRadius: 100,
              background: status.bg, color: status.color,
              fontSize: 12, fontWeight: 600,
              border: `1px solid ${status.border}`,
            }}>
              {status.label}
            </span>
            <PriorityPill priority={task.priority} />
          </div>
          <div style={{ fontSize: 13, color: S.textSecondary, lineHeight: 1.55 }}>
            {task.description}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12, color: S.textMuted, fontFamily: S.mono }}>
        <span>Created {timeAgo(task.createdAt)}</span>
        {task.tokensUsed > 0 && <span>{task.tokensUsed} tokens · ${task.costUsd.toFixed(4)}</span>}
      </div>
      {(task.output || task.status === 'needs_approval') && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${S.border}` }}>
          {task.output && (
            <>
              <button onClick={() => setExpanded(!expanded)} style={{
                background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer',
                fontSize: 12, fontWeight: 600, padding: 0, fontFamily: S.font,
                textTransform: 'uppercase', letterSpacing: '0.08em',
              }}>
                Output {expanded ? '▾' : '▸'}
              </button>
              {expanded && (
                <pre style={{
                  marginTop: 8, padding: 12, borderRadius: 8,
                  background: 'rgba(0,0,0,0.28)', border: `1px solid ${S.border}`,
                  fontSize: 12, color: '#C8CBD3', fontFamily: S.mono,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 240, overflowY: 'auto',
                }}>
                  {task.output}
                </pre>
              )}
            </>
          )}
          {task.status === 'needs_approval' && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => onApprove(task.id)} style={approveBtn()}>Approve</button>
              <button onClick={() => onReject(task.id)} style={rejectBtn()}>Reject</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Agent editor modal (create + edit share most fields)
// ═══════════════════════════════════════════════════════════════
type AgentDraft = Omit<Agent, 'id' | 'budgetUsed' | 'budgetResetAt' | 'lastHeartbeat' | 'createdAt'>;

function AgentEditorModal({
  agents, mode, initial, onClose, onSave,
}: {
  agents: Agent[];
  mode: 'create' | 'edit';
  initial?: Agent;
  onClose: () => void;
  onSave: (draft: AgentDraft) => void;
}) {
  const defaultDraft: AgentDraft = {
    name: '', role: '', systemPrompt: '',
    reportsTo: null,
    model: 'claude-haiku-4-5-20251001',
    budgetMonthly: 10,
    heartbeatSchedule: '4h',
    tools: ['agent_brain'],
    autoApprove: false,
    status: 'active',
  };
  const [draft, setDraft] = useState<AgentDraft>(initial ?? defaultDraft);

  const canSave = draft.name.trim().length > 0 && draft.role.trim().length > 0;

  const toggleTool = (t: AgentTool) => {
    setDraft((d) => d.tools.includes(t)
      ? { ...d, tools: d.tools.filter((x) => x !== t) }
      : { ...d, tools: [...d.tools, t] }
    );
  };

  return (
    <div onClick={onClose} style={modalBackdrop()}>
      <div onClick={(e) => e.stopPropagation()} style={modalCard()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.015em' }}>
            {mode === 'create' ? 'New agent' : 'Edit agent'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Name *">
            <Input value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Ad Operations Director" autoFocus />
          </Field>
          <Field label="Role *">
            <Input value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} placeholder="Oversees all paid advertising campaigns" />
          </Field>
          <Field label="System prompt">
            <textarea
              value={draft.systemPrompt}
              onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
              placeholder="You are …  Your mission is …  Return JSON as specified."
              rows={8}
              style={inputStyle()}
            />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Reports to">
              <Select
                value={draft.reportsTo ?? ''}
                onChange={(v) => setDraft({ ...draft, reportsTo: v === '' ? null : v })}
                options={[
                  { value: '', label: 'Board (You)' },
                  ...agents.filter((a) => a.id !== initial?.id).map((a) => ({ value: a.id, label: a.name })),
                ]}
              />
            </Field>
            <Field label="AI model">
              <Select
                value={draft.model}
                onChange={(v) => setDraft({ ...draft, model: v })}
                options={[
                  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5' },
                  { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
                  { value: 'anthropic/claude-sonnet-4', label: 'Claude Sonnet 4 (OpenRouter)' },
                  { value: 'openai/gpt-4o', label: 'GPT-4o (OpenRouter)' },
                  { value: 'openai/gpt-4o-mini', label: 'GPT-4o Mini (OpenRouter)' },
                  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro (OpenRouter)' },
                ]}
              />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Budget cap (monthly)">
              <Input
                type="number"
                value={draft.budgetMonthly.toString()}
                onChange={(v) => setDraft({ ...draft, budgetMonthly: Number(v) || 0 })}
              />
            </Field>
            <Field label="Heartbeat schedule">
              <Select
                value={draft.heartbeatSchedule}
                onChange={(v) => setDraft({ ...draft, heartbeatSchedule: v as HeartbeatSchedule })}
                options={(Object.keys(HEARTBEAT_LABELS) as HeartbeatSchedule[]).map((k) => ({
                  value: k, label: HEARTBEAT_LABELS[k],
                }))}
              />
            </Field>
          </div>

          <Field label="Available tools">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 2 }}>
              {ALL_TOOLS.map((t) => {
                const checked = draft.tools.includes(t.id);
                return (
                  <label key={t.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    padding: 12, borderRadius: 10,
                    background: checked ? S.accentSoft : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${checked ? S.accentBorder : S.border}`,
                    cursor: 'pointer', transition: 'all 0.12s',
                  }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTool(t.id)}
                      style={{ marginTop: 3, cursor: 'pointer', accentColor: S.accent }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: S.white }}>{t.label}</div>
                      <div style={{ fontSize: 12, color: S.textMuted, marginTop: 2 }}>{t.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Field label="Auto-approve actions">
              <Select
                value={draft.autoApprove ? 'yes' : 'no'}
                onChange={(v) => setDraft({ ...draft, autoApprove: v === 'yes' })}
                options={[{ value: 'no', label: 'No — require my approval' }, { value: 'yes', label: 'Yes — let it run' }]}
              />
            </Field>
            <Field label="Status">
              <Select
                value={draft.status}
                onChange={(v) => setDraft({ ...draft, status: v as AgentStatus })}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'paused', label: 'Paused' },
                  { value: 'inactive', label: 'Inactive' },
                ]}
              />
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
          <button onClick={onClose} style={ghostButton()}>Cancel</button>
          <button
            onClick={() => canSave && onSave(draft)}
            disabled={!canSave}
            style={primaryButton(!canSave)}
          >
            {mode === 'create' ? 'Create agent' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inline edit form (inside slide-over)
function AgentEditInline({
  agent, agents, onCancel, onSave,
}: {
  agent: Agent;
  agents: Agent[];
  onCancel: () => void;
  onSave: (patch: Partial<Agent>) => void;
}) {
  const [draft, setDraft] = useState<AgentDraft>({
    name: agent.name, role: agent.role, systemPrompt: agent.systemPrompt,
    reportsTo: agent.reportsTo, model: agent.model,
    budgetMonthly: agent.budgetMonthly, heartbeatSchedule: agent.heartbeatSchedule,
    tools: [...agent.tools], autoApprove: agent.autoApprove, status: agent.status,
  });
  return (
    <div style={{ marginTop: 20, padding: 18, background: 'rgba(0,0,0,0.2)', border: `1px solid ${S.border}`, borderRadius: 12 }}>
      <div style={{ ...sectionLabelStyle(), marginBottom: 12 }}>Edit agent</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Name">
          <Input value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
        </Field>
        <Field label="Status">
          <Select value={draft.status} onChange={(v) => setDraft({ ...draft, status: v as AgentStatus })}
            options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Paused' }, { value: 'inactive', label: 'Inactive' }]} />
        </Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <Field label="Role">
          <Input value={draft.role} onChange={(v) => setDraft({ ...draft, role: v })} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <Field label="Heartbeat">
          <Select value={draft.heartbeatSchedule} onChange={(v) => setDraft({ ...draft, heartbeatSchedule: v as HeartbeatSchedule })}
            options={(Object.keys(HEARTBEAT_LABELS) as HeartbeatSchedule[]).map((k) => ({ value: k, label: HEARTBEAT_LABELS[k] }))} />
        </Field>
        <Field label="Budget / month">
          <Input type="number" value={draft.budgetMonthly.toString()} onChange={(v) => setDraft({ ...draft, budgetMonthly: Number(v) || 0 })} />
        </Field>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
        <Field label="Reports to">
          <Select
            value={draft.reportsTo ?? ''}
            onChange={(v) => setDraft({ ...draft, reportsTo: v === '' ? null : v })}
            options={[{ value: '', label: 'Board (You)' }, ...agents.filter((a) => a.id !== agent.id).map((a) => ({ value: a.id, label: a.name }))]}
          />
        </Field>
        <Field label="Auto-approve">
          <Select value={draft.autoApprove ? 'yes' : 'no'} onChange={(v) => setDraft({ ...draft, autoApprove: v === 'yes' })}
            options={[{ value: 'no', label: 'No' }, { value: 'yes', label: 'Yes' }]} />
        </Field>
      </div>
      <div style={{ marginTop: 10 }}>
        <Field label="System prompt">
          <textarea rows={6} value={draft.systemPrompt} onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })} style={inputStyle()} />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
        <button onClick={onCancel} style={tinyGhostBtn()}>Cancel</button>
        <button onClick={() => onSave(draft)} style={tinyPrimaryBtn()}>Save</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// New-task modal (global) + inline form (inside detail)
// ═══════════════════════════════════════════════════════════════
function NewTaskModal({
  agents, onClose, onSave,
}: {
  agents: Agent[];
  onClose: () => void;
  onSave: (input: { title: string; description: string; assignedTo: string; priority: TaskPriority; dueDate: string | null }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState(agents[0]?.id || '');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  const canSave = title.trim() && assignedTo;

  return (
    <div onClick={onClose} style={modalBackdrop()}>
      <div onClick={(e) => e.stopPropagation()} style={modalCard()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: S.white, margin: 0, letterSpacing: '-0.015em' }}>New task</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: S.textMuted, cursor: 'pointer', fontSize: 24, lineHeight: 1, padding: 4 }}>×</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Title *">
            <Input value={title} onChange={setTitle} autoFocus placeholder="Generate Meta ads for KING Toronto" />
          </Field>
          <Field label="Description">
            <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle()}
              placeholder="What should the agent do? Be specific about output format and constraints." />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Assigned to *">
              <Select value={assignedTo} onChange={setAssignedTo} options={agents.map((a) => ({ value: a.id, label: a.name }))} />
            </Field>
            <Field label="Priority">
              <Select value={priority} onChange={(v) => setPriority(v as TaskPriority)}
                options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
            </Field>
          </div>
          <Field label="Due date (optional)">
            <Input type="date" value={dueDate} onChange={setDueDate} />
          </Field>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button onClick={onClose} style={ghostButton()}>Cancel</button>
          <button onClick={() => canSave && onSave({
            title: title.trim(), description: description.trim(),
            assignedTo, priority, dueDate: dueDate || null,
          })} disabled={!canSave} style={primaryButton(!canSave)}>
            Create task
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineNewTaskForm({ onCancel, onSave }: {
  onCancel: () => void;
  onSave: (input: { title: string; description: string; priority: TaskPriority; dueDate: string | null }) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const canSave = title.trim().length > 0;
  return (
    <div style={{ padding: 16, background: 'rgba(0,0,0,0.22)', border: `1px solid ${S.border}`, borderRadius: 12, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Field label="Title">
        <Input value={title} onChange={setTitle} placeholder="Short task title" autoFocus />
      </Field>
      <Field label="Description">
        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle()} placeholder="What should the agent deliver?" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Field label="Priority">
          <Select value={priority} onChange={(v) => setPriority(v as TaskPriority)}
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }]} />
        </Field>
        <Field label="Due date">
          <Input type="date" value={dueDate} onChange={setDueDate} />
        </Field>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <button onClick={onCancel} style={tinyGhostBtn()}>Cancel</button>
        <button onClick={() => canSave && onSave({ title: title.trim(), description: description.trim(), priority, dueDate: dueDate || null })}
          disabled={!canSave} style={tinyPrimaryBtn(!canSave)}>
          Create task
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared input primitives (dark)
// ═══════════════════════════════════════════════════════════════
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 13, color: S.textMuted, fontWeight: 500 }}>{label}</span>
      {children}
    </label>
  );
}

function Input({
  value, onChange, type = 'text', placeholder, autoFocus,
}: { value: string; onChange: (v: string) => void; type?: string; placeholder?: string; autoFocus?: boolean }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={inputStyle()}
    />
  );
}

function Select({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
          ...inputStyle(), paddingRight: 34, cursor: 'pointer',
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ background: S.bg, color: S.textPrimary }}>
            {o.label}
          </option>
        ))}
      </select>
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: S.textMuted, display: 'flex' }}>
        <svg width="11" height="11" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2.5 4l2.5 2.5L7.5 4" /></svg>
      </span>
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: 'rgba(255,255,255,0.04)', border: `1px solid ${S.border}`,
    color: S.textPrimary, fontSize: 14, fontFamily: S.font, outline: 'none',
    lineHeight: 1.55,
  };
}

function sectionLabelStyle(): React.CSSProperties {
  return {
    fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.08em',
    color: S.textMuted, fontWeight: 600, marginBottom: 10, display: 'block',
  };
}

function modalBackdrop(): React.CSSProperties {
  return {
    position: 'fixed', inset: 0, zIndex: 10001,
    background: 'rgba(11,13,17,0.6)', backdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: S.font,
  };
}
function modalCard(): React.CSSProperties {
  return {
    width: 620, maxWidth: '94vw', maxHeight: '90vh',
    background: S.bg, color: S.textPrimary,
    border: `1px solid ${S.border}`, borderRadius: 18,
    padding: 32, overflowY: 'auto',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
  };
}

function ghostButton(): React.CSSProperties {
  return {
    padding: '12px 22px', borderRadius: 10,
    background: 'transparent', border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 14, fontWeight: 500,
    cursor: 'pointer', fontFamily: S.font,
  };
}
function primaryButton(disabled?: boolean): React.CSSProperties {
  return {
    padding: '12px 22px', borderRadius: 10,
    background: disabled ? 'rgba(255,255,255,0.05)' : S.accent,
    color: disabled ? S.textMuted : S.white,
    border: 'none', fontSize: 14, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: S.font,
  };
}
function tinyGhostBtn(): React.CSSProperties {
  return {
    padding: '7px 12px', borderRadius: 7,
    background: 'transparent', border: `1px solid ${S.border}`,
    color: S.textSecondary, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: S.font,
  };
}
function tinyPrimaryBtn(disabled?: boolean): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 7,
    background: disabled ? 'rgba(255,255,255,0.05)' : S.accent,
    color: disabled ? S.textMuted : S.white,
    border: 'none', fontSize: 12, fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: S.font,
  };
}
function approveBtn(): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 7,
    background: S.green, color: '#fff', border: 'none',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
  };
}
function rejectBtn(): React.CSSProperties {
  return {
    padding: '7px 14px', borderRadius: 7,
    background: 'transparent', color: S.red,
    border: '1px solid rgba(239,68,68,0.3)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: S.font,
  };
}
