/**
 * Scale Media — storage + canvas rendering for brand assets and ad creatives.
 *
 * Assets are held in localStorage as base64 data URLs for now. The layout is
 * intentionally compatible with a future Supabase Storage backend (the
 * dataUrl field becomes a Supabase public URL on that migration).
 */

export const SCALE_MEDIA_KEY = 'scale-media-library';
export const SCALE_CREATIVES_KEY = 'scale-creatives';
export const MEDIA_MAX_ITEMS = 20;
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;

export type MediaCategory =
  | 'logo'
  | 'headshot'
  | 'brokerage'
  | 'project_photo'
  | 'lifestyle'
  | 'custom';

export interface MediaAsset {
  id: string;
  name: string;
  dataUrl: string;
  category: MediaCategory;
  width: number;
  height: number;
  size: number;
  uploadedAt: string;
}

export const MEDIA_CATEGORIES: Array<{ id: MediaCategory; label: string; description: string }> = [
  { id: 'logo',          label: 'Logo',          description: 'Primary, secondary, white, or dark logo.' },
  { id: 'headshot',      label: 'Headshot',      description: 'Agent photo for authored-by cards.' },
  { id: 'brokerage',     label: 'Brokerage',     description: 'Rare Real Estate branding lockups.' },
  { id: 'project_photo', label: 'Project Photo', description: 'Renderings, floor plans, amenity shots.' },
  { id: 'lifestyle',     label: 'Lifestyle',     description: 'Neighbourhood, city, lifestyle imagery.' },
  { id: 'custom',        label: 'Custom',        description: 'Anything else.' },
];

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function loadMedia(): MediaAsset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SCALE_MEDIA_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMedia(assets: MediaAsset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SCALE_MEDIA_KEY, JSON.stringify(assets));
  } catch (err) {
    // Likely quota exceeded — surface a clean error for the caller.
    throw new Error('Browser storage is full. Delete some assets first.');
  }
}

export async function addMediaFromFile(file: File, category: MediaCategory): Promise<MediaAsset> {
  if (file.size > MEDIA_MAX_BYTES) {
    throw new Error(`"${file.name}" is larger than 5 MB.`);
  }
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/i.test(file.type)) {
    throw new Error(`"${file.name}" is not a supported image type.`);
  }
  const dataUrl = await readFileAsDataUrl(file);
  const { width, height } = await measureImage(dataUrl);
  const asset: MediaAsset = {
    id: uid('media'),
    name: file.name,
    dataUrl,
    category,
    width,
    height,
    size: file.size,
    uploadedAt: new Date().toISOString(),
  };
  const current = loadMedia();
  if (current.length >= MEDIA_MAX_ITEMS) {
    throw new Error(`You've hit the ${MEDIA_MAX_ITEMS}-asset limit. Delete one before uploading.`);
  }
  const next = [asset, ...current];
  saveMedia(next);
  return asset;
}

export function deleteMedia(id: string): MediaAsset[] {
  const next = loadMedia().filter((a) => a.id !== id);
  saveMedia(next);
  return next;
}

export function ensureSeededMedia(): MediaAsset[] {
  const existing = loadMedia();
  if (existing.length > 0) return existing;
  const nowIso = new Date().toISOString();
  const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0066FF"/>
      <stop offset="1" stop-color="#00D4AA"/>
    </linearGradient>
  </defs>
  <circle cx="100" cy="100" r="96" fill="url(#g)"/>
  <text x="100" y="122" font-family="DM Sans, sans-serif" font-size="72" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="-2">CW</text>
</svg>`;
  const headshotSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#1A1D23"/>
  <circle cx="100" cy="82" r="34" fill="#8B8FA3"/>
  <path d="M36 200c0-35 29-62 64-62s64 27 64 62v0H36v0z" fill="#8B8FA3"/>
</svg>`;
  const toDataUrl = (svg: string) =>
    `data:image/svg+xml;base64,${typeof window !== 'undefined' ? window.btoa(svg) : Buffer.from(svg).toString('base64')}`;

  const seeded: MediaAsset[] = [
    {
      id: uid('media'),
      name: 'CondoWizard logo (placeholder).svg',
      dataUrl: toDataUrl(logoSvg),
      category: 'logo',
      width: 200, height: 200, size: logoSvg.length, uploadedAt: nowIso,
    },
    {
      id: uid('media'),
      name: 'Agent headshot (placeholder).svg',
      dataUrl: toDataUrl(headshotSvg),
      category: 'headshot',
      width: 200, height: 200, size: headshotSvg.length, uploadedAt: nowIso,
    },
  ];
  saveMedia(seeded);
  return seeded;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function measureImage(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined') { resolve({ width: 0, height: 0 }); return; }
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height });
    img.onerror = () => resolve({ width: 0, height: 0 });
    img.src = dataUrl;
  });
}

// ─────────────────────────────────────────────────────────────
// Creative rendering
// ─────────────────────────────────────────────────────────────
export type TemplateId = 'minimal' | 'bold' | 'split' | 'gradient' | 'frame' | 'clean';

export interface CreativeTemplate {
  id: TemplateId;
  label: string;
  description: string;
}

export const TEMPLATES: CreativeTemplate[] = [
  { id: 'minimal',  label: 'Minimal',  description: 'Large image, small text at bottom with subtle gradient.' },
  { id: 'bold',     label: 'Bold',     description: 'Large centered text over darkened image.' },
  { id: 'split',    label: 'Split',    description: 'Image on the left, text on a dark panel on the right.' },
  { id: 'gradient', label: 'Gradient', description: 'Image with a full accent-colour gradient wash.' },
  { id: 'frame',    label: 'Frame',    description: 'Image inside a branded border with a logo badge.' },
  { id: 'clean',    label: 'Clean',    description: 'Full-bleed image with a floating white text card.' },
];

export interface CreativeSpec {
  template: TemplateId;
  imageDataUrl: string | null;
  logoDataUrl?: string | null;
  headline: string;
  subtitle: string;
  cta: string;
  showLogo: boolean;
  textColor: 'light' | 'dark';
  accentColor: string;
  fontScale: 'small' | 'medium' | 'large';
  footer: string;
  width: number;   // output pixels
  height: number;
}

export interface SavedCreative {
  id: string;
  slot?: string;            // "hero", "card_1", "slide_2", etc.
  spec: CreativeSpec;
  dataUrl: string;          // exported PNG
  createdAt: string;
}

/**
 * Render a CreativeSpec to a PNG data URL using an offscreen canvas. This is
 * the html2canvas pattern without the external dependency — we re-draw the
 * template with canvas primitives so the export matches the preview 1:1.
 */
export async function renderCreativeToDataUrl(spec: CreativeSpec): Promise<string> {
  if (typeof document === 'undefined') throw new Error('Canvas rendering only works in the browser.');
  const { width, height } = spec;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');

  // Background
  ctx.fillStyle = '#0B0D11';
  ctx.fillRect(0, 0, width, height);

  const img = spec.imageDataUrl ? await loadImage(spec.imageDataUrl) : null;

  const drawCover = (x: number, y: number, w: number, h: number) => {
    if (!img) return;
    const iw = img.width, ih = img.height;
    const scale = Math.max(w / iw, h / ih);
    const dw = iw * scale, dh = ih * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  };

  const fontFamily = `'DM Sans', -apple-system, sans-serif`;
  const textLight = '#FFFFFF';
  const textDark = '#111318';
  const textColor = spec.textColor === 'light' ? textLight : textDark;
  const shadowColor = spec.textColor === 'light' ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.45)';
  const fontScaleFactor = spec.fontScale === 'small' ? 0.82 : spec.fontScale === 'large' ? 1.2 : 1;

  const drawShadowedText = (
    text: string,
    x: number,
    y: number,
    options: { font: string; align?: CanvasTextAlign; color?: string; maxWidth?: number; shadow?: boolean },
  ) => {
    ctx.save();
    ctx.textAlign = options.align || 'left';
    ctx.font = options.font;
    ctx.fillStyle = options.color || textColor;
    if (options.shadow !== false) {
      ctx.shadowColor = shadowColor;
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 1;
    }
    wrapAndFill(ctx, text, x, y, options.maxWidth ?? width * 0.85);
    ctx.restore();
  };

  const drawPillCta = (x: number, y: number, label: string, bg: string, fg: string) => {
    const padX = Math.round(width * 0.024);
    const padY = Math.round(width * 0.012);
    const fontSize = Math.round(width * 0.032 * fontScaleFactor);
    ctx.font = `700 ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(label);
    const w = metrics.width + padX * 2;
    const h = fontSize + padY * 2;
    ctx.save();
    ctx.fillStyle = bg;
    roundRect(ctx, x, y - h / 2, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = fg;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + padX, y + 1);
    ctx.restore();
  };

  switch (spec.template) {
    case 'minimal': {
      drawCover(0, 0, width, height);
      // Gradient fade from bottom
      const grad = ctx.createLinearGradient(0, height * 0.4, 0, height);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.72)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      const bottomPad = Math.round(width * 0.06);
      const headSize = Math.round(width * 0.055 * fontScaleFactor);
      const subSize = Math.round(width * 0.032 * fontScaleFactor);
      drawShadowedText(spec.headline, bottomPad, height - bottomPad - subSize - 12, {
        font: `700 ${headSize}px ${fontFamily}`,
        color: textLight, maxWidth: width - bottomPad * 2,
      });
      drawShadowedText(spec.subtitle, bottomPad, height - bottomPad + subSize - subSize / 2, {
        font: `500 ${subSize}px ${fontFamily}`,
        color: 'rgba(255,255,255,0.85)', maxWidth: width - bottomPad * 2,
      });
      drawPillCta(width - bottomPad - ctaWidth(ctx, spec.cta, width * 0.032 * fontScaleFactor), height - bottomPad, spec.cta, spec.accentColor, '#fff');
      break;
    }
    case 'bold': {
      drawCover(0, 0, width, height);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(0, 0, width, height);
      const headSize = Math.round(width * 0.09 * fontScaleFactor);
      const subSize = Math.round(width * 0.035 * fontScaleFactor);
      drawShadowedText(spec.headline, width / 2, height / 2 - 10, {
        font: `700 ${headSize}px ${fontFamily}`, align: 'center', color: textLight,
        maxWidth: width * 0.84,
      });
      drawShadowedText(spec.subtitle, width / 2, height / 2 + headSize, {
        font: `500 ${subSize}px ${fontFamily}`, align: 'center',
        color: 'rgba(255,255,255,0.9)', maxWidth: width * 0.84,
      });
      const ctaY = height / 2 + headSize + subSize * 2.2;
      const ctaW = ctaWidth(ctx, spec.cta, width * 0.032 * fontScaleFactor);
      drawPillCta(width / 2 - ctaW / 2, ctaY, spec.cta, spec.accentColor, '#fff');
      break;
    }
    case 'split': {
      const halfW = Math.round(width * 0.55);
      drawCover(0, 0, halfW, height);
      ctx.fillStyle = '#111318';
      ctx.fillRect(halfW, 0, width - halfW, height);
      const padX = Math.round(width * 0.035);
      const headSize = Math.round(width * 0.06 * fontScaleFactor);
      const subSize = Math.round(width * 0.03 * fontScaleFactor);
      ctx.fillStyle = '#fff';
      ctx.font = `700 ${headSize}px ${fontFamily}`;
      ctx.textAlign = 'left';
      wrapAndFill(ctx, spec.headline, halfW + padX, height * 0.35, width - halfW - padX * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.font = `500 ${subSize}px ${fontFamily}`;
      wrapAndFill(ctx, spec.subtitle, halfW + padX, height * 0.52, width - halfW - padX * 2);
      drawPillCta(halfW + padX, height * 0.68, spec.cta, spec.accentColor, '#fff');
      break;
    }
    case 'gradient': {
      drawCover(0, 0, width, height);
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, hexAlpha(spec.accentColor, 0.65));
      g.addColorStop(1, 'rgba(0,0,0,0.55)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
      const pad = Math.round(width * 0.06);
      const headSize = Math.round(width * 0.065 * fontScaleFactor);
      const subSize = Math.round(width * 0.032 * fontScaleFactor);
      drawShadowedText(spec.headline, pad, pad + headSize, {
        font: `700 ${headSize}px ${fontFamily}`, color: '#fff', maxWidth: width - pad * 2,
      });
      drawShadowedText(spec.subtitle, pad, pad + headSize * 2 + 8, {
        font: `500 ${subSize}px ${fontFamily}`, color: 'rgba(255,255,255,0.9)',
        maxWidth: width - pad * 2,
      });
      drawPillCta(pad, height - pad, spec.cta, '#fff', spec.accentColor);
      break;
    }
    case 'frame': {
      const borderW = Math.round(width * 0.04);
      ctx.fillStyle = spec.accentColor;
      ctx.fillRect(0, 0, width, height);
      drawCover(borderW, borderW, width - borderW * 2, height - borderW * 2);
      const pad = borderW + Math.round(width * 0.035);
      const headSize = Math.round(width * 0.05 * fontScaleFactor);
      const subSize = Math.round(width * 0.028 * fontScaleFactor);
      const textTop = height - borderW - headSize * 2 - Math.round(width * 0.04);
      // Dark panel behind text
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(borderW, textTop - Math.round(width * 0.03), width - borderW * 2, height - borderW - (textTop - Math.round(width * 0.03)));
      drawShadowedText(spec.headline, pad, textTop + headSize, {
        font: `700 ${headSize}px ${fontFamily}`, color: '#fff', maxWidth: width - pad * 2, shadow: false,
      });
      drawShadowedText(spec.subtitle, pad, textTop + headSize * 2 + 4, {
        font: `500 ${subSize}px ${fontFamily}`, color: 'rgba(255,255,255,0.85)', maxWidth: width - pad * 2, shadow: false,
      });
      break;
    }
    case 'clean': {
      drawCover(0, 0, width, height);
      const cardW = Math.round(width * 0.72);
      const cardH = Math.round(height * 0.28);
      const cardX = (width - cardW) / 2;
      const cardY = height - cardH - Math.round(width * 0.06);
      ctx.save();
      ctx.fillStyle = '#fff';
      roundRect(ctx, cardX, cardY, cardW, cardH, 16);
      ctx.fill();
      ctx.restore();
      const pad = Math.round(width * 0.03);
      const headSize = Math.round(width * 0.048 * fontScaleFactor);
      const subSize = Math.round(width * 0.028 * fontScaleFactor);
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111318';
      ctx.font = `700 ${headSize}px ${fontFamily}`;
      wrapAndFill(ctx, spec.headline, cardX + pad, cardY + pad + headSize, cardW - pad * 2);
      ctx.fillStyle = '#6B7185';
      ctx.font = `500 ${subSize}px ${fontFamily}`;
      wrapAndFill(ctx, spec.subtitle, cardX + pad, cardY + pad + headSize + subSize + 4, cardW - pad * 2);
      drawPillCta(cardX + pad, cardY + cardH - pad - 4, spec.cta, spec.accentColor, '#fff');
      break;
    }
  }

  // Logo (top-right)
  if (spec.showLogo && spec.logoDataUrl) {
    try {
      const logo = await loadImage(spec.logoDataUrl);
      const logoW = Math.round(width * 0.12);
      const scale = logoW / logo.width;
      const logoH = logo.height * scale;
      const lx = width - Math.round(width * 0.05) - logoW;
      const ly = Math.round(width * 0.05);
      ctx.drawImage(logo, lx, ly, logoW, logoH);
    } catch { /* ignore */ }
  }

  // Footer (brokerage) — muted strip
  if (spec.footer) {
    const footerSize = Math.round(width * 0.018);
    ctx.textAlign = 'center';
    ctx.font = `500 ${footerSize}px ${fontFamily}`;
    ctx.fillStyle = spec.template === 'frame' ? '#fff' :
                    spec.template === 'clean' ? '#6B7185' :
                    'rgba(255,255,255,0.7)';
    ctx.fillText(spec.footer, width / 2, height - Math.round(width * 0.018));
  }

  return canvas.toDataURL('image/png');
}

function ctaWidth(ctx: CanvasRenderingContext2D, label: string, fontSizePx: number): number {
  const prev = ctx.font;
  ctx.font = `700 ${Math.round(fontSizePx)}px 'DM Sans', sans-serif`;
  const w = ctx.measureText(label).width + Math.round(fontSizePx * 1.5);
  ctx.font = prev;
  return w;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapAndFill(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number) {
  if (!text) return;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  const lineHeight = parseFloat(ctx.font) * 1.15;
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src.slice(0, 64)}`));
    img.src = src;
  });
}

export function hexAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const r = parseInt(m[1].slice(0, 2), 16);
  const g = parseInt(m[1].slice(2, 4), 16);
  const b = parseInt(m[1].slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Canvas dimensions recommended for each channel format.
 */
export const CHANNEL_CREATIVE_DIMS: Record<string, { width: number; height: number; previewMaxW: number }> = {
  meta_lead_gen:   { width: 1080, height: 1080, previewMaxW: 400 },
  meta_carousel:   { width: 1080, height: 1080, previewMaxW: 220 },  // per card
  ig_stories:      { width: 1080, height: 1920, previewMaxW: 225 },  // per slide
  google_display:  { width: 1200, height: 628,  previewMaxW: 420 },
};

export const VISUAL_CHANNELS = new Set<string>([
  'meta_lead_gen', 'meta_carousel', 'ig_stories', 'google_display',
]);

/**
 * Saved creatives — stored under "scale-creatives" keyed by result id so the
 * Review step can look them up. Not critical for the UI (which passes specs
 * through state), but useful as a cache across reloads.
 */
export function loadCreatives(): Record<string, SavedCreative[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SCALE_CREATIVES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveCreatives(map: Record<string, SavedCreative[]>) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(SCALE_CREATIVES_KEY, JSON.stringify(map)); } catch {}
}
