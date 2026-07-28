// Toronto-local calendar date helpers.
// Repliers stores listDate as UTC; "today" for new-listings must be computed
// in America/Toronto so a listing entered at 11pm EST doesn't roll over.

const TZ = 'America/Toronto';

export function torontoTodayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const m = parts.find((p) => p.type === 'month')?.value ?? '01';
  const d = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${y}-${m}-${d}`;
}

export function torontoTomorrowISO(now: Date = new Date()): string {
  const today = torontoTodayISO(now);
  const [y, m, d] = today.split('-').map(Number);
  // Construct a UTC anchor then add one day. Since the date only carries a
  // calendar boundary (not a wall-clock time), this is safe across DST.
  const t = Date.UTC(y, m - 1, d) + 86400000;
  const dt = new Date(t);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function formatTorontoTime(
  iso: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, ...opts }).format(new Date(iso));
  } catch {
    return '';
  }
}

export function formatTorontoDate(
  iso: string | Date | null | undefined,
  opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
): string {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, ...opts }).format(new Date(iso));
  } catch {
    return '';
  }
}
