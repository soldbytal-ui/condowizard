/**
 * Google Ads REST API (v18) helpers.
 *
 * The developer token is in TEST mode until Basic access is approved, so
 * creates only succeed against test customers. The code paths are the same
 * for production — only the token changes.
 */

export const GOOGLE_ADS_API_VERSION = 'v18';
const GA_API = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export interface GoogleAdsAuth {
  accessToken: string;
  developerToken: string;
  customerId: string;           // 10-digit customer id, no dashes
  loginCustomerId?: string;     // MCC / manager account id, no dashes (optional)
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  id_token?: string;
  token_type?: string;
  scope?: string;
}

// ─────────────────────────────────────────────────────────────
// OAuth
// ─────────────────────────────────────────────────────────────
export async function exchangeCodeForTokens(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OAuth exchange failed: ${JSON.stringify(data)}`);
  return data;
}

export async function refreshAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<GoogleTokenResponse> {
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data;
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{ email?: string; name?: string; sub?: string }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return {};
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// Google Ads REST helpers
// ─────────────────────────────────────────────────────────────
function stripCustomerId(id: string): string {
  return (id || '').replace(/\D/g, '');
}

function headers(auth: GoogleAdsAuth): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${auth.accessToken}`,
    'developer-token': auth.developerToken,
  };
  if (auth.loginCustomerId) h['login-customer-id'] = stripCustomerId(auth.loginCustomerId);
  return h;
}

async function googleAdsPost(auth: GoogleAdsAuth, path: string, body: unknown): Promise<{ results: Array<{ resourceName: string }> }> {
  const customerId = stripCustomerId(auth.customerId);
  const res = await fetch(`${GA_API}/customers/${customerId}${path}`, {
    method: 'POST',
    headers: headers(auth),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = data?.error?.message || JSON.stringify(data);
    throw new Error(`Google Ads ${path} failed: ${err}`);
  }
  return data;
}

export async function createCampaignBudget(
  auth: GoogleAdsAuth,
  args: { name: string; dailyDollars: number }
): Promise<string> {
  const amountMicros = Math.round(args.dailyDollars * 1_000_000).toString();
  const data = await googleAdsPost(auth, '/campaignBudgets:mutate', {
    operations: [{
      create: {
        name: args.name,
        amountMicros,
        deliveryMethod: 'STANDARD',
        explicitlyShared: false,
      },
    }],
  });
  return data.results[0].resourceName;
}

export async function createCampaign(
  auth: GoogleAdsAuth,
  args: { name: string; budgetResourceName: string; channelType?: 'SEARCH' | 'DISPLAY' }
): Promise<string> {
  const data = await googleAdsPost(auth, '/campaigns:mutate', {
    operations: [{
      create: {
        name: args.name,
        advertisingChannelType: args.channelType || 'SEARCH',
        status: 'PAUSED',  // never auto-launch; user unpauses in Google Ads
        campaignBudget: args.budgetResourceName,
        manualCpc: { enhancedCpcEnabled: false },
        networkSettings: {
          targetGoogleSearch: true,
          targetSearchNetwork: args.channelType !== 'DISPLAY',
          targetContentNetwork: args.channelType === 'DISPLAY',
          targetPartnerSearchNetwork: false,
        },
      },
    }],
  });
  return data.results[0].resourceName;
}

export async function createAdGroup(
  auth: GoogleAdsAuth,
  args: { campaignResourceName: string; name: string; cpcBidDollars?: number }
): Promise<string> {
  const cpcBidMicros = Math.round((args.cpcBidDollars ?? 2) * 1_000_000).toString();
  const data = await googleAdsPost(auth, '/adGroups:mutate', {
    operations: [{
      create: {
        name: args.name,
        campaign: args.campaignResourceName,
        status: 'ENABLED',
        type: 'SEARCH_STANDARD',
        cpcBidMicros,
      },
    }],
  });
  return data.results[0].resourceName;
}

export type KeywordMatchType = 'EXACT' | 'PHRASE' | 'BROAD';

export async function createKeywords(
  auth: GoogleAdsAuth,
  args: { adGroupResourceName: string; keywords: string[]; matchType: KeywordMatchType; negative?: boolean }
): Promise<string[]> {
  if (!args.keywords.length) return [];
  const operations = args.keywords.map((text) => ({
    create: {
      adGroup: args.adGroupResourceName,
      status: 'ENABLED',
      negative: !!args.negative,
      keyword: { text, matchType: args.matchType },
    },
  }));
  const data = await googleAdsPost(auth, '/adGroupCriteria:mutate', { operations });
  return data.results.map((r) => r.resourceName);
}

export async function createResponsiveSearchAd(
  auth: GoogleAdsAuth,
  args: { adGroupResourceName: string; headlines: string[]; descriptions: string[]; finalUrl: string; path1?: string; path2?: string }
): Promise<string> {
  const headlines = dedupe(args.headlines).filter(nonEmpty).slice(0, 15).map((text) => ({ text }));
  const descriptions = dedupe(args.descriptions).filter(nonEmpty).slice(0, 4).map((text) => ({ text }));

  if (headlines.length < 3) throw new Error(`Responsive search ads need at least 3 headlines (got ${headlines.length}).`);
  if (descriptions.length < 2) throw new Error(`Responsive search ads need at least 2 descriptions (got ${descriptions.length}).`);

  const data = await googleAdsPost(auth, '/adGroupAds:mutate', {
    operations: [{
      create: {
        adGroup: args.adGroupResourceName,
        status: 'ENABLED',
        ad: {
          finalUrls: [args.finalUrl],
          responsiveSearchAd: {
            headlines,
            descriptions,
            ...(args.path1 ? { path1: args.path1 } : {}),
            ...(args.path2 ? { path2: args.path2 } : {}),
          },
        },
      },
    }],
  });
  return data.results[0].resourceName;
}

export async function createSitelinks(
  auth: GoogleAdsAuth,
  args: { campaignResourceName: string; sitelinks: Array<{ text: string; url: string; description1?: string; description2?: string }> }
): Promise<string[]> {
  if (!args.sitelinks.length) return [];
  // Step 1: create sitelink assets
  const customerId = stripCustomerId(auth.customerId);
  const assetRes = await fetch(`${GA_API}/customers/${customerId}/assets:mutate`, {
    method: 'POST',
    headers: headers(auth),
    body: JSON.stringify({
      operations: args.sitelinks.map((s) => ({
        create: {
          sitelinkAsset: {
            linkText: s.text,
            description1: s.description1 || '',
            description2: s.description2 || '',
          },
          finalUrls: [s.url],
        },
      })),
    }),
  });
  const assetData = await assetRes.json();
  if (!assetRes.ok) throw new Error(`Sitelink asset create failed: ${JSON.stringify(assetData)}`);
  const assetResourceNames: string[] = (assetData.results || []).map((r: { resourceName: string }) => r.resourceName);

  // Step 2: link each asset to the campaign as a SITELINK asset
  const linkData = await googleAdsPost(auth, '/campaignAssets:mutate', {
    operations: assetResourceNames.map((rn) => ({
      create: {
        campaign: args.campaignResourceName,
        asset: rn,
        fieldType: 'SITELINK',
      },
    })),
  });
  return linkData.results.map((r) => r.resourceName);
}

// ─────────────────────────────────────────────────────────────
// Defaults helpers — used by the push route to turn AI output +
// project metadata into keyword lists without extra AI calls.
// ─────────────────────────────────────────────────────────────
export function deriveDefaultKeywords(args: { projectName: string; neighborhood?: string }): {
  exact: string[];
  phrase: string[];
  negatives: string[];
} {
  const name = args.projectName.trim();
  const n = args.neighborhood?.trim();
  const exact = dedupe([
    name,
    `${name} condos`,
    `${name} pre construction`,
    `${name} pre-construction`,
  ]);
  const phrase = dedupe([
    `new condos ${n || 'toronto'}`,
    `pre construction ${n || 'toronto'}`,
    `${n || 'toronto'} condos for sale`,
    `${name} price`,
    `${name} floor plans`,
  ]);
  const negatives = [
    'jobs', 'job', 'careers', 'career',
    'rental', 'rentals', 'rent', 'for rent',
    'reviews', 'review', 'complaints',
    'airbnb', 'short term',
    'free', 'cheap',
  ];
  return { exact, phrase, negatives };
}

// ─────────────────────────────────────────────────────────────
// Small utils
// ─────────────────────────────────────────────────────────────
function dedupe<T>(xs: T[]): T[] {
  const seen = new Set<T>();
  const out: T[] = [];
  xs.forEach((x) => { if (!seen.has(x)) { seen.add(x); out.push(x); } });
  return out;
}
function nonEmpty(s: string) { return typeof s === 'string' && s.trim().length > 0; }
