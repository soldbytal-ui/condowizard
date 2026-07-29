import { COMPARE_LEGEND, COMPARE_ROWS } from '@/lib/staging-redesign/content';

export default function OccupiedVsVacant() {
  return (
    <section className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
      <div className="max-w-[1240px] mx-auto">
        <div className="max-w-2xl mb-8">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Occupied vs. vacant</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            Two different scopes, one preparation approach
          </h2>
          <p className="text-text-muted mt-3 leading-relaxed">
            The scope changes with the property. Occupied homes are usually styled around the seller&rsquo;s pieces; vacant properties are staged with a full furniture package. Specific inclusions are confirmed on the consultation and listed in the listing agreement.
          </p>
        </div>

        <div className="overflow-hidden border border-border rounded-2xl bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#F6F6F3]">
                <th className="text-left font-semibold text-text-primary px-4 md:px-6 py-3 border-b border-border w-2/5">Scope item</th>
                <th className="text-left font-semibold text-text-primary px-4 md:px-6 py-3 border-b border-border">Occupied</th>
                <th className="text-left font-semibold text-text-primary px-4 md:px-6 py-3 border-b border-border">Vacant</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row, i) => (
                <tr key={row.label} className={i % 2 === 1 ? 'bg-[#FBFAF6]' : 'bg-white'}>
                  <td className="px-4 md:px-6 py-3 border-b border-border align-top">
                    <p className="font-medium text-text-primary">{row.label}</p>
                    {row.note && <p className="text-[11px] text-text-muted mt-1 leading-relaxed">{row.note}</p>}
                  </td>
                  <td className="px-4 md:px-6 py-3 border-b border-border align-top">
                    <Chip tone={row.occupied} />
                  </td>
                  <td className="px-4 md:px-6 py-3 border-b border-border align-top">
                    <Chip tone={row.vacant} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-[11px] uppercase tracking-widest text-text-muted">Legend</span>
          {(Object.keys(COMPARE_LEGEND) as Array<keyof typeof COMPARE_LEGEND>).map((tone) => (
            <span key={tone} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${COMPARE_LEGEND[tone].className}`}>
              {COMPARE_LEGEND[tone].label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Chip({ tone }: { tone: keyof typeof COMPARE_LEGEND }) {
  const spec = COMPARE_LEGEND[tone];
  return (
    <span className={`inline-block text-[11px] font-medium px-2.5 py-1 rounded-full ${spec.className}`}>
      {spec.label}
    </span>
  );
}
