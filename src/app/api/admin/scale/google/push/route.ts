import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  GoogleAdsAuth,
  refreshAccessToken,
  createCampaignBudget,
  createCampaign,
  createAdGroup,
  createKeywords,
  createResponsiveSearchAd,
  createSitelinks,
  deriveDefaultKeywords,
} from '@/lib/google-ads';

export const dynamic = 'force-dynamic';

interface PushPayload {
  campaignName: string;
  projectName: string;
  neighborhood?: string;
  dailyBudget: number;           // in dollars
  finalUrl: string;
  headlines: string[];           // at least 3
  descriptions: string[];        // at least 2
  keywords_exact?: string[];
  keywords_phrase?: string[];
  negatives?: string[];
  sitelinks?: Array<{ text: string; url: string; description1?: string; description2?: string }>;
  channelType?: 'SEARCH' | 'DISPLAY';
}

/**
 * POST /api/admin/scale/google/push
 * Creates a paused Google Ads campaign end-to-end: budget → campaign →
 * ad group → keywords → RSA → sitelinks. Returns the IDs so the UI can
 * link into the Google Ads console.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PushPayload;

    if (!body.campaignName || !body.projectName) {
      return NextResponse.json({ error: 'campaignName and projectName are required' }, { status: 400 });
    }
    if (!body.headlines || body.headlines.length < 3) {
      return NextResponse.json({ error: 'At least 3 headlines are required' }, { status: 400 });
    }
    if (!body.descriptions || body.descriptions.length < 2) {
      return NextResponse.json({ error: 'At least 2 descriptions are required' }, { status: 400 });
    }
    if (!body.finalUrl) {
      return NextResponse.json({ error: 'finalUrl is required' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
    const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;

    if (!clientId || !clientSecret || !developerToken || !customerId) {
      return NextResponse.json(
        { error: 'Google Ads env vars missing (CLIENT_ID / CLIENT_SECRET / DEVELOPER_TOKEN / CUSTOMER_ID).' },
        { status: 500 }
      );
    }

    const cookieStore = cookies();
    const refreshToken = cookieStore.get('ga_refresh_token')?.value;
    if (!refreshToken) {
      return NextResponse.json({ error: 'Not connected to Google Ads. Connect in /admin/scale/settings.' }, { status: 401 });
    }

    // Always refresh on push — simpler than tracking expiry.
    const tokenRes = await refreshAccessToken(refreshToken, clientId, clientSecret);
    const accessToken = tokenRes.access_token;

    const auth: GoogleAdsAuth = {
      accessToken,
      developerToken,
      customerId,
      loginCustomerId: loginCustomerId || undefined,
    };

    // Fill in keyword defaults when caller omitted them.
    const derived = deriveDefaultKeywords({ projectName: body.projectName, neighborhood: body.neighborhood });
    const keywordsExact = (body.keywords_exact && body.keywords_exact.length ? body.keywords_exact : derived.exact);
    const keywordsPhrase = (body.keywords_phrase && body.keywords_phrase.length ? body.keywords_phrase : derived.phrase);
    const negatives = (body.negatives && body.negatives.length ? body.negatives : derived.negatives);

    // 1. Budget
    const budgetResourceName = await createCampaignBudget(auth, {
      name: `${body.campaignName} — Budget`,
      dailyDollars: body.dailyBudget,
    });

    // 2. Campaign
    const campaignResourceName = await createCampaign(auth, {
      name: body.campaignName,
      budgetResourceName,
      channelType: body.channelType || 'SEARCH',
    });

    // 3. Ad group
    const adGroupResourceName = await createAdGroup(auth, {
      campaignResourceName,
      name: `${body.projectName} — Ad Group`,
    });

    // 4. Keywords (exact + phrase)
    const exactKw = await createKeywords(auth, { adGroupResourceName, keywords: keywordsExact, matchType: 'EXACT' });
    const phraseKw = await createKeywords(auth, { adGroupResourceName, keywords: keywordsPhrase, matchType: 'PHRASE' });
    const negKw = await createKeywords(auth, { adGroupResourceName, keywords: negatives, matchType: 'BROAD', negative: true });

    // 5. Responsive Search Ad
    const adResourceName = await createResponsiveSearchAd(auth, {
      adGroupResourceName,
      headlines: body.headlines,
      descriptions: body.descriptions,
      finalUrl: body.finalUrl,
    });

    // 6. Sitelinks (best-effort; failure here shouldn't void the campaign)
    let sitelinkResourceNames: string[] = [];
    if (body.sitelinks && body.sitelinks.length) {
      try {
        sitelinkResourceNames = await createSitelinks(auth, {
          campaignResourceName,
          sitelinks: body.sitelinks,
        });
      } catch (err) {
        sitelinkResourceNames = [];
        console.warn('Sitelink creation failed', err);
      }
    }

    const extractId = (rn: string) => rn.split('/').pop() || '';

    return NextResponse.json({
      success: true,
      customerId,
      campaignId: extractId(campaignResourceName),
      adGroupId: extractId(adGroupResourceName),
      adId: extractId(adResourceName),
      campaignResourceName,
      adGroupResourceName,
      adResourceName,
      budgetResourceName,
      keywordResourceNames: [...exactKw, ...phraseKw, ...negKw],
      sitelinkResourceNames,
      status: 'PAUSED',
      note: 'Campaign created in PAUSED state. Un-pause inside the Google Ads UI when ready.',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
