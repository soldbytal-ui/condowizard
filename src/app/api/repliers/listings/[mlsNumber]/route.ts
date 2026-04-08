import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest, RepliersListing } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';

export async function GET(
  req: NextRequest,
  { params }: { params: { mlsNumber: string } }
) {
  try {
    const { mlsNumber } = params;

    const data = await repliersRequest<RepliersListing>({
      path: `/listings/${mlsNumber}`,
      revalidate: 600,
    });

    const listing = mapMLSToUnified(data);

    // Map comparables if present
    const comparables = data.comparables?.map(mapMLSToUnified) || [];
    const history = data.history || [];

    return NextResponse.json({
      listing,
      comparables,
      history,
      raw: data, // full Repliers response for detail page
    });
  } catch (error) {
    console.error('Repliers single listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}
