interface Props {
  monthsOfInventory: number | null;
  priceDrops: number | null;
  terminations: number | null;
}

function classify(moi: number | null): { label: string; sub: string; color: string; bar: string; pos: number } {
  if (moi == null) {
    return { label: 'Not enough data', sub: 'Waiting on sales', color: 'text-text-muted', bar: 'bg-surface2', pos: 50 };
  }
  if (moi < 2) {
    return {
      label: "Seller's Market",
      sub: 'Low inventory · fast turnover · leverage sellers',
      color: 'text-accent-green',
      bar: 'bg-accent-green',
      pos: Math.max(6, Math.min(28, (moi / 2) * 33)),
    };
  }
  if (moi <= 4) {
    return {
      label: 'Balanced Market',
      sub: 'Healthy supply meeting demand · neutral leverage',
      color: 'text-accent-blue',
      bar: 'bg-accent-blue',
      pos: 33 + ((moi - 2) / 2) * 33,
    };
  }
  return {
    label: "Buyer's Market",
    sub: 'Elevated inventory · slower absorption · leverage buyers',
    color: 'text-text-primary',
    bar: 'bg-surface2',
    pos: Math.min(94, 66 + ((moi - 4) / 4) * 33),
  };
}

export default function MarketBalanceGauge({ monthsOfInventory, priceDrops, terminations }: Props) {
  const c = classify(monthsOfInventory);

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Market balance</p>
          <p className={`mt-1 font-serif text-2xl font-bold ${c.color}`}>{c.label}</p>
          <p className="mt-1 text-xs text-text-muted">{c.sub}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Months of inventory</p>
          <p className="font-serif text-2xl font-bold text-text-primary tabular-nums">
            {monthsOfInventory == null ? '—' : `${monthsOfInventory.toFixed(1)} mo`}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <div className="relative h-2 rounded-full bg-gradient-to-r from-accent-green via-accent-blue to-surface2 overflow-visible">
          <div
            className="absolute -top-1 h-4 w-1.5 rounded bg-text-primary shadow"
            style={{ left: `calc(${c.pos.toFixed(1)}% - 3px)` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <span>&lt; 2 mo · Seller</span>
          <span>2–4 mo · Balanced</span>
          <span>&gt; 4 mo · Buyer</span>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-surface2/50 border border-border">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Price drops (30d)</p>
          <p className="mt-1 font-serif text-xl font-bold text-text-primary tabular-nums">
            {priceDrops != null ? priceDrops.toLocaleString() : '—'}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-surface2/50 border border-border">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Terminations</p>
          <p className="mt-1 font-serif text-xl font-bold text-text-primary tabular-nums">
            {terminations != null ? terminations.toLocaleString() : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
