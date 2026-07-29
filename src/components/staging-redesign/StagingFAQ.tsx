import { STAGING_FAQS } from '@/lib/staging-redesign/content';

export default function StagingFAQ() {
  return (
    <section id="faq" className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
      <div className="max-w-[900px] mx-auto">
        <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">FAQ</p>
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
          Answers to the questions we hear most
        </h2>
        <p className="text-text-muted mt-3 leading-relaxed max-w-2xl">
          Where an answer depends on the specific property, we&rsquo;ve said so. The consultation is where scope, timing and any coordinated services are confirmed for your listing.
        </p>

        <div className="mt-8 divide-y divide-border border border-border rounded-2xl overflow-hidden bg-white">
          {STAGING_FAQS.map((f, i) => (
            <details key={i} className="group">
              <summary className="flex items-start justify-between gap-6 px-5 md:px-6 py-4 cursor-pointer list-none hover:bg-surface2 transition-colors">
                <h3 className="text-[15px] font-semibold text-text-primary leading-snug">{f.q}</h3>
                <svg
                  className="w-4 h-4 text-text-primary/70 mt-1 shrink-0 transition-transform group-open:rotate-180"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 md:px-6 pb-5 -mt-1 text-sm text-text-primary/80 leading-relaxed max-w-2xl">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
