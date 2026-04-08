import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest, RepliersListingsResponse } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      city = 'Toronto',
      status = 'A',
      type,
      lastStatus,
      sortBy = 'updatedOnDesc',
      resultsPerPage = 24,
      pageNum = 1,
      minPrice,
      maxPrice,
      minBeds,
      maxBeds,
      minBaths,
      minSqft,
      maxSqft,
      maxDom,
      neighborhood,
      area,
      cluster,
      map,
      statistics,
      aggregates,
      class: propertyClass,
    } = body;

    const params: Record<string, unknown> = {
      city,
      status,
      sortBy,
      resultsPerPage,
      pageNum,
    };

    if (type) params.type = type;
    if (lastStatus) params.lastStatus = lastStatus;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (minBeds) params.minBeds = minBeds;
    if (maxBeds) params.maxBeds = maxBeds;
    if (minBaths) params.minBaths = minBaths;
    if (minSqft) params.minSqft = minSqft;
    if (maxSqft) params.maxSqft = maxSqft;
    if (maxDom) params.maxDom = maxDom;
    if (neighborhood) params.neighborhood = neighborhood;
    if (area) params.area = area;
    if (cluster) params.cluster = true;
    if (map) params.map = map;
    if (propertyClass) params.class = propertyClass;

    // Statistics: Repliers requires specific stat names, not a boolean.
    // Different stats available for active (status=A) vs sold (status=U).
    if (statistics) {
      if (status === 'U' || lastStatus === 'Sld') {
        params.statistics = 'avg-listPrice,med-listPrice,avg-soldPrice,med-soldPrice,avg-daysOnMarket,med-daysOnMarket,cnt-available,cnt-closed';
      } else {
        params.statistics = 'avg-listPrice,med-listPrice,cnt-available,cnt-new';
      }
    }

    if (aggregates) params.aggregates = aggregates;

    console.log('[Repliers] Fetching listings with params:', JSON.stringify(params));

    const data = await repliersRequest<RepliersListingsResponse>({
      path: '/listings',
      body: params,
      revalidate: 300,
    });

    console.log(`[Repliers] Got ${data.listings?.length || 0} listings, total: ${data.count}`);

    const listings = (data.listings || []).map(mapMLSToUnified);

    // Normalize statistics to a simpler shape for the frontend
    const rawStats = data.statistics as Record<string, any> || {};
    const normalizedStats = {
      averagePrice: rawStats.listPrice?.avg || null,
      medianPrice: rawStats.listPrice?.med || null,
      averageDom: rawStats.daysOnMarket?.avg || null,
      totalActive: rawStats.available?.mth ? Object.values(rawStats.available.mth as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : null,
      totalSold: rawStats.closed?.mth ? Object.values(rawStats.closed.mth as Record<string, number>).reduce((a: number, b: number) => a + b, 0) : null,
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
