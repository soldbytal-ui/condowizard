interface Row {
  bedrooms: string;
  label: string;
  soldCount: number;
  medianSold: number | null;
  averageDom: number | null;
}

interface Props {
  rows: Row[];
}

function fmtPrice(v: number | null): string {
  if (v == null) return '—';
  return `$${Math.round(v).toLocaleString()}`;
}

function fmtNum(v: number | null): string {
  if (v == null) return '—';
  return Math.round(v).toLocaleString();
}

export default function SuiteTypeTable({ rows }: Props) {
  if (!rows || rows.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 text-sm text-text-muted">
        No suite-type breakdown available yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-surface2/60">
            <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Suite</th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Sold (90d)</th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Median Sold</th>
            <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-text-muted">Avg DOM</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.bedrooms} className="border-b border-border last:border-0 hover:bg-surface2/50">
              <td className="px-4 py-3 text-sm font-medium text-text-primary">{r.label}</td>
              <td className="px-4 py-3 text-right text-sm text-text-primary tabular-nums">{fmtNum(r.soldCount)}</td>
              <td className="px-4 py-3 text-right text-sm text-text-primary tabular-nums">{fmtPrice(r.medianSold)}</td>
              <td className="px-4 py-3 text-right text-sm text-text-muted tabular-nums">{fmtNum(r.averageDom)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
