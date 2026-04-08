import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest, RepliersListingsResponse } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';

// All known Repliers query param keys — pass them straight through
const PASSTHROUGH_KEYS = [
  'city', 'status', 'type', 'lastStatus', 'sortBy', 'resultsPerPage', 'pageNum',
  'minPrice', 'maxPrice', 'minBeds', 'maxBeds', 'minBaths', 'maxBaths',
  'minSqft', 'maxSqft', 'minDaysOnMarket', 'maxDaysOnMarket',
  'neighborhood', 'area', 'district', 'municipality',
  'streetName', 'minStreetNumber', 'maxStreetNumber', 'streetDirection', 'unitNumber',
  'mlsNumber', 'propertyType', 'style', 'class',
  'minUpdatedOn', 'maxUpdatedOn', 'minListDate', 'maxListDate',
  'minSoldDate', 'maxSoldDate', 'minSoldPrice', 'maxSoldPrice',
  'maxMaintenanceFee', 'minTaxes', 'maxTaxes',
  'minBedroomsTotal', 'maxBedroomsTotal', 'minBedroomsPlus', 'maxBedroomsPlus',
  'minBathroomsHalf', 'maxBathroomsHalf', 'minKitchens', 'maxKitchens',
  'minLotSizeSqft', 'maxLotSizeSqft', 'minStories', 'maxStories',
  'minYearBuilt', 'maxYearBuilt',
  'minParkingSpaces', 'minGarageSpaces', 'garage', 'driveway', 'locker',
  'basement', 'heating', 'exteriorConstruction', 'swimmingPool', 'balcony',
  'waterfront', 'den',
  'minOpenHouseDate', 'maxOpenHouseDate',
  'hasImages', 'hasAgents',
  'cluster', 'map', 'aggregates',
  'lastPriceChangeType',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const params: Record<string, unknown> = {};

    // Pass through all known params
    for (const key of PASSTHROUGH_KEYS) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
        params[key] = body[key];
      }
    }

    // Defaults
    if (!params.city) params.city = 'Toronto';
    if (!params.status) params.status = 'A';
    if (!params.sortBy) params.sortBy = 'updatedOnDesc';
    if (!params.resultsPerPage) params.resultsPerPage = 24;
    if (!params.pageNum) params.pageNum = 1;

    // Statistics: Repliers requires specific stat names
    if (body.statistics) {
      const status = params.status as string;
      const lastStatus = params.lastStatus as string;
      if (status === 'U' || lastStatus === 'Sld' || lastStatus === 'Lsd') {
        params.statistics = 'avg-listPrice,med-listPrice,avg-soldPrice,med-soldPrice,avg-daysOnMarket,med-daysOnMarket,cnt-available,cnt-closed';
      } else {
        params.statistics = 'avg-listPrice,med-listPrice,cnt-available,cnt-new';
      }
    }

    console.log('[Repliers] Fetching with params:', JSON.stringify(params));

    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: params,
      revalidate: 300,
    });

    console.log(`[Repliers] Got ${data.listings?.length || 0} listings, total: ${data.count}`);

    const listings = (data.listings || []).map(mapMLSToUnified);

    // Normalize statistics
    const rawStats = data.statistics as Record<string, any> || {};
    const normalizedStats = {
      averagePrice: rawStats.listPrice?.avg || null,
      medianPrice: rawStats.listPrice?.med || null,
      averageSoldPrice: rawStats.soldPrice?.avg || null,
      medianSoldPrice: rawStats.soldPrice?.med || null,
      averageDom: rawStats.daysOnMarket?.avg || null,
      medianDom: rawStats.daysOnMarket?.med || null,
      totalActive: rawStats.available?.mth
        ? Object.values(rawStats.available.mth).filter((v): v is number => typeof v === 'number').reduce((a, b) => a + b, 0)
        : null,
      totalSold: rawStats.closed?.mth
        ? Object.values(rawStats.closed.mth).filter((v): v is number => typeof v === 'number').reduce((a, b) => a + b, 0)
        : null,
    };

    return NextResponse.json({
      listings,
      total: data.count || 0,
      numPages: data.numPages || 0,
      currentPage: data.currentPage || 1,
      statistics: normalizedStats,
      aggregates: data.aggregates || null,
      clusters: data.clusters || null,
    });
  } catch (error) {
    console.error('Repliers listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings', details: String(error) },
      { status: 500 }
    );
  }
}
