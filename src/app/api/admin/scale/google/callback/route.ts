import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForTokens, fetchGoogleUserInfo } from '@/lib/google-ads';

export const dynamic = 'force-dynamic';

/**
 * OAuth callback. Google redirects here with ?code=... &state=...
 * We exchange the code for refresh + access tokens, then store the refresh
 * token in an httpOnly cookie. The access token is short-lived — we refresh
 * on demand in the push route.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  const settingsUrl = new URL('/admin/scale/settings', url.origin);

  if (error) {
    settingsUrl.searchParams.set('ga_error', error);
    return NextResponse.redirect(settingsUrl);
  }
  if (!code) {
    settingsUrl.searchParams.set('ga_error', 'missing_code');
    return NextResponse.redirect(settingsUrl);
  }

  const cookieStore = cookies();
  const expectedState = cookieStore.get('ga_oauth_state')?.value;
  if (!expectedState || expectedState !== state) {
    settingsUrl.searchParams.set('ga_error', 'state_mismatch');
    return NextResponse.redirect(settingsUrl);
  }
  cookieStore.delete('ga_oauth_state');

  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    settingsUrl.searchParams.set('ga_error', 'server_not_configured');
    return NextResponse.redirect(settingsUrl);
  }

  const redirectUri = `${url.origin}/api/admin/scale/google/callback`;

  try {
    const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
    if (!tokens.refresh_token) {
      settingsUrl.searchParams.set('ga_error', 'no_refresh_token');
      return NextResponse.redirect(settingsUrl);
    }

    const userInfo = await fetchGoogleUserInfo(tokens.access_token);

    const secure = process.env.NODE_ENV === 'production';
    const thirtyDays = 60 * 60 * 24 * 30;

    cookieStore.set('ga_refresh_token', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: thirtyDays,
    });
    cookieStore.set('ga_access_token', tokens.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: Math.max(60, (tokens.expires_in || 3600) - 60),
    });
    if (userInfo.email) {
      cookieStore.set('ga_email', userInfo.email, {
        httpOnly: true,
        sameSite: 'lax',
        secure,
        path: '/',
        maxAge: thirtyDays,
      });
    }

    settingsUrl.searchParams.set('ga_connected', '1');
    return NextResponse.redirect(settingsUrl);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    settingsUrl.searchParams.set('ga_error', encodeURIComponent(message));
    return NextResponse.redirect(settingsUrl);
  }
}
