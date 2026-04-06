import { STATUS_COLORS, STATUS_LABELS } from '@/lib/utils';

export default function StatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.COMPLETED;
  const label = STATUS_LABELS[status] || status;

  return (
    <span className={`${colors.bg} ${colors.text} text-xs font-semibold px-2.5 py-1 rounded-full`}>
      {label}
    </span>
  );
}
