import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { mapPreconToUnified } from '@/lib/data-merge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '24');
    const priceMin = searchParams.get('priceMin');
    const priceMax = searchParams.get('priceMax');
    const bedsMin = searchParams.get('bedsMin');
    const neighborhood = searchParams.get('neighborhood');
    const developer = searchParams.get('developer');
    const occupancyYear = searchParams.get('occupancyYear');
    const status = searchParams.get('status');
    const featured = searchParams.get('featured');
    const sortBy = searchParams.get('sortBy') || 'newest';

    let query = supabase
      .from('precon_projects')
      .select('*', { count: 'exact' })
      .eq('is_published', true);

    if (priceMin) query = query.gte('price_from', parseInt(priceMin));
    if (priceMax) query = query.lte('price_from', parseInt(priceMax));
    if (bedsMin) query = query.gte('beds_to', parseInt(bedsMin));
    if (neighborhood) query = query.ilike('neighborhood', `%${neighborhood}%`);
    if (developer) query = query.ilike('developer', `%${developer}%`);
    if (occupancyYear) query = query.eq('occupancy_year', parseInt(occupancyYear));
    if (status) query = query.eq('status', status);
    if (featured === 'true') query = query.eq('is_featured', true);

    switch (sortBy) {
      case 'price_asc': query = query.order('price_from', { ascending: true }); break;
      case 'price_desc': query = query.order('price_from', { ascending: false }); break;
      case 'largest': query = query.order('sqft_to', { ascending: false }); break;
      default: query = query.order('updated_at', { ascending: false });
    }

    query = query.range((page - 1) * pageSize, page * pageSize - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error('Supabase precon error:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    const listings = (data || []).map(mapPreconToUnified);

    return NextResponse.json({
      listings,
      total: count || 0,
    });
  } catch (error) {
    console.error('Precon API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
