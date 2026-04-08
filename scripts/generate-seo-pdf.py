#!/usr/bin/env python3
"""Generate SEO Audit PDF from markdown content using ReportLab."""
import re
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import inch, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    PageBreak, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

OUTPUT = "/Users/talshelef/Desktop/preconstructionmiami/SEO-AUDIT.pdf"

# Colors
GREEN = HexColor("#00D26A")
DARK = HexColor("#0D0D0D")
MUTED = HexColor("#666666")
LIGHT_BG = HexColor("#F5F5F5")
WHITE = HexColor("#FFFFFF")
BORDER = HexColor("#DDDDDD")

styles = getSampleStyleSheet()

# Custom styles
styles.add(ParagraphStyle("Title1", parent=styles["Title"], fontSize=24, textColor=DARK, spaceAfter=6))
styles.add(ParagraphStyle("Subtitle", parent=styles["Normal"], fontSize=12, textColor=MUTED, spaceAfter=20))
styles.add(ParagraphStyle("H1", parent=styles["Heading1"], fontSize=20, textColor=DARK, spaceBefore=24, spaceAfter=8))
styles.add(ParagraphStyle("H2", parent=styles["Heading2"], fontSize=16, textColor=DARK, spaceBefore=18, spaceAfter=6))
styles.add(ParagraphStyle("H3", parent=styles["Heading3"], fontSize=13, textColor=DARK, spaceBefore=14, spaceAfter=4))
styles.add(ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, textColor=DARK, leading=14, spaceAfter=6))
styles.add(ParagraphStyle("BodyMuted", parent=styles["Normal"], fontSize=10, textColor=MUTED, leading=14, spaceAfter=6))
styles.add(ParagraphStyle("BulletItem", parent=styles["Normal"], fontSize=10, textColor=DARK, leading=14, leftIndent=20, bulletIndent=10, spaceAfter=3))
styles.add(ParagraphStyle("ScoreStyle", parent=styles["Normal"], fontSize=48, textColor=GREEN, alignment=TA_CENTER, spaceAfter=4))
styles.add(ParagraphStyle("ScoreLabel", parent=styles["Normal"], fontSize=12, textColor=MUTED, alignment=TA_CENTER, spaceAfter=20))
styles.add(ParagraphStyle("TableCell", parent=styles["Normal"], fontSize=9, textColor=DARK, leading=12))
styles.add(ParagraphStyle("TableHeader", parent=styles["Normal"], fontSize=9, textColor=WHITE, leading=12, fontName="Helvetica-Bold"))
styles.add(ParagraphStyle("Footer", parent=styles["Normal"], fontSize=8, textColor=MUTED, alignment=TA_CENTER))

def make_table(headers, rows, col_widths=None):
    """Create a styled table."""
    header_row = [Paragraph(h, styles["TableHeader"]) for h in headers]
    data = [header_row]
    for row in rows:
        data.append([Paragraph(str(c), styles["TableCell"]) for c in row])

    w = col_widths or [None] * len(headers)
    t = Table(data, colWidths=w, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 9),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BACKGROUND", (0, 1), (-1, -1), WHITE),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
    ]))
    return t


def build_pdf():
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=A4,
        leftMargin=20*mm, rightMargin=20*mm,
        topMargin=20*mm, bottomMargin=20*mm,
    )

    story = []
    pw = doc.width

    # --- COVER ---
    story.append(Spacer(1, 60))
    story.append(Paragraph("SEO Content Audit", styles["Title1"]))
    story.append(Paragraph("https://preconstructionmiami.net/", styles["Subtitle"]))
    story.append(Paragraph("April 3, 2026", styles["BodyMuted"]))
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=2, color=GREEN))
    story.append(Spacer(1, 30))

    # Score
    story.append(Paragraph("72/100", styles["ScoreStyle"]))
    story.append(Paragraph("SEO Health Score", styles["ScoreLabel"]))
    story.append(Paragraph(
        "The site has a solid foundation with dynamic metadata, structured data, and good internal linking. "
        "Critical gaps in canonical tags, OG images, schema breadth, and property page meta have been identified "
        "and <b>fixed as part of this audit</b>.",
        styles["Body"]
    ))

    story.append(PageBreak())

    # --- ON-PAGE SEO ---
    story.append(Paragraph("On-Page SEO Checklist", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    on_page_items = [
        ("Title Tag", "Pass", "Primary keyword front-loaded. Template system ensures unique titles per page. About page double-brand issue fixed."),
        ("Meta Description", "Pass", "155 chars. Contains keyword, price range, neighborhoods, CTA language."),
        ("Heading Hierarchy", "Pass", "Single H1 per page, logical H2/H3 structure, keywords in subheadings."),
        ("Image Optimization", "Needs Work", "3 of 6 featured cards missing images. Alt text well-structured. Lazy loading enabled."),
        ("Internal Linking", "Pass", "42 links on homepage. 24 neighborhood pages cross-linked. Breadcrumbs on all pages."),
        ("URL Structure", "Pass", "Clean, keyword-rich, lowercase, hyphen-separated. Proper redirects configured."),
    ]

    t_data = [["Element", "Status", "Notes"]]
    for item in on_page_items:
        status_color = "#00D26A" if item[1] == "Pass" else "#FF9800"
        t_data.append([
            Paragraph(item[0], styles["TableCell"]),
            Paragraph(f'<font color="{status_color}"><b>{item[1]}</b></font>', styles["TableCell"]),
            Paragraph(item[2], styles["TableCell"]),
        ])

    t = Table(t_data, colWidths=[pw*0.18, pw*0.12, pw*0.70], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LIGHT_BG]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    story.append(t)

    # --- E-E-A-T ---
    story.append(Spacer(1, 20))
    story.append(Paragraph("Content Quality (E-E-A-T)", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    eeat = make_table(
        ["Dimension", "Score", "Evidence"],
        [
            ["Experience", "Present", "154+ real listings with specific pricing, unit counts, completion dates. Could strengthen with buyer testimonials."],
            ["Expertise", "Strong", "21 blog posts on financing, deposits, market analysis. Detailed neighborhood content with price tables."],
            ["Authoritativeness", "Present", "78 developer profiles, comprehensive coverage. Could improve with author bylines and media mentions."],
            ["Trustworthiness", "Strong", "Physical address, disclaimer, Terms/Privacy links, HTTPS, prices marked approximate."],
        ],
        [pw*0.15, pw*0.12, pw*0.73]
    )
    story.append(eeat)

    # --- KEYWORD ANALYSIS ---
    story.append(Spacer(1, 20))
    story.append(Paragraph("Keyword Ranking Targets", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    kw = make_table(
        ["Keyword", "Volume", "Target Page", "Goal"],
        [
            ["pre-construction condos miami", "High", "Homepage", "Top 5"],
            ["new condos brickell", "High", "/new-condos-brickell", "Top 3"],
            ["new condos miami", "High", "/new-condos", "Top 5"],
            ["888 brickell", "Medium", "/properties/888-brickell-by-dolce-and-gabbana", "Top 3"],
            ["miami beach new condos", "Medium", "/new-condos-miami-beach", "Top 5"],
            ["branded residences miami", "Medium", "Blog post", "Top 10"],
            ["downtown miami condos", "Medium", "/new-condos-downtown-miami", "Top 5"],
            ["fort lauderdale pre-construction", "Medium", "/new-condos-fort-lauderdale", "Top 5"],
            ["how to buy pre-construction miami", "Low-Med", "Blog post", "Featured snippet"],
            ["miami pre-construction deposit", "Low-Med", "Blog post", "Featured snippet"],
        ],
        [pw*0.28, pw*0.10, pw*0.42, pw*0.20]
    )
    story.append(kw)

    story.append(PageBreak())

    # --- TECHNICAL SEO ---
    story.append(Paragraph("Technical SEO", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    tech = make_table(
        ["Check", "Status", "Details"],
        [
            ["robots.txt", "Pass", "Allows all crawlers, points to sitemap.xml"],
            ["XML Sitemap", "Pass", "231 URLs. Dynamic generation. Correct priorities."],
            ["Canonical Tags", "Fixed", "Were missing on homepage, /new-condos, and property pages. Now added."],
            ["Open Graph Images", "Fixed", "og:image and twitter:image were missing. Now configured."],
            ["Twitter Card", "Fixed", "Upgraded from 'summary' to 'summary_large_image'."],
            ["Robots Meta", "Fixed", "Added explicit index/follow with max-image-preview: large."],
            ["Viewport Meta", "Pass", "Standard responsive viewport tag present."],
            ["HTTPS", "Pass", "SSL certificate active."],
            ["Mobile-Friendly", "Pass", "Responsive grid layouts, mobile CTAs."],
        ],
        [pw*0.20, pw*0.10, pw*0.70]
    )
    story.append(tech)

    # --- SCHEMA ---
    story.append(Spacer(1, 20))
    story.append(Paragraph("Schema Markup", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    schema = make_table(
        ["Schema Type", "Before Audit", "After Audit"],
        [
            ["RealEstateAgent", "Basic (no address)", "Enhanced (address, multi-county, knowsAbout)"],
            ["WebSite + SearchAction", "Missing", "Added (enables sitelinks search box)"],
            ["ItemList", "Missing", "Added (utility for listings pages)"],
            ["RealEstateListing", "Wrong URL (/pre-construction/)", "Fixed URL (/properties/)"],
            ["Breadcrumb", "Dead URL in trail", "Fixed to /new-condos"],
            ["FAQPage", "Present", "No change needed"],
            ["Article", "Present", "No change needed"],
            ["BreadcrumbList", "Present", "No change needed"],
        ],
        [pw*0.25, pw*0.35, pw*0.40]
    )
    story.append(schema)

    story.append(PageBreak())

    # --- CONTENT GAP ---
    story.append(Paragraph("Content Gap Analysis", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    gaps = make_table(
        ["Missing Topic", "Volume", "Competition", "Content Type", "Priority"],
        [
            ["miami condo market forecast 2027", "Medium", "Low", "Blog post", "1"],
            ["best neighborhoods to invest miami 2026", "High", "Medium", "Blog guide", "1"],
            ["pre-construction vs ready to move in", "Medium", "Low", "Blog post", "2"],
            ["miami condo insurance costs", "Medium", "Low", "Blog post", "2"],
            ["miami condo assignment/flip guide", "Medium", "Medium", "Blog post", "2"],
            ["aventura pre-construction condos", "Medium", "Low", "Page content", "3"],
            ["coral gables new developments", "Medium", "Low", "Page content", "3"],
            ["developer deep-dive profiles", "Low", "Very Low", "Dev pages", "4"],
        ],
        [pw*0.30, pw*0.12, pw*0.14, pw*0.18, pw*0.12]
    )
    story.append(gaps)

    # --- FIXES EXECUTED ---
    story.append(Spacer(1, 20))
    story.append(Paragraph("Fixes Executed in This Audit", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>Critical (Fixed)</b>", styles["H3"]))
    critical = [
        "Added canonical tags to homepage, /new-condos, and all property pages",
        "Added og:image and twitter:image configuration for social sharing previews",
        "Upgraded twitter:card from 'summary' to 'summary_large_image'",
        "Added explicit robots meta with max-image-preview: large for rich results",
        "Fixed RealEstateListing schema URL from /pre-construction/ to /properties/",
        "Fixed breadcrumb schema URL from dead /pre-construction to /new-condos",
        "Fixed About page double brand name in title tag",
    ]
    for item in critical:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(Spacer(1, 10))
    story.append(Paragraph("<b>High Priority (Fixed)</b>", styles["H3"]))
    high = [
        "Added WebSite + SearchAction schema (enables Google sitelinks search box)",
        "Enhanced RealEstateAgent schema with postal address, multi-county service area, knowsAbout",
        "Added ItemList schema utility for listings pages",
        "Added metadataBase to layout.tsx for proper OG image URL resolution",
        "Added OpenGraph metadata to /new-condos and property detail pages",
    ]
    for item in high:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    # --- REMAINING RECOMMENDATIONS ---
    story.append(Spacer(1, 20))
    story.append(Paragraph("Remaining Recommendations", styles["H1"]))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>High Priority (This Month)</b>", styles["H3"]))
    for item in [
        "Create /public/og-image.png (1200x630px) branded social sharing image",
        "Fill missing project images -- 3 of 6 featured homepage cards have no images",
        "Add 'Latest Insights' blog section to homepage for crawl depth",
        "Add contextual links from blog posts to specific property pages",
    ]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Medium Priority (This Quarter)</b>", styles["H3"]))
    for item in [
        "Write 2027 market forecast blog post",
        "Write 'best neighborhoods to invest' guide",
        "Add author bylines to blog posts for E-E-A-T",
        "Optimize hero LCP -- static fallback before Mapbox loads",
        "Enrich developer profile pages with bio content",
    ]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    story.append(Spacer(1, 8))
    story.append(Paragraph("<b>Low Priority (When Resources Allow)</b>", styles["H3"]))
    for item in [
        "Add hreflang tags if targeting international buyers",
        "Create interactive construction timeline tool",
        "Add testimonials with AggregateRating schema",
        "Set up Google Search Console structured data monitoring",
    ]:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {item}", styles["BulletItem"]))

    # --- FOOTER ---
    story.append(Spacer(1, 30))
    story.append(HRFlowable(width="100%", thickness=1, color=BORDER))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Report generated by PreConstructionMiami SEO Audit Tool -- April 3, 2026", styles["Footer"]))

    doc.build(story)
    print(f"PDF saved to {OUTPUT}")


if __name__ == "__main__":
    build_pdf()
