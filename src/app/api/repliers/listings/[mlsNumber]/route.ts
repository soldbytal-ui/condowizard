import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest, RepliersListing } from '@/lib/repliers';
import { mapMLSToUnified } from '@/lib/data-merge';

const TRREB_BOARD_ID = '91';

export async function GET(
  req: NextRequest,
  { params }: { params: { mlsNumber: string } }
) {
  try {
    const { mlsNumber } = params;

    const data = await repliersRequest<RepliersListing>({
      path: `/listings/${mlsNumber}`,
      query: { boardId: TRREB_BOARD_ID },
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
      raw: data,
    });
  } catch (error) {
    console.error('Repliers single listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing', details: String(error) },
      { status: 500 }
    );
  }
}
