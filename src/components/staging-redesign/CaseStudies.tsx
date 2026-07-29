// Case studies are held for verified results — property, timing and pricing
// figures must be substantiated before publication. Rather than fabricate
// entries, the section renders an editorial "in preparation" state until
// verified case studies are added.

interface CaseStudy {
  slug: string;
  neighbourhood: string;
  propertyType: string;
  condition: string;
  scope: string;
  timeline: string;
  listPrice?: string;
  soldPrice?: string;
  daysOnMarket?: number;
  showings?: number;
  verified: boolean;
}

const CASE_STUDIES: CaseStudy[] = [];

export default function CaseStudies() {
  const verified = CASE_STUDIES.filter((c) => c.verified);

  return (
    <section className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
      <div className="max-w-[1240px] mx-auto">
        <div className="max-w-2xl mb-8 md:mb-10">
          <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Case studies</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
            Verified projects, honestly reported
          </h2>
          <p className="text-text-muted mt-3 leading-relaxed">
            Where a case study is published, the property details, scope of work and any pricing or timing figures shown are drawn directly from the listing record and the seller&rsquo;s permission to share.
          </p>
        </div>

        {verified.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {verified.map((c) => (
              <article key={c.slug} className="bg-white rounded-2xl border border-border p-6 flex flex-col">
                <p className="text-[11px] uppercase tracking-widest text-text-muted">{c.propertyType} · {c.neighbourhood}</p>
                <p className="font-serif text-lg font-bold text-text-primary mt-1">{c.condition}</p>
                <p className="text-sm text-text-muted mt-3 leading-relaxed">{c.scope}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs border-t border-border pt-4">
                  <dt className="text-text-muted">Preparation</dt><dd className="text-text-primary font-medium">{c.timeline}</dd>
                  {c.listPrice && <><dt className="text-text-muted">List price</dt><dd className="text-text-primary font-medium">{c.listPrice}</dd></>}
                  {c.soldPrice && <><dt className="text-text-muted">Sold price</dt><dd className="text-text-primary font-medium">{c.soldPrice}</dd></>}
                  {c.daysOnMarket != null && <><dt className="text-text-muted">Days on market</dt><dd className="text-text-primary font-medium">{c.daysOnMarket}</dd></>}
                  {c.showings != null && <><dt className="text-text-muted">Showings</dt><dd className="text-text-primary font-medium">{c.showings}</dd></>}
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-border rounded-2xl p-8 md:p-12 max-w-3xl">
            <p className="text-[11px] uppercase tracking-widest text-text-muted">In preparation</p>
            <p className="font-serif text-2xl font-bold text-text-primary mt-2 leading-tight">
              Case studies are added once every figure can be substantiated
            </p>
            <p className="text-text-muted mt-4 leading-relaxed">
              We&rsquo;re holding this section for projects where the property record, the scope of preparation work and any listing or sale figures can all be shown transparently. New case studies will appear here as they clear review.
            </p>
          </div>
        )}

        <p className="text-xs text-text-muted mt-8 max-w-3xl leading-relaxed">
          Where results are shown, the outcome reflects the full listing, pricing and marketing strategy and is not attributable to staging alone.
        </p>
      </div>
    </section>
  );
}
