interface Props {
  data: {
    activeCount: number;
    medianAskingRent: number | null;
    averageAskingRent: number | null;
    leasedCount: number;
    medianLeasedRent: number | null;
    averageLeasedRent: number | null;
    averageDom: number | null;
  } | null;
}

function fmtRent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return `$${Math.round(v).toLocaleString()}/mo`;
}

function fmtNum(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return Math.round(v).toLocaleString();
}

export default function RentalSnapshotCard({ data }: Props) {
  if (!data) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 text-sm text-text-muted">
        Rental snapshot not available yet.
      </div>
    );
  }

  const cells = [
    { label: 'Active rentals', value: fmtNum(data.activeCount), accent: 'blue' as const },
    { label: 'Median asking rent', value: fmtRent(data.medianAskingRent) },
    { label: 'Avg asking rent', value: fmtRent(data.averageAskingRent) },
    { label: 'Avg days on market', value: fmtNum(data.averageDom) },
    { label: 'Leased (90d)', value: fmtNum(data.leasedCount) },
    { label: 'Median leased rent', value: fmtRent(data.medianLeasedRent) },
  ];

  return (
    <div className="bg-white rounded-xl border border-border p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-5">
        {cells.map((c) => (
          <div key={c.label}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{c.label}</p>
            <p
              className={`mt-1 font-serif text-xl font-bold ${
                c.accent === 'blue' ? 'text-accent-blue' : 'text-text-primary'
              }`}
            >
              {c.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
