import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mlsNumber = searchParams.get('mlsNumber');
    const address = searchParams.get('address');

    if (!mlsNumber && !address) {
      return NextResponse.json(
        { error: 'mlsNumber or address is required' },
        { status: 400 }
      );
    }

    const query: Record<string, string | undefined> = {};
    if (mlsNumber) query.mlsNumber = mlsNumber;
    if (address) query.address = address;

    const data = await repliersRequest({
      path: '/listings/history',
      query,
      revalidate: 600,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Repliers history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
