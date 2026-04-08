import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest, RepliersEstimate } from '@/lib/repliers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mlsNumber, address, city, province } = body;

    if (!mlsNumber && !address) {
      return NextResponse.json(
        { error: 'mlsNumber or address is required' },
        { status: 400 }
      );
    }

    const data = await repliersRequest<RepliersEstimate>({
      method: 'POST',
      path: '/estimates',
      body: {
        mlsNumber,
        address,
        city: city || 'Toronto',
        province: province || 'Ontario',
      },
      revalidate: 3600,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Repliers estimates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch estimate' },
      { status: 500 }
    );
  }
}
