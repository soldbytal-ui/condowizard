import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const name = searchParams.get('name');
    const brokerage = searchParams.get('brokerage');

    const query: Record<string, string | undefined> = {};
    if (memberId) query.memberId = memberId;
    if (name) query.name = name;
    if (brokerage) query.brokerage = brokerage;

    const data = await repliersRequest({
      path: '/members',
      query,
      revalidate: 3600,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Repliers members error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
