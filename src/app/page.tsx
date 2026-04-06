export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { generateLocalBusinessSchema, generateWebSiteSchema, generateHowToSchema } from '@/lib/seo';
import ProjectCard from '@/components/projects/ProjectCard';
import DynamicMap from '@/components/map/DynamicMap';

export default async function HomePage() {
  const featuredRes = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('featured', true)
    .order('priceMin', { ascending: false })
    .limit(6);

  const mapRes = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .not('latitude', 'is', null);

  const neighborhoodRes = await supabase
    .from('neighborhoods')
    .select('*, projects(count)')
    .order('displayOrder', { ascending: true })
    .limit(12);

  const countRes = await supabase.from('projects').select('*', { count: 'exact', head: true });
  const nhCountRes = await supabase.from('neighborhoods').select('*', { count: 'exact', head: true });

  const featured = featuredRes.data || [];
  const mapProjects = mapRes.data || [];
  const neighborhoods = neighborhoodRes.data || [];
  const projectCount = countRes.count || 0;
  const neighborhoodCount = nhCountRes.count || 0;

  const neighborhoodsWithCount = (neighborhoods).map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  // Sort featured: projects with images first
  const sortedFeatured = [...featured].sort((a: any, b: any) => {
    if (a.mainImageUrl && !b.mainImageUrl) return -1;
    if (!a.mainImageUrl && b.mainImageUrl) return 1;
    return 0;
  });

  const schema = generateLocalBusinessSchema();
  const webSiteSchema = generateWebSiteSchema();
  const howToSchema = generateHowToSchema();
  const totalProjects = projectCount;
  const totalNeighborhoods = neighborhoodCount;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* Hero — 3D Map */}
      <section className="relative h-[75vh] w-full">
        <DynamicMap projects={mapProjects} />

        {/* Bottom gradient fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent pointer-events-none z-10" />

        {/* Animated scroll-down chevron */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center animate-bounce">
          <svg className="w-6 h-6 text-text-muted/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Overlay stats panel */}
        <div className="absolute bottom-28 left-8 z-10 glass-panel rounded-2xl p-6 max-w-md">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary leading-tight mb-4">
            Toronto&apos;s Premier<br />
            <span className="text-accent-blue">Pre-Construction</span> Marketplace
          </h1>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <div className="text-accent-blue font-mono text-xl font-semibold">{totalProjects}+</div>
              <div className="text-text-muted text-xs mt-0.5">Projects</div>
            </div>
            <div>
              <div className="text-accent-blue font-mono text-xl font-semibold">{totalNeighborhoods}+</div>
              <div className="text-text-muted text-xs mt-0.5">Neighborhoods</div>
            </div>
            <div>
              <div className="text-accent-blue font-mono text-xl font-semibold">$400K-$5M+</div>
              <div className="text-text-muted text-xs mt-0.5">Price Range</div>
            </div>
          </div>
          <Link href="/new-condos" className="btn-primary inline-flex items-center gap-2 text-sm">
            Browse All Properties &rarr;
          </Link>
        </div>
      </section>

      {/* Featured Developments */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">Featured Developments</h2>
              <p className="text-text-muted mt-2">Handpicked new construction projects across Toronto</p>
            </div>
            <Link href="/new-condos" className="hidden md:inline-flex btn-secondary text-sm">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFeatured.map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
          <div className="mt-8 text-center md:hidden">
            <Link href="/new-condos" className="btn-secondary">View All Projects &rarr;</Link>
          </div>
        </div>
      </section>

      {/* Explore Neighborhoods */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">Explore Toronto&apos;s Neighborhoods</h2>
            <p className="text-text-muted mt-2 max-w-xl mx-auto">
              From the vibrant streets of King West to the refined elegance of Yorkville
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {neighborhoodsWithCount.map((n: any) => (
              <Link
                key={n.id}
                href={`/new-condos-${n.slug}`}
                className="glass-panel group rounded-2xl p-5 hover:border-accent-blue/30 transition-all hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-accent-blue font-semibold text-lg">{n.name[0]}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-blue transition-colors">
                  {n.name}
                </h3>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-text-muted">{n._count.projects} Projects</span>
                  {n.avgPriceStudio && (
                    <span className="text-accent-blue font-mono text-sm">From {formatPrice(n.avgPriceStudio)}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6 bg-surface border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-text-primary">How Pre-Construction Works</h2>
            <p className="text-text-muted mt-2">Four simple steps to securing your dream home</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Browse', desc: 'Explore 200+ pre-construction developments across the Greater Toronto Area with detailed specs, pricing, and floor plans.' },
              { step: '02', title: 'Reserve', desc: 'Secure your preferred unit with a reservation deposit, typically 5%-15%. Lock in pre-construction pricing.' },
              { step: '03', title: 'Track', desc: 'Monitor construction milestones and make scheduled deposit payments (typically 15-20% total before completion).' },
              { step: '04', title: 'Move In', desc: 'Receive your keys to a brand-new home. Close with a mortgage for the remaining balance.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-accent-blue font-mono text-5xl font-bold mb-4">{item.step}</div>
                <h3 className="text-xl font-semibold text-text-primary mb-3">{item.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-text-primary mb-4">
            Ready to Explore Pre-Construction in Toronto?
          </h2>
          <p className="text-text-muted max-w-xl mx-auto mb-8">
            Get exclusive access to pre-launch pricing and new development updates delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/new-condos" className="btn-primary text-lg px-8 py-4">
              Browse Projects
            </Link>
            <Link href="/contact-us" className="btn-secondary text-lg px-8 py-4">
              Speak with an Expert
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
