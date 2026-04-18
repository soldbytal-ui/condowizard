'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { sendEmail, isResendConnected, wrapInEmailTemplate } from '@/lib/scale-email';
import { isTwilioConnected, initiateCall, pollCallStatus, transcribeRecording, formatDuration, type CallAnalysis } from '@/lib/scale-calls';

// ═══════════════════════════════════════════════════════════════
// Types (mirrors CRM page types with extended activity types)
// ═══════════════════════════════════════════════════════════════
type LeadStatus = 'new' | 'contacted' | 'showing' | 'offer' | 'under_contract' | 'closed' | 'lost';
type LeadSource = 'Website Form' | 'Google Ads' | 'Meta Ads' | 'Instagram' | 'Referral' | 'Walk-in' | 'Manual';

interface Activity {
  id: string;
  type: 'created' | 'status_changed' | 'note_added' | 'follow_up_scheduled' | 'campaign_sent' | 'edited' | 'email' | 'text' | 'call' | 'note' | 'inquiry' | 'ai_call';
  description: string;
  timestamp: string;
  meta?: Record<string, string>;
}

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  source: LeadSource;
  interest: string;
  budget: string;
  timeline: string;
  status: LeadStatus;
  notes: string;
  activities: Activity[];
  nextFollowUp: string | null;
  createdAt: string;
  updatedAt: string;
  assignedTo: string | null;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  done: boolean;
}

interface Deal {
  id: string;
  property: string;
  price: string;
  status: 'active' | 'pending' | 'closed' | 'lost';
}

interface StoredFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

// ═══════════════════════════════════════════════════════════════
// Design tokens
// ═══════════════════════════════════════════════════════════════
const INK = '#0B0D11';
const INK2 = '#141414';
const INK3 = '#1A1D25';
const PAPER = '#F3F0E8';
const ACCENT = '#FF4A1C';
const LINE = 'rgba(255,255,255,0.07)';
const MUTED = '#8B8FA3';
const GREEN = '#10B981';
const FONT_HEADING = "'Fraunces', Georgia, serif";
const FONT_BODY = "'Inter Tight', -apple-system, sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

// ═══════════════════════════════════════════════════════════════
// Stage meta
// ═══════════════════════════════════════════════════════════════
interface StageMeta { id: LeadStatus; label: string; accent: string; badgeColor: string; badgeBg: string }
const STAGES: StageMeta[] = [
  { id: 'new',            label: 'New',            accent: '#0066FF', badgeColor: '#93C5FD', badgeBg: 'rgba(0,102,255,0.16)' },
  { id: 'contacted',      label: 'Contacted',      accent: '#F59E0B', badgeColor: '#FCD34D', badgeBg: 'rgba(245,158,11,0.16)' },
  { id: 'showing',        label: 'Showing',        accent: '#8B5CF6', badgeColor: '#C4B5FD', badgeBg: 'rgba(139,92,246,0.16)' },
  { id: 'offer',          label: 'Offer',          accent: '#06B6D4', badgeColor: '#67E8F9', badgeBg: 'rgba(6,182,212,0.16)' },
  { id: 'under_contract', label: 'Under Contract', accent: '#10B981', badgeColor: '#6EE7B7', badgeBg: 'rgba(16,185,129,0.16)' },
  { id: 'closed',         label: 'Closed',         accent: '#047857', badgeColor: '#A7F3D0', badgeBg: 'rgba(4,120,87,0.22)' },
  { id: 'lost',           label: 'Lost',           accent: '#6B7185', badgeColor: '#9CA3AF', badgeBg: 'rgba(107,113,133,0.18)' },
];

const SOURCES: LeadSource[] = ['Website Form', 'Google Ads', 'Meta Ads', 'Instagram', 'Referral', 'Walk-in', 'Manual'];
const BUDGETS = ['Under $500K', '$500K-$750K', '$750K-$1M', '$1M-$1.5M', '$1.5M-$2M', '$2M+'];
const TIMELINES = ['Immediately', '1-3 months', '3-6 months', '6-12 months', '12+ months'];

const CRM_LEADS_KEY = 'scale-crm-leads';
const EMAIL_TEMPLATES_KEY = 'scale-email-templates';

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════
function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}
function nowIso() { return new Date().toISOString(); }
function stageMeta(s: LeadStatus): StageMeta {
  return STAGES.find((x) => x.id === s) || STAGES[0];
}
function daysAgo(iso: string): number {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 0;
  return Math.max(0, Math.round((Date.now() - d.getTime()) / 86400000));
}
function timeAgo(iso: string): string {
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
function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}
function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
}

// ═══════════════════════════════════════════════════════════════
// localStorage helpers
// ═══════════════════════════════════════════════════════════════
function loadLeads(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CRM_LEADS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}
function saveLeads(leads: Lead[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(CRM_LEADS_KEY, JSON.stringify(leads)); } catch { /* ignore */ }
}
function loadTasks(leadId: string): Task[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`scale-crm-tasks-${leadId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}
function saveTasks(leadId: string, tasks: Task[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(`scale-crm-tasks-${leadId}`, JSON.stringify(tasks)); } catch { /* ignore */ }
}
function loadFiles(leadId: string): StoredFile[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`scale-crm-files-${leadId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}
function saveFiles(leadId: string, files: StoredFile[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(`scale-crm-files-${leadId}`, JSON.stringify(files)); } catch { /* ignore */ }
}
function loadDeals(leadId: string): Deal[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`scale-crm-deals-${leadId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}
function saveDeals(leadId: string, deals: Deal[]) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(`scale-crm-deals-${leadId}`, JSON.stringify(deals)); } catch { /* ignore */ }
}

// ═══════════════════════════════════════════════════════════════
// Default email templates
// ═══════════════════════════════════════════════════════════════
const DEFAULT_TEMPLATES: EmailTemplate[] = [
  {
    id: 'tpl_intro',
    name: 'Introduction',
    subject: 'Great to connect, {firstName}',
    body: `Hi {firstName},

Thank you for reaching out about {interest}. I'm excited to help you find the perfect property.

I specialize in pre-construction condos in Toronto and have access to exclusive pricing and first-access to new developments in {neighborhood}.

With your budget of {budget}, I have some excellent options that I think you'll love. Would you be available for a quick call this week to discuss what you're looking for?

Best regards,
Tal Shelef
CondoWizard`,
  },
  {
    id: 'tpl_followup',
    name: 'Follow Up',
    subject: 'Following up on {interest}',
    body: `Hi {firstName},

I wanted to follow up on our conversation about {interest}. I've been keeping an eye on new listings and developments that match your criteria.

There are a few exciting options in {neighborhood} that just became available within your {budget} budget range. I'd love to walk you through them.

When would be a good time to connect?

Best,
Tal Shelef`,
  },
  {
    id: 'tpl_stillbuying',
    name: 'Still Buying',
    subject: 'Are you still looking, {firstName}?',
    body: `Hi {firstName},

I hope you're doing well! I wanted to check in and see if you're still looking for {interest}.

The market has been moving quickly lately, and I've seen some great opportunities come up in {neighborhood}. I don't want you to miss out on something perfect.

If your timeline or needs have changed, I completely understand. Just let me know how I can best help.

Cheers,
Tal Shelef`,
  },
  {
    id: 'tpl_nurture',
    name: 'Nurture Lead',
    subject: 'Market update for {neighborhood}',
    body: `Hi {firstName},

I wanted to share a quick market update for {neighborhood} that I think you'll find interesting.

We've seen some significant developments recently, including new project launches and pricing changes that could impact your search for {interest}.

I've put together some insights specifically for buyers in the {budget} range. Would you like me to send those over?

Looking forward to hearing from you,
Tal Shelef`,
  },
  {
    id: 'tpl_custom',
    name: 'Custom',
    subject: '',
    body: '',
  },
];

function seedEmailTemplates() {
  if (typeof window === 'undefined') return;
  try {
    const existing = window.localStorage.getItem(EMAIL_TEMPLATES_KEY);
    if (!existing) {
      window.localStorage.setItem(EMAIL_TEMPLATES_KEY, JSON.stringify(DEFAULT_TEMPLATES));
    }
  } catch { /* ignore */ }
}

function loadEmailTemplates(): EmailTemplate[] {
  if (typeof window === 'undefined') return DEFAULT_TEMPLATES;
  try {
    const raw = window.localStorage.getItem(EMAIL_TEMPLATES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return DEFAULT_TEMPLATES;
}

// ═══════════════════════════════════════════════════════════════
// Activity icon colors
// ═══════════════════════════════════════════════════════════════
const ACTIVITY_COLORS: Record<string, string> = {
  email: '#3B82F6',
  text: '#10B981',
  call: '#FF4A1C',
  note: '#F59E0B',
  note_added: '#F59E0B',
  inquiry: '#EF4444',
  created: '#8B5CF6',
  status_changed: '#06B6D4',
  follow_up_scheduled: '#0066FF',
  campaign_sent: '#EC4899',
  edited: '#6B7185',
  ai_call: '#B670E8',
};

const ACTIVITY_ICONS: Record<string, string> = {
  email: '\u2709',     // envelope
  text: '\uD83D\uDCAC', // speech bubble (will render as text fallback)
  call: '\uD83D\uDCDE', // telephone
  note: '\uD83D\uDCDD', // memo
  note_added: '\uD83D\uDCDD',
  inquiry: '\u2757',   // exclamation
  created: '\u2728',   // sparkles
  status_changed: '\u27A1', // arrow
  follow_up_scheduled: '\uD83D\uDCC5', // calendar
  campaign_sent: '\uD83D\uDCE7', // email
  edited: '\u270F',    // pencil
  ai_call: '\uD83E\uDD16', // robot
};

// ═══════════════════════════════════════════════════════════════
// Main Page Component
// ═══════════════════════════════════════════════════════════════
export default function LeadDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [lead, setLead] = useState<Lead | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Composer state
  const [activeTab, setActiveTab] = useState<'email' | 'note' | 'text' | 'call' | 'ai_call'>('email');

  // Email composer
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  // Note composer
  const [noteBody, setNoteBody] = useState('');

  // Text composer
  const [textBody, setTextBody] = useState('');

  // Call log (manual)
  const [callOutcome, setCallOutcome] = useState('Connected');
  const [callDuration, setCallDuration] = useState('');
  const [callNotes, setCallNotes] = useState('');

  // Twilio call state
  const [twilioCallSid, setTwilioCallSid] = useState<string | null>(null);
  const [twilioCallStatus, setTwilioCallStatus] = useState<string>('');
  const [twilioCallTimer, setTwilioCallTimer] = useState(0);
  const [twilioProcessing, setTwilioProcessing] = useState<string>('');
  const twilioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const twilioPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // AI Call state
  const [aiCallAgentId, setAiCallAgentId] = useState('');
  const [aiCallStatus, setAiCallStatus] = useState<'' | 'confirming' | 'dialing' | 'in-progress' | 'completed'>('');
  const [aiCallConvId, setAiCallConvId] = useState('');
  const [voiceAgents, setVoiceAgents] = useState<Array<{ id: string; name: string; voiceName: string; templateId: string; vapiAssistantId: string | null }>>([]);

  // Timeline filter
  const [activityFilter, setActivityFilter] = useState<string>('all');

  // Detail editing
  const [editing, setEditing] = useState(false);
  const [editSource, setEditSource] = useState<LeadSource>('Website Form');
  const [editInterest, setEditInterest] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editTimeline, setEditTimeline] = useState('');
  const [editNextFollowUp, setEditNextFollowUp] = useState('');
  const [editAssignedTo, setEditAssignedTo] = useState('');

  // Status dropdown
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDate, setTaskDate] = useState('');

  // Files
  const [files, setFiles] = useState<StoredFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deals
  const [deals, setDeals] = useState<Deal[]>([]);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [dealProperty, setDealProperty] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [dealStatus, setDealStatus] = useState<Deal['status']>('active');

  // Activity expansion
  const [expandedActivities, setExpandedActivities] = useState<Set<string>>(new Set());

  // ── Load lead ─────────────────────────────────────────────────
  useEffect(() => {
    seedEmailTemplates();
    setTemplates(loadEmailTemplates());

    const leads = loadLeads();
    const found = leads.find(l => l.id === id);
    if (found) {
      setLead(found);
      setEmailTo(found.email || '');
      setEditSource(found.source);
      setEditInterest(found.interest);
      setEditBudget(found.budget);
      setEditTimeline(found.timeline);
      setEditNextFollowUp(found.nextFollowUp || '');
      setEditAssignedTo(found.assignedTo || '');
      setTasks(loadTasks(found.id));
      setFiles(loadFiles(found.id));
      setDeals(loadDeals(found.id));
    }
    // Load voice agents from localStorage
    try {
      const raw = localStorage.getItem('scale-voice-agents');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setVoiceAgents(parsed);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, [id]);

  // ── Save lead to localStorage ─────────────────────────────────
  const persistLead = useCallback((updated: Lead) => {
    setLead(updated);
    const leads = loadLeads();
    const idx = leads.findIndex(l => l.id === updated.id);
    if (idx >= 0) {
      leads[idx] = updated;
    } else {
      leads.push(updated);
    }
    saveLeads(leads);
  }, []);

  // ── Toast ─────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // ── Add activity ──────────────────────────────────────────────
  const addActivity = useCallback((type: Activity['type'], description: string, meta?: Record<string, string>) => {
    if (!lead) return;
    const activity: Activity = {
      id: uid('act'),
      type,
      description,
      timestamp: nowIso(),
      meta,
    };
    const updated: Lead = {
      ...lead,
      activities: [activity, ...lead.activities],
      updatedAt: nowIso(),
    };
    persistLead(updated);
  }, [lead, persistLead]);

  // ── Status change ─────────────────────────────────────────────
  const changeStatus = useCallback((newStatus: LeadStatus) => {
    if (!lead || lead.status === newStatus) return;
    const stage = stageMeta(newStatus);
    const activity: Activity = {
      id: uid('act'),
      type: 'status_changed',
      description: `Status changed to ${stage.label}.`,
      timestamp: nowIso(),
    };
    const updated: Lead = {
      ...lead,
      status: newStatus,
      activities: [activity, ...lead.activities],
      updatedAt: nowIso(),
    };
    persistLead(updated);
    setShowStatusDropdown(false);
    showToast(`Status updated to ${stage.label}`);
  }, [lead, persistLead, showToast]);

  // ── Template variable replacement ─────────────────────────────
  const replaceTemplateVars = useCallback((text: string): string => {
    if (!lead) return text;
    const { firstName, lastName } = splitName(lead.name);
    // Extract neighborhood from interest or use a fallback
    const neighborhood = lead.interest || 'your area';
    return text
      .replace(/\{firstName\}/g, firstName)
      .replace(/\{lastName\}/g, lastName)
      .replace(/\{interest\}/g, lead.interest || 'your property search')
      .replace(/\{neighborhood\}/g, neighborhood)
      .replace(/\{budget\}/g, lead.budget || 'your budget');
  }, [lead]);

  // ── Send email ────────────────────────────────────────────────
  const [emailSending, setEmailSending] = useState(false);

  const handleSendEmail = useCallback(async () => {
    if (!lead || !emailBody.trim() || !emailSubject.trim()) return;
    setEmailSending(true);

    // Try Resend first, fall back to local-only
    if (isResendConnected()) {
      const result = await sendEmail({
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
      });

      if (result.success) {
        addActivity('email', `Email sent to ${emailTo}\nSubject: ${emailSubject}\n\n${emailBody}`, {
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
          messageId: result.messageId || '',
          direction: 'outbound',
        });
        setEmailSubject('');
        setEmailBody('');
        showToast(`Email sent to ${lead.name}`);
      } else {
        // Show specific error messages
        showToast(result.error || 'Email failed to send');
      }
    } else {
      // Resend not connected — save as activity locally only
      addActivity('email', `Email sent to ${emailTo}\nSubject: ${emailSubject}\n\n${emailBody}`, {
        to: emailTo,
        subject: emailSubject,
        body: emailBody,
        direction: 'outbound',
      });
      setEmailSubject('');
      setEmailBody('');
      showToast('Email logged (connect Resend in Settings to send live)');
    }

    setEmailSending(false);
  }, [lead, emailTo, emailSubject, emailBody, addActivity, showToast]);

  // ── Save note ─────────────────────────────────────────────────
  const handleSaveNote = useCallback(() => {
    if (!lead || !noteBody.trim()) return;
    addActivity('note', noteBody.trim());
    setNoteBody('');
    showToast('Note saved');
  }, [lead, noteBody, addActivity, showToast]);

  // ── Send text ─────────────────────────────────────────────────
  const handleSendText = useCallback(() => {
    if (!lead || !textBody.trim()) return;
    // TODO: Connect to Twilio API for actual SMS delivery
    addActivity('text', `SMS sent to ${lead.phone}: ${textBody.trim()}`, {
      to: lead.phone,
      body: textBody.trim(),
    });
    setTextBody('');
    showToast('Text sent');
  }, [lead, textBody, addActivity, showToast]);

  // ── Log call ──────────────────────────────────────────────────
  const handleLogCall = useCallback(() => {
    if (!lead) return;
    const desc = `Call with ${lead.name} — ${callOutcome}${callDuration ? `, ${callDuration} min` : ''}${callNotes ? `\n${callNotes}` : ''}`;
    addActivity('call', desc, {
      outcome: callOutcome,
      duration: callDuration,
      notes: callNotes,
    });
    setCallOutcome('Connected');
    setCallDuration('');
    setCallNotes('');
    showToast('Call logged');
  }, [lead, callOutcome, callDuration, callNotes, addActivity, showToast]);

  // ── Twilio call ──────────────────────────────────────────────
  const handleStartTwilioCall = useCallback(async () => {
    if (!lead?.phone) { showToast('No phone number for this lead'); return; }
    setTwilioCallStatus('initiating');
    setTwilioCallTimer(0);

    const result = await initiateCall(lead.phone, lead.id, lead.name);
    if (!result.success) {
      showToast(result.error || 'Call failed');
      setTwilioCallStatus('');
      return;
    }

    setTwilioCallSid(result.callSid || null);
    setTwilioCallStatus('ringing');

    // Start timer when answered
    twilioPollRef.current = setInterval(async () => {
      if (!result.callSid) return;
      const poll = await pollCallStatus(result.callSid);
      const status = poll.status?.status || '';

      if (status === 'answered' || status === 'in-progress') {
        setTwilioCallStatus('in-progress');
        if (!twilioTimerRef.current) {
          twilioTimerRef.current = setInterval(() => {
            setTwilioCallTimer((t) => t + 1);
          }, 1000);
        }
      }

      if (status === 'completed' || status === 'failed' || status === 'busy' || status === 'no-answer' || status === 'canceled') {
        // Stop polling and timer
        if (twilioPollRef.current) { clearInterval(twilioPollRef.current); twilioPollRef.current = null; }
        if (twilioTimerRef.current) { clearInterval(twilioTimerRef.current); twilioTimerRef.current = null; }

        if (status !== 'completed') {
          setTwilioCallStatus('');
          showToast(`Call ${status}`);
          return;
        }

        setTwilioCallStatus('completed');
        setTwilioProcessing('Checking for recording...');

        // Poll for recording
        let recording = poll.recording;
        let attempts = 0;
        while (!recording && attempts < 12) {
          await new Promise((r) => setTimeout(r, 5000));
          const rePoll = await pollCallStatus(result.callSid!);
          recording = rePoll.recording;
          attempts++;
        }

        if (!recording) {
          addActivity('call', `Call with ${lead.name} — ${formatDuration(poll.status?.duration || 0)}. Recording not available.`, {
            outcome: 'completed',
            duration: String(poll.status?.duration || 0),
            callSid: result.callSid || '',
          });
          setTwilioCallStatus('');
          setTwilioProcessing('');
          showToast('Call completed (no recording captured)');
          return;
        }

        // Transcribe
        setTwilioProcessing('Transcribing call...');
        const txResult = await transcribeRecording(
          (recording as { recordingUrl: string }).recordingUrl,
          { name: lead.name, interest: lead.interest, budget: lead.budget, timeline: lead.timeline }
        );

        if (txResult.success && txResult.transcript) {
          setTwilioProcessing('Analyzing conversation...');
          await new Promise((r) => setTimeout(r, 500)); // Brief pause for UX

          const analysis = txResult.analysis as CallAnalysis | null;
          const desc = analysis?.summary || `Call with ${lead.name} — ${formatDuration(txResult.duration || 0)}`;

          addActivity('call', desc, {
            outcome: 'completed',
            duration: String(txResult.duration || 0),
            callSid: result.callSid || '',
            recordingUrl: (recording as { recordingUrl: string }).recordingUrl,
            transcript: txResult.transcript,
            ...(analysis ? {
              summary: analysis.summary,
              sentiment: analysis.sentiment,
              engagementLevel: analysis.engagementLevel,
              actionItems: JSON.stringify(analysis.actionItems || []),
              suggestedStatus: analysis.suggestedStatus || '',
              followUpRecommendation: analysis.followUpRecommendation || '',
              followUpTiming: analysis.followUpTiming || '',
            } : {}),
          });
          showToast('Call transcribed and analyzed');
        } else {
          addActivity('call', `Call with ${lead.name} — ${formatDuration((recording as { duration: number }).duration || 0)}`, {
            outcome: 'completed',
            duration: String((recording as { duration: number }).duration || 0),
            callSid: result.callSid || '',
            recordingUrl: (recording as { recordingUrl: string }).recordingUrl,
          });
          showToast(txResult.error || 'Call completed (transcription unavailable)');
        }

        setTwilioCallStatus('');
        setTwilioProcessing('');
      }
    }, 3000);
  }, [lead, addActivity, showToast]);

  // Cleanup Twilio intervals on unmount
  useEffect(() => {
    return () => {
      if (twilioTimerRef.current) clearInterval(twilioTimerRef.current);
      if (twilioPollRef.current) clearInterval(twilioPollRef.current);
    };
  }, []);

  // ── AI Call ───────────────────────────────────────────────────
  const handleAiCall = useCallback(async () => {
    if (!lead?.phone || !aiCallAgentId) return;
    setAiCallStatus('dialing');

    try {
      const integrations = JSON.parse(localStorage.getItem('scale-integrations') || '{}');
      const elevenLabsKey = integrations.elevenlabs?.apiKey;
      const twilioConfig = integrations.twilio;

      if (!elevenLabsKey) {
        showToast('Connect ElevenLabs in Settings first');
        setAiCallStatus('');
        return;
      }

      const agent = voiceAgents.find(a => a.id === aiCallAgentId);
      const res = await fetch('/api/admin/scale/voice-agents/call/outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          elevenLabsApiKey: elevenLabsKey,
          agentId: agent?.vapiAssistantId || aiCallAgentId,
          agentPhoneNumberId: twilioConfig?.elevenLabsPhoneId || undefined,
          leadPhone: lead.phone,
          leadContext: {
            name: lead.name,
            interest: lead.interest,
            budget: lead.budget,
            timeline: lead.timeline,
            neighborhood: lead.interest,
          },
        }),
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.error || 'AI call failed');
        setAiCallStatus('');
        return;
      }

      setAiCallConvId(data.conversationId || '');
      setAiCallStatus('in-progress');

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/admin/scale/voice-agents/webhook?callId=${data.conversationId}`);
          const pollData = await pollRes.json();
          if (pollData.result) {
            clearInterval(pollInterval);
            const r = pollData.result as Record<string, unknown>;
            addActivity('ai_call', (r.summary as string) || `AI call with ${lead.name} — ${Math.round((r.duration as number) || 0)}s`, {
              agentName: agent?.name || 'Voice Agent',
              duration: String(r.duration || 0),
              transcript: (r.transcript as string) || '',
              summary: (r.summary as string) || '',
              conversationId: data.conversationId,
              recordingUrl: (r.recordingUrl as string) || '',
              status: (r.status as string) || 'completed',
            });
            setAiCallStatus('completed');
            showToast('AI call completed — transcript saved');
            setTimeout(() => setAiCallStatus(''), 3000);
          }
        } catch { /* keep polling */ }
      }, 10000);

      // Stop polling after 10 minutes max
      setTimeout(() => {
        clearInterval(pollInterval);
        if (aiCallStatus === 'in-progress') {
          addActivity('ai_call', `AI call with ${lead.name} — result pending`, {
            agentName: agent?.name || 'Voice Agent',
            conversationId: data.conversationId,
            status: 'pending',
          });
          setAiCallStatus('');
          showToast('Call may still be in progress. Results will appear when available.');
        }
      }, 600000);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'AI call failed');
      setAiCallStatus('');
    }
  }, [lead, aiCallAgentId, voiceAgents, addActivity, showToast, aiCallStatus]);

  // ── Save detail edits ─────────────────────────────────────────
  const handleSaveDetails = useCallback(() => {
    if (!lead) return;
    const updated: Lead = {
      ...lead,
      source: editSource,
      interest: editInterest,
      budget: editBudget,
      timeline: editTimeline,
      nextFollowUp: editNextFollowUp || null,
      assignedTo: editAssignedTo || null,
      updatedAt: nowIso(),
      activities: [
        { id: uid('act'), type: 'edited', description: 'Lead details updated.', timestamp: nowIso() },
        ...lead.activities,
      ],
    };
    persistLead(updated);
    setEditing(false);
    showToast('Details saved');
  }, [lead, editSource, editInterest, editBudget, editTimeline, editNextFollowUp, editAssignedTo, persistLead, showToast]);

  // ── Tasks ─────────────────────────────────────────────────────
  const handleAddTask = useCallback(() => {
    if (!taskTitle.trim()) return;
    const newTask: Task = { id: uid('task'), title: taskTitle.trim(), dueDate: taskDate || '', done: false };
    const updated = [...tasks, newTask];
    setTasks(updated);
    saveTasks(id, updated);
    setTaskTitle('');
    setTaskDate('');
    setShowAddTask(false);
    showToast('Task added');
  }, [taskTitle, taskDate, tasks, id, showToast]);

  const toggleTask = useCallback((taskId: string) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    setTasks(updated);
    saveTasks(id, updated);
  }, [tasks, id]);

  // ── Files ─────────────────────────────────────────────────────
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const reader = new FileReader();
    reader.onload = () => {
      const storedFile: StoredFile = {
        id: uid('file'),
        name: file.name,
        size: file.size,
        type: file.type,
        data: reader.result as string,
      };
      const updated = [...files, storedFile];
      setFiles(updated);
      saveFiles(id, updated);
      showToast('File uploaded');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [files, id, showToast]);

  const deleteFile = useCallback((fileId: string) => {
    const updated = files.filter(f => f.id !== fileId);
    setFiles(updated);
    saveFiles(id, updated);
  }, [files, id]);

  // ── Deals ─────────────────────────────────────────────────────
  const handleAddDeal = useCallback(() => {
    if (!dealProperty.trim()) return;
    const deal: Deal = { id: uid('deal'), property: dealProperty.trim(), price: dealPrice.trim(), status: dealStatus };
    const updated = [...deals, deal];
    setDeals(updated);
    saveDeals(id, updated);
    setDealProperty('');
    setDealPrice('');
    setDealStatus('active');
    setShowAddDeal(false);
    showToast('Deal added');
  }, [dealProperty, dealPrice, dealStatus, deals, id, showToast]);

  // ── Filtered activities ───────────────────────────────────────
  const filteredActivities = lead ? lead.activities.filter(a => {
    if (activityFilter === 'all') return true;
    if (activityFilter === 'emails') return a.type === 'email' || a.type === 'campaign_sent';
    if (activityFilter === 'texts') return a.type === 'text';
    if (activityFilter === 'calls') return a.type === 'call' || a.type === 'ai_call';
    if (activityFilter === 'notes') return a.type === 'note' || a.type === 'note_added';
    if (activityFilter === 'inquiries') return a.type === 'inquiry' || a.type === 'created';
    return true;
  }) : [];

  const activityCounts = lead ? {
    all: lead.activities.length,
    emails: lead.activities.filter(a => a.type === 'email' || a.type === 'campaign_sent').length,
    texts: lead.activities.filter(a => a.type === 'text').length,
    calls: lead.activities.filter(a => a.type === 'call' || a.type === 'ai_call').length,
    notes: lead.activities.filter(a => a.type === 'note' || a.type === 'note_added').length,
    inquiries: lead.activities.filter(a => a.type === 'inquiry' || a.type === 'created').length,
  } : { all: 0, emails: 0, texts: 0, calls: 0, notes: 0, inquiries: 0 };

  // ── Toggle activity expansion ─────────────────────────────────
  const toggleExpand = (actId: string) => {
    setExpandedActivities(prev => {
      const next = new Set(prev);
      if (next.has(actId)) next.delete(actId);
      else next.add(actId);
      return next;
    });
  };

  // ── Loading / Not found ───────────────────────────────────────
  if (!hydrated) {
    return (
      <div style={{ background: INK, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, color: MUTED }}>
        Loading...
      </div>
    );
  }

  if (!lead) {
    return (
      <div style={{ background: INK, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_BODY, color: MUTED, gap: 16 }}>
        <div style={{ fontSize: 18 }}>Lead not found</div>
        <button
          onClick={() => router.push('/admin/scale/crm')}
          style={{ padding: '10px 24px', borderRadius: 10, background: ACCENT, color: '#fff', border: 'none', cursor: 'pointer', fontFamily: FONT_BODY, fontSize: 14, fontWeight: 600 }}
        >
          Back to CRM
        </button>
      </div>
    );
  }

  const stage = stageMeta(lead.status);
  const daysSinceCreated = daysAgo(lead.createdAt);

  // ═══════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ background: INK, minHeight: '100vh', fontFamily: FONT_BODY, color: PAPER, fontSize: 14, lineHeight: 1.6 }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        @keyframes toastIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .lead-detail-scroll::-webkit-scrollbar { width: 6px; }
        .lead-detail-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .lead-detail-scroll::-webkit-scrollbar-track { background: transparent; }
      `}</style>

      {/* ── TOP BAR ─────────────────────────────────────────────── */}
      <div style={{
        padding: '16px 32px',
        borderBottom: `1px solid ${LINE}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexWrap: 'wrap',
        background: INK2,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <button
            onClick={() => router.push('/admin/scale/crm')}
            style={{
              background: 'none', border: 'none', color: MUTED, cursor: 'pointer',
              fontFamily: FONT_BODY, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span style={{ fontSize: 16 }}>&larr;</span> CRM
          </button>

          <h1 style={{ fontFamily: FONT_HEADING, fontSize: 24, fontWeight: 600, color: PAPER, margin: 0 }}>
            {lead.name}
          </h1>

          {/* Status badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', borderRadius: 100,
            background: stage.badgeBg, color: stage.badgeColor,
            fontSize: 12, fontWeight: 600,
            border: `1px solid ${stage.accent}40`,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage.accent }} />
            {stage.label}
          </span>

          {/* Status dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              style={{
                padding: '5px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${LINE}`,
                color: MUTED, fontSize: 12, cursor: 'pointer', fontFamily: FONT_BODY,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              Change
              <span style={{ fontSize: 10 }}>&#x25BC;</span>
            </button>
            {showStatusDropdown && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 4, zIndex: 100,
                background: INK3, border: `1px solid ${LINE}`, borderRadius: 10,
                padding: 6, minWidth: 160, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}>
                {STAGES.map(s => (
                  <button
                    key={s.id}
                    onClick={() => changeStatus(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      width: '100%', padding: '8px 12px', borderRadius: 6,
                      background: lead.status === s.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: 'none', color: PAPER, fontSize: 13, cursor: 'pointer',
                      fontFamily: FONT_BODY, textAlign: 'left',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.accent }} />
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Call', icon: '\uD83D\uDCDE', action: () => { setActiveTab('call'); } },
            { label: 'Email', icon: '\u2709', action: () => { setActiveTab('email'); } },
            { label: 'SMS', icon: '\uD83D\uDCAC', action: () => { setActiveTab('text'); } },
          ].map(btn => (
            <button
              key={btn.label}
              onClick={btn.action}
              style={{
                padding: '8px 16px', borderRadius: 8,
                background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`,
                color: PAPER, fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY,
                display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
              }}
            >
              <span>{btn.icon}</span> {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Close status dropdown on outside click */}
      {showStatusDropdown && (
        <div
          onClick={() => setShowStatusDropdown(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
        />
      )}

      {/* ── 3-COLUMN LAYOUT ─────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        maxWidth: 1600,
        margin: '0 auto',
        padding: '24px 32px',
        gap: 24,
        animation: 'fadeIn 0.3s ease',
        alignItems: 'flex-start',
      }}>

        {/* ═══ LEFT COLUMN (300px) ═══════════════════════════════ */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Contact Info Card */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 24,
            border: `1px solid ${LINE}`,
          }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: `linear-gradient(135deg, ${stage.accent}, ${ACCENT})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700, color: '#fff', fontFamily: FONT_BODY,
              }}>
                {getInitials(lead.name)}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 16, color: PAPER }}>{lead.name}</div>
              </div>
            </div>

            {/* Email */}
            {lead.email && (
              <div style={{ marginBottom: 10 }}>
                <a href={`mailto:${lead.email}`} style={{ color: PAPER, fontFamily: FONT_MONO, fontSize: 13, textDecoration: 'none', opacity: 0.9 }}>
                  {lead.email}
                </a>
              </div>
            )}

            {/* Phone */}
            {lead.phone && (
              <div style={{ marginBottom: 14 }}>
                <a href={`tel:${lead.phone}`} style={{ color: PAPER, fontFamily: FONT_MONO, fontSize: 13, textDecoration: 'none', opacity: 0.9 }}>
                  {lead.phone}
                </a>
              </div>
            )}

            {/* Source badge */}
            <div style={{ marginBottom: 12 }}>
              <span style={{
                display: 'inline-block', padding: '4px 12px', borderRadius: 100,
                background: 'rgba(255,255,255,0.06)', color: MUTED,
                fontSize: 12, fontWeight: 500,
              }}>
                {lead.source}
              </span>
            </div>

            {/* Created */}
            <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: MUTED }}>
              Created {daysSinceCreated === 0 ? 'today' : `${daysSinceCreated} day${daysSinceCreated === 1 ? '' : 's'} ago`}
            </div>
          </div>

          {/* Lead Details Card */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 24,
            border: `1px solid ${LINE}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: PAPER }}>Lead Details</div>
              <button
                onClick={() => {
                  if (editing) handleSaveDetails();
                  else setEditing(true);
                }}
                style={{
                  padding: '4px 12px', borderRadius: 6,
                  background: editing ? ACCENT : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${editing ? ACCENT : LINE}`,
                  color: editing ? '#fff' : MUTED, fontSize: 12, cursor: 'pointer',
                  fontFamily: FONT_BODY, fontWeight: 500,
                }}
              >
                {editing ? 'Save' : 'Edit'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <DetailRow label="Source">
                {editing ? (
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value as LeadSource)}
                    style={inlineSelectStyle()}
                  >
                    {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <span style={{ color: PAPER, fontSize: 13 }}>{lead.source}</span>
                )}
              </DetailRow>
              <DetailRow label="Interest">
                {editing ? (
                  <input
                    value={editInterest}
                    onChange={(e) => setEditInterest(e.target.value)}
                    style={inlineInputStyle()}
                  />
                ) : (
                  <span style={{ color: PAPER, fontSize: 13 }}>{lead.interest || '\u2014'}</span>
                )}
              </DetailRow>
              <DetailRow label="Budget">
                {editing ? (
                  <select
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    style={inlineSelectStyle()}
                  >
                    {BUDGETS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                ) : (
                  <span style={{ color: PAPER, fontSize: 13 }}>{lead.budget || '\u2014'}</span>
                )}
              </DetailRow>
              <DetailRow label="Timeline">
                {editing ? (
                  <select
                    value={editTimeline}
                    onChange={(e) => setEditTimeline(e.target.value)}
                    style={inlineSelectStyle()}
                  >
                    {TIMELINES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ) : (
                  <span style={{ color: PAPER, fontSize: 13 }}>{lead.timeline || '\u2014'}</span>
                )}
              </DetailRow>
              <DetailRow label="Next Follow-Up">
                {editing ? (
                  <input
                    type="date"
                    value={editNextFollowUp}
                    onChange={(e) => setEditNextFollowUp(e.target.value)}
                    style={inlineInputStyle()}
                  />
                ) : (
                  <span style={{ color: PAPER, fontSize: 13 }}>
                    {lead.nextFollowUp ? formatDate(lead.nextFollowUp) : '\u2014'}
                  </span>
                )}
              </DetailRow>
              <DetailRow label="Assigned To">
                {editing ? (
                  <input
                    value={editAssignedTo}
                    onChange={(e) => setEditAssignedTo(e.target.value)}
                    style={inlineInputStyle()}
                  />
                ) : (
                  <span style={{ color: PAPER, fontSize: 13 }}>{lead.assignedTo || '\u2014'}</span>
                )}
              </DetailRow>
            </div>

            {editing && (
              <button
                onClick={() => setEditing(false)}
                style={{
                  marginTop: 12, padding: '4px 12px', borderRadius: 6,
                  background: 'transparent', border: `1px solid ${LINE}`,
                  color: MUTED, fontSize: 12, cursor: 'pointer', fontFamily: FONT_BODY,
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* ═══ MIDDLE COLUMN (flex 1) ════════════════════════════ */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tab bar */}
          <div style={{
            display: 'flex', gap: 4, padding: 4,
            background: INK2, borderRadius: 10, border: `1px solid ${LINE}`,
          }}>
            {([
              { id: 'email' as const, label: 'Email' },
              { id: 'note' as const, label: 'Note' },
              { id: 'text' as const, label: 'Text' },
              { id: 'call' as const, label: 'Log Call' },
              { id: 'ai_call' as const, label: 'AI Call' },
            ]).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 8,
                  background: activeTab === tab.id ? ACCENT : 'transparent',
                  color: activeTab === tab.id ? '#fff' : MUTED,
                  border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: FONT_BODY, transition: 'background 0.15s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Composer area */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 24,
            border: `1px solid ${LINE}`,
          }}>

            {/* ── EMAIL TAB ──────────────────────────────────────── */}
            {activeTab === 'email' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, fontWeight: 500, display: 'block', marginBottom: 6 }}>To</label>
                  <input
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    style={composerInputStyle()}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, fontWeight: 500, display: 'block', marginBottom: 6 }}>Subject</label>
                  <input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject"
                    style={composerInputStyle()}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: MUTED, fontWeight: 500, display: 'block', marginBottom: 6 }}>Body</label>
                  <textarea
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Write your email..."
                    style={{
                      ...composerInputStyle(),
                      minHeight: 200, resize: 'vertical',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {/* Templates dropdown */}
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowTemplates(!showTemplates)}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`,
                        color: MUTED, fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      Templates <span style={{ fontSize: 10 }}>&#x25BC;</span>
                    </button>
                    {showTemplates && (
                      <>
                        <div
                          onClick={() => setShowTemplates(false)}
                          style={{ position: 'fixed', inset: 0, zIndex: 98 }}
                        />
                        <div style={{
                          position: 'absolute', bottom: '100%', left: 0, marginBottom: 4, zIndex: 100,
                          background: INK3, border: `1px solid ${LINE}`, borderRadius: 10,
                          padding: 6, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                        }}>
                          {templates.map(tpl => (
                            <button
                              key={tpl.id}
                              onClick={() => {
                                setEmailSubject(replaceTemplateVars(tpl.subject));
                                setEmailBody(replaceTemplateVars(tpl.body));
                                setShowTemplates(false);
                              }}
                              style={{
                                display: 'block', width: '100%', padding: '8px 12px', borderRadius: 6,
                                background: 'transparent', border: 'none', color: PAPER,
                                fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY, textAlign: 'left',
                              }}
                            >
                              {tpl.name}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={handleSendEmail}
                    disabled={!emailBody.trim() || !emailSubject.trim() || emailSending}
                    style={{
                      padding: '10px 24px', borderRadius: 8,
                      background: (emailBody.trim() && emailSubject.trim() && !emailSending) ? ACCENT : 'rgba(255,255,255,0.05)',
                      color: (emailBody.trim() && emailSubject.trim() && !emailSending) ? '#fff' : MUTED,
                      border: 'none', fontSize: 14, fontWeight: 600,
                      cursor: (emailBody.trim() && emailSubject.trim() && !emailSending) ? 'pointer' : 'not-allowed',
                      fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    {emailSending ? (
                      <><span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Sending...</>
                    ) : (
                      <>Send Email →</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ── NOTE TAB ───────────────────────────────────────── */}
            {activeTab === 'note' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Write a note about this lead..."
                  style={{
                    ...composerInputStyle(),
                    minHeight: 160, resize: 'vertical',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSaveNote}
                    disabled={!noteBody.trim()}
                    style={{
                      padding: '10px 24px', borderRadius: 8,
                      background: noteBody.trim() ? ACCENT : 'rgba(255,255,255,0.05)',
                      color: noteBody.trim() ? '#fff' : MUTED,
                      border: 'none', fontSize: 14, fontWeight: 600,
                      cursor: noteBody.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: FONT_BODY,
                    }}
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}

            {/* ── TEXT TAB ───────────────────────────────────────── */}
            {activeTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* TODO: Connect to Twilio API for actual SMS delivery */}
                <div style={{ position: 'relative' }}>
                  <textarea
                    value={textBody}
                    onChange={(e) => {
                      if (e.target.value.length <= 320) setTextBody(e.target.value);
                    }}
                    placeholder={`Send a text to ${lead.phone || 'this lead'}...`}
                    style={{
                      ...composerInputStyle(),
                      minHeight: 120, resize: 'vertical',
                    }}
                  />
                  <span style={{
                    position: 'absolute', bottom: 12, right: 12,
                    fontSize: 12, fontFamily: FONT_MONO,
                    color: textBody.length > 160 ? '#F59E0B' : MUTED,
                  }}>
                    {textBody.length}/160
                    {textBody.length > 160 && ` (${Math.ceil(textBody.length / 160)} segments)`}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleSendText}
                    disabled={!textBody.trim()}
                    style={{
                      padding: '10px 24px', borderRadius: 8,
                      background: textBody.trim() ? ACCENT : 'rgba(255,255,255,0.05)',
                      color: textBody.trim() ? '#fff' : MUTED,
                      border: 'none', fontSize: 14, fontWeight: 600,
                      cursor: textBody.trim() ? 'pointer' : 'not-allowed',
                      fontFamily: FONT_BODY,
                    }}
                  >
                    Send Text
                  </button>
                </div>
              </div>
            )}

            {/* ── CALL TAB ───────────────────────────────────────── */}
            {activeTab === 'call' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Twilio Call Section */}
                {isTwilioConnected() && lead?.phone && (
                  <div style={{ background: INK3, borderRadius: 12, border: `1px solid ${LINE}`, padding: 18 }}>
                    <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                      TWILIO VOICE CALL
                    </div>
                    {twilioCallStatus === '' ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: 14, color: PAPER, marginBottom: 4 }}>Call <strong>{lead.name}</strong> at {lead.phone}</div>
                          <div style={{ fontSize: 11, color: MUTED }}>Your phone will ring first, then we connect to the lead. Call is recorded and transcribed.</div>
                        </div>
                        <button onClick={handleStartTwilioCall} style={{ padding: '10px 22px', borderRadius: 8, background: '#10B981', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                          Start Call
                        </button>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        {twilioCallStatus === 'initiating' && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#10B981', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ fontSize: 14, color: PAPER }}>Starting call...</span>
                          </div>
                        )}
                        {twilioCallStatus === 'ringing' && (
                          <div>
                            <div style={{ fontSize: 14, color: '#F59E0B', marginBottom: 4 }}>Calling your phone... Answer to connect</div>
                            <div style={{ fontSize: 11, color: MUTED }}>Your phone should ring shortly</div>
                          </div>
                        )}
                        {twilioCallStatus === 'in-progress' && (
                          <div>
                            <div style={{ fontSize: 20, fontFamily: FONT_MONO, color: '#10B981', marginBottom: 4 }}>
                              {Math.floor(twilioCallTimer / 60).toString().padStart(2, '0')}:{(twilioCallTimer % 60).toString().padStart(2, '0')}
                            </div>
                            <div style={{ fontSize: 13, color: PAPER }}>Call in progress with {lead.name}</div>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', margin: '8px auto 0', animation: 'pulse 2s infinite ease-in-out' }} />
                          </div>
                        )}
                        {twilioCallStatus === 'completed' && twilioProcessing && (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                            <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            <span style={{ fontSize: 14, color: PAPER }}>{twilioProcessing}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!isTwilioConnected() && (
                  <div style={{ background: INK3, borderRadius: 12, border: `1px solid ${LINE}`, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: 12, color: MUTED }}>Connect Twilio in Settings to make calls with recording + AI transcription</div>
                    <a href="/admin/scale/settings" style={{ fontSize: 11, color: ACCENT, fontWeight: 600, fontFamily: FONT_MONO, textDecoration: 'none' }}>SETTINGS →</a>
                  </div>
                )}

                {/* Manual call log (always available) */}
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                    LOG A CALL MANUALLY
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 12, color: MUTED, fontWeight: 500, display: 'block', marginBottom: 6 }}>Outcome</label>
                      <select value={callOutcome} onChange={(e) => setCallOutcome(e.target.value)} style={composerInputStyle()}>
                        {['Connected', 'Left voicemail', 'No answer', 'Wrong number', 'Disconnected'].map(o => (
                          <option key={o} value={o} style={{ background: INK3, color: PAPER }}>{o}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: MUTED, fontWeight: 500, display: 'block', marginBottom: 6 }}>Duration (minutes)</label>
                      <input type="number" min="0" value={callDuration} onChange={(e) => setCallDuration(e.target.value)} placeholder="0" style={composerInputStyle()} />
                    </div>
                  </div>
                  <div style={{ marginTop: 14 }}>
                    <label style={{ fontSize: 12, color: MUTED, fontWeight: 500, display: 'block', marginBottom: 6 }}>Notes</label>
                    <textarea value={callNotes} onChange={(e) => setCallNotes(e.target.value)} placeholder="Call notes..." style={{ ...composerInputStyle(), minHeight: 80, resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                    <button onClick={handleLogCall} style={{ padding: '10px 24px', borderRadius: 8, background: ACCENT, color: '#fff', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY }}>
                      Log Call
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── AI CALL TAB ───────────────────────────────────── */}
            {activeTab === 'ai_call' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {voiceAgents.length === 0 ? (
                  <div style={{ background: INK3, borderRadius: 12, border: `1px solid ${LINE}`, padding: 24, textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: PAPER, marginBottom: 8 }}>No voice agents configured</div>
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 16 }}>Create an AI voice agent to make autonomous calls.</div>
                    <a href="/admin/scale/voice-agents" style={{ padding: '8px 18px', borderRadius: 8, background: ACCENT, color: '#fff', fontSize: 12, fontWeight: 600, fontFamily: FONT_BODY, textDecoration: 'none' }}>
                      Create voice agent →
                    </a>
                  </div>
                ) : aiCallStatus === '' || aiCallStatus === 'confirming' ? (
                  <>
                    <div style={{ background: INK3, borderRadius: 12, border: `1px solid ${LINE}`, padding: 18 }}>
                      <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                        SEND AN AI AGENT TO CALL THIS LEAD
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <label style={{ fontSize: 12, color: MUTED, display: 'block', marginBottom: 6 }}>Which voice agent?</label>
                        <select value={aiCallAgentId} onChange={(e) => setAiCallAgentId(e.target.value)} style={{ ...composerInputStyle(), cursor: 'pointer' }}>
                          <option value="" style={{ background: INK3, color: PAPER }}>Select an agent...</option>
                          {voiceAgents.map(a => (
                            <option key={a.id} value={a.id} style={{ background: INK3, color: PAPER }}>{a.name} ({a.voiceName})</option>
                          ))}
                        </select>
                      </div>

                      {aiCallAgentId && (() => {
                        const agent = voiceAgents.find(a => a.id === aiCallAgentId);
                        return agent ? (
                          <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: `1px solid ${LINE}`, padding: 14, marginBottom: 14 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #8B3FBF, #B670E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_HEADING, fontSize: 14, fontStyle: 'italic', color: '#fff' }}>AI</div>
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: PAPER }}>{agent.name}</div>
                                <div style={{ fontSize: 11, color: MUTED }}>Voice: {agent.voiceName}</div>
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                              <strong style={{ color: PAPER }}>Lead context:</strong> {lead?.name} · {lead?.interest || 'No interest'} · {lead?.budget || 'No budget'} · {lead?.timeline || 'No timeline'}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {aiCallStatus === 'confirming' ? (
                        <div style={{ background: 'rgba(255,74,28,0.06)', borderRadius: 10, border: '1px solid rgba(255,74,28,0.15)', padding: 14, marginBottom: 14, fontSize: 12, color: MUTED }}>
                          <strong style={{ color: PAPER }}>Confirm:</strong> AI agent will call <strong style={{ color: PAPER }}>{lead?.name}</strong> at {lead?.phone}. Cost: ~$0.50–$1.00.
                          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                            <button onClick={handleAiCall} style={{ padding: '8px 18px', borderRadius: 8, background: '#10B981', border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY }}>
                              Confirm & Call
                            </button>
                            <button onClick={() => setAiCallStatus('')} style={{ padding: '8px 14px', borderRadius: 8, background: 'transparent', border: `1px solid ${LINE}`, color: MUTED, fontSize: 12, cursor: 'pointer', fontFamily: FONT_BODY }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => { if (!aiCallAgentId) { showToast('Select an agent first'); return; } if (!lead?.phone) { showToast('Lead has no phone number'); return; } setAiCallStatus('confirming'); }}
                          disabled={!aiCallAgentId}
                          style={{ padding: '10px 22px', borderRadius: 8, background: aiCallAgentId ? 'linear-gradient(135deg, #8B3FBF, #B670E8)' : 'rgba(255,255,255,0.05)', border: 'none', color: aiCallAgentId ? '#fff' : MUTED, fontSize: 13, fontWeight: 600, cursor: aiCallAgentId ? 'pointer' : 'not-allowed', fontFamily: FONT_BODY, display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                          Use AI to call now
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ background: INK3, borderRadius: 12, border: `1px solid ${LINE}`, padding: 24, textAlign: 'center' }}>
                    {aiCallStatus === 'dialing' && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#B670E8', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        <span style={{ fontSize: 14, color: PAPER }}>Dialing {lead?.name}...</span>
                      </div>
                    )}
                    {aiCallStatus === 'in-progress' && (
                      <div>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#B670E8', margin: '0 auto 10px', animation: 'pulse 2s infinite ease-in-out' }} />
                        <div style={{ fontSize: 15, color: PAPER, marginBottom: 4 }}>AI agent is talking to {lead?.name}</div>
                        <div style={{ fontSize: 11, color: MUTED }}>Transcript will appear in the timeline when the call ends</div>
                        {aiCallConvId && <div style={{ fontFamily: FONT_MONO, fontSize: 10, color: MUTED, marginTop: 8 }}>ID: {aiCallConvId.slice(0, 16)}...</div>}
                      </div>
                    )}
                    {aiCallStatus === 'completed' && (
                      <div>
                        <div style={{ fontSize: 20, marginBottom: 6 }}>✓</div>
                        <div style={{ fontSize: 14, color: '#10B981' }}>AI call completed — see timeline below</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── ACTIVITY TIMELINE ─────────────────────────────────── */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 24,
            border: `1px solid ${LINE}`,
          }}>
            <div style={{ fontWeight: 600, fontSize: 15, color: PAPER, marginBottom: 16 }}>Activity</div>

            {/* Filter tabs */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
              {([
                { id: 'all', label: 'All' },
                { id: 'emails', label: 'Emails' },
                { id: 'texts', label: 'Texts' },
                { id: 'calls', label: 'Calls' },
                { id: 'notes', label: 'Notes' },
                { id: 'inquiries', label: 'Inquiries' },
              ] as const).map(f => (
                <button
                  key={f.id}
                  onClick={() => setActivityFilter(f.id)}
                  style={{
                    padding: '5px 12px', borderRadius: 100,
                    background: activityFilter === f.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                    border: `1px solid ${activityFilter === f.id ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                    color: activityFilter === f.id ? PAPER : MUTED,
                    fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: FONT_BODY,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  {f.label}
                  <span style={{
                    fontSize: 11, fontFamily: FONT_MONO,
                    padding: '1px 6px', borderRadius: 100,
                    background: 'rgba(255,255,255,0.06)', color: MUTED,
                  }}>
                    {activityCounts[f.id]}
                  </span>
                </button>
              ))}
            </div>

            {/* Timeline items */}
            <div className="lead-detail-scroll" style={{ maxHeight: 500, overflowY: 'auto' }}>
              {filteredActivities.length === 0 && (
                <div style={{ padding: 24, textAlign: 'center', color: MUTED, fontSize: 13 }}>
                  No activities to show.
                </div>
              )}
              {filteredActivities.map((activity, idx) => {
                const isExpanded = expandedActivities.has(activity.id);
                const color = ACTIVITY_COLORS[activity.type] || MUTED;
                const icon = ACTIVITY_ICONS[activity.type] || '\u2022';
                const lines = activity.description.split('\n');
                const title = lines[0];
                const content = lines.slice(1).join('\n');
                const hasContent = content.trim().length > 0;

                return (
                  <div
                    key={activity.id}
                    onClick={() => hasContent && toggleExpand(activity.id)}
                    style={{
                      display: 'flex', gap: 14, padding: '14px 0',
                      borderTop: idx > 0 ? `1px solid ${LINE}` : 'none',
                      cursor: hasContent ? 'pointer' : 'default',
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: `${color}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14,
                    }}>
                      <span style={{ filter: 'none' }}>{icon}</span>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13, color: PAPER, fontWeight: 500, lineHeight: 1.4 }}>
                          {title}
                        </span>
                        <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_MONO, flexShrink: 0 }}>
                          {timeAgo(activity.timestamp)}
                        </span>
                      </div>
                      {hasContent && isExpanded && (
                        <div style={{
                          marginTop: 8, fontSize: 13, color: MUTED, lineHeight: 1.6,
                          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                          padding: 12, borderRadius: 8,
                          background: 'rgba(255,255,255,0.03)',
                        }}>
                          {content}
                        </div>
                      )}
                      {hasContent && !isExpanded && (
                        <div style={{ fontSize: 11, color: MUTED, marginTop: 4, opacity: 0.6 }}>
                          Click to expand
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═══ RIGHT COLUMN (300px) ══════════════════════════════ */}
        <div style={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Tasks Card */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 20,
            border: `1px solid ${LINE}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: PAPER }}>Tasks</span>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                style={{
                  width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`,
                  color: MUTED, fontSize: 16, cursor: 'pointer', lineHeight: 1,
                }}
              >
                +
              </button>
            </div>

            {showAddTask && (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Task title"
                  style={sideInputStyle()}
                />
                <input
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                  style={sideInputStyle()}
                />
                <button
                  onClick={handleAddTask}
                  disabled={!taskTitle.trim()}
                  style={{
                    padding: '7px 14px', borderRadius: 7,
                    background: taskTitle.trim() ? ACCENT : 'rgba(255,255,255,0.04)',
                    color: taskTitle.trim() ? '#fff' : MUTED,
                    border: 'none', fontSize: 12, fontWeight: 600, cursor: taskTitle.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: FONT_BODY,
                  }}
                >
                  Save
                </button>
              </div>
            )}

            {tasks.length === 0 && !showAddTask && (
              <div style={{ fontSize: 13, color: MUTED, padding: '8px 0' }}>No upcoming tasks</div>
            )}

            {tasks.map(task => (
              <div
                key={task.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 0',
                  borderTop: `1px solid ${LINE}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  style={{ marginTop: 3, cursor: 'pointer', accentColor: ACCENT }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: 13, color: PAPER, fontWeight: 500,
                    textDecoration: task.done ? 'line-through' : 'none',
                    opacity: task.done ? 0.5 : 1,
                  }}>
                    {task.title}
                  </div>
                  {task.dueDate && (
                    <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_MONO, marginTop: 2 }}>
                      {formatDate(task.dueDate)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Files Card */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 20,
            border: `1px solid ${LINE}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: PAPER }}>Files</span>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`,
                  color: MUTED, fontSize: 16, cursor: 'pointer', lineHeight: 1,
                }}
              >
                +
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>

            {files.length === 0 && (
              <div style={{ fontSize: 13, color: MUTED, padding: '8px 0' }}>No files yet</div>
            )}

            {files.map(file => (
              <div
                key={file.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0',
                  borderTop: `1px solid ${LINE}`,
                }}
              >
                <span style={{ fontSize: 16 }}>
                  {file.type.startsWith('image/') ? '\uD83D\uDDBC' : '\uD83D\uDCC4'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: PAPER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: 11, color: MUTED, fontFamily: FONT_MONO }}>
                    {formatFileSize(file.size)}
                  </div>
                </div>
                <button
                  onClick={() => deleteFile(file.id)}
                  style={{
                    background: 'none', border: 'none', color: MUTED, cursor: 'pointer',
                    fontSize: 14, padding: 4, opacity: 0.6, lineHeight: 1,
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Deals Card */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 20,
            border: `1px solid ${LINE}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: PAPER }}>Deals</span>
              <button
                onClick={() => setShowAddDeal(!showAddDeal)}
                style={{
                  width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.06)', border: `1px solid ${LINE}`,
                  color: MUTED, fontSize: 16, cursor: 'pointer', lineHeight: 1,
                }}
              >
                +
              </button>
            </div>

            {showAddDeal && (
              <div style={{ marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={dealProperty}
                  onChange={(e) => setDealProperty(e.target.value)}
                  placeholder="Property name"
                  style={sideInputStyle()}
                />
                <input
                  value={dealPrice}
                  onChange={(e) => setDealPrice(e.target.value)}
                  placeholder="Price (e.g. $850,000)"
                  style={sideInputStyle()}
                />
                <select
                  value={dealStatus}
                  onChange={(e) => setDealStatus(e.target.value as Deal['status'])}
                  style={sideInputStyle()}
                >
                  <option value="active" style={{ background: INK3 }}>Active</option>
                  <option value="pending" style={{ background: INK3 }}>Pending</option>
                  <option value="closed" style={{ background: INK3 }}>Closed</option>
                  <option value="lost" style={{ background: INK3 }}>Lost</option>
                </select>
                <button
                  onClick={handleAddDeal}
                  disabled={!dealProperty.trim()}
                  style={{
                    padding: '7px 14px', borderRadius: 7,
                    background: dealProperty.trim() ? ACCENT : 'rgba(255,255,255,0.04)',
                    color: dealProperty.trim() ? '#fff' : MUTED,
                    border: 'none', fontSize: 12, fontWeight: 600,
                    cursor: dealProperty.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: FONT_BODY,
                  }}
                >
                  Save
                </button>
              </div>
            )}

            {deals.length === 0 && !showAddDeal && (
              <div style={{ fontSize: 13, color: MUTED, padding: '8px 0' }}>No deals yet</div>
            )}

            {deals.map(deal => {
              const dealColors: Record<string, { bg: string; color: string }> = {
                active: { bg: 'rgba(0,102,255,0.14)', color: '#93C5FD' },
                pending: { bg: 'rgba(245,158,11,0.14)', color: '#FCD34D' },
                closed: { bg: 'rgba(16,185,129,0.14)', color: '#6EE7B7' },
                lost: { bg: 'rgba(107,113,133,0.14)', color: '#9CA3AF' },
              };
              const dc = dealColors[deal.status] || dealColors.active;
              return (
                <div
                  key={deal.id}
                  style={{
                    padding: '10px 0',
                    borderTop: `1px solid ${LINE}`,
                  }}
                >
                  <div style={{ fontSize: 13, color: PAPER, fontWeight: 500 }}>{deal.property}</div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 13, color: MUTED, fontFamily: FONT_MONO }}>{deal.price}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 100,
                      background: dc.bg, color: dc.color, textTransform: 'capitalize',
                    }}>
                      {deal.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Activity Summary Card */}
          <div style={{
            background: INK2, borderRadius: 14, padding: 20,
            border: `1px solid ${LINE}`,
          }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: PAPER, marginBottom: 14 }}>Activity Summary</div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginBottom: 6 }}>Marketing Source</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                }}>
                  {lead.source === 'Google Ads' ? '\uD83C\uDF0D' :
                   lead.source === 'Meta Ads' ? '\uD83D\uDCF1' :
                   lead.source === 'Instagram' ? '\uD83D\uDCF7' :
                   lead.source === 'Referral' ? '\uD83E\uDD1D' :
                   lead.source === 'Walk-in' ? '\uD83D\uDEB6' :
                   lead.source === 'Website Form' ? '\uD83C\uDF10' : '\u270F'}
                </span>
                <span style={{ fontSize: 13, color: PAPER }}>{lead.source}</span>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: MUTED, fontWeight: 500, marginBottom: 8 }}>Website Activity</div>
              {[
                { page: '/new-condos/king-toronto', time: '2m 34s' },
                { page: '/neighborhood/yorkville', time: '1m 12s' },
                { page: '/pre-construction', time: '0m 48s' },
              ].map((visit, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 0', borderTop: i > 0 ? `1px solid ${LINE}` : 'none',
                }}>
                  <span style={{ fontSize: 12, color: MUTED, fontFamily: FONT_MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {visit.page}
                  </span>
                  <span style={{ fontSize: 11, color: MUTED, fontFamily: FONT_MONO, flexShrink: 0, marginLeft: 8 }}>
                    {visit.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── TOAST ─────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10000,
          padding: '12px 28px', borderRadius: 10,
          background: GREEN, color: '#fff',
          fontSize: 14, fontWeight: 600, fontFamily: FONT_BODY,
          boxShadow: '0 8px 32px rgba(16,185,129,0.3)',
          animation: 'toastIn 0.25s ease',
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════════════════════════════
function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: MUTED, fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <div style={{ textAlign: 'right' }}>{children}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Shared style helpers
// ═══════════════════════════════════════════════════════════════
function composerInputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${LINE}`,
    color: PAPER,
    fontSize: 14,
    fontFamily: FONT_BODY,
    outline: 'none',
    lineHeight: 1.55,
    boxSizing: 'border-box' as const,
  };
}

function sideInputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 7,
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${LINE}`,
    color: PAPER,
    fontSize: 13,
    fontFamily: FONT_BODY,
    outline: 'none',
    boxSizing: 'border-box' as const,
  };
}

function inlineInputStyle(): React.CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid rgba(255,255,255,0.12)`,
    color: PAPER,
    fontSize: 13,
    fontFamily: FONT_BODY,
    outline: 'none',
    width: '100%',
    maxWidth: 160,
    boxSizing: 'border-box' as const,
  };
}

function inlineSelectStyle(): React.CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: 6,
    background: 'rgba(255,255,255,0.06)',
    border: `1px solid rgba(255,255,255,0.12)`,
    color: PAPER,
    fontSize: 13,
    fontFamily: FONT_BODY,
    outline: 'none',
    width: '100%',
    maxWidth: 160,
    boxSizing: 'border-box' as const,
  };
}
