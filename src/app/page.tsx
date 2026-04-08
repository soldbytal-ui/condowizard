export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { generateLocalBusinessSchema, generateWebSiteSchema, generateHowToSchema } from '@/lib/seo';
import DynamicMap from '@/components/map/DynamicMap';
import HomeSearch from '@/components/home/HomeSearch';

export default async function HomePage() {
  // Fetch pre-con projects for the map
  const mapRes = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .not('latitude', 'is', null);

  // Featured pre-con projects
  const featuredRes = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('featured', true)
    .order('priceMin', { ascending: false })
    .limit(6);

  // Neighborhoods
  const neighborhoodRes = await supabase
    .from('neighborhoods')
    .select('*, projects(count)')
    .order('displayOrder', { ascending: true })
    .limit(12);

  const countRes = await supabase.from('projects').select('*', { count: 'exact', head: true });

  const mapProjects = mapRes.data || [];
  const featured = featuredRes.data || [];
  const neighborhoods = neighborhoodRes.data || [];
  const projectCount = countRes.count || 0;

  const neighborhoodsWithCount = neighborhoods.map((n: any) => ({
    ...n,
    _count: { projects: n.projects?.[0]?.count || 0 },
  }));

  const sortedFeatured = [...featured].sort((a: any, b: any) => {
    if (a.mainImageUrl && !b.mainImageUrl) return -1;
    if (!a.mainImageUrl && b.mainImageUrl) return 1;
    return 0;
  });

  const schema = generateLocalBusinessSchema();
  const webSiteSchema = generateWebSiteSchema();
  const howToSchema = generateHowToSchema();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      {/* Hero with 3D Map */}
      <section className="relative h-[80vh] w-full">
        <DynamicMap projects={mapProjects} />

        {/* Bottom gradient */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-bg to-transparent pointer-events-none z-10" />

        {/* Search overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl px-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white text-center mb-2 drop-shadow-lg">
              Find Your Next Home in Toronto
            </h1>
            <p className="text-white/80 text-center mb-6 drop-shadow">
              MLS listings, pre-construction condos, sold data & market insights
            </p>
            <HomeSearch />
          </div>
        </div>

        {/* Stats panel */}
        <div className="absolute bottom-28 left-8 z-10 bg-white/90 backdrop-blur-md rounded-2xl p-5 max-w-sm shadow-lg border border-border hidden md:block">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-accent-blue font-mono text-lg font-bold">Live</div>
              <div className="text-text-muted text-xs mt-0.5">MLS Data</div>
            </div>
            <div>
              <div className="text-accent-blue font-mono text-lg font-bold">{projectCount}+</div>
              <div className="text-text-muted text-xs mt-0.5">Pre-Con Projects</div>
            </div>
            <div>
              <div className="text-accent-blue font-mono text-lg font-bold">24+</div>
              <div className="text-text-muted text-xs mt-0.5">Neighborhoods</div>
            </div>
          </div>
        </div>

        {/* Scroll chevron */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* Quick access tabs */}
      <section className="py-8 px-6 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/search', icon: '🏠', title: 'Buy', desc: 'Browse active MLS listings' },
            { href: '/search?tab=rent', icon: '🔑', title: 'Rent', desc: 'Find rental listings' },
            { href: '/sold', icon: '📊', title: 'Sold Data', desc: 'Recent sale prices' },
            { href: '/search?tab=precon', icon: '🏗️', title: 'Pre-Construction', desc: `${projectCount}+ new projects` },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-accent-blue/30 hover:-translate-y-0.5 transition-all"
            >
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Pre-Construction Projects */}
      {sortedFeatured.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-block px-3 py-1 bg-bt-precon/20 text-bt-precon text-xs font-bold rounded-full mb-2">
                  PRE-CONSTRUCTION
                </span>
                <h2 className="text-3xl font-bold text-text-primary">Featured New Developments</h2>
                <p className="text-text-muted mt-1">Handpicked pre-construction projects across Toronto</p>
              </div>
              <Link href="/new-condos" className="hidden md:inline-flex items-center gap-1 text-accent-blue text-sm font-medium hover:underline">
                View All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedFeatured.map((project: any) => (
                <Link
                  key={project.id}
                  href={`/properties/${project.slug}`}
                  className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-all"
                >
                  <div className="relative aspect-[4/3] bg-surface2 overflow-hidden">
                    {project.mainImageUrl ? (
                      <img src={project.mainImageUrl} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : project.images?.[0] ? (
                      <img src={project.images[0]} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 bg-bt-precon text-black text-[10px] font-bold rounded px-2 py-0.5">
                      PRE-CONSTRUCTION
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">{project.name}</h3>
                    <p className="text-sm text-text-muted mt-0.5">
                      {project.neighborhood?.name || 'Toronto'} {project.developer?.name ? `by ${project.developer.name}` : ''}
                    </p>
                    <p className="font-serif text-lg font-bold text-text-primary mt-2">
                      {formatPrice(project.priceMin)} {project.priceMax ? `- ${formatPrice(project.priceMax)}` : '+'}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-text-muted mt-2">
                      {project.totalUnits && <span>{project.totalUnits} units</span>}
                      {project.floors && <span>{project.floors} floors</span>}
                      {project.estCompletion && <span>Est. {project.estCompletion}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Neighborhoods */}
      <section className="py-16 px-6 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary">Explore Toronto Neighborhoods</h2>
            <p className="text-text-muted mt-2 max-w-xl mx-auto">
              From the vibrant streets of King West to the refined elegance of Yorkville
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {neighborhoodsWithCount.map((n: any) => (
              <Link
                key={n.id}
                href={`/neighborhood/${n.slug}`}
                className="group bg-surface rounded-xl p-5 border border-border hover:border-accent-blue/30 hover:-translate-y-0.5 transition-all"
              >
                <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-accent-blue font-bold text-lg">{n.name[0]}</span>
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

      {/* Market Stats Preview */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary">Toronto Market at a Glance</h2>
            <p className="text-text-muted mt-2">Live data from the Toronto Regional Real Estate Board</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: 'Live', sub: 'TRREB MLS' },
              { label: 'Pre-Con Projects', value: `${projectCount}+`, sub: 'Across GTA' },
              { label: 'Neighborhoods', value: '24+', sub: 'Toronto & GTA' },
              { label: 'Price Range', value: '$400K-$5M+', sub: 'All property types' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl border border-border p-5 text-center">
                <p className="font-serif text-2xl font-bold text-accent-blue">{stat.value}</p>
                <p className="font-medium text-text-primary text-sm mt-1">{stat.label}</p>
                <p className="text-xs text-text-muted">{stat.sub}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/market" className="inline-flex items-center gap-2 text-accent-blue font-medium hover:underline">
              View Full Market Report &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-text-primary">How CondoWizard Works</h2>
            <p className="text-text-muted mt-2">Your complete Toronto real estate toolkit</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Search', desc: 'Explore live MLS listings and pre-construction projects on our interactive map with AI-powered search.' },
              { step: '02', title: 'Compare', desc: 'Analyze sold data, market trends, and AI property estimates to make informed decisions.' },
              { step: '03', title: 'Connect', desc: 'Get expert guidance from Tal Shelef, your licensed Sales Representative at Rare Real Estate Inc.' },
              { step: '04', title: 'Close', desc: 'From offer to closing, get full-service support for resale or pre-construction purchases.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-accent-blue font-mono text-4xl font-bold mb-3">{item.step}</div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">
            Ready to Find Your Next Home?
          </h2>
          <p className="text-text-muted max-w-xl mx-auto mb-8">
            Search thousands of MLS listings and pre-construction projects. Get expert guidance every step of the way.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="bg-accent-blue text-white text-lg font-medium px-8 py-4 rounded-lg hover:bg-accent-blue/90 transition-colors">
              Start Searching
            </Link>
            <Link href="/contact-us" className="border border-border text-text-primary text-lg font-medium px-8 py-4 rounded-lg hover:border-accent-blue/30 transition-colors">
              Speak with an Expert
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
