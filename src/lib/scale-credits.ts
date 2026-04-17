/**
 * Scale Credits — credit system for AI-powered actions.
 * Tracks balance, transactions, and plan allocations.
 */

export type ScalePlan = 'starter' | 'pro' | 'team' | 'enterprise';

export interface CreditTransaction {
  id: string;
  amount: number;           // positive = added, negative = used
  reason: string;
  timestamp: string;        // ISO
  balance: number;          // balance after this transaction
}

export interface CreditTopUp {
  credits: number;
  priceCad: number;
  label: string;
}

export interface PlanAllocation {
  plan: ScalePlan;
  label: string;
  creditsPerMonth: number;
  priceCad: number | null;  // null = custom
}

const CREDITS_BALANCE_KEY = 'scale-credits-balance';
const CREDITS_PLAN_KEY = 'scale-credits-plan';
const CREDITS_HISTORY_KEY = 'scale-credits-history';

export const PLAN_ALLOCATIONS: PlanAllocation[] = [
  { plan: 'starter',    label: 'Starter',    creditsPerMonth: 2_000,  priceCad: 79 },
  { plan: 'pro',        label: 'Pro',        creditsPerMonth: 10_000, priceCad: 249 },
  { plan: 'team',       label: 'Team',       creditsPerMonth: 50_000, priceCad: 749 },
  { plan: 'enterprise', label: 'Enterprise', creditsPerMonth: 0,      priceCad: null },
];

export const TOP_UP_PACKS: CreditTopUp[] = [
  { credits: 1_000,  priceCad: 20,  label: '+1,000 credits' },
  { credits: 5_000,  priceCad: 90,  label: '+5,000 credits' },
  { credits: 10_000, priceCad: 160, label: '+10,000 credits' },
];

// Credit cost ranges by task type
export const CREDIT_COSTS = {
  light:  { min: 1,  max: 5,   label: 'Light task (simple prompts)' },
  medium: { min: 30, max: 50,  label: 'Medium task (campaign generation)' },
  heavy:  { min: 60, max: 100, label: 'Heavy task (SEO landing page)' },
  studio: { min: 20, max: 80,  label: 'Studio edit' },
  emailNurture:   { min: 50, max: 70,  label: 'Email nurture sequence' },
  seoLandingPage: { min: 70, max: 90,  label: 'SEO landing page' },
} as const;

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Seed default credits on first use (Pro plan, 6812 remaining). */
function ensureSeeded() {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem(CREDITS_BALANCE_KEY) !== null) return;
  window.localStorage.setItem(CREDITS_BALANCE_KEY, '6812');
  window.localStorage.setItem(CREDITS_PLAN_KEY, 'pro');
  const seed: CreditTransaction[] = [
    { id: uid(), amount: 10000, reason: 'Pro plan monthly allocation', timestamp: '2026-04-01T00:00:00Z', balance: 10000 },
    { id: uid(), amount: -1200, reason: 'Campaign generation × 8', timestamp: '2026-04-03T14:22:00Z', balance: 8800 },
    { id: uid(), amount: -850,  reason: 'SEO landing page — King West', timestamp: '2026-04-05T10:15:00Z', balance: 7950 },
    { id: uid(), amount: -620,  reason: 'Email nurture — KING Toronto', timestamp: '2026-04-07T09:30:00Z', balance: 7330 },
    { id: uid(), amount: -518,  reason: 'Studio edits × 12', timestamp: '2026-04-10T16:45:00Z', balance: 6812 },
  ];
  window.localStorage.setItem(CREDITS_HISTORY_KEY, JSON.stringify(seed));
}

export function getCredits(): number {
  if (typeof window === 'undefined') return 0;
  ensureSeeded();
  const raw = window.localStorage.getItem(CREDITS_BALANCE_KEY);
  return raw ? parseInt(raw, 10) : 0;
}

export function getPlan(): ScalePlan {
  if (typeof window === 'undefined') return 'pro';
  ensureSeeded();
  return (window.localStorage.getItem(CREDITS_PLAN_KEY) as ScalePlan) || 'pro';
}

export function getMonthlyAllocation(plan?: ScalePlan): number {
  const p = plan ?? getPlan();
  const found = PLAN_ALLOCATIONS.find((a) => a.plan === p);
  return found?.creditsPerMonth ?? 10_000;
}

export function useCredits(amount: number, reason: string): boolean {
  if (typeof window === 'undefined') return false;
  ensureSeeded();
  const balance = getCredits();
  if (amount > balance) return false;
  const newBalance = balance - amount;
  window.localStorage.setItem(CREDITS_BALANCE_KEY, String(newBalance));
  const history = getCreditHistory();
  history.unshift({
    id: uid(),
    amount: -amount,
    reason,
    timestamp: new Date().toISOString(),
    balance: newBalance,
  });
  window.localStorage.setItem(CREDITS_HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
  return true;
}

export function addCredits(amount: number, source: string): number {
  if (typeof window === 'undefined') return 0;
  ensureSeeded();
  const balance = getCredits() + amount;
  window.localStorage.setItem(CREDITS_BALANCE_KEY, String(balance));
  const history = getCreditHistory();
  history.unshift({
    id: uid(),
    amount,
    reason: source,
    timestamp: new Date().toISOString(),
    balance,
  });
  window.localStorage.setItem(CREDITS_HISTORY_KEY, JSON.stringify(history.slice(0, 200)));
  return balance;
}

export function getCreditHistory(): CreditTransaction[] {
  if (typeof window === 'undefined') return [];
  ensureSeeded();
  try {
    const raw = window.localStorage.getItem(CREDITS_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Estimate credit cost for a given task type. Returns the midpoint. */
export function estimateCost(taskType: keyof typeof CREDIT_COSTS): number {
  const range = CREDIT_COSTS[taskType];
  return Math.round((range.min + range.max) / 2);
}
