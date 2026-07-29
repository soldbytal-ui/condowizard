import { DISCLOSURE, PREP_GROUPS } from '@/lib/staging-redesign/content';

const TONES: Record<string, { badge: string; card: string; label: string }> = {
  included: {
    badge: 'bg-text-primary text-white',
    card: 'bg-white',
    label: 'Included',
  },
  coordinated: {
    badge: 'bg-text-primary/10 text-text-primary',
    card: 'bg-white',
    label: 'Coordinated',
  },
  optional: {
    badge: 'bg-transparent text-text-muted border border-border',
    card: 'bg-white',
    label: 'Optional',
  },
};

export default function PrepServices() {
  return (
    <section className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
      <div className="max-w-[1240px] mx-auto">
        <div className="max-w-2xl mb-8 md:mb-10">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Listing preparation services</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            What we deliver, coordinate and offer as extras
          </h2>
          <p className="text-text-muted mt-3 leading-relaxed">
            Preparation work often extends beyond staging itself. To keep expectations clear, every service is labelled by how it&rsquo;s delivered: included with staging, coordinated through trusted trades, or optional and priced separately.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PREP_GROUPS.map((g) => {
            const tone = TONES[g.tone];
            return (
              <div key={g.label} className={`rounded-2xl border border-border p-6 md:p-7 flex flex-col ${tone.card}`}>
                <span className={`self-start text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded ${tone.badge}`}>
                  {tone.label}
                </span>
                <p className="font-serif text-xl font-bold text-text-primary mt-4 leading-tight">{g.label}</p>
                <p className="text-sm text-text-muted mt-2 leading-relaxed">{g.description}</p>
                <ul className="mt-5 space-y-2.5 border-t border-border pt-4">
                  {g.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5 text-sm text-text-primary">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-primary/70 mt-2 shrink-0" aria-hidden />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-text-muted mt-8 max-w-3xl leading-relaxed">
          {DISCLOSURE}
        </p>
      </div>
    </section>
  );
}
