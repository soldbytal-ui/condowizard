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
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getListing(params.mlsNumber);
  if (!data) return { title: 'Listing Not Found' };

  const listing = mapMLSToUnified(data);
  const title = `${listing.address} - ${listing.propertyType} | MLS ${listing.mlsNumber}`;
  const description = `${listing.priceDisplay} - ${listing.beds} bed, ${listing.baths} bath ${listing.propertyType} in ${listing.neighborhood}, Toronto. ${listing.sqft} sqft. MLS# ${listing.mlsNumber}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: listing.images[0] ? [{ url: listing.images[0], width: 1200, height: 630 }] : [],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ListingPage({ params }: Props) {
  const data = await getListing(params.mlsNumber);
  if (!data) notFound();

  const listing = mapMLSToUnified(data);
  const comparables = data.comparables?.map(mapMLSToUnified) || [];
  const history = data.history || [];

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.address,
    description: listing.description,
    url: `https://condowizard.ca/listing/${listing.mlsNumber}`,
    image: listing.images[0],
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.address,
      addressLocality: listing.city,
      addressRegion: 'ON',
      addressCountry: 'CA',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: listing.lat,
      longitude: listing.lng,
    },
    offers: {
      '@type': 'Offer',
      price: listing.price,
      priceCurrency: 'CAD',
    },
    numberOfRooms: listing.beds,
    numberOfBathroomsTotal: listing.baths,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ListingDetail listing={listing} comparables={comparables} history={history} rawData={data} />
    </>
  );
}
