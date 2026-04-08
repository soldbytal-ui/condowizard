import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get('city') || 'Toronto';
    const neighborhood = searchParams.get('neighborhood') || undefined;
    const page = searchParams.get('page') || '1';

    const data = await repliersRequest({
      path: '/listings/buildings',
      query: {
        city,
        neighborhood,
        pageNum: parseInt(page),
        resultsPerPage: 24,
      },
      revalidate: 3600,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Repliers buildings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch buildings' },
      { status: 500 }
    );
  }
}
