export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { generateBreadcrumbSchema, generateFAQSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import InquiryForm from '@/components/projects/InquiryForm';
import DynamicNeighborhoodMap from '@/components/map/DynamicNeighborhoodMap';

type Props = { params: Promise<{ neighborhood: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { neighborhood: slug } = await params;
  const { data: n } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .single();
  if (!n) return { title: 'Neighborhood Not Found' };
  return {
    title: n.metaTitle || `New Pre-Construction Condos in ${n.name} | CondoWizard.ca`,
    description: n.metaDescription || `Browse pre-construction condos in ${n.name}. Find new developments, pricing, floor plans, and completion dates.`,
    alternates: {
      canonical: `https://condowizard.ca/new-condos-${n.slug}`,
    },
    openGraph: {
      title: n.metaTitle || `New Pre-Construction Condos in ${n.name}`,
      description: n.metaDescription || `Browse pre-construction condos in ${n.name}.`,
      url: `https://condowizard.ca/new-condos-${n.slug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: n.metaTitle || `New Pre-Construction Condos in ${n.name}`,
      description: n.metaDescription || `Browse pre-construction condos in ${n.name}.`,
    },
  };
}

export default async function NeighborhoodPage({ params }: Props) {
  const { neighborhood: slug } = await params;

  const { data: neighborhood } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!neighborhood) notFound();

  const [{ data: projects }, { data: allNeighborhoods }] = await Promise.all([
    supabase
      .from('projects')
      .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
      .eq('neighborhoodId', neighborhood.id)
      .order('priceMin', { ascending: true }),
    supabase
      .from('neighborhoods')
      .select('*, projects(count)')
      .neq('id', neighborhood.id)
      .order('displayOrder', { ascending: true })
      .limit(12),
  ]);

  const projectList = projects || [];
  const projectCount = projectList.length;

  const allWithCount = (allNeighborhoods || []).map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  // Split neighborhoods for sidebar (4) and bottom interlinking (all)
  const sidebarNeighborhoods = allWithCount.slice(0, 4);
  const bottomNeighborhoods = allWithCount;

  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'New Condos', url: 'https://condowizard.ca/new-condos' },
    { name: neighborhood.name, url: `https://condowizard.ca/new-condos-${neighborhood.slug}` },
  ]);

  // Generate dynamic FAQs based on neighborhood data
  const faqs = [
    {
      question: `What are the best new pre-construction condos in ${neighborhood.name}?`,
      answer: projectCount > 0
        ? `There are currently ${projectCount} active pre-construction developments in ${neighborhood.name}. ${projectList.slice(0, 3).map((p: any) => p.name).join(', ')}${projectCount > 3 ? ` and ${projectCount - 3} more` : ''} are among the top projects. Visit our ${neighborhood.name} page for full pricing, floor plans, and availability.`
        : `New pre-construction projects in ${neighborhood.name} are coming soon. Register with us to be notified of new launches and VIP pricing.`,
    },
    {
      question: `What is the average price of pre-construction condos in ${neighborhood.name}?`,
      answer: neighborhood.avgPriceStudio
        ? `Pre-construction condo prices in ${neighborhood.name} start from approximately ${formatPrice(neighborhood.avgPriceStudio)} for studios. ${neighborhood.avgPrice2br ? `Two-bedroom units average around ${formatPrice(neighborhood.avgPrice2br)}.` : ''} Prices vary significantly by developer, floor level, and view. Contact us for current pricing on specific projects.`
        : `Pre-construction condo prices in ${neighborhood.name} vary by project, unit type, and floor level. Get in touch for current pricing on specific developments in ${neighborhood.name}.`,
    },
    {
      question: `Is ${neighborhood.name} a good area to buy pre-construction in Toronto?`,
      answer: `${neighborhood.name} is one of the Greater Toronto Area's most sought-after neighborhoods for pre-construction investment. ${neighborhood.description?.slice(0, 200) || `The area offers excellent amenities, strong appreciation potential, and a desirable lifestyle.`} Connect with a licensed agent for a personalized investment analysis.`,
    },
    {
      question: `When will new condos in ${neighborhood.name} be completed?`,
      answer: `Most pre-construction condos currently selling in ${neighborhood.name} have estimated completion dates between 2026 and 2030+. Completion timelines vary by project — some developments in ${neighborhood.name} are already under construction while others are in pre-construction sales. Contact us for project-specific timelines.`,
    },
  ];

  const faqSchema = generateFAQSchema(faqs);

  // Neighborhood center coordinates for mini-map
  const NEIGHBORHOOD_MAP_CENTERS: Record<string, [number, number]> = {
    'downtown-core': [43.6510, -79.3832],
    'king-west': [43.6440, -79.4020],
    'liberty-village': [43.6380, -79.4180],
    'queen-west': [43.6470, -79.4120],
    'yorkville': [43.6710, -79.3940],
    'the-annex': [43.6700, -79.4050],
    'midtown': [43.6990, -79.3960],
    'yonge-eglinton': [43.7080, -79.3980],
    'north-york': [43.7670, -79.4130],
    'scarborough': [43.7730, -79.2580],
    'etobicoke': [43.6520, -79.5640],
    'leaside': [43.7080, -79.3600],
    'leslieville': [43.6630, -79.3320],
    'riverside': [43.6590, -79.3430],
    'danforth': [43.6810, -79.3230],
    'high-park': [43.6530, -79.4640],
    'junction': [43.6640, -79.4680],
    'roncesvalles': [43.6490, -79.4500],
    'waterfront': [43.6390, -79.3810],
    'cityplace': [43.6390, -79.3960],
    'fort-york': [43.6370, -79.4010],
    'canary-district': [43.6560, -79.3520],
    'port-lands': [43.6490, -79.3380],
    'mississauga': [43.5890, -79.6441],
    'vaughan': [43.8361, -79.4983],
    'richmond-hill': [43.8828, -79.4403],
    'markham': [43.8561, -79.3370],
    'oakville': [43.4675, -79.6877],
    'burlington': [43.3255, -79.7990],
    'hamilton': [43.2557, -79.8711],
    'brampton': [43.7315, -79.7624],
  };
  const mapCenter = NEIGHBORHOOD_MAP_CENTERS[slug] || [43.6532, -79.3832];

  const prices = [
    { type: 'Studio', price: neighborhood.avgPriceStudio },
    { type: '1 Bedroom', price: neighborhood.avgPrice1br },
    { type: '2 Bedroom', price: neighborhood.avgPrice2br },
    { type: '3 Bedroom', price: neighborhood.avgPrice3br },
    { type: 'Penthouse', price: neighborhood.avgPricePenthouse },
  ].filter((p) => p.price);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="bg-surface py-16 md:py-24 border-b border-border">
        <div className="container-main">
          <nav className="text-sm text-text-muted mb-6 flex items-center gap-2">
            <Link href="/" className="hover:text-accent-blue transition-colors">Home</Link>
            <span>/</span>
            <Link href="/new-condos" className="hover:text-accent-blue transition-colors">New Condos</Link>
            <span>/</span>
            <span className="text-accent-blue">{neighborhood.name}</span>
          </nav>
          <h1 className="text-3xl md:text-5xl font-bold text-text-primary">
            New Pre-Construction Condos in <span className="text-accent-blue">{neighborhood.name}</span>
          </h1>
          <p className="text-text-muted mt-4 text-lg max-w-2xl">
            {projectCount > 0
              ? `${projectCount} active ${projectCount === 1 ? 'development' : 'developments'} available.`
              : 'New developments coming soon.'}
            {neighborhood.avgPriceStudio && ` Starting from ${formatPrice(neighborhood.avgPriceStudio)}.`}
            {' '}Updated for 2026-2030.
          </p>
        </div>
      </section>

      {/* Neighborhood 3D Mini-Map */}
      <section className="container-main mt-8">
        <DynamicNeighborhoodMap
          center={mapCenter}
          neighborhoodName={neighborhood.name}
          neighborhoodId={neighborhood.id}
        />
      </section>

      <div className="container-main pt-24 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            {/* About This Neighborhood */}
            {neighborhood.description && (
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  About {neighborhood.name} Real Estate
                </h2>
                <div className="text-text-muted leading-relaxed whitespace-pre-line">
                  {neighborhood.description}
                </div>
              </section>
            )}

            {/* Price Table */}
            {prices.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Average Pre-Construction Prices in {neighborhood.name}
                </h2>
                <div className="card overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface2 text-sm">
                        <th className="px-6 py-3 text-left font-medium text-text-muted">Unit Type</th>
                        <th className="px-6 py-3 text-right font-medium text-text-muted">Starting Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prices.map((p, i) => (
                        <tr key={p.type} className={`border-t border-border ${i % 2 === 0 ? 'bg-bg' : 'bg-surface'}`}>
                          <td className="px-6 py-3 text-sm text-text-primary">{p.type}</td>
                          <td className="px-6 py-3 text-sm text-right font-semibold font-mono text-accent-blue">{formatPrice(p.price)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Projects */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                All Pre-Construction Projects in {neighborhood.name} ({projectCount})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projectList.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
              {projectCount === 0 && (
                <div className="text-center py-16 card">
                  <p className="text-text-muted mb-4">No projects listed in {neighborhood.name} yet.</p>
                  <p className="text-sm text-text-muted">
                    New pre-construction launches are announced regularly.{' '}
                    <Link href="/contact-us" className="text-accent-blue hover:underline">Contact us</Link>
                    {' '}to be notified of upcoming projects in {neighborhood.name}.
                  </p>
                </div>
              )}
            </section>

            {/* Lifestyle Section */}
            {neighborhood.lifestyleDescription && (
              <section>
                <h2 className="text-2xl font-bold text-text-primary mb-4">
                  Living in {neighborhood.name}: Lifestyle & Amenities
                </h2>
                <div className="text-text-muted leading-relaxed whitespace-pre-line">
                  {neighborhood.lifestyleDescription}
                </div>
              </section>
            )}

            {/* FAQ Section */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Frequently Asked Questions About {neighborhood.name} Pre-Construction
              </h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <details key={i} className="card group" open={i === 0}>
                    <summary className="p-5 cursor-pointer list-none flex items-center justify-between text-text-primary font-medium hover:text-accent-blue transition-colors">
                      <h3 className="text-base font-medium pr-4">{faq.question}</h3>
                      <span className="text-accent-blue text-xl flex-shrink-0 group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <div className="px-5 pb-5 text-text-muted text-sm leading-relaxed border-t border-border pt-4">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Top Developers in this Neighborhood */}
            {(() => {
              const devCounts: Record<string, { name: string; slug: string; count: number }> = {};
              for (const p of projectList) {
                const dev = (p as any).developer;
                if (dev?.name && dev?.slug) {
                  if (!devCounts[dev.slug]) devCounts[dev.slug] = { name: dev.name, slug: dev.slug, count: 0 };
                  devCounts[dev.slug].count++;
                }
              }
              const topDevs = Object.values(devCounts).sort((a, b) => b.count - a.count).slice(0, 6);
              if (topDevs.length === 0) return null;
              return (
                <section>
                  <h2 className="text-2xl font-bold text-text-primary mb-6">
                    Top Developers in {neighborhood.name}
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {topDevs.map((d) => (
                      <Link
                        key={d.slug}
                        href={`/developers/${d.slug}`}
                        className="card p-4 hover:border-accent-blue/30 transition-all group"
                      >
                        <div className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors line-clamp-1">
                          {d.name}
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          {d.count} {d.count === 1 ? 'project' : 'projects'} in {neighborhood.name}
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Explore All Neighborhoods — Full Interlinking */}
            <section>
              <h2 className="text-2xl font-bold text-text-primary mb-6">
                Explore More GTA Neighborhoods
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {bottomNeighborhoods.map((n: any) => (
                  <Link
                    key={n.id}
                    href={`/new-condos-${n.slug}`}
                    className="card p-4 hover:border-accent-blue/30 transition-all group"
                  >
                    <div className="text-sm font-medium text-text-primary group-hover:text-accent-blue transition-colors">
                      {n.name}
                    </div>
                    <div className="text-xs text-text-muted mt-1">
                      {n._count.projects} {n._count.projects === 1 ? 'project' : 'projects'}
                    </div>
                  </Link>
                ))}
              </div>
              <div className="mt-4 text-center">
                <Link href="/new-condos" className="text-sm text-accent-blue hover:underline">
                  View all neighborhoods &rarr;
                </Link>
              </div>
            </section>

            {/* CTA — Contextual interlink to homepage */}
            <section className="bg-accent-blue/5 border border-accent-blue/20 rounded-2xl p-8 text-center">
              <h2 className="text-xl font-bold text-text-primary mb-3">
                Ready to Invest in {neighborhood.name}?
              </h2>
              <p className="text-text-muted text-sm mb-6 max-w-lg mx-auto">
                Our partner agents specialize in {neighborhood.name} pre-construction condos.
                Get VIP access to new launches, developer pricing, and exclusive floor plans.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/contact-us" className="btn-primary">
                  Schedule a Consultation
                </Link>
                <Link href="/new-condos" className="px-6 py-3 border border-border rounded-xl text-sm text-text-primary hover:border-accent-blue/30 transition-colors">
                  Browse All Projects
                </Link>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="sticky top-20 space-y-6">
              <InquiryForm neighborhoodId={neighborhood.id} source="neighborhood" />

              {/* Nearby Neighborhoods */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Nearby Neighborhoods</h3>
                <div className="space-y-3">
                  {sidebarNeighborhoods.map((n: any) => (
                    <Link
                      key={n.id}
                      href={`/new-condos-${n.slug}`}
                      className="flex items-center justify-between text-sm text-text-muted hover:text-accent-blue transition-colors"
                    >
                      <span>{n.name}</span>
                      <span className="text-text-muted/60">{n._count.projects} projects</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="card p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    &rarr; Home
                  </Link>
                  <Link href="/new-condos" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    &rarr; All New Condos
                  </Link>
                  <Link href="/blog" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    &rarr; Market Insights Blog
                  </Link>
                  <Link href="/contact-us" className="block text-sm text-text-muted hover:text-accent-blue transition-colors">
                    &rarr; Connect with an Agent
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
