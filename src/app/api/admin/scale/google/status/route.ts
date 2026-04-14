import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/scale/google/status
 * Returns whether Google Ads is connected. Customer ID comes from env,
 * not from the user, because the developer token is tied to a specific
 * Google Ads account.
 */
export async function GET() {
  const cookieStore = cookies();
  const refreshToken = cookieStore.get('ga_refresh_token')?.value;
  const email = cookieStore.get('ga_email')?.value || null;

  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID || null;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || null;
  const developerTokenConfigured = Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN);

  return NextResponse.json({
    connected: Boolean(refreshToken),
    email,
    customerId,
    loginCustomerId,
    developerTokenConfigured,
  });
}

/**
 * DELETE /api/admin/scale/google/status — disconnect (clear cookies).
 */
export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('ga_refresh_token');
  cookieStore.delete('ga_access_token');
  cookieStore.delete('ga_email');
  return NextResponse.json({ ok: true });
}
