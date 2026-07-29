// Original SVG showing the closing-cost composition for the illustrative
// $850,000 first-time-buyer worked example. Purely decorative but accessible
// via title/desc; the numerical breakdown lives in the summary panel below.

export default function HeroCostGraphic() {
  const segments = [
    { label: 'Ontario LTT (net FTHB)', value: 9.475, color: '#0066FF' },
    { label: 'Toronto MLTT (net FTHB)', value: 9.0, color: '#3D8BFF' },
    { label: 'Development-charge cap', value: 15.0, color: '#7BAFFF' },
    { label: 'Tarion, hookups, reserve', value: 3.5, color: '#B7D2FF' },
    { label: 'Legal + adjustments', value: 3.0, color: '#DEE9FF' },
  ];
  const total = segments.reduce((s, x) => s + x.value, 0);
  let x = 0;
  const height = 44;
  const width = 100;
  const barHeight = 14;
  const barY = 3;

  return (
    <figure
      className="w-full"
      aria-label="Illustrative composition of final-closing costs on an $850,000 downtown Toronto pre-construction suite for a resident first-time buyer, in thousands of dollars."
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full h-auto"
        role="img"
      >
        <title>Illustrative closing-cost composition</title>
        <desc>
          Horizontal stacked bar showing the approximate final-closing cost split for the
          example: net LTT, capped development charges, Tarion and hookups, and legal fees.
        </desc>
        {segments.map((s, i) => {
          const w = (s.value / total) * width;
          const rect = (
            <rect
              key={i}
              x={x}
              y={barY}
              width={w}
              height={barHeight}
              fill={s.color}
              rx={2}
            />
          );
          x += w;
          return rect;
        })}
        {/* baseline */}
        <line x1={0} y1={barY + barHeight + 2} x2={width} y2={barY + barHeight + 2} stroke="#E5E7EB" strokeWidth={0.4} />
        {/* legend text */}
        <g transform={`translate(0 ${barY + barHeight + 8})`} fontFamily="DM Sans, sans-serif" fontSize={2.2} fill="#6B7280">
          <text x={0} y={0}>$0k</text>
          <text x={width / 2} y={0} textAnchor="middle">≈ $20k illustrative</text>
          <text x={width} y={0} textAnchor="end">$40k</text>
        </g>
      </svg>
      <figcaption className="mt-3 text-xs text-text-muted">
        Illustrative composition of final-closing costs on an $850,000 downtown Toronto suite for a resident first-time buyer, per the worked example below. Not tied to any specific project.
      </figcaption>
      <ul className="mt-4 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
        {segments.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-text-muted">{s.label}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
