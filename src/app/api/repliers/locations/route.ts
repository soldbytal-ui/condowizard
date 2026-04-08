import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'autocomplete' or 'boundaries'
    const area = searchParams.get('area');

    if (type === 'boundaries' || area) {
      // Fetch community boundary GeoJSON
      const data = await repliersRequest({
        path: '/locations',
        query: { area: area || undefined, city: 'Toronto' },
        revalidate: 86400,
      });
      return NextResponse.json(data);
    }

    // Autocomplete
    if (!query) {
      return NextResponse.json({ suggestions: [] });
    }

    const data = await repliersRequest<{ suggestions: unknown[] }>({
      path: '/locations/autocomplete',
      query: { search: query, city: 'Toronto' },
      revalidate: 86400,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Repliers locations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
