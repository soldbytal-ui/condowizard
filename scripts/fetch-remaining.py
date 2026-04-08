#!/usr/bin/env python3
"""
For remaining projects without images, use known official website URLs
to fetch and extract images via direct HTTP requests.
"""
import json, re, os
from urllib.request import Request, urlopen
from urllib.error import URLError

SUPABASE_URL = "https://fnyrtptmcazhmoztmuay.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI"

# Known official website URLs for remaining projects
KNOWN_SITES = {
    "ora-by-casa-tua": "https://orabycasatua.com/",
    "origin-residences": "https://originresidences.com/",
    "pagani-residences-miami": "https://paganiresidencesmiami.com/",
    "palma-miami-beach": "https://palmamiamibeach.com/",
    "parkside-brickell": "https://parksidebrickell.com/",
    "pier-sixty-six-residences": "https://pierssixtysix.com/residences",
    "ponce-park": "https://poncepark.com/",
    "raleigh-at-rosewood-residences": "https://www.raleighrosewood.com/",
    "ritz-carlton-residences-south-beach": "https://www.ritzcarltonresidencesmiamibeach.com/",
    "riva-fort-lauderdale": "https://rivafortlauderdale.com/",
    "rivage-bal-harbour": "https://rivagebalharbour.com/",
    "season-one-brickell": "https://seasononebrickell.com/",
    "seven-park": "https://sevenpark.com/",
    "seventeen-gables": "https://seventeengables.com/",
    "shoma-bay": "https://shomabay.com/",
    "shore-club-private-collection": "https://www.shoreclubprivatecollection.com/",
    "silver-sands-residences": "https://silversandsresidences.com/",
    "sixth-and-rio": "https://sixthandrio.com/",
    "smart-brickell-ii": "https://smartbrickell.com/",
    "smart-brickell-iii": "https://smartbrickell.com/",
    "solemar-residences": "https://solemarresidences.com/",
    "solina-bay-harbor": "https://solinabayharbor.com/",
    "st-regis-residences-brickell": "https://stregisresidencesbrickell.com/",
    "surf-house-at-the-surf-club": "https://thesurfclub.com/",
    "surf-row-residences": "https://surfrowresidences.com/",
    "the-avenue-coral-gables": "https://theavenuecoralgables.com/",
    "the-cloud-one-hotel-and-residences": "https://cloudoneresidences.com/",
    "the-delmore-surfside": "https://thedelmoresurfside.com/",
    "the-edition-residences-fort-lauderdale": "https://www.editionresidencesftlauderdale.com/",
    "the-lincoln-coconut-grove": "https://thelincolncoconutgrove.com/",
    "the-links-estates": "https://thelinksestates.com/",
    "the-perigon": "https://www.theperigon.com/",
    "the-residences-at-1428-brickell": "https://1428brickell.com/",
    "the-residences-at-mandarin-oriental": "https://mo-residencesmiami.com/",
    "the-residences-at-shell-bay": "https://shellbay.com/residences",
    "the-residences-at-six-fisher-island": "https://sixfisherisland.com/",
    "the-rider-residences": "https://theriderresidences.com/",
    "the-st-regis-residences-sunny-isles": "https://stregisresidences-sunnyisles.com/",
    "the-standard-residences-brickell": "https://thestandardresidences.com/brickell",
    "the-standard-residences-midtown": "https://thestandardresidences.com/midtown",
    "the-village-at-coral-gables": "https://thevillageatcoralgables.com/",
    "the-well-bay-harbor-islands": "https://thewellresidences.com/bay-harbor",
    "the-well-coconut-grove": "https://thewellresidences.com/coconut-grove",
    "tula-residences": "https://tularesidences.com/",
    "twenty-sixth-and-2nd-wynwood": "https://twentysixthsecond.com/",
    "twenty-nine-indian-creek": "https://29indiancreek.com/",
    "viceroy-brickell-residences": "https://viceroybrickell.com/",
    "viceroy-residences-aventura": "https://viceroyresidences.com/aventura",
    "villa-miami": "https://villamiami.com/",
    "villa-valencia": "https://villavalencia.com/",
    "vista-harbor-residences-and-yacht-club": "https://vistaharborresidences.com/",
    "vita-at-grove-isle": "https://vitagroveisle.com/",
    "waldorf-astoria-pompano-beach": "https://waldorfastoriapompanobeach.com/",
    "waldorf-astoria-residences-miami": "https://waldorfastoriamiami.com/",
    "ziggurat": "https://zigguratmiami.com/",
}

def fetch_html(url):
    """Fetch HTML from a URL."""
    try:
        req = Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"})
        with urlopen(req, timeout=15) as resp:
            return resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  Failed to fetch {url}: {e}")
        return ""

def extract_images_from_html(html, base_url):
    """Extract image URLs from HTML."""
    imgs = []
    # Find og:image
    og_match = re.search(r'<meta\s+(?:property|name)="og:image"\s+content="([^"]+)"', html)
    if og_match:
        imgs.append(og_match.group(1))
    # Find all img src
    for match in re.findall(r'<img[^>]+src="([^"]+)"', html):
        if match.startswith("//"):
            match = "https:" + match
        elif match.startswith("/"):
            match = base_url.rstrip("/") + match
        if any(ext in match.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            imgs.append(match)
    # Find background images
    for match in re.findall(r'url\(["\']?(https?://[^)"\'\s]+)["\']?\)', html):
        if any(ext in match.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
            imgs.append(match)
    return imgs

def update_project(project_id, main_image, gallery, website_url):
    """Update project in Supabase."""
    images_json = {"gallery": gallery[:12]} if gallery else {}
    body = {}
    if main_image:
        body["mainImageUrl"] = main_image
    if images_json:
        body["images"] = images_json
    if website_url:
        body["websiteUrl"] = website_url
    if not body:
        return False
    req = Request(
        f"{SUPABASE_URL}/rest/v1/projects?id=eq.{project_id}",
        data=json.dumps(body).encode(),
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
        method="PATCH",
    )
    try:
        urlopen(req)
        return True
    except Exception as e:
        print(f"  DB error: {e}")
        return False

def main():
    projects = json.load(open("scripts/image-results/all-projects.json"))
    slug_to_project = {p["slug"]: p for p in projects}

    updated = 0
    for slug, site_url in KNOWN_SITES.items():
        project = slug_to_project.get(slug, {})
        pid = project.get("id", "")
        name = project.get("name", slug)
        if not pid:
            print(f"SKIP {slug}: no project ID")
            continue

        print(f"Fetching: {name} -> {site_url}")
        html = fetch_html(site_url)
        if not html:
            continue

        raw_imgs = extract_images_from_html(html, site_url)
        # Deduplicate and filter
        seen = set()
        gallery = []
        for url in raw_imgs:
            if url in seen:
                continue
            seen.add(url)
            # Skip tiny/icon images
            if any(skip in url.lower() for skip in ['favicon', 'icon', 'logo', 'pixel', 'tracking', '1x1', 'svg']):
                continue
            gallery.append({"url": url, "alt": name, "type": "rendering"})

        main_img = gallery[0]["url"] if gallery else None
        print(f"  Found {len(gallery)} images, main: {'YES' if main_img else 'NO'}")

        if main_img or gallery:
            if update_project(pid, main_img, gallery, site_url):
                updated += 1
                print(f"  -> Updated")
            else:
                print(f"  -> Failed")
        else:
            # Still save the website URL even if no images
            update_project(pid, None, [], site_url)
            print(f"  -> Saved URL only")

    print(f"\nDone! Updated: {updated}/{len(KNOWN_SITES)}")

if __name__ == "__main__":
    main()
