#!/usr/bin/env python3
"""
Extract images from firecrawl search results and update Supabase.
Reads all .firecrawl/search-*.json files, extracts image URLs, and updates projects.
"""
import json, re, os, sys
from urllib.request import Request, urlopen
from urllib.parse import quote

SUPABASE_URL = "https://fnyrtptmcazhmoztmuay.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI"

def extract_images_from_markdown(md, project_name):
    """Extract and categorize images from scraped markdown content."""
    # Find markdown images: ![alt](url)
    md_imgs = re.findall(r'!\[([^\]]*)\]\(([^)]+)\)', md)
    # Find raw image URLs
    raw_imgs = re.findall(r'(https?://[^\s\)\"\'>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s\)\"\'>]*)?)', md)

    all_urls = set()
    gallery = []
    floor_plans = []

    for alt, url in md_imgs:
        url = url.split('?')[0] if 'sanity.io' not in url else url.split('?')[0]
        if url in all_urls:
            continue
        all_urls.add(url)

        # Skip tiny images (icons, logos) by checking dimensions in URL
        dim_match = re.search(r'-(\d+)x(\d+)', url)
        if dim_match:
            w, h = int(dim_match.group(1)), int(dim_match.group(2))
            if w < 200 and h < 200:
                continue

        # Skip vimeo thumbnails, tracking pixels, etc
        if any(skip in url.lower() for skip in ['vimeo', 'pixel', 'tracking', 'favicon', 'icon', 'logo', 'svg']):
            continue

        alt_lower = alt.lower()
        # Categorize
        if any(kw in alt_lower for kw in ['floor plan', 'floorplan', 'floor_plan', 'layout', 'unit plan']):
            floor_plans.append({"url": url, "label": alt or None})
        else:
            img_type = "rendering"
            if any(kw in alt_lower for kw in ['aerial', 'drone', 'bird']):
                img_type = "aerial"
            elif any(kw in alt_lower for kw in ['photo', 'construction', 'progress']):
                img_type = "photo"
            elif any(kw in alt_lower for kw in ['interior', 'kitchen', 'living', 'bedroom', 'bathroom']):
                img_type = "rendering"
            gallery.append({"url": url, "alt": alt or f"{project_name} rendering", "type": img_type})

    # Add raw URLs not already found
    for url in raw_imgs:
        clean_url = url.split('?')[0] if 'sanity.io' not in url else url
        if clean_url in all_urls:
            continue
        all_urls.add(clean_url)
        dim_match = re.search(r'-(\d+)x(\d+)', clean_url)
        if dim_match:
            w, h = int(dim_match.group(1)), int(dim_match.group(2))
            if w < 200 and h < 200:
                continue
        if any(skip in clean_url.lower() for skip in ['vimeo', 'pixel', 'tracking', 'favicon', 'icon', 'logo']):
            continue
        gallery.append({"url": clean_url, "alt": f"{project_name}", "type": "rendering"})

    return gallery, floor_plans

def update_project(project_id, main_image, gallery, floor_plans, website_url):
    """Update a project in Supabase."""
    images_json = {}
    if gallery:
        images_json["gallery"] = gallery[:12]  # Cap at 12 gallery images
    if floor_plans:
        images_json["floorPlans"] = floor_plans[:8]  # Cap at 8 floor plans

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
        print(f"  ERROR updating: {e}")
        return False

def process_search_result(filepath, slug, project_name):
    """Process a single firecrawl search result file."""
    with open(filepath) as f:
        data = json.load(f)

    web_results = data.get("data", {}).get("web", [])
    if not web_results:
        print(f"  No web results found")
        return None

    # Get website URL from first result
    website_url = web_results[0].get("url", "")

    # Combine markdown from all scraped results
    all_gallery = []
    all_floor_plans = []

    for result in web_results:
        md = result.get("markdown", "")
        if not md:
            continue
        gallery, floor_plans = extract_images_from_markdown(md, project_name)
        all_gallery.extend(gallery)
        all_floor_plans.extend(floor_plans)

    # Deduplicate by URL
    seen = set()
    unique_gallery = []
    for img in all_gallery:
        if img["url"] not in seen:
            seen.add(img["url"])
            unique_gallery.append(img)

    seen_fp = set()
    unique_fps = []
    for fp in all_floor_plans:
        if fp["url"] not in seen_fp:
            seen_fp.add(fp["url"])
            unique_fps.append(fp)

    # Pick best main image (largest resolution from sanity/cloudinary/etc)
    main_image = None
    if unique_gallery:
        # Prefer high-res images
        def score_image(img):
            url = img["url"]
            dim_match = re.search(r'-(\d+)x(\d+)', url)
            if dim_match:
                return int(dim_match.group(1)) * int(dim_match.group(2))
            return 1000000  # Assume large if no dims in URL

        sorted_gallery = sorted(unique_gallery, key=score_image, reverse=True)
        main_image = sorted_gallery[0]["url"]

    return {
        "mainImageUrl": main_image,
        "gallery": unique_gallery[:12],
        "floorPlans": unique_fps[:8],
        "websiteUrl": website_url,
    }

def main():
    results_dir = ".firecrawl"

    # Load project mapping
    projects_file = "scripts/image-results/all-projects.json"
    if os.path.exists(projects_file):
        with open(projects_file) as f:
            projects = json.load(f)
        slug_to_project = {p["slug"]: p for p in projects}
    else:
        slug_to_project = {}

    # Process all search result files
    search_files = sorted([f for f in os.listdir(results_dir) if f.startswith("search-") and f.endswith(".json")])

    updated = 0
    failed = 0

    for filename in search_files:
        # Extract slug from filename: search-{slug}.json
        slug = filename.replace("search-", "").replace(".json", "")
        project = slug_to_project.get(slug, {})
        project_id = project.get("id", "")
        project_name = project.get("name", slug)

        print(f"\nProcessing: {project_name} ({slug})")

        filepath = os.path.join(results_dir, filename)
        result = process_search_result(filepath, slug, project_name)

        if not result:
            failed += 1
            continue

        print(f"  Main image: {'YES' if result['mainImageUrl'] else 'NO'}")
        print(f"  Gallery: {len(result['gallery'])} images")
        print(f"  Floor plans: {len(result['floorPlans'])} images")
        print(f"  Website: {result['websiteUrl']}")

        if project_id:
            success = update_project(
                project_id,
                result["mainImageUrl"],
                result["gallery"],
                result["floorPlans"],
                result["websiteUrl"],
            )
            if success:
                updated += 1
                print(f"  -> Updated in Supabase")
            else:
                failed += 1
        else:
            print(f"  -> No project ID found, skipping DB update")
            failed += 1

    print(f"\n{'='*50}")
    print(f"Done! Updated: {updated}, Failed: {failed}")

if __name__ == "__main__":
    main()
