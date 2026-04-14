/**
 * Scale Agents — types, storage, and the heartbeat engine.
 *
 * Agents live in localStorage for now; the schema is written so it can be
 * moved to Postgres without changes. The heartbeat engine is client-side
 * (so it has access to the user's Model Router config + Agent Brain) but
 * is also exposed as a pure function that the cron endpoint can stub.
 */

import {
  callAI,
  loadScaleConfig,
  buildBrainPrompt,
  ScaleChatMessage,
  ScaleModelConfig,
} from '@/lib/scale-ai';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type AgentStatus = 'active' | 'paused' | 'inactive';
export type HeartbeatSchedule = '1h' | '2h' | '4h' | '8h' | '12h' | '24h' | 'manual';
export type AgentTool =
  | 'campaign_wizard'
  | 'google_ads_push'
  | 'crm_access'
  | 'agent_brain'
  | 'content_generation'
  | 'web_scraping';

export const ALL_TOOLS: Array<{ id: AgentTool; label: string; description: string }> = [
  { id: 'campaign_wizard',    label: 'Campaign Wizard',    description: 'Generate ad campaigns (Google, Meta, email).' },
  { id: 'google_ads_push',    label: 'Google Ads Push',    description: 'Push campaigns live to Google Ads.' },
  { id: 'crm_access',         label: 'CRM Access',         description: 'Read + write leads, notes, and pipeline status.' },
  { id: 'agent_brain',        label: 'Agent Brain',        description: 'Read and propose edits to knowledge base rules.' },
  { id: 'content_generation', label: 'Content Generation', description: 'Draft blog posts, emails, and social copy.' },
  { id: 'web_scraping',       label: 'Web Scraping',       description: 'Pull project data, images, and market info.' },
];

export const HEARTBEAT_INTERVALS_MS: Record<HeartbeatSchedule, number> = {
  '1h':     1 * 60 * 60 * 1000,
  '2h':     2 * 60 * 60 * 1000,
  '4h':     4 * 60 * 60 * 1000,
  '8h':     8 * 60 * 60 * 1000,
  '12h':   12 * 60 * 60 * 1000,
  '24h':   24 * 60 * 60 * 1000,
  manual:  Number.POSITIVE_INFINITY,
};

export const HEARTBEAT_LABELS: Record<HeartbeatSchedule, string> = {
  '1h': 'Every 1 hour',
  '2h': 'Every 2 hours',
  '4h': 'Every 4 hours',
  '8h': 'Every 8 hours',
  '12h': 'Every 12 hours',
  '24h': 'Every 24 hours',
  manual: 'Manual only',
};

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  reportsTo: string | null;   // parent agent id; null = Board
  model: string;
  budgetMonthly: number;
  budgetUsed: number;
  budgetResetAt: string;       // ISO — first of month
  heartbeatSchedule: HeartbeatSchedule;
  lastHeartbeat: string | null;
  tools: AgentTool[];
  autoApprove: boolean;
  status: AgentStatus;
  createdAt: string;
}

export type TaskStatus = 'queued' | 'in_progress' | 'completed' | 'failed' | 'needs_approval';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  assignedTo: string;          // agent id
  status: TaskStatus;
  priority: TaskPriority;
  output: string | null;
  proposedAction?: ProposedAction | null;
  tokensUsed: number;
  costUsd: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  dueDate: string | null;
  parentTaskId: string | null;
}

export type AuditActionType =
  | 'heartbeat'
  | 'task_created'
  | 'task_completed'
  | 'task_failed'
  | 'task_approved'
  | 'task_rejected'
  | 'action_executed'
  | 'subtask_created'
  | 'agent_created'
  | 'agent_edited';

export interface AuditEntry {
  id: string;
  timestamp: string;
  agentId: string | null;
  actionType: AuditActionType;
  summary: string;
  detail?: string;
  tokensUsed?: number;
  costUsd?: number;
}

export interface ProposedAction {
  type: 'create_campaign' | 'push_to_google' | 'update_lead' | 'create_content' | 'send_notification';
  data: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// Storage
// ─────────────────────────────────────────────────────────────
export const AGENTS_KEY = 'scale-agents';
export const AGENT_TASKS_KEY = 'scale-agents-tasks';
export const AGENT_AUDIT_KEY = 'scale-agents-audit';

export function uid(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function nowIso() { return new Date().toISOString(); }

function firstOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function loadList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function saveList<T>(key: string, list: T[]): void {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(key, JSON.stringify(list)); } catch {}
}

export function loadAgents(): Agent[] { return loadList<Agent>(AGENTS_KEY); }
export function saveAgents(agents: Agent[]): void { saveList(AGENTS_KEY, agents); }

export function loadTasks(): AgentTask[] { return loadList<AgentTask>(AGENT_TASKS_KEY); }
export function saveTasks(tasks: AgentTask[]): void { saveList(AGENT_TASKS_KEY, tasks); }

export function loadAudit(): AuditEntry[] { return loadList<AuditEntry>(AGENT_AUDIT_KEY); }
export function saveAudit(entries: AuditEntry[]): void { saveList(AGENT_AUDIT_KEY, entries); }

export function appendAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>): AuditEntry {
  const full: AuditEntry = { id: uid('aud'), timestamp: nowIso(), ...entry };
  const list = loadAudit();
  list.unshift(full);
  // Keep the most recent 500 entries
  saveAudit(list.slice(0, 500));
  return full;
}

// ─────────────────────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────────────────────
function makeAgent(partial: Partial<Agent> & Pick<Agent, 'id' | 'name' | 'role' | 'reportsTo'>): Agent {
  const created = nowIso();
  return {
    systemPrompt: defaultSystemPrompt(partial.name, partial.role, partial.reportsTo),
    model: 'claude-haiku-4-5-20251001',
    budgetMonthly: 10,
    budgetUsed: 0,
    budgetResetAt: firstOfMonthIso(),
    heartbeatSchedule: '8h',
    lastHeartbeat: null,
    tools: ['agent_brain'],
    autoApprove: false,
    status: 'active',
    createdAt: created,
    ...partial,
  };
}

function defaultSystemPrompt(name: string, role: string, reportsTo: string | null): string {
  return `You are ${name}, an autonomous agent inside Scale — CondoWizard's AI operations platform.

ROLE
${role}

REPORTING
You report to ${reportsTo === null ? 'the Board (the human operator)' : 'your parent agent'}.

OUTPUT CONTRACT
When you heartbeat, you return a single JSON object shaped like:
{
  "task_updates": [{ "task_id": "...", "status": "completed" | "in_progress" | "failed" | "needs_approval", "output": "..." }],
  "new_subtasks": [{ "title": "...", "description": "...", "assign_to": "<agent_id or self>", "priority": "low" | "medium" | "high" | "urgent" }],
  "actions": [{ "type": "create_campaign" | "push_to_google" | "update_lead" | "create_content" | "send_notification", "data": { ... } }],
  "report": "1-3 sentence summary of what you did",
  "tokens_used": 0
}

Never invent task ids — only reference ids present in your current task list. Never act outside your enabled tools. If you cannot act without approval, mark the task "needs_approval" and describe what you want to do in the output.`;
}

export function seedAgents(): { agents: Agent[]; tasks: AgentTask[] } {
  const ceoId = 'agent_ceo';
  const adOpsId = 'agent_ad_ops';
  const leadOpsId = 'agent_lead_ops';
  const contentId = 'agent_content';
  const platformId = 'agent_platform';

  const agents: Agent[] = [
    makeAgent({
      id: ceoId,
      name: 'Scale CEO',
      role: 'Chief orchestrator — prioritizes work, delegates to department heads, reports to the Board.',
      reportsTo: null,
      budgetMonthly: 20,
      tools: ALL_TOOLS.map((t) => t.id),
    }),
    makeAgent({
      id: adOpsId,
      name: 'Ad Ops Director',
      role: 'Runs all paid ad campaigns — Google Search, Meta, Instagram, Display.',
      reportsTo: ceoId,
      budgetMonthly: 15,
      heartbeatSchedule: '4h',
      tools: ['campaign_wizard', 'google_ads_push', 'agent_brain'],
    }),
    makeAgent({
      id: leadOpsId,
      name: 'Lead Ops Director',
      role: 'Manages CRM, lead qualification, scoring, and follow-up sequences.',
      reportsTo: ceoId,
      budgetMonthly: 10,
      heartbeatSchedule: '4h',
      tools: ['crm_access', 'agent_brain'],
    }),
    makeAgent({
      id: contentId,
      name: 'Content Director',
      role: 'Creates blog posts, SEO content, social media, and email newsletters.',
      reportsTo: ceoId,
      budgetMonthly: 10,
      heartbeatSchedule: '12h',
      tools: ['content_generation', 'agent_brain'],
    }),
    makeAgent({
      id: platformId,
      name: 'Platform Lead',
      role: 'Maintains Scale codebase, ships features, fixes bugs, manages integrations.',
      reportsTo: ceoId,
      budgetMonthly: 15,
      model: 'claude-sonnet-4-20250514',
      tools: ALL_TOOLS.map((t) => t.id),
    }),
  ];

  const tasks: AgentTask[] = [
    makeTask('Generate Google Search campaigns for top 5 projects', adOpsId, 'high',
      'Use the Campaign Wizard to generate Google Search ads for the 5 highest-priority pre-construction projects. Deliver JSON output for each, ready to push.'),
    makeTask('Define lead scoring criteria for Toronto pre-construction', leadOpsId, 'high',
      'Propose a 5-factor lead scoring rubric (budget, timeline, source, engagement, neighbourhood) with weightings. Output as JSON.'),
    makeTask('Write 3 blog posts for April 2026', contentId, 'medium',
      'Draft 3 SEO-focused blog posts: King West market update, why Yorkville prices are rising, pre-construction buying guide 2026.'),
    makeTask('Connect Scale to real project database', platformId, 'urgent',
      'Replace the fallback project list with live Prisma queries. Ensure image URLs, neighborhoods, and status fields map correctly.'),
    makeTask('Create hiring plan for sub-agents', ceoId, 'medium',
      'Propose which specialist agents to spin up next (e.g. SEO Specialist, Email Copywriter). Include system prompts and budgets.'),
  ];

  return { agents, tasks };
}

function makeTask(title: string, assignedTo: string, priority: TaskPriority, description: string): AgentTask {
  return {
    id: uid('task'),
    title,
    description,
    assignedTo,
    status: 'queued',
    priority,
    output: null,
    tokensUsed: 0,
    costUsd: 0,
    createdAt: nowIso(),
    startedAt: null,
    completedAt: null,
    dueDate: null,
    parentTaskId: null,
  };
}

/** Seed once on first visit. Returns whatever is now in storage. */
export function ensureSeeded(): { agents: Agent[]; tasks: AgentTask[] } {
  const existing = loadAgents();
  if (existing.length > 0) {
    return { agents: existing, tasks: loadTasks() };
  }
  const { agents, tasks } = seedAgents();
  saveAgents(agents);
  saveTasks(tasks);
  agents.forEach((a) => appendAudit({
    agentId: a.id, actionType: 'agent_created',
    summary: `Seeded ${a.name} (${a.role.slice(0, 60)}${a.role.length > 60 ? '…' : ''}).`,
  }));
  return { agents, tasks };
}

// ─────────────────────────────────────────────────────────────
// Heartbeat helpers
// ─────────────────────────────────────────────────────────────
export function isHeartbeatDue(agent: Agent): boolean {
  if (agent.status !== 'active') return false;
  if (agent.heartbeatSchedule === 'manual') return false;
  if (!agent.lastHeartbeat) return true;
  const last = new Date(agent.lastHeartbeat).getTime();
  const interval = HEARTBEAT_INTERVALS_MS[agent.heartbeatSchedule];
  return Date.now() - last >= interval;
}

export function nextHeartbeatDue(agent: Agent): string | null {
  if (agent.heartbeatSchedule === 'manual') return null;
  const interval = HEARTBEAT_INTERVALS_MS[agent.heartbeatSchedule];
  const last = agent.lastHeartbeat ? new Date(agent.lastHeartbeat).getTime() : Date.now() - interval;
  return new Date(last + interval).toISOString();
}

// ─────────────────────────────────────────────────────────────
// Heartbeat execution
// ─────────────────────────────────────────────────────────────
export interface HeartbeatResponse {
  task_updates?: Array<{ task_id: string; status: TaskStatus; output?: string }>;
  new_subtasks?: Array<{ title: string; description: string; assign_to: string; priority: TaskPriority }>;
  actions?: Array<ProposedAction>;
  report?: string;
  tokens_used?: number;
}

function buildHeartbeatPrompt(agent: Agent, tasks: AgentTask[], brain: string): string {
  const toolList = agent.tools.map((t) => {
    const meta = ALL_TOOLS.find((x) => x.id === t);
    return `- ${meta?.label ?? t}: ${meta?.description ?? ''}`;
  }).join('\n');

  return `${agent.systemPrompt}${brain}

ENABLED TOOLS
${toolList || '- (none)'}

AUTO-APPROVE: ${agent.autoApprove ? 'yes — your actions execute automatically.' : 'no — any "actions" will be queued as needs_approval until the human reviews them.'}

CURRENT TASK QUEUE (your open tasks)
${tasks.length === 0 ? 'No tasks right now. Check in briefly and return.' :
tasks.map((t) => `- [${t.id}] (${t.status}, ${t.priority}) ${t.title} — ${t.description}`).join('\n')}

Return ONLY the JSON object from your output contract. No markdown, no prose.`;
}

function tryParseJson<T = unknown>(text: string): T | null {
  if (!text) return null;
  const trimmed = text.trim().replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '');
  try { return JSON.parse(trimmed) as T; } catch {}
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]) as T; } catch {} }
  return null;
}

/**
 * Execute a single agent heartbeat. Updates the agent's lastHeartbeat /
 * budgetUsed, applies task_updates, creates new_subtasks, and queues
 * actions (either executed immediately if auto-approve, or parked as
 * needs_approval). Returns the parsed AI response + summary for the UI.
 */
export async function runHeartbeat(
  agentId: string,
  options: { config?: ScaleModelConfig; dryRun?: boolean } = {}
): Promise<{
  ok: boolean;
  report: string;
  response?: HeartbeatResponse;
  raw?: string;
  error?: string;
}> {
  const agents = loadAgents();
  const tasks = loadTasks();
  const agent = agents.find((a) => a.id === agentId);
  if (!agent) return { ok: false, report: 'Agent not found', error: 'not_found' };

  const config = options.config ?? loadScaleConfig();
  if (!config.apiKey && config.provider !== 'openrouter_free') {
    return { ok: false, report: 'Model Router not configured', error: 'no_api_key' };
  }

  const ownTasks = tasks.filter((t) =>
    t.assignedTo === agent.id && t.status !== 'completed' && t.status !== 'failed'
  );
  const brain = buildBrainPrompt();
  const systemPrompt = buildHeartbeatPrompt(agent, ownTasks, brain);
  const userMessage = `Heartbeat at ${new Date().toLocaleString()}. Return JSON.`;

  let raw = '';
  try {
    raw = await callAI(config, systemPrompt, userMessage, [] as ScaleChatMessage[]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendAudit({
      agentId: agent.id, actionType: 'heartbeat',
      summary: `Heartbeat failed`,
      detail: message,
    });
    return { ok: false, report: message, error: message };
  }

  const parsed = tryParseJson<HeartbeatResponse>(raw);
  if (!parsed) {
    appendAudit({
      agentId: agent.id, actionType: 'heartbeat',
      summary: 'Heartbeat returned unparseable output',
      detail: raw.slice(0, 500),
    });
    return { ok: false, report: 'Agent output was not valid JSON', raw, error: 'bad_json' };
  }

  if (options.dryRun) {
    return { ok: true, report: parsed.report ?? 'Dry run', response: parsed, raw };
  }

  // Estimate cost from tokens (rough): $1/$5 per 1M for Haiku-ish. We use a
  // default of $3 / 1M blended for estimation.
  const tokens = parsed.tokens_used ?? estimateTokens(raw) + estimateTokens(systemPrompt);
  const estCost = tokens * 0.000003;

  // Apply task updates
  const nextTasks = [...tasks];
  (parsed.task_updates ?? []).forEach((u) => {
    const idx = nextTasks.findIndex((t) => t.id === u.task_id);
    if (idx < 0) return;
    const prev = nextTasks[idx];
    const started = prev.startedAt ?? (u.status === 'in_progress' ? nowIso() : prev.startedAt);
    const completed = u.status === 'completed' ? nowIso() : prev.completedAt;
    nextTasks[idx] = {
      ...prev,
      status: u.status,
      output: u.output ?? prev.output,
      startedAt: started,
      completedAt: completed,
    };
    if (u.status === 'completed') {
      appendAudit({
        agentId: agent.id, actionType: 'task_completed',
        summary: `Completed "${prev.title}"`,
        detail: u.output?.slice(0, 400),
      });
    } else if (u.status === 'failed') {
      appendAudit({
        agentId: agent.id, actionType: 'task_failed',
        summary: `Failed "${prev.title}"`,
        detail: u.output?.slice(0, 400),
      });
    }
  });

  // Create sub-tasks
  (parsed.new_subtasks ?? []).forEach((s) => {
    const assignTo = s.assign_to === 'self' ? agent.id : s.assign_to;
    const exists = agents.some((a) => a.id === assignTo);
    if (!exists) return;
    const subtask: AgentTask = {
      id: uid('task'),
      title: s.title,
      description: s.description,
      assignedTo: assignTo,
      status: 'queued',
      priority: s.priority,
      output: null,
      tokensUsed: 0,
      costUsd: 0,
      createdAt: nowIso(),
      startedAt: null,
      completedAt: null,
      dueDate: null,
      parentTaskId: null,
    };
    nextTasks.unshift(subtask);
    appendAudit({
      agentId: agent.id, actionType: 'subtask_created',
      summary: `Created sub-task "${s.title}" → ${agents.find((a) => a.id === assignTo)?.name ?? assignTo}`,
    });
  });

  // Queue actions. Auto-approved actions become a task marked completed
  // with a note describing the executed action; others become needs_approval
  // so the human reviews before anything hits production.
  (parsed.actions ?? []).forEach((action) => {
    const approvalTitle = `Proposed: ${action.type.replace(/_/g, ' ')}`;
    const summaryLine = summarizeAction(action);
    const task: AgentTask = {
      id: uid('task'),
      title: approvalTitle,
      description: summaryLine,
      assignedTo: agent.id,
      status: agent.autoApprove ? 'completed' : 'needs_approval',
      priority: 'medium',
      output: JSON.stringify(action, null, 2),
      proposedAction: action,
      tokensUsed: 0,
      costUsd: 0,
      createdAt: nowIso(),
      startedAt: agent.autoApprove ? nowIso() : null,
      completedAt: agent.autoApprove ? nowIso() : null,
      dueDate: null,
      parentTaskId: null,
    };
    nextTasks.unshift(task);
    appendAudit({
      agentId: agent.id,
      actionType: agent.autoApprove ? 'action_executed' : 'task_created',
      summary: agent.autoApprove ? `Auto-executed ${action.type}` : `Queued ${action.type} for approval`,
      detail: summaryLine,
    });
  });

  saveTasks(nextTasks);

  // Update agent heartbeat + budget
  const nextAgents = agents.map((a) => a.id === agent.id ? {
    ...a,
    lastHeartbeat: nowIso(),
    budgetUsed: Math.round((a.budgetUsed + estCost) * 10000) / 10000,
  } : a);
  saveAgents(nextAgents);

  appendAudit({
    agentId: agent.id, actionType: 'heartbeat',
    summary: parsed.report ?? 'Heartbeat complete',
    detail: `${parsed.task_updates?.length ?? 0} updates · ${parsed.new_subtasks?.length ?? 0} sub-tasks · ${parsed.actions?.length ?? 0} actions`,
    tokensUsed: tokens,
    costUsd: estCost,
  });

  return { ok: true, report: parsed.report ?? 'Heartbeat complete', response: parsed, raw };
}

function summarizeAction(a: ProposedAction): string {
  switch (a.type) {
    case 'create_campaign':   return `Create a campaign: ${JSON.stringify(a.data).slice(0, 200)}`;
    case 'push_to_google':    return `Push to Google Ads: ${JSON.stringify(a.data).slice(0, 200)}`;
    case 'update_lead':       return `Update CRM lead: ${JSON.stringify(a.data).slice(0, 200)}`;
    case 'create_content':    return `Create content: ${JSON.stringify(a.data).slice(0, 200)}`;
    case 'send_notification': return `Notify: ${JSON.stringify(a.data).slice(0, 200)}`;
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─────────────────────────────────────────────────────────────
// UI-facing helpers
// ─────────────────────────────────────────────────────────────
export function totalCompletedTasks(tasks: AgentTask[]): number {
  return tasks.filter((t) => t.status === 'completed').length;
}
export function totalInProgressTasks(tasks: AgentTask[]): number {
  return tasks.filter((t) => t.status === 'in_progress' || t.status === 'needs_approval').length;
}
export function totalSpend(agents: Agent[]): number {
  return agents.reduce((sum, a) => sum + (a.budgetUsed || 0), 0);
}

export function agentById(agents: Agent[], id: string | null): Agent | null {
  if (!id) return null;
  return agents.find((a) => a.id === id) ?? null;
}
