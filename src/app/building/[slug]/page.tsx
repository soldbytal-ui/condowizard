import { Metadata } from 'next';
import Link from 'next/link';
import { repliersRequest } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';
import ListingCard from '@/components/search/ListingCard';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `${decodeURIComponent(params.slug).replace(/-/g, ' ')} - Building Profile`,
    description: `View active listings, sold history, and building details for ${decodeURIComponent(params.slug).replace(/-/g, ' ')} in Toronto.`,
  };
}

export default async function BuildingPage({ params }: Props) {
  const buildingName = decodeURIComponent(params.slug).replace(/-/g, ' ');

  // Try to fetch building data and active listings
  let listings: any[] = [];
  let buildingData: any = null;

  try {
    const res = await repliersRequest<any>({
      method: 'POST',
      path: '/listings',
      body: {
        city: 'Toronto',
        status: 'A',
        type: 'sale',
        resultsPerPage: 24,
        sortBy: 'listPriceDesc',
      },
      revalidate: 3600,
    });
    listings = (res.listings || []).map(mapMLSToUnified);
  } catch {}

  return (
    <div className="pt-14 bg-bg min-h-screen">
      <div className="container-main py-10">
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-4">
          <Link href="/" className="hover:text-accent-blue">Home</Link>
          <span>/</span>
          <Link href="/search" className="hover:text-accent-blue">Search</Link>
          <span>/</span>
          <span className="text-text-primary capitalize">{buildingName}</span>
        </nav>

        <h1 className="text-3xl font-bold text-text-primary capitalize">{buildingName}</h1>
        <p className="text-text-muted mt-2">Building profile and active listings</p>

        {/* Building details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-text-muted">Active Listings</p>
            <p className="font-serif text-2xl font-bold mt-1">{listings.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-text-muted">Property Type</p>
            <p className="font-serif text-lg font-bold mt-1">Condo</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-text-muted">City</p>
            <p className="font-serif text-lg font-bold mt-1">Toronto</p>
          </div>
          <div className="bg-white rounded-xl border border-border p-5">
            <p className="text-xs text-text-muted">Status</p>
            <p className="font-serif text-lg font-bold mt-1 text-accent-green">Active</p>
          </div>
        </div>

        {/* Active listings */}
        {listings.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-bold text-text-primary mb-6">Active Listings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.slice(0, 12).map((listing: any) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* RECO */}
        <div className="mt-12 p-4 bg-white rounded-xl border border-border text-xs text-text-muted">
          <p>Tal Shelef, Sales Representative | Rare Real Estate Inc., Brokerage | 1701 Avenue Rd, Toronto, ON M5M 3Y3 | 647-890-4082</p>
        </div>
      </div>
    </div>
  );
}
