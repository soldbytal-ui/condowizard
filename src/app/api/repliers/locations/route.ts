import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type'); // 'area', 'city', 'neighborhood', 'autocomplete', 'boundaries'
    const area = searchParams.get('area');
    const city = searchParams.get('city');
    const page = searchParams.get('page') || '1';

    // Autocomplete search
    if (query || type === 'autocomplete') {
      if (!query) return NextResponse.json({ suggestions: [] });
      const data = await repliersRequest<any>({
        path: '/locations/autocomplete',
        query: { search: query, city: 'Toronto' },
        revalidate: 86400,
      });
      return NextResponse.json(data);
    }

    // Location hierarchy: areas, cities, neighbourhoods
    const locQuery: Record<string, string | undefined> = {
      boardId: '91',
      pageNum: page,
      resultsPerPage: '100',
    };

    if (type) locQuery.type = type;
    if (area) locQuery.area = area;
    if (city) locQuery.city = city;

    // Default to Toronto if no area/city specified
    if (!area && !city && type !== 'area') locQuery.city = 'Toronto';

    const data = await repliersRequest({
      path: '/locations',
      query: locQuery,
      revalidate: 86400,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Repliers locations error:', error);
    return NextResponse.json({ error: 'Failed to fetch locations', locations: [] }, { status: 500 });
  }
}
