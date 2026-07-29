import { PROCESS_STEPS } from '@/lib/staging-redesign/content';

export default function Process() {
  return (
    <section className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
      <div className="max-w-[1240px] mx-auto">
        <div className="max-w-2xl mb-10">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Process</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            From consultation to a photo-ready listing
          </h2>
          <p className="text-text-muted mt-3 leading-relaxed">
            Every listing moves at a different pace. The steps below describe the standard sequence — the exact timing is set on the consultation based on the property, existing condition and target listing date.
          </p>
        </div>

        <ol className="space-y-0">
          {PROCESS_STEPS.map((step, i) => (
            <li key={step.n} className="grid grid-cols-[64px_1fr_minmax(0,220px)] md:grid-cols-[80px_1fr_minmax(0,240px)] gap-4 md:gap-6 items-start py-6 border-t border-border">
              <div className="font-mono text-xs text-text-muted pt-1">{step.n}</div>
              <div>
                <p className="font-serif text-xl md:text-2xl font-bold text-text-primary leading-tight">{step.title}</p>
                <p className="text-sm text-text-muted mt-2 leading-relaxed max-w-xl">{step.desc}</p>
              </div>
              <div className="text-[11px] uppercase tracking-widest text-text-primary/70 md:text-right pt-1">
                {step.timing}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
