import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl;

  // WordPress ?p=123 query param → redirect to homepage
  if (searchParams.has('p') && pathname === '/') {
    const url = request.nextUrl.clone();
    url.searchParams.delete('p');
    url.pathname = '/';
    return NextResponse.redirect(url, 301);
  }

  // WordPress ?page_id=123 query param
  if (searchParams.has('page_id')) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('page_id');
    url.pathname = '/';
    return NextResponse.redirect(url, 301);
  }

  // WordPress ?cat=123 query param
  if (searchParams.has('cat')) {
    const url = request.nextUrl.clone();
    url.searchParams.delete('cat');
    url.pathname = '/blog';
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run on paths that might have WP query params
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)',
  ],
};
