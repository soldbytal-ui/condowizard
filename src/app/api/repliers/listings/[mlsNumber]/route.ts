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
      revalidate: 600, // 10 min server-side cache
    });

    const listing = mapMLSToUnified(data);
    const comparables = data.comparables?.map(mapMLSToUnified) || [];
    const history = data.history || [];

    return NextResponse.json(
      { listing, comparables, history, raw: data },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        },
      }
    );
  } catch (error: any) {
    const msg = String(error);
    // Check for rate limit
    if (msg.includes('429') || msg.includes('rate')) {
      return NextResponse.json(
        { error: 'rate_limit', message: 'Please wait a moment and try again' },
        { status: 429, headers: { 'Retry-After': '10' } }
      );
    }
    console.error('Repliers single listing error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listing', details: msg },
      { status: 500 }
    );
  }
}
