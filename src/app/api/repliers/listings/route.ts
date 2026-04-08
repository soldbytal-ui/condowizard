import { NextRequest, NextResponse } from 'next/server';
import { RepliersListingsResponse } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';

const REPLIERS_BASE = 'https://api.repliers.io';
const API_KEY = process.env.REPLIERS_API_KEY || '';

// Scalar params: key→value (single value)
const SCALAR_KEYS = [
  'city', 'status', 'type', 'sortBy', 'resultsPerPage', 'pageNum',
  'minPrice', 'maxPrice', 'minBedrooms', 'maxBedrooms', 'minBeds', 'maxBeds',
  'minBaths', 'maxBaths',
  'minSqft', 'maxSqft', 'minDaysOnMarket', 'maxDaysOnMarket',
  'neighborhood', 'area', 'district', 'municipality',
  'streetName', 'minStreetNumber', 'maxStreetNumber', 'unitNumber',
  'mlsNumber', 'class',
  'minUpdatedOn', 'maxUpdatedOn', 'minListDate', 'maxListDate',
  'minSoldDate', 'maxSoldDate', 'minSoldPrice', 'maxSoldPrice',
  'maxMaintenanceFee', 'minTaxes', 'maxTaxes',
  'minBedroomsPlus', 'maxBedroomsPlus',
  'minBathroomsHalf', 'maxBathroomsHalf', 'minKitchens', 'maxKitchens',
  'minLotSizeSqft', 'maxLotSizeSqft', 'minStories', 'maxStories',
  'minYearBuilt', 'maxYearBuilt',
  'minParkingSpaces', 'minGarageSpaces', 'locker',
  'waterfront', 'den',
  'minOpenHouseDate', 'maxOpenHouseDate',
  'hasImages', 'hasAgents',
  'cluster', 'lastPriceChangeType',
  'listings', 'aggregates',
];

// Array params: key→multiple values (Repliers expects repeated query params)
const ARRAY_KEYS = [
  'lastStatus', 'propertyType', 'style', 'streetDirection',
  'garage', 'driveway', 'basement', 'heating', 'exteriorConstruction',
  'swimmingPool', 'balcony',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Build URLSearchParams with proper repeated-param handling
    const qp = new URLSearchParams();

    // Defaults
    qp.set('city', body.city || 'Toronto');
    qp.set('status', body.status || 'A');
    qp.set('sortBy', body.sortBy || 'updatedOnDesc');
    qp.set('resultsPerPage', String(body.resultsPerPage || 24));
    qp.set('pageNum', String(body.pageNum || 1));

    // Scalar params
    for (const key of SCALAR_KEYS) {
      if (body[key] !== undefined && body[key] !== null && body[key] !== '') {
        qp.set(key, String(body[key]));
      }
    }

    // Array params — Repliers expects: &propertyType=X&propertyType=Y (repeated)
    for (const key of ARRAY_KEYS) {
      if (body[key]) {
        const val = body[key];
        // Could be comma-separated string or actual array
        const arr = Array.isArray(val) ? val : String(val).split(',').map((s: string) => s.trim());
        for (const v of arr) {
          if (v) qp.append(key, v);
        }
      }
    }

    // Statistics
    if (body.statistics) {
      const status = qp.get('status');
      const lastStatus = qp.get('lastStatus');
      if (status === 'U' || lastStatus === 'Sld' || lastStatus === 'Lsd') {
        qp.set('statistics', 'avg-listPrice,med-listPrice,avg-soldPrice,med-soldPrice,avg-daysOnMarket,med-daysOnMarket,cnt-available,cnt-closed');
      } else {
        qp.set('statistics', 'avg-listPrice,med-listPrice,cnt-available,cnt-new');
      }
    }

    // Map polygon (passed as body.map — special handling, keep as query param)
    if (body.map) {
      qp.set('map', typeof body.map === 'string' ? body.map : JSON.stringify(body.map));
    }

    const url = `${REPLIERS_BASE}/listings?${qp.toString()}`;
    console.log(`[Repliers] GET ${url.slice(0, 300)}...`);

    const res = await fetch(url, {
      headers: { 'REPLIERS-API-KEY': API_KEY },
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[Repliers] Error ${res.status}:`, errText.slice(0, 500));
      return NextResponse.json({ error: 'Repliers API error', details: errText.slice(0, 300) }, { status: res.status });
    }

    const data: RepliersListingsResponse = await res.json();
    console.log(`[Repliers] Got ${data.listings?.length || 0} listings, total: ${data.count}`);

    const listings = (data.listings || []).map(mapMLSToUnified);

    // Normalize statistics
    const rawStats = (data.statistics as Record<string, any>) || {};
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
    return NextResponse.json({ error: 'Failed to fetch listings', details: String(error) }, { status: 500 });
  }
}
