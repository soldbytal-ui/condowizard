import Link from 'next/link';

// The staging portfolio is intentionally empty until verified project imagery
// with the required permissions is added to the repository. Rather than
// invent visuals, the section renders an editorial "in preparation" state
// that mirrors the rest of the page's typographic system.

interface StagingProject {
  slug: string;
  neighbourhood: string;
  propertyType: string;
  occupancy: 'occupied' | 'vacant';
  scope: string;
  beforeSrc?: string;
  afterSrc?: string;
  verifiedResult?: string | null;
}

const VERIFIED_PROJECTS: StagingProject[] = [];

const CATEGORY_TAGS = ['Condos', 'Homes', 'Vacant properties', 'Occupied properties', 'Townhomes'];

export default function Portfolio() {
  const hasProjects = VERIFIED_PROJECTS.length > 0;

  return (
    <section id="portfolio" className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
      <div className="max-w-[1240px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="max-w-xl">
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Portfolio</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              Before &amp; after — a selection of recent staging work
            </h2>
            <p className="text-text-muted mt-3 leading-relaxed">
              Selected projects are added as verified photography and permissions are confirmed. Every entry shows the property type, neighbourhood, whether the home was occupied or vacant and the scope of work.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_TAGS.map((c) => (
              <span key={c} className="text-[11px] font-medium text-text-primary/75 bg-white border border-border rounded-full px-3 py-1">{c}</span>
            ))}
          </div>
        </div>

        {hasProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {VERIFIED_PROJECTS.map((p) => (
              <article key={p.slug} className="bg-white rounded-2xl border border-border overflow-hidden">
                <div className="grid grid-cols-2">
                  {p.beforeSrc && (
                    <div className="relative aspect-[4/5] bg-surface2">
                      <img src={p.beforeSrc} alt={`${p.neighbourhood} ${p.propertyType} — before staging`} className="absolute inset-0 w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 text-[9px] font-bold tracking-widest bg-text-primary text-white px-1.5 py-0.5 rounded">BEFORE</span>
                    </div>
                  )}
                  {p.afterSrc && (
                    <div className="relative aspect-[4/5] bg-surface2">
                      <img src={p.afterSrc} alt={`${p.neighbourhood} ${p.propertyType} — after staging`} className="absolute inset-0 w-full h-full object-cover" />
                      <span className="absolute top-2 left-2 text-[9px] font-bold tracking-widest bg-white text-text-primary px-1.5 py-0.5 rounded">AFTER</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <p className="text-[11px] uppercase tracking-widest text-text-muted">{p.propertyType} · {p.occupancy === 'vacant' ? 'Vacant' : 'Occupied'}</p>
                  <p className="font-serif text-lg font-bold text-text-primary mt-1">{p.neighbourhood}</p>
                  <p className="text-sm text-text-muted mt-2 leading-relaxed">{p.scope}</p>
                  {p.verifiedResult && (
                    <p className="text-xs text-text-primary mt-3 pt-3 border-t border-border">{p.verifiedResult}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <PortfolioFallback />
        )}
      </div>
    </section>
  );
}

function PortfolioFallback() {
  return (
    <div className="bg-white border border-border rounded-2xl p-8 md:p-12">
      <div className="grid md:grid-cols-[minmax(0,1fr)_240px] gap-8 items-start">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-text-muted">Portfolio in preparation</p>
          <p className="font-serif text-2xl md:text-3xl font-bold text-text-primary mt-2 leading-tight">
            We&rsquo;re preparing a verified before-and-after gallery for publication
          </p>
          <p className="text-text-muted mt-4 leading-relaxed max-w-2xl">
            Rather than fill this section with stock imagery, we&rsquo;re holding it for photography that has the seller&rsquo;s permission, verified project details and a truthful scope of work. Selected projects will be published here as they clear review.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href="#consultation"
              className="inline-flex items-center justify-center bg-text-primary text-white text-sm font-semibold px-4 py-2.5 rounded-lg hover:brightness-110 transition-all"
            >
              Request a Seller Consultation
            </a>
            <Link
              href="/contact-us"
              className="inline-flex items-center justify-center border border-border text-text-primary text-sm font-semibold px-4 py-2.5 rounded-lg hover:border-text-primary/30 transition-all"
            >
              Ask about a specific project
            </Link>
          </div>
        </div>
        <div aria-hidden className="hidden md:grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`aspect-[4/5] rounded-md ${i % 2 === 0 ? 'bg-[#EAE6DC]' : 'bg-[#F0ECE2]'}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
