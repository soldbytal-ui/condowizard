import StatTile from './StatTile';

interface Snapshot {
  active: number | null;
  new_listings: number | null;
  sold_count: number | null;
  median_sold: number | string | null;
  average_sold: number | string | null;
  median_dom: number | string | null;
  average_dom: number | string | null;
  sale_to_list_pct: number | string | null;
  months_of_inventory: number | string | null;
  yoy_median_sold_delta: number | string | null;
  yoy_average_sold_delta: number | string | null;
  yoy_sold_count_delta: number | string | null;
  yoy_average_dom_delta: number | string | null;
  yoy_sale_to_list_delta: number | string | null;
  price_drops: number | null;
  terminations: number | null;
  by_suite_type: Array<{ bedrooms: string; label: string; soldCount: number; medianSold: number | null; averageDom: number | null }> | null;
  rental_snapshot: {
    activeCount: number;
    medianAskingRent: number | null;
    averageAskingRent: number | null;
    leasedCount: number;
    medianLeasedRent: number | null;
    averageLeasedRent: number | null;
    averageDom: number | null;
  } | null;
  trend: Array<{ date: string; medianSold: number | null; soldCount: number | null; active: number | null; saleToList: number | null; monthsOfInventory: number | null; averageDom: number | null }> | null;
  snapshot_date: string | Date;
  window_days: number;
  generated_at: string | Date;
}

function toDateStr(v: string | Date | null | undefined): string {
  if (!v) return '—';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

function n(v: number | string | null | undefined): number | null {
  if (v == null) return null;
  const x = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(x) ? x : null;
}

function fmtPrice(v: number | null): string {
  if (v == null) return '—';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(v >= 10_000_000 ? 1 : 2)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${Math.round(v)}`;
}

function fmtPct(v: number | null, digits = 1): string {
  return v == null ? '—' : `${v.toFixed(digits)}%`;
}

function fmtMonths(v: number | null): string {
  return v == null ? '—' : `${v.toFixed(1)} mo`;
}

function fmtNum(v: number | null): string {
  return v == null ? '—' : Math.round(v).toLocaleString();
}

function delta(
  v: number | null,
  direction: 'up-good' | 'down-good' = 'up-good',
  kind: 'pct' | 'pp' = 'pct'
): { text: string; positive: boolean; neutral: boolean } | null {
  if (v == null || !Number.isFinite(v)) return null;
  const sign = v > 0 ? '+' : '';
  const suffix = kind === 'pct' ? '%' : ' pp';
  const neutral = Math.abs(v) < 0.05;
  const positive = direction === 'up-good' ? v > 0 : v < 0;
  return { text: `${sign}${v.toFixed(1)}${suffix}`, positive, neutral };
}

interface Props {
  snapshot: Snapshot;
  neighborhoodName: string;
}

export default function MarketPulseSection({ snapshot }: Props) {
  const priorCaption = snapshot.window_days === 30 ? 'vs. last month' : snapshot.window_days === 365 ? 'vs. last year' : 'vs. same quarter LY';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile
          label="Median Sold"
          value={fmtPrice(n(snapshot.median_sold))}
          delta={delta(n(snapshot.yoy_median_sold_delta), 'up-good')}
          deltaCaption={priorCaption}
          accent="blue"
        />
        <StatTile
          label="Sales Volume"
          value={fmtNum(snapshot.sold_count)}
          delta={delta(n(snapshot.yoy_sold_count_delta), 'up-good')}
          deltaCaption={priorCaption}
        />
        <StatTile
          label="Sale to List"
          value={fmtPct(n(snapshot.sale_to_list_pct))}
          delta={delta(n(snapshot.yoy_sale_to_list_delta), 'up-good', 'pp')}
          deltaCaption={priorCaption}
        />
        <StatTile
          label="Avg Days on Market"
          value={fmtNum(n(snapshot.average_dom))}
          delta={delta(n(snapshot.yoy_average_dom_delta), 'down-good')}
          deltaCaption={priorCaption}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Active" value={fmtNum(snapshot.active)} accent="blue" />
        <StatTile label="New (30 days)" value={fmtNum(snapshot.new_listings)} />
        <StatTile label="Months of Inventory" value={fmtMonths(n(snapshot.months_of_inventory))} />
        <StatTile label="Snapshot" value={toDateStr(snapshot.snapshot_date)} deltaCaption={`${snapshot.window_days}-day window`} />
      </div>
    </div>
  );
}

export type { Snapshot };
