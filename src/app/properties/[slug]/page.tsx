export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatPriceRange, STATUS_LABELS, CATEGORY_LABELS } from '@/lib/utils';
import { generateRealEstateListingSchema, generateBreadcrumbSchema } from '@/lib/seo';
import Markdown from 'react-markdown';
import StatusBadge from '@/components/projects/StatusBadge';
import InquiryForm from '@/components/projects/InquiryForm';
import ProjectCard from '@/components/projects/ProjectCard';
import ImageGallery from '@/components/projects/ImageGallery';
import FloorPlans from '@/components/projects/FloorPlans';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*)')
    .eq('slug', slug)
    .single();

  if (!project) return { title: 'Project Not Found' };

  const area = project.neighborhood?.name || 'Toronto';
  const title = project.metaTitle || `${project.name} | Pre-Construction in ${area}`;
  const description =
    project.metaDescription ||
    project.description?.slice(0, 160) ||
    `${project.name} - New pre-construction development in ${area}. ${project.priceMin ? `From ${formatPrice(project.priceMin)}.` : ''} ${project.totalUnits ? `${project.totalUnits} residences.` : ''}`;
  return {
    title,
    description,
    alternates: {
      canonical: `https://condowizard.ca/properties/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://condowizard.ca/properties/${slug}`,
      type: 'website',
      ...(project.mainImageUrl && { images: [{ url: project.mainImageUrl, alt: project.name }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      ...(project.mainImageUrl && { images: [project.mainImageUrl] }),
    },
  };
}

export default async function PropertyDetailPage({ params }: Props) {
  const { slug } = await params;
  const { data: project } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('slug', slug)
    .single();

  if (!project) notFound();

  const { data: relatedProjects } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('neighborhoodId', project.neighborhoodId)
    .neq('id', project.id)
    .limit(3);

  const listingSchema = generateRealEstateListingSchema(project);
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Properties', url: 'https://condowizard.ca/new-condos' },
    ...(project.neighborhood
      ? [{ name: project.neighborhood.name, url: `https://condowizard.ca/new-condos-${project.neighborhood.slug}` }]
      : []),
    { name: project.name, url: `https://condowizard.ca/properties/${project.slug}` },
  ]);

  // Defensive: amenities may be stored as string, array, or null
  let amenities: string[] = [];
  if (Array.isArray(project.amenities)) {
    amenities = project.amenities;
  } else if (typeof project.amenities === 'string') {
    try { amenities = JSON.parse(project.amenities); } catch { amenities = []; }
  }

  // Parse faqJson — could be array or JSON string
  let parsedFaqs: { question: string; answer: string }[] = [];
  if (Array.isArray(project.faqJson)) {
    parsedFaqs = project.faqJson;
  } else if (typeof project.faqJson === 'string') {
    try { parsedFaqs = JSON.parse(project.faqJson); } catch {}
  }
  const projectImages = (project.images as any) || {};
  // gallery may be stored as string[] (from scraper) or {url,alt}[] (legacy) — normalize
  const rawGallery = Array.isArray(projectImages.gallery) ? projectImages.gallery : [];
  const galleryImages: { url: string; alt?: string; type?: string }[] = rawGallery
    .map((g: any, i: number) => typeof g === 'string' ? { url: g, alt: `${project.name} — Image ${i + 1}` } : g)
    .filter((g: any) => g && typeof g.url === 'string' && g.url.length > 0);
  const rawFloor = Array.isArray(projectImages.floorPlans) ? projectImages.floorPlans : [];
  const floorPlanImages: { url: string; label?: string }[] = rawFloor
    .map((f: any, i: number) => typeof f === 'string' ? { url: f, label: `Floor Plan ${i + 1}` } : f)
    .filter((f: any) => f && typeof f.url === 'string');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-text-muted mb-8 flex items-center gap-2 flex-wrap">
          <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
          <span className="text-text-muted/40">/</span>
          <Link href="/pre-construction" className="hover:text-accent-blue transition-colors">Properties</Link>
          {project.neighborhood && (
            <>
              <span className="text-text-muted/40">/</span>
              <Link href={`/new-condos-${project.neighborhood.slug}`} className="hover:text-accent-blue transition-colors">
                {project.neighborhood.name}
              </Link>
            </>
          )}
          <span className="text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">{project.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <StatusBadge status={project.status} />
                <span className="text-xs text-text-muted bg-surface2 border border-border px-2.5 py-1 rounded-full">
                  {CATEGORY_LABELS[project.category] || project.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-text-primary">{project.name}</h1>
              {project.address && <p className="text-text-muted mt-2">{project.address}</p>}
              {project.developer && (
                <p className="text-text-muted mt-1">
                  by <Link href={`/developers/${project.developer.slug}`} className="text-text-primary font-medium hover:text-accent-blue transition-colors">{project.developer.name}</Link>
                </p>
              )}
            </div>

            {/* Image placeholder */}
            <div className="bg-gradient-to-br from-surface2 to-surface rounded-2xl h-64 md:h-96 flex items-center justify-center overflow-hidden border border-border">
              {project.mainImageUrl ? (
                <img src={project.mainImageUrl} alt={project.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-text-muted/20 text-7xl font-light">{project.name[0]}</span>
              )}
            </div>

            {/* Key Specs — 4 glass panels */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Price', value: formatPriceRange(project.priceMin, project.priceMax) },
                { label: 'Total Units', value: project.totalUnits ? `${project.totalUnits} Residences` : 'TBD' },
                { label: 'Floors', value: project.floors ? `${project.floors} Stories` : 'TBD' },
                { label: 'Est. Completion', value: project.estCompletion || 'TBD' },
              ].map((spec) => (
                <div key={spec.label} className="glass-panel rounded-xl p-4">
                  <div className="text-xs text-text-muted uppercase tracking-wider">{spec.label}</div>
                  <div className="text-text-primary font-semibold mt-1">{spec.value}</div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-text-muted/40 -mt-2">Prices shown are approximate and subject to change. Verify with developer or licensed agent.</p>

            {project.unitTypes && (
              <div className="glass-panel rounded-xl p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Unit Types</div>
                <div className="text-text-primary font-medium">{project.unitTypes}</div>
              </div>
            )}

            {project.depositStructure && (
              <div className="bg-accent-blue/5 border border-accent-blue/20 rounded-xl p-4">
                <div className="text-xs text-accent-blue uppercase tracking-wider mb-1">Deposit Structure</div>
                <div className="text-text-primary font-medium">{project.depositStructure}</div>
              </div>
            )}

            {/* Description — structured sections with blue left-border */}
            {(project.longDescription || project.description) && (() => {
              // Try to parse structured JSON content
              let structured: any = null;
              try {
                const parsed = JSON.parse(project.longDescription || '');
                if (parsed.about || parsed.location || parsed.investment || parsed.developer) {
                  structured = parsed;
                }
              } catch {}

              if (structured) {
                const devName = project.developer?.name || 'the Developer';
                const hoodName = project.neighborhood?.name || 'the Neighbourhood';
                const sections = [
                  { key: 'about', title: `About ${project.name}`, content: structured.about },
                  { key: 'location', title: `Living in ${hoodName}`, content: structured.location },
                  { key: 'investment', title: 'Buyer and Investment Considerations', content: structured.investment },
                  { key: 'developer', title: `About ${devName}`, content: structured.developer },
                ].filter(s => s.content);

                const renderParagraphs = (text: string) =>
                  text.split(/\n\n+/).map((p: string, i: number) => (
                    <p key={i} className="text-sm text-text-muted leading-relaxed mb-3 last:mb-0 whitespace-pre-line">
                      {p}
                    </p>
                  ));

                return (
                  <div className="space-y-6">
                    {sections.map(s => (
                      <div key={s.key} className="border-l-[3px] border-accent-blue pl-5">
                        <h2 className="text-lg font-semibold text-text-primary mb-2">{s.title}</h2>
                        {renderParagraphs(s.content)}
                      </div>
                    ))}

                    {structured.considerations && (
                      <div className="border-l-[3px] border-amber-500 pl-5 bg-amber-50/40 py-3 rounded-r-md">
                        <h2 className="text-lg font-semibold text-text-primary mb-2">Important Considerations Before Purchasing</h2>
                        <ul className="list-disc list-outside ml-4 space-y-1 text-sm text-text-muted leading-relaxed">
                          {structured.considerations.split('\n').filter((l: string) => l.trim()).map((line: string, i: number) => (
                            <li key={i}>{line}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {structured.pricing && (
                      <div className="border-l-[3px] border-accent-blue pl-5">
                        <h2 className="text-lg font-semibold text-text-primary mb-2">{project.name} Pricing and Floor Plans</h2>
                        <p className="text-sm text-text-muted leading-relaxed">{structured.pricing}</p>
                      </div>
                    )}

                    {structured.lastVerified && (
                      <p className="text-xs text-text-muted/60 italic">Information last verified: {structured.lastVerified}</p>
                    )}
                  </div>
                );
              }

              // Fallback: render as Markdown
              return (
                <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-muted prose-p:leading-relaxed">
                  <Markdown
                    components={{
                      a: ({ href, children }) => href?.startsWith('/') ? <a href={href}>{children}</a> : <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                      h2: ({ children }) => <h2 className="text-lg font-semibold text-text-primary mt-8 mb-3 pl-4 border-l-[3px] border-accent-blue/60">{children}</h2>,
                    }}
                  >
                    {project.longDescription || project.description}
                  </Markdown>
                </div>
              );
            })()}

            {/* Amenities */}
            {amenities.length > 0 && (() => {
              let amenitiesIntro: string | null = null;
              try {
                const parsed = JSON.parse(project.longDescription || '');
                if (parsed?.amenitiesIntro) amenitiesIntro = parsed.amenitiesIntro;
              } catch {}
              return (
                <div>
                  <h2 className="text-2xl font-semibold text-text-primary mb-3">Amenities</h2>
                  {amenitiesIntro && (
                    <p className="text-sm text-text-muted leading-relaxed mb-4">{amenitiesIntro}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {amenities.map((amenity: string) => (
                      <div key={amenity} className="flex items-center gap-2 text-sm text-text-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent-blue flex-shrink-0" />
                        {amenity}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Gallery */}
            <ImageGallery images={galleryImages} projectName={project.name} />

            {/* Floor Plans — gated */}
            <FloorPlans floorPlans={floorPlanImages} projectId={project.id} projectName={project.name} />

            {/* Architect */}
            {project.architect && (
              <div className="glass-panel rounded-xl p-4">
                <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Architect</div>
                <div className="text-text-primary font-medium">{project.architect}</div>
              </div>
            )}

            {/* FAQ Section */}
            {parsedFaqs.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold text-text-primary mb-4">
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {parsedFaqs.map((faq, i) => (
                    <details key={i} className="glass-panel rounded-xl group">
                      <summary className="cursor-pointer p-4 flex items-center justify-between text-text-primary font-medium hover:text-accent-blue transition-colors">
                        {faq.question}
                        <svg className="w-5 h-5 text-text-muted group-open:rotate-180 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="px-4 pb-4 text-text-muted leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
                <script
                  type="application/ld+json"
                  dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'FAQPage',
                      mainEntity: parsedFaqs.map(faq => ({
                        '@type': 'Question',
                        name: faq.question,
                        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                      })),
                    }),
                  }}
                />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-24">
              <InquiryForm projectId={project.id} projectName={project.name} />

              {/* Form disclaimer */}
              <p className="text-[10px] text-text-muted/50 mt-3 px-1 leading-relaxed">
                By submitting this form, you agree to our{' '}
                <Link href="/terms" className="underline hover:text-text-muted">Terms of Service</Link> and{' '}
                <Link href="/privacy" className="underline hover:text-text-muted">Privacy Policy</Link>.
                CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage. All pricing and project details are approximate and subject to change.
              </p>

              {/* Neighborhood link */}
              {project.neighborhood && (
                <Link
                  href={`/new-condos-${project.neighborhood.slug}`}
                  className="mt-6 block card p-5 group hover:border-accent-blue/30 transition-all"
                >
                  <div className="text-xs text-text-muted uppercase tracking-wider mb-1">Neighbourhood</div>
                  <div className="text-text-primary text-lg font-semibold group-hover:text-accent-blue transition-colors">
                    {project.neighborhood.name}
                  </div>
                  <div className="text-accent-blue text-sm mt-1">View all projects &rarr;</div>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Related Projects */}
        {(relatedProjects || []).length > 0 && (
          <div className="mt-20 pt-10 border-t border-border">
            <h2 className="text-2xl font-semibold text-text-primary mb-6">
              More in {project.neighborhood?.name || 'This Area'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(relatedProjects || []).map((p: any) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
