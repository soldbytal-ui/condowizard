import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/scale/seo/proxy
 *
 * Proxies requests to the DataForSEO API. The client passes credentials
 * in the request body (from localStorage) because this is a client-side app.
 */
export async function POST(req: NextRequest) {
  try {
    const { endpoint, data, auth } = await req.json();

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }
    if (!auth || typeof auth !== 'string') {
      return NextResponse.json({ error: 'Missing auth' }, { status: 401 });
    }

    const url = `https://api.dataforseo.com/v3${endpoint}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': auth,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Proxy error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
