import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'scale-dev-secret-change-in-production');

async function getSessionFromToken(token?: string) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  // ─── WordPress legacy redirects (existing logic, preserved) ───
  if (searchParams.has('p') && pathname === '/') {
    const url = request.nextUrl.clone();
    url.searchParams.delete('p');
    url.pathname = '/';
    return NextResponse.redirect(url, 301);
  }
  if (searchParams.has('page_id')) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('page_id');
    url.pathname = '/';
    return NextResponse.redirect(url, 301);
  }
  if (searchParams.has('cat')) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('cat');
    url.pathname = '/blog';
    return NextResponse.redirect(url, 301);
  }

  // ─── Scale auth protection ───

  // Public auth paths — always allow
  if (
    pathname === '/admin/platform/login' ||
    pathname === '/admin/platform/setup' ||
    pathname.startsWith('/signup/complete') ||
    pathname === '/api/admin/platform/auth' ||
    pathname === '/api/admin/platform/invite'
  ) {
    return NextResponse.next();
  }

  // Skip non-admin paths entirely
  if (!pathname.startsWith('/admin/') && !pathname.startsWith('/api/admin/')) {
    return NextResponse.next();
  }

  // Everything below requires a valid session
  const token = request.cookies.get('scale-session')?.value;
  const session = await getSessionFromToken(token);

  // Super admin pages (except login/setup already handled above)
  if (pathname.startsWith('/admin/platform')) {
    if (!session?.isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin/platform/login', request.url));
    }
    return NextResponse.next();
  }

  // Scale tenant pages — require session with tenantId or superAdmin
  if (pathname.startsWith('/admin/scale')) {
    if (!session) {
      return NextResponse.redirect(new URL('/admin/platform/login', request.url));
    }
    if (!session.isSuperAdmin && !session.tenantId) {
      return NextResponse.redirect(new URL('/admin/platform/login', request.url));
    }
    return NextResponse.next();
  }

  // Scale API routes — 401 JSON (not redirect) for unauthenticated calls
  if (pathname.startsWith('/api/admin/scale')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!session.isSuperAdmin && !session.tenantId) {
      return NextResponse.json({ error: 'Unauthorized — no tenant context' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Platform API routes (except public ones handled above)
  if (pathname.startsWith('/api/admin/platform')) {
    if (!session?.isSuperAdmin) {
      return NextResponse.json({ error: 'Unauthorized — super admin required' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // /admin but not /admin/platform or /admin/scale — allow (existing admin pages)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
