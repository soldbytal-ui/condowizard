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
    return await repliersRequest<RepliersListing>({
      path: `/listings/${mlsNumber}`,
      query: { boardId: '91' },
      revalidate: 600,
    });
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
  const desc = `${listing.priceDisplay} - ${listing.beds} bed, ${listing.baths} bath in ${listing.neighborhood || 'Toronto'}. MLS# ${listing.mlsNumber}.`;
  return {
    title, description: desc,
    openGraph: { title, description: desc, images: listing.images?.[0] ? [{ url: listing.images[0] }] : [], type: 'website' },
  };
}

export default async function ListingPage({ params }: Props) {
  const data = await getListing(params.mlsNumber);
  if (!data) notFound();

  const listing = mapMLSToUnified(data);
  const det = data.details || {};
  const addr = data.address || {};

  // Extract serializable property details for the detail component
  const propertyDetails = {
    propertyType: det.propertyType || null,
    style: det.style || null,
    yearBuilt: det.yearBuilt || null,
    sqft: det.sqft || det.sqftRange || null,
    lotWidth: data.lot?.width || null,
    lotDepth: data.lot?.depth || null,
    lotAcres: data.lot?.acres || null,
    parking: det.numParkingSpaces || null,
    garage: det.numGarageSpaces || null,
    garageType: det.garage || null,
    driveway: det.driveway || null,
    basement1: det.basement1 || null,
    basement2: det.basement2 || null,
    heating: det.heating || null,
    cooling: det.airConditioning || det.centralAirConditioning || null,
    fireplace: det.numFireplaces || null,
    exterior1: det.exteriorConstruction1 || null,
    exterior2: det.exteriorConstruction2 || null,
    roof: det.roofMaterial || null,
    waterSource: det.waterSource || null,
    sewer: det.sewer || det.landSewer || null,
    taxes: data.taxes?.annualAmount || null,
    taxYear: data.taxes?.assessmentYear || null,
    maintenanceFee: det.HOAFee || null,
    extras: det.extras || null,
    den: det.den || null,
    pool: det.swimmingPool || null,
    waterfront: det.waterfront || null,
    zoning: det.zoning || null,
    virtualTour: det.virtualTourUrl || null,
    description: det.description || null,
    communityCode: addr.communityCode || addr.community || null,
    postalCode: addr.zip || null,
  };

  // Rooms
  const rooms = (data.rooms || []).map((r: any) => ({
    name: r.description || 'Room',
    level: r.level || '',
    length: r.length || '',
    width: r.width || '',
    features: [r.features, r.features2, r.features3].filter(Boolean).join(', '),
  }));

  // History
  const history = Array.isArray(data.history)
    ? data.history.map((h: any) => ({
        mlsNumber: h.mlsNumber || null, listDate: h.listDate || null,
        listPrice: h.listPrice || null, soldDate: h.soldDate || null,
        soldPrice: h.soldPrice || null, status: h.status || null, lastStatus: h.lastStatus || null,
      }))
    : [];

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'RealEstateListing',
    name: listing.address, url: `https://condowizard.ca/listing/${listing.mlsNumber}`,
    image: listing.images?.[0],
    address: { '@type': 'PostalAddress', streetAddress: listing.address, addressLocality: listing.city || 'Toronto', addressRegion: 'ON', addressCountry: 'CA' },
    ...(listing.lat && listing.lng ? { geo: { '@type': 'GeoCoordinates', latitude: listing.lat, longitude: listing.lng } } : {}),
    offers: { '@type': 'Offer', price: listing.price || 0, priceCurrency: 'CAD' },
    numberOfRooms: listing.beds, numberOfBathroomsTotal: listing.baths,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ListingDetail listing={listing} propertyDetails={propertyDetails} rooms={rooms} history={history} />
    </>
  );
}
