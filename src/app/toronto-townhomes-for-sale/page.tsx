import type { Metadata } from 'next';
import Link from 'next/link';
import HomeListingCard from '@/components/home/HomeListingCard';
import { generateBreadcrumbSchema } from '@/lib/seo';
import { mapHomeListing } from '@/lib/homepage-data';
import { repliersRequest, type RepliersListingsResponse } from '@/lib/repliers';

export const revalidate = 900;

export const metadata: Metadata = {
  title: 'Toronto Townhomes For Sale — Freehold & Condo Townhouses',
  description:
    'Browse freehold and condo townhouses for sale in Toronto. Live MLS listings across every neighbourhood, with pricing, photos and sold history.',
  alternates: { canonical: 'https://condowizard.ca/toronto-townhomes-for-sale' },
  openGraph: {
    title: 'Toronto Townhomes For Sale — Freehold & Condo Townhouses',
    description: 'Live Toronto MLS listings for townhouses and townhomes.',
    url: 'https://condowizard.ca/toronto-townhomes-for-sale',
    type: 'website',
  },
};

async function loadTownhomes() {
  try {
    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: {
        city: 'Toronto',
        status: 'A',
        type: 'sale',
        propertyType: 'Att/Row/Twnhouse,Condo Townhouse',
        sortBy: 'updatedOnDesc',
        resultsPerPage: 24,
        hasImages: true,
      },
      revalidate: 600,
    });
    return {
      listings: (data.listings || []).map(mapHomeListing),
      total: data.count || 0,
    };
  } catch (err) {
    console.error('[toronto-townhomes] fetch error', err);
    return { listings: [], total: 0 };
  }
}

export default async function TorontoTownhomesPage() {
  const { listings, total } = await loadTownhomes();
  const breadcrumb = generateBreadcrumbSchema([
    { name: 'Home', url: 'https://condowizard.ca' },
    { name: 'Townhomes for Sale', url: 'https://condowizard.ca/toronto-townhomes-for-sale' },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <section className="pt-24 pb-10 px-5 md:px-8 bg-[#F6F6F3]">
        <div className="max-w-[1240px] mx-auto">
          <nav className="text-xs text-text-muted mb-3">
            <Link href="/" className="hover:text-accent-blue">Home</Link>
            <span className="mx-1.5">/</span>
            <span className="text-text-primary">Townhomes for sale</span>
          </nav>
          <h1 className="font-serif text-4xl md:text-5xl font-bold text-text-primary tracking-tight">
            Toronto Townhomes For Sale
          </h1>
          <p className="text-text-muted mt-3 max-w-2xl">
            Freehold and condo townhouses across Toronto. {total.toLocaleString('en-CA')} active listings from the current TRREB MLS feed.
          </p>
        </div>
      </section>
      <section className="py-10 md:py-14 px-5 md:px-8">
        <div className="max-w-[1240px] mx-auto">
          {listings.length === 0 ? (
            <p className="text-sm text-text-muted">No townhomes currently listed. <Link href="/search" className="text-accent-blue">Open search →</Link></p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
              {listings.map((l) => (
                <HomeListingCard key={l.mlsNumber} listing={l} />
              ))}
            </div>
          )}
          <div className="mt-8">
            <Link href="/search?tab=sale&propertyType=Att/Row/Twnhouse,Condo Townhouse" className="inline-flex items-center gap-1 text-sm font-semibold text-accent-blue hover:underline">
              Open in full search →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
