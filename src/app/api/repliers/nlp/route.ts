import { NextRequest, NextResponse } from 'next/server';
import { repliersRequest } from '@/lib/repliers';

export async function POST(req: NextRequest) {
  try {
    const { prompt, nlpId } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const data = await repliersRequest({
      method: 'POST',
      path: '/nlp',
      body: { prompt, nlpId },
      revalidate: 0,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Repliers NLP error:', error);
    return NextResponse.json(
      { error: 'Failed to process NLP request' },
      { status: 500 }
    );
  }
}
