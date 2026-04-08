import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const area = searchParams.get('area');
    const page = searchParams.get('page') || '1';

    if (type === 'boundaries' || area) {
      const data = await repliersRequest({
        path: '/locations',
        query: {
          area: area || undefined,
          city: 'Toronto',
          pageNum: page,
          resultsPerPage: '100',
        },
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
    return NextResponse.json({ error: 'Failed to fetch locations' }, { status: 500 });
  }
}
