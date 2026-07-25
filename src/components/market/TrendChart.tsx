interface Point {
  date: string;
  medianSold: number | null;
  soldCount: number | null;
  active: number | null;
  saleToList: number | null;
  monthsOfInventory: number | null;
  averageDom: number | null;
}

interface Props {
  points: Point[];
  metric?: 'medianSold' | 'soldCount' | 'saleToList';
  label?: string;
}

function toNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export default function TrendChart({ points, metric = 'medianSold', label }: Props) {
  const values = (points || []).map((p) => ({ date: p.date, value: toNum((p as any)[metric]) })).filter((p) => p.value != null) as Array<{ date: string; value: number }>;

  if (values.length < 2) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 text-sm text-text-muted">
        History will chart here once at least two daily snapshots have accumulated.
        {values.length === 1 ? ' First snapshot captured today.' : ''}
      </div>
    );
  }

  const width = 640;
  const height = 200;
  const pad = { l: 12, r: 12, t: 16, b: 24 };

  const xs = values.map((_, i) => i);
  const ys = values.map((v) => v.value);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yRange = yMax - yMin || 1;
  const xToPx = (i: number) => pad.l + (xs.length > 1 ? (i / (xs.length - 1)) * (width - pad.l - pad.r) : 0);
  const yToPx = (v: number) => pad.t + (1 - (v - yMin) / yRange) * (height - pad.t - pad.b);

  const linePath = values
    .map((v, i) => `${i === 0 ? 'M' : 'L'} ${xToPx(i).toFixed(1)} ${yToPx(v.value).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L ${xToPx(values.length - 1).toFixed(1)} ${(height - pad.b).toFixed(1)} L ${xToPx(0).toFixed(1)} ${(height - pad.b).toFixed(1)} Z`;

  const first = values[0];
  const last = values[values.length - 1];
  const delta = first.value !== 0 ? ((last.value - first.value) / first.value) * 100 : 0;
  const positive = delta > 0;

  const format = (v: number): string => {
    if (metric === 'medianSold') {
      return v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(2)}M` : `$${Math.round(v / 1_000)}K`;
    }
    if (metric === 'saleToList') return `${v.toFixed(1)}%`;
    return v.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            {label || 'Median sold price'}
          </p>
          <p className="mt-1 font-serif text-2xl font-bold text-text-primary tabular-nums">{format(last.value)}</p>
        </div>
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            Math.abs(delta) < 0.05
              ? 'bg-surface2 text-text-muted'
              : positive
              ? 'bg-accent-green/10 text-accent-green'
              : 'bg-surface2 text-text-muted'
          }`}
        >
          {positive ? '+' : ''}
          {delta.toFixed(1)}% since {first.date}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="tc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0066FF" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#tc-fill)" />
        <path d={linePath} fill="none" stroke="#0066FF" strokeWidth="2" />
      </svg>
    </div>
  );
}
