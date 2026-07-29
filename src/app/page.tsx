import Link from 'next/link';
import type { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import {
  generateLocalBusinessSchema,
  generateWebSiteSchema,
  generateOrganizationSchema,
  generateItemListSchema,
} from '@/lib/seo';
import UniversalSearch from '@/components/home/UniversalSearch';
import HeroCollage from '@/components/home/HeroCollage';
import HomeListingCard from '@/components/home/HomeListingCard';
import RecentlySold from '@/components/home/RecentlySold';
import PreconFeatured, { type PreconProject } from '@/components/home/PreconFeatured';
import MarketSnapshot from '@/components/home/MarketSnapshot';
import NeighbourhoodCard from '@/components/home/NeighbourhoodCard';
import AlertsSignup from '@/components/home/AlertsSignup';
import {
  fetchNewTodayListings,
  fetchRecentSolds,
  fetchNeighborhoodStat,
  type HomeListing,
} from '@/lib/homepage-data';
import { torontoTodayISO, formatTorontoDate } from '@/lib/toronto-time';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Toronto MLS Listings & Pre-Construction Condos | CondoWizard',
  description:
    'Search live Toronto MLS listings, rentals and sold prices. Explore pre-construction condos, neighbourhoods and current market data on CondoWizard.',
  alternates: { canonical: 'https://condowizard.ca' },
  openGraph: {
    title: 'Toronto MLS Listings & Pre-Construction Condos | CondoWizard',
    description:
      'Search live Toronto MLS listings, rentals and sold prices. Explore pre-construction condos, neighbourhoods and current market data on CondoWizard.',
    url: 'https://condowizard.ca',
    type: 'website',
  },
};

const FEATURED_NEIGHBOURHOODS: Array<{ name: string; slug: string; blurb: string; repliersName: string; tone: string }> = [
  { name: 'King West', slug: 'king-west', blurb: 'Lofts, restaurants and nightlife along Toronto\'s west stretch.', repliersName: 'Niagara', tone: 'bg-gradient-to-br from-[#1F2A44] to-[#111827]' },
  { name: 'Yorkville', slug: 'yorkville', blurb: 'Luxury condos and designer retail in the heart of Bloor-Yorkville.', repliersName: 'Annex', tone: 'bg-gradient-to-br from-[#3B2A1F] to-[#1F1611]' },
  { name: 'Waterfront', slug: 'waterfront', blurb: 'Glass towers and lakefront parks along Queens Quay.', repliersName: 'Waterfront Communities C1', tone: 'bg-gradient-to-br from-[#0B2A46] to-[#061626]' },
  { name: 'Liberty Village', slug: 'liberty-village', blurb: 'Converted warehouses and mid-rise condos, young and busy.', repliersName: 'Niagara', tone: 'bg-gradient-to-br from-[#3A2440] to-[#1B1226]' },
  { name: 'Yonge and Eglinton', slug: 'yonge-eglinton', blurb: 'Midtown transit hub with new condos on the Crosstown line.', repliersName: 'Yonge-Eglinton', tone: 'bg-gradient-to-br from-[#1F3A2A] to-[#111F19]' },
  { name: 'North York', slug: 'north-york', blurb: 'Suburban living along the Yonge corridor with subway access.', repliersName: 'Willowdale East', tone: 'bg-gradient-to-br from-[#2F2A1F] to-[#1A1611]' },
];

const GUIDE_SLUGS = [
  'pre-construction-closing-costs-toronto',
  'hst-rebate-pre-construction-condo',
  'interim-occupancy-fees',
  'assignment-sales-toronto',
  'deposit-structures-pre-construction',
  'how-to-buy-pre-construction-toronto',
];

const PROPERTY_TYPES = [
  { title: 'Toronto Condos', href: '/condos', desc: 'Every building with live listings and sold history.', category: 'Condos' },
  { title: 'Houses', href: '/toronto-houses-for-sale', desc: 'Detached and semi-detached homes across the city.', category: 'Houses' },
  { title: 'Townhomes', href: '/toronto-townhomes-for-sale', desc: 'Freehold and condo townhouses in every neighbourhood.', category: 'Townhomes' },
  { title: 'Luxury Homes', href: '/toronto-luxury-homes', desc: 'Homes and condos above $2M across Toronto.', category: 'Luxury' },
];

async function loadFeaturedPrecon(): Promise<PreconProject[]> {
  const { data } = await supabase
    .from('projects')
    .select('id, slug, name, status, estCompletion, totalUnits, floors, priceMin, priceMax, mainImageUrl, category, featured, neighborhood:neighborhoods(name), developer:developers(name)')
    .eq('featured', true)
    .neq('status', 'COMPLETED')
    .neq('status', 'ARCHIVED')
    .limit(12);
  return (data || []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    neighborhoodName: p.neighborhood?.name || null,
    developerName: p.developer?.name || null,
    status: p.status,
    estCompletion: p.estCompletion,
    totalUnits: p.totalUnits,
    floors: p.floors,
    priceMin: p.priceMin,
    priceMax: p.priceMax,
    mainImageUrl: p.mainImageUrl,
    category: p.category,
    featured: !!p.featured,
  }));
}

async function loadGuides() {
  const { data } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, publishedAt, updatedAt, author, category, featuredImage, content')
    .not('publishedAt', 'is', null)
    .in('slug', GUIDE_SLUGS)
    .limit(6);
  if (data && data.length) return data;

  // Fallback to the six most recent buyer guides if the slug list isn't present yet.
  const { data: fallback } = await supabase
    .from('blog_posts')
    .select('slug, title, excerpt, publishedAt, updatedAt, author, category, featuredImage, content')
    .not('publishedAt', 'is', null)
    .order('publishedAt', { ascending: false })
    .limit(6);
  return fallback || [];
}

async function loadNeighbourhoodImages(slugs: string[]): Promise<Record<string, string>> {
  const { data } = await supabase
    .from('neighborhoods')
    .select('slug, imageUrl')
    .in('slug', slugs);
  const map: Record<string, string> = {};
  for (const row of data || []) {
    if (row?.slug && row?.imageUrl) map[row.slug] = row.imageUrl;
  }
  return map;
}

function readingLabel(content: string | null | undefined): string {
  if (!content) return '3 min read';
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(2, Math.round(words / 220));
  return `${mins} min read`;
}

function extractExcerpt(post: any): string {
  const raw = post.excerpt;
  if (raw && raw !== '---' && raw.length > 20) return raw.slice(0, 180);
  const content = post.content || '';
  const lines = content.split('\n');
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith('#') || t.startsWith('```') || t.startsWith('|') || t.startsWith('>') || t.startsWith('---')) continue;
    if (t.length < 60) continue;
    return t.replace(/\*\*/g, '').slice(0, 180);
  }
  return '';
}

export default async function HomePage() {
  const today = torontoTodayISO();
  const [
    newToday,
    recentSolds,
    featuredPrecon,
    guides,
    hoodImageMap,
    hoodStats,
  ] = await Promise.all([
    fetchNewTodayListings(8),
    fetchRecentSolds(6),
    loadFeaturedPrecon(),
    loadGuides(),
    loadNeighbourhoodImages(FEATURED_NEIGHBOURHOODS.map((n) => n.slug)),
    Promise.all(FEATURED_NEIGHBOURHOODS.map((n) => fetchNeighborhoodStat(n.repliersName))),
  ]);

  const heroListings: HomeListing[] = (newToday.length ? newToday : recentSolds).filter((l) => l.image).slice(0, 3);

  const localBusinessSchema = generateLocalBusinessSchema();
  const websiteSchema = generateWebSiteSchema();
  const organizationSchema = generateOrganizationSchema();

  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Tal Shelef',
    jobTitle: 'Sales Representative',
    url: 'https://condowizard.ca/about',
    worksFor: {
      '@type': 'RealEstateAgent',
      name: 'Rare Real Estate Inc., Brokerage',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '1701 Avenue Rd',
        addressLocality: 'Toronto',
        addressRegion: 'ON',
        postalCode: 'M5M 3Y3',
        addressCountry: 'CA',
      },
    },
    telephone: '647-890-4082',
    email: 'Contact@condowizard.ca',
  };

  const listingItemList = newToday.length
    ? generateItemListSchema(
        newToday.slice(0, 6).map((l, i) => ({
          position: i + 1,
          name: `${l.address}${l.neighborhood ? `, ${l.neighborhood}` : ''}`,
          url: `https://condowizard.ca${l.href}`,
        }))
      )
    : null;

  const preconItemList = featuredPrecon.length
    ? generateItemListSchema(
        featuredPrecon.slice(0, 6).map((p, i) => ({
          position: i + 1,
          name: p.name,
          url: `https://condowizard.ca/properties/${p.slug}`,
        }))
      )
    : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      {listingItemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(listingItemList) }} />
      )}
      {preconItemList && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(preconItemList) }} />
      )}

      {/* HERO */}
      <section className="relative pt-24 md:pt-28 pb-14 md:pb-20 px-5 md:px-8 bg-[#F6F6F3]">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" aria-hidden />
              Live Toronto MLS · {formatTorontoDate(today, { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="font-serif text-[38px] leading-[1.05] md:text-[54px] md:leading-[1.02] text-text-primary tracking-tight">
              Toronto MLS Listings and Pre-Construction Condos
            </h1>
            <p className="text-text-primary/70 mt-5 text-base md:text-lg max-w-[560px] leading-relaxed">
              Search homes for sale and rent, explore new condo developments, review sold history and follow Toronto market activity with live MLS data.
            </p>
            <div className="mt-7">
              <UniversalSearch />
            </div>
          </div>
          <HeroCollage listings={heroListings} />
        </div>
      </section>

      {/* NEW TODAY */}
      <section id="new-today" className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" aria-hidden />
                Refreshed from the Repliers feed
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">New Toronto Listings Today</h2>
              <p className="text-text-muted mt-1.5 text-sm md:text-base max-w-2xl">
                Homes entered into TRREB MLS today, {formatTorontoDate(today)}. Filtered to active sale listings, deduped and shown in Toronto time.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/search?tab=sale&sortBy=newest" className="text-sm font-medium text-text-primary/85 hover:text-accent-blue">
                View all new listings →
              </Link>
              <Link href="/search?tab=sale&sortBy=newest&view=map" className="text-sm font-medium text-text-primary/85 hover:text-accent-blue">
                Map view →
              </Link>
              <Link href={`/search?tab=sale&sortBy=newest&listedFrom=${today}`} className="text-xs font-medium bg-text-primary text-white px-3 py-1.5 rounded-full hover:brightness-110">
                Save this search
              </Link>
            </div>
          </div>

          {newToday.length === 0 ? (
            <div className="bg-surface2 rounded-xl border border-border p-8 text-center">
              <p className="text-sm text-text-primary font-medium">No new listings have hit the market yet today.</p>
              <p className="text-xs text-text-muted mt-1">Fresh Toronto listings usually appear from mid-morning onward. Check back shortly.</p>
              <Link href="/search?tab=sale&sortBy=newest" className="inline-block mt-4 text-sm font-medium text-accent-blue hover:underline">
                Browse recent listings →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {newToday.map((l) => (
                <HomeListingCard key={l.mlsNumber} listing={l} variant="new-today" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* PROPERTY TYPE NAV */}
      <section className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-6 md:mb-8 max-w-xl">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">Browse by property type</h2>
            <p className="text-text-muted mt-1.5">Every landing page is served from live MLS data and refreshed continuously.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {PROPERTY_TYPES.map((t) => (
              <Link
                key={t.title}
                href={t.href}
                className="group block bg-white border border-border rounded-xl p-5 hover:border-text-primary/20 hover:-translate-y-0.5 transition-all"
              >
                <p className="text-[11px] uppercase tracking-widest text-text-muted">{t.category}</p>
                <p className="font-serif text-xl font-bold text-text-primary mt-1.5 group-hover:text-accent-blue transition-colors">{t.title}</p>
                <p className="text-xs text-text-muted mt-2 leading-relaxed">{t.desc}</p>
                <p className="mt-4 text-xs font-medium text-accent-blue">Explore →</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PRECON */}
      <section id="pre-construction" className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5B547]" aria-hidden />
                Curated by CondoWizard
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">Featured Toronto Pre-Construction Projects</h2>
              <p className="text-text-muted mt-1.5 max-w-2xl">
                Hand-picked developments across the city. Toggle a filter to see what suits your timeline.
              </p>
            </div>
            <Link href="/new-condos" className="text-sm font-medium text-accent-blue hover:underline">
              View all projects →
            </Link>
          </div>
          <PreconFeatured projects={featuredPrecon} />
        </div>
      </section>

      {/* MLS vs Pre-Construction */}
      <section className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="grid md:grid-cols-2 gap-4 md:gap-6">
            <div className="bg-white border border-border rounded-2xl p-8 md:p-10 flex flex-col">
              <p className="text-[11px] uppercase tracking-widest text-text-muted">Buy now</p>
              <h3 className="font-serif text-2xl md:text-3xl font-bold text-text-primary mt-2">Explore existing Toronto homes</h3>
              <p className="text-text-muted mt-3 leading-relaxed">
                View active MLS listings, book showings and compare recent sold prices.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 text-xs text-text-muted">
                <div><span className="block font-semibold text-text-primary text-sm">Live</span> MLS feed</div>
                <div><span className="block font-semibold text-text-primary text-sm">Showings</span> in days</div>
                <div><span className="block font-semibold text-text-primary text-sm">Sold</span> comparables</div>
              </div>
              <Link
                href="/search?tab=sale"
                className="mt-8 inline-flex items-center justify-center bg-accent-blue text-white text-sm font-semibold px-5 py-3 rounded-lg hover:brightness-110 transition-all self-start"
              >
                Search MLS Listings
              </Link>
            </div>
            <div className="bg-text-primary text-white border border-text-primary rounded-2xl p-8 md:p-10 flex flex-col">
              <p className="text-[11px] uppercase tracking-widest text-white/60">Buy for the future</p>
              <h3 className="font-serif text-2xl md:text-3xl font-bold mt-2">Explore new developments</h3>
              <p className="text-white/75 mt-3 leading-relaxed">
                Compare developers, deposit schedules, estimated occupancy dates and available projects.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2 text-xs text-white/70">
                <div><span className="block font-semibold text-white text-sm">15–20%</span> total deposit</div>
                <div><span className="block font-semibold text-white text-sm">2–5 yr</span> to occupancy</div>
                <div><span className="block font-semibold text-white text-sm">Assign</span> or close</div>
              </div>
              <Link
                href="/new-condos"
                className="mt-8 inline-flex items-center justify-center bg-white text-text-primary text-sm font-semibold px-5 py-3 rounded-lg hover:bg-white/90 transition-all self-start"
              >
                Browse Pre-Construction
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MARKET SNAPSHOT */}
      <section id="market" className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="mb-6 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" aria-hidden />
              Live TRREB data
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">Toronto market — right now</h2>
            <p className="text-text-muted mt-1.5">A snapshot of activity across Toronto, updated from the Repliers TRREB feed.</p>
          </div>
          <MarketSnapshot />
        </div>
      </section>

      {/* NEIGHBOURHOODS */}
      <section id="neighbourhoods" className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">Discover Toronto neighbourhoods</h2>
              <p className="text-text-muted mt-1.5 max-w-2xl">Every neighbourhood has its own page with active listings, sold history and market data.</p>
            </div>
            <Link href="/search" className="text-sm font-medium text-accent-blue hover:underline">
              View all neighbourhoods →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {FEATURED_NEIGHBOURHOODS.map((n, i) => (
              <NeighbourhoodCard
                key={n.slug}
                name={n.name}
                slug={n.slug}
                blurb={n.blurb}
                imageUrl={hoodImageMap[n.slug] || null}
                toneClass={n.tone}
                active={hoodStats[i]?.active ?? 0}
                medianPrice={hoodStats[i]?.medianPrice ?? null}
              />
            ))}
          </div>
        </div>
      </section>

      {/* RECENTLY SOLD */}
      <section id="sold" className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-text-primary" aria-hidden />
                Members-only sold data
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">Recently sold in Toronto</h2>
              <p className="text-text-muted mt-1.5 max-w-2xl">Complete sold pricing is available to registered members under TRREB's VOW rules.</p>
            </div>
            <Link href="/sold" className="text-sm font-medium text-accent-blue hover:underline">
              Explore sold data →
            </Link>
          </div>
          <RecentlySold listings={recentSolds} />
        </div>
      </section>

      {/* GUIDES */}
      <section id="guides" className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
        <div className="max-w-[1240px] mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6 md:mb-8">
            <div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary">Toronto Real Estate and Pre-Construction Guides</h2>
              <p className="text-text-muted mt-1.5 max-w-2xl">Original buyer guides written and maintained by our team.</p>
            </div>
            <Link href="/blog" className="text-sm font-medium text-accent-blue hover:underline">
              All guides →
            </Link>
          </div>
          {guides.length === 0 ? (
            <p className="text-sm text-text-muted">Guides are being published — check the <Link href="/blog" className="text-accent-blue">blog</Link> for the latest.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {guides.map((g: any) => (
                <Link
                  key={g.slug}
                  href={`/blog/${g.slug}`}
                  className="group block bg-white border border-border rounded-xl overflow-hidden hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all"
                >
                  {g.featuredImage ? (
                    <div className="aspect-[16/9] bg-surface2 overflow-hidden">
                      <img src={g.featuredImage} alt={g.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" loading="lazy" />
                    </div>
                  ) : null}
                  <div className="p-5">
                    <p className="text-[10px] uppercase tracking-widest text-text-muted">{g.category || 'Buyer Guide'}</p>
                    <p className="font-serif text-lg font-bold text-text-primary mt-2 group-hover:text-accent-blue transition-colors leading-snug">
                      {g.title}
                    </p>
                    <p className="text-sm text-text-muted mt-2 line-clamp-2 leading-relaxed">{extractExcerpt(g)}</p>
                    <div className="mt-4 flex items-center gap-2 text-[11px] text-text-muted">
                      <span>{g.author || 'Tal Shelef'}</span>
                      <span aria-hidden>·</span>
                      <span>{readingLabel(g.content)}</span>
                      {g.updatedAt || g.publishedAt ? (
                        <>
                          <span aria-hidden>·</span>
                          <span>Updated {formatTorontoDate(g.updatedAt || g.publishedAt)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SELLER SECTION */}
      <section id="sell" className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-text-muted mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" aria-hidden />
              For sellers
            </div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              Selling a Toronto Property?
            </h2>
            <p className="text-text-primary/75 mt-4 text-base md:text-lg leading-relaxed max-w-lg">
              Strategic pricing, professional presentation and live neighbourhood data help position your property for the market.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-2">
              <Link
                href="/contact-us?source=seller"
                className="inline-flex items-center justify-center bg-text-primary text-white text-sm font-semibold px-5 py-3 rounded-lg hover:brightness-110 transition-all"
              >
                Request a property assessment
              </Link>
              <Link
                href="/staging"
                className="inline-flex items-center justify-center border border-border text-text-primary text-sm font-semibold px-5 py-3 rounded-lg hover:border-text-primary/30 transition-all"
              >
                Learn about selling
              </Link>
            </div>
          </div>
          <ul className="space-y-4">
            {[
              { t: 'Pricing informed by relevant sold data', d: 'Every recommendation is grounded in live comparables from the same building or block, not a broad city average.' },
              { t: 'Professional staging where appropriate', d: 'Full-service staging arranged in-house for vacant units, or targeted refresh for occupied homes.' },
              { t: 'Photography and launch strategy', d: 'Photography, floorplan and marketing plan built for how buyers actually browse — MLS first, syndicated broadly.' },
            ].map((b) => (
              <li key={b.t} className="flex gap-4">
                <div className="mt-1 shrink-0 w-6 h-6 rounded-full bg-text-primary/8 text-text-primary flex items-center justify-center">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{b.t}</p>
                  <p className="text-sm text-text-muted mt-1 leading-relaxed">{b.d}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ABOUT / TRUST */}
      <section id="about" className="py-14 md:py-20 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
        <div className="max-w-[1240px] mx-auto grid md:grid-cols-[220px_1fr] gap-8 items-start">
          <div className="mx-auto md:mx-0">
            <div className="w-[180px] h-[220px] md:w-[220px] md:h-[260px] rounded-xl bg-gradient-to-br from-[#1F2A44] to-[#111827] flex items-end justify-center overflow-hidden">
              <span className="font-serif text-white text-6xl mb-6" aria-hidden>TS</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-widest text-text-muted mb-2">Behind CondoWizard</p>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">Tal Shelef, Sales Representative</h2>
            <p className="text-sm text-text-muted mt-1">Rare Real Estate Inc., Brokerage · 1701 Avenue Rd, Toronto ON</p>
            <p className="text-text-primary/80 mt-5 leading-relaxed max-w-2xl">
              Tal built CondoWizard to give Toronto buyers, sellers and investors a live view of the market — MLS listings and pre-construction inventory in one place, with the same feed working brokers use. Areas of focus include downtown condos, pre-construction assignments and investment properties across the GTA.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs">
              {['Downtown condos', 'Pre-construction', 'Assignments', 'Investment', 'First-time buyers'].map((f) => (
                <span key={f} className="bg-white border border-border text-text-primary/80 rounded-full px-3 py-1">{f}</span>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact-us" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-blue hover:underline">
                Contact Tal directly →
              </Link>
              <a href="tel:6478904082" className="inline-flex items-center gap-1 text-sm font-medium text-text-primary/80 hover:text-text-primary">
                647-890-4082
              </a>
              <a href="mailto:Contact@condowizard.ca" className="inline-flex items-center gap-1 text-sm font-medium text-text-primary/80 hover:text-text-primary">
                Contact@condowizard.ca
              </a>
            </div>
            <p className="mt-8 text-[11px] text-text-muted leading-relaxed max-w-2xl">
              CondoWizard.ca is operated by Tal Shelef, Sales Representative at Rare Real Estate Inc., Brokerage. MLS listing data is provided by the Toronto Regional Real Estate Board (TRREB) via Repliers and is deemed reliable but not guaranteed. Sold data displayed under a TRREB VOW (Virtual Office Website) agreement is restricted to registered members. Not intended to solicit clients currently under contract with another brokerage.
            </p>
          </div>
        </div>
      </section>

      {/* ALERTS SIGNUP */}
      <section id="alerts" className="py-14 md:py-20 px-5 md:px-8 bg-white border-t border-border">
        <div className="max-w-[900px] mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-text-primary leading-tight">
              See New Listings Before Your Next Search
            </h2>
            <p className="text-text-muted mt-3 max-w-xl mx-auto">
              Tell us what you're looking for and we'll send matching Toronto listings the moment they hit MLS.
            </p>
          </div>
          <AlertsSignup />
        </div>
      </section>

      {/* CRAWLABLE INTRO — kept small, at page end for SEO context */}
      <section className="py-10 md:py-14 px-5 md:px-8 bg-[#F6F6F3] border-t border-border">
        <div className="max-w-[860px] mx-auto text-sm text-text-muted leading-relaxed">
          <p>
            <strong className="text-text-primary">CondoWizard.ca</strong> combines Toronto MLS listings, rentals, sold activity, neighbourhood information and pre-construction projects into one platform. Search live TRREB inventory across every Toronto neighbourhood, review sold prices under our TRREB VOW agreement, compare active developments and their occupancy timelines, and follow current market conditions — all from a single, continuously refreshed feed.
          </p>
        </div>
      </section>
    </>
  );
}
