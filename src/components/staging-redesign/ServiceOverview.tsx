import { SERVICE_OVERVIEW } from '@/lib/staging-redesign/content';

export default function ServiceOverview() {
  return (
    <section className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
      <div className="max-w-[1240px] mx-auto">
        <div className="max-w-2xl mb-8 md:mb-10">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Service overview</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            Staging is one part of preparing your property for the market
          </h2>
          <p className="text-text-muted mt-3 leading-relaxed">
            Every engagement is scoped around the property, timeline and marketing plan. The confirmed staging services are shown below; related preparation services are addressed further down the page.
          </p>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-8">
          {SERVICE_OVERVIEW.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="shrink-0 w-8 h-8 flex items-center justify-center border border-border rounded-md text-[11px] font-mono text-text-primary/60 mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <p className="text-[15px] font-semibold text-text-primary">{s.title}</p>
                <p className="text-sm text-text-muted mt-1.5 leading-relaxed">{s.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
