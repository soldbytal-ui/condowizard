import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { repliersRequest, RepliersListing } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';
import ListingDetail from '@/components/listings/ListingDetail';

interface Props {
  params: { mlsNumber: string };
}

async function getListing(mlsNumber: string) {
  try {
    const data = await repliersRequest<RepliersListing>({
      path: `/listings/${mlsNumber}`,
      query: { boardId: '91' },
      revalidate: 600,
    });
    return data;
  } catch (err) {
    console.error(`Failed to fetch listing ${mlsNumber}:`, err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getListing(params.mlsNumber);
  if (!data) return { title: 'Listing Not Found' };

  const listing = mapMLSToUnified(data);
  const title = `${listing.address || params.mlsNumber} - ${listing.propertyType || 'Property'} | MLS ${listing.mlsNumber}`;
  const desc = `${listing.priceDisplay} - ${listing.beds} bed, ${listing.baths} bath ${listing.propertyType || ''} in ${listing.neighborhood || 'Toronto'}. MLS# ${listing.mlsNumber}.`;

  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: listing.images?.[0] ? [{ url: listing.images[0], width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description: desc },
  };
}

export default async function ListingPage({ params }: Props) {
  const data = await getListing(params.mlsNumber);
  if (!data) notFound();

  const listing = mapMLSToUnified(data);

  // Map comparables safely — they may not exist or may fail to map
  let comparables: ReturnType<typeof mapMLSToUnified>[] = [];
  try {
    if (Array.isArray(data.comparables)) {
      comparables = data.comparables.map(mapMLSToUnified);
    }
  } catch (err) {
    console.error('Failed to map comparables:', err);
  }

  // Extract history as plain serializable objects
  const history = Array.isArray(data.history)
    ? data.history.map((h: any) => ({
        mlsNumber: h.mlsNumber || null,
        listDate: h.listDate || null,
        listPrice: h.listPrice || null,
        soldDate: h.soldDate || null,
        soldPrice: h.soldPrice || null,
        status: h.status || null,
        lastStatus: h.lastStatus || null,
      }))
    : [];

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.address || params.mlsNumber,
    description: listing.description || '',
    url: `https://condowizard.ca/listing/${listing.mlsNumber}`,
    image: listing.images?.[0] || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address || '',
      addressLocality: listing.city || 'Toronto',
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    ...(listing.lat && listing.lng ? {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: listing.lat,
        longitude: listing.lng,
      },
    } : {}),
    offers: {
      '@type': 'Offer',
      price: listing.price || 0,
      priceCurrency: 'CAD',
    },
    numberOfRooms: listing.beds || 0,
    numberOfBathroomsTotal: listing.baths || 0,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ListingDetail listing={listing} comparables={comparables} history={history} />
    </>
  );
}
