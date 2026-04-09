export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import { generateLocalBusinessSchema, generateWebSiteSchema, generateHowToSchema } from '@/lib/seo';
import HomeSearch from '@/components/home/HomeSearch';

const NEIGHBOURHOODS = [
  { name: 'Yorkville', slug: 'yorkville', desc: 'Luxury condos & designer boutiques' },
  { name: 'King West', slug: 'king-west', desc: 'Restaurants, nightlife & lofts' },
  { name: 'Liberty Village', slug: 'liberty-village', desc: 'Young professionals & tech' },
  { name: 'The Annex', slug: 'the-annex', desc: 'University area, heritage homes' },
  { name: 'Waterfront', slug: 'waterfront', desc: 'Lakefront condos & parks' },
  { name: 'Leslieville', slug: 'leslieville', desc: 'Family-friendly, artsy vibe' },
  { name: 'High Park', slug: 'high-park', desc: 'Green space, Bloor West Village' },
  { name: 'North York', slug: 'north-york', desc: 'Suburban living, Yonge corridor' },
];

export default async function HomePage() {
  const featuredRes = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
    .eq('featured', true)
    .order('priceMin', { ascending: false })
    .limit(6);

  const countRes = await supabase.from('projects').select('*', { count: 'exact', head: true });

  const featured = featuredRes.data || [];
  const projectCount = countRes.count || 0;

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

      {/* Hero — clean, no map */}
      <section className="pt-24 pb-16 px-6 bg-gradient-to-b from-surface to-bg">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-text-primary leading-tight">
            Find Your Next Home<br />in Toronto
          </h1>
          <p className="text-text-muted mt-4 text-lg max-w-xl mx-auto">
            Live MLS data, pre-construction projects, sold history &amp; market insights
          </p>
          <div className="mt-8 max-w-2xl mx-auto">
            <HomeSearch />
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="py-8 px-6 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: '/search', icon: '🏠', title: 'Buy', desc: '11,000+ active listings' },
            { href: '/search?tab=rent', icon: '🔑', title: 'Rent', desc: '14,000+ rentals' },
            { href: '/search?tab=sold', icon: '📊', title: 'Sold Data', desc: 'Market history back to 2003' },
            { href: '/new-condos', icon: '🏗️', title: 'Pre-Construction', desc: `${projectCount || 803}+ new projects` },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-accent-blue/30 hover:-translate-y-0.5 transition-all">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Pre-Con */}
      {sortedFeatured.length > 0 && (
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-block px-3 py-1 bg-bt-precon/20 text-bt-precon text-xs font-bold rounded-full mb-2">PRE-CONSTRUCTION</span>
                <h2 className="text-3xl font-bold text-text-primary">Featured New Developments</h2>
                <p className="text-text-muted mt-1">Handpicked pre-construction projects across Toronto</p>
              </div>
              <Link href="/new-condos" className="hidden md:inline-flex items-center gap-1 text-accent-blue text-sm font-medium hover:underline">View All &rarr;</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedFeatured.map((project: any) => (
                <Link key={project.id} href={`/properties/${project.slug}`} className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-md transition-all">
                  <div className="relative aspect-[4/3] bg-surface2 overflow-hidden">
                    {(project.mainImageUrl || project.images?.[0]) ? (
                      <img src={project.mainImageUrl || project.images[0]} alt={project.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted">No Image</div>
                    )}
                    <div className="absolute top-2 left-2 bg-bt-precon text-black text-[10px] font-bold rounded px-2 py-0.5">PRE-CONSTRUCTION</div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-text-primary group-hover:text-accent-blue transition-colors">{project.name}</h3>
                    <p className="text-sm text-text-muted mt-0.5">{project.neighborhood?.name || 'Toronto'} {project.developer?.name ? `by ${project.developer.name}` : ''}</p>
                    <p className="font-serif text-lg font-bold text-text-primary mt-2">{formatPrice(project.priceMin)} {project.priceMax ? `- ${formatPrice(project.priceMax)}` : '+'}</p>
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

      {/* Neighbourhoods */}
      <section className="py-16 px-6 bg-white border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary">Explore Toronto Neighbourhoods</h2>
            <p className="text-text-muted mt-2 max-w-xl mx-auto">From the vibrant streets of King West to the refined elegance of Yorkville</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {NEIGHBOURHOODS.map((n) => (
              <Link key={n.slug} href={`/search?neighborhood=${encodeURIComponent(n.name)}`} className="group bg-surface rounded-xl p-5 border border-border hover:border-accent-blue/30 hover:-translate-y-0.5 transition-all">
                <div className="w-10 h-10 bg-accent-blue/10 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-accent-blue font-bold text-lg">{n.name[0]}</span>
                </div>
                <h3 className="text-lg font-semibold text-text-primary group-hover:text-accent-blue transition-colors">{n.name}</h3>
                <p className="text-sm text-text-muted mt-1">{n.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Market Stats */}
      <section className="py-16 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-text-primary">Toronto Market at a Glance</h2>
            <p className="text-text-muted mt-2">Live data from the Toronto Regional Real Estate Board</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Listings', value: '11,000+', sub: 'TRREB MLS' },
              { label: 'Pre-Con Projects', value: `${projectCount || 803}+`, sub: 'Across GTA' },
              { label: 'Neighbourhoods', value: '144', sub: 'Toronto & GTA' },
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
            <Link href="/market" className="inline-flex items-center gap-2 text-accent-blue font-medium hover:underline">View Full Market Report &rarr;</Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-white border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to Find Your Next Home?</h2>
          <p className="text-text-muted max-w-xl mx-auto mb-8">Search thousands of MLS listings and pre-construction projects. Get expert guidance every step of the way.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/search" className="bg-accent-blue text-white text-lg font-medium px-8 py-4 rounded-lg hover:bg-accent-blue/90 transition-colors">Search MLS Listings</Link>
            <Link href="/new-condos" className="border border-border text-text-primary text-lg font-medium px-8 py-4 rounded-lg hover:border-accent-blue/30 transition-colors">Browse Pre-Construction</Link>
          </div>
        </div>
      </section>
    </>
  );
}
