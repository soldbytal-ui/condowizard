/**
 * Shared image-scrape lib used by import + standalone scrape scripts.
 * Given a project name (+ optional csvSource, csvWebsite), returns the best
 * project rendering URL + gallery, sourced from listing sites like precondo.ca,
 * gta-homes.com, condonow.com, condos.ca, etc.
 */

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export function slugify(s) {
  return s.toLowerCase()
    .replace(/[àáâä]/g, 'a').replace(/[éèê]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ûü]/g, 'u')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchHtml(url, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' }, redirect: 'follow' });
    clearTimeout(id);
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('html')) return null;
    return await res.text();
  } catch {
    clearTimeout(id);
    return null;
  }
}

const GENERIC_OG_BLACKLIST = [
  /precondo\.ca\/wp-content\/uploads\/2019\/08\/PC_fb\.jpg/i,
  /precondo\.ca\/wp-content\/uploads\/2017\/07\/FI\.jpg/i,
  /precondo\.ca\/wp-content\/uploads\/2019\/08\/New-condos-in-/i,
  /condos\.ca.*\/og-default/i,
  /developments\.ca\/(kitchen|default|placeholder)/i,
  /buzzbuzzhome\.com.*\/(default|placeholder|logo)/i,
  /favicon|apple-touch-icon|share-image-default/i,
  /gta-homes\.com.*\/default/i,
  // Hotlink-blocked domains — CloudFront returns 403 to non-condonow referrers
  /condonow\.com/i,
];

const isGeneric = (url) => GENERIC_OG_BLACKLIST.some(rx => rx.test(url));

function extractImages(html, baseUrl) {
  const results = [];
  const ogMatches = [...html.matchAll(/<meta[^>]*(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["'][^>]*content=["']([^"']+)["']/gi)];
  ogMatches.forEach(m => results.push({ url: m[1], og: true }));
  const ogRev = [...html.matchAll(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image)["']/gi)];
  ogRev.forEach(m => results.push({ url: m[1], og: true }));

  const imgMatches = [...html.matchAll(/<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["'][^>]*>/gi)];
  imgMatches.forEach(m => {
    const src = m[1];
    if (/logo|icon|avatar|placeholder|blank|1x1|pixel|thumb|thumbnail|100x100|150x150|feed-icon|favicon/i.test(src)) return;
    if (/hero|banner|main|feature|render|exterior|building|tower|architec|nav-slider|slider|gallery|carousel|1920|1440|1200|1024|800/i.test(src)) {
      results.push({ url: src, og: false });
    }
  });

  const wpMatches = [...html.matchAll(/(https?:\/\/[^"'\s]+wp-content\/uploads\/[^"'\s]+\.(?:jpg|jpeg|png|webp))/gi)];
  wpMatches.forEach(m => results.push({ url: m[1], og: false }));

  return results
    .map(r => {
      let u = r.url;
      if (!u) return null;
      if (u.startsWith('//')) u = 'https:' + u;
      else if (u.startsWith('/')) { try { u = new URL(u, baseUrl).toString(); } catch { return null; } }
      else if (!u.startsWith('http')) { try { u = new URL(u, baseUrl).toString(); } catch { return null; } }
      if (/\.svg$/i.test(u)) return null;
      if (isGeneric(u)) return null;
      return { url: u, og: r.og };
    })
    .filter(Boolean)
    .filter((v, i, arr) => arr.findIndex(x => x.url === v.url) === i);
}

function scoreImage(url, isOg, projectSlug) {
  let s = 0;
  if (isOg) s += 4;
  const words = projectSlug.split('-').filter(w => w.length > 2);
  const urlLower = url.toLowerCase();
  const wordHits = words.filter(w => urlLower.includes(w)).length;
  s += wordHits * 3;
  if (/render|exterior|building|tower|architec|hero|feature|banner|main/i.test(url)) s += 3;
  if (/facade|elevation|streetview|street-view|aerial|drone/i.test(url)) s += 2;
  if (/1920|1440|1200|1024/.test(url)) s += 2;
  if (/wp-content\/uploads\/20(2[3-9]|3\d)/.test(url)) s += 2;
  if (/\.(jpe?g|webp)$/i.test(url)) s += 1;
  if (/logo|icon|placeholder|thumb|share/i.test(url)) s -= 10;
  if (/PC_fb|FI\.jpg|default|generic|social/i.test(url)) s -= 20;
  return s;
}

async function findProjectPageOnListing(listingHtml, listingUrl, projectSlug) {
  const words = projectSlug.split('-').filter(w => w.length > 3);
  const links = [...listingHtml.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)]
    .map(m => m[1])
    .filter(h => h && words.some(w => h.toLowerCase().includes(w)))
    .map(h => { try { return new URL(h, listingUrl).toString(); } catch { return null; } })
    .filter(Boolean);
  return [...new Set(links)].slice(0, 3);
}

export async function findBestImage(name, csvSource, csvWebsite) {
  const slug = slugify(name.replace(/\s*condos?\s*$/i, ''));
  const listingPatterns = [
    `https://precondo.ca/${slug}/`,
    `https://precondo.ca/${slug}-condos/`,
    `https://condonow.com/${name.replace(/\s+/g, '-').replace(/[^\w-]/g,'')}-Condos`,
    `https://condonow.com/${slug}-condos`,
    `https://condos.ca/toronto/${slug}`,
    `https://condos.ca/toronto/${slug}-condos`,
    `https://www.gta-homes.com/toronto-condos/${slug}/`,
    `https://www.talkcondo.com/toronto/${slug}/`,
    `https://www.talkcondo.com/toronto/${slug}-condos/`,
    `https://www.buzzbuzzhome.com/us/${slug}`,
    `https://www.buzzbuzzhome.com/ca/${slug}`,
    `https://homebaba.ca/${slug}/`,
  ];
  const candidates = [...listingPatterns];
  if (csvWebsite) candidates.push(csvWebsite);
  if (csvSource) candidates.push(csvSource);

  const seen = new Set();
  const allFound = [];

  for (const url of candidates) {
    if (seen.has(url)) continue;
    seen.add(url);
    const html = await fetchHtml(url);
    if (!html) continue;

    const isCategoryLike = /\/new-condos-[^/]+\/?$/i.test(url) || /Toronto Condos For Sale/i.test(html.slice(0, 4000));
    if (isCategoryLike) {
      const subUrls = await findProjectPageOnListing(html, url, slug);
      for (const sub of subUrls) {
        if (seen.has(sub)) continue;
        seen.add(sub);
        const subHtml = await fetchHtml(sub);
        if (!subHtml) continue;
        extractImages(subHtml, sub).forEach(img => allFound.push({ url: img.url, score: scoreImage(img.url, img.og, slug), sourceUrl: sub }));
      }
      extractImages(html, url)
        .filter(img => slug.split('-').filter(w=>w.length>3).some(w => img.url.toLowerCase().includes(w)))
        .forEach(img => allFound.push({ url: img.url, score: scoreImage(img.url, img.og, slug), sourceUrl: url }));
      continue;
    }

    extractImages(html, url).forEach(img => allFound.push({ url: img.url, score: scoreImage(img.url, img.og, slug), sourceUrl: url }));

    const best = allFound.sort((a,b) => b.score - a.score)[0];
    if (best && best.score >= 8) break;
  }

  if (!allFound.length) return null;
  const ranked = allFound.sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (best.score < 3) return null;
  return {
    mainImageUrl: best.url,
    allImages: [...new Set(ranked.slice(0, 12).map(r => r.url))],
    sourceUrl: best.sourceUrl,
  };
}
