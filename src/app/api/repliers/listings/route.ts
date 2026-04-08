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
    if (statistics) params.statistics = true;
    if (aggregates) params.aggregates = aggregates;
    if (propertyClass) params.class = propertyClass;

    const data = await repliersRequest<RepliersListingsResponse>({
      method: 'POST',
      path: '/listings',
      body: params,
      revalidate: 300,
    });

    const listings = data.listings.map(mapMLSToUnified);

    return NextResponse.json({
      listings,
      total: data.count,
      numPages: data.numPages,
      currentPage: data.currentPage,
      statistics: data.statistics || null,
      aggregates: data.aggregates || null,
      clusters: data.clusters || null,
    });
  } catch (error) {
    console.error('Repliers listings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
