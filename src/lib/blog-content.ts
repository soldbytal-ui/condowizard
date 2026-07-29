// Parses CondoWizard buyer-guide markdown into structured blocks.
// Fenced code blocks with known languages become interactive components;
// everything else stays plain markdown.

export type HeadingLevel = 2 | 3;

export interface Heading {
  id: string;
  text: string;
  level: HeadingLevel;
}

export type Block =
  | { type: 'markdown'; value: string }
  | { type: 'takeaways'; items: string[] }
  | { type: 'warning'; value: string }
  | { type: 'checklist'; items: string[] }
  | { type: 'example'; title?: string; assumptions: string[] }
  | { type: 'taltake'; value: string }
  | { type: 'timeline'; stages: TimelineStage[] }
  | { type: 'table'; caption?: string; headers: string[]; align?: TableAlign[]; rows: string[][]; totals?: string[][] }
  | { type: 'faq'; items: { q: string; a: string }[] }
  | { type: 'cta'; kind?: 'primary' | 'quiet'; heading: string; body: string; buttons: CtaButton[] }
  | { type: 'sources'; items: SourceEntry[] };

export type TableAlign = 'left' | 'right' | 'center';

export interface TimelineStage {
  label: string;
  meta?: string;
  obligations: string[];
}

export interface CtaButton {
  label: string;
  href: string;
  style?: 'primary' | 'secondary';
}

export interface SourceEntry {
  org: string;
  title: string;
  url: string;
  updated?: string;
}

const KNOWN_LANGS = new Set([
  'takeaways',
  'warning',
  'checklist',
  'example',
  'taltake',
  'timeline',
  'table',
  'faq',
  'cta',
  'sources',
]);

// Strip legacy inline frontmatter markers that older article bodies may contain.
export function cleanContent(content: string): string {
  return content
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return (
        !t.startsWith('**Meta Title:') &&
        !t.startsWith('**Meta Description:') &&
        !t.startsWith('**Target Keyword:') &&
        !t.startsWith('**Slug:')
      );
    })
    .join('\n');
}

// Certain H2 sections in the source markdown are rendered by dedicated
// components (sticky TOC, FAQ accordion, sources drawer). Strip those
// sections from the visible article body so we don't render them twice.
const REDUNDANT_H2 = new Set([
  'table of contents',
  'frequently asked questions',
  'sources',
  'sources and last reviewed',
]);

// Strip a redundant H2 heading and any prose that follows it, up to the next
// heading or the next fenced code block (whichever comes first). This lets a
// heading like `## Sources` disappear while the `\`\`\`sources` block right
// below it survives to be rendered by its dedicated component.
export function stripRedundantSections(content: string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let inFence = false;
  let skip = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      // A fenced block ends any active skip.
      skip = false;
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (!inFence) {
      const h2 = line.match(/^##\s+(.+?)\s*$/);
      if (h2) {
        const heading = h2[1].toLowerCase().replace(/\*+/g, '').trim();
        if (REDUNDANT_H2.has(heading)) {
          skip = true;
          continue;
        }
        skip = false;
      }
    }
    if (!skip) out.push(line);
  }
  return out.join('\n');
}

// Slugify used to build heading anchor ids.
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// Extract H2 (and optional H3) headings for the table of contents.
export function extractHeadings(content: string, includeH3 = false): Heading[] {
  const lines = content.split('\n');
  const out: Heading[] = [];
  let inFence = false;
  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*$/);
    if (!m) continue;
    const level = m[1].length as HeadingLevel;
    if (level === 3 && !includeH3) continue;
    const text = m[2].replace(/\*+/g, '').trim();
    if (
      text.toLowerCase().startsWith('table of contents') ||
      text.toLowerCase().startsWith('sources')
    ) {
      continue;
    }
    out.push({ id: slugifyHeading(text), text, level: level as HeadingLevel });
  }
  return out;
}

// Split the article body into blocks. Unknown fences fall through as markdown so
// authors can still write regular code blocks without breaking the page.
export function parseArticle(content: string): Block[] {
  const clean = cleanContent(content);
  const lines = clean.split('\n');
  const blocks: Block[] = [];
  let buffer: string[] = [];
  let inFence = false;
  let fenceLang = '';
  let fenceBody: string[] = [];

  const flushMarkdown = () => {
    const value = buffer.join('\n').trim();
    if (value) blocks.push({ type: 'markdown', value });
    buffer = [];
  };

  for (const line of lines) {
    if (!inFence && line.startsWith('```')) {
      const lang = line.slice(3).trim();
      if (KNOWN_LANGS.has(lang)) {
        flushMarkdown();
        inFence = true;
        fenceLang = lang;
        fenceBody = [];
        continue;
      }
      buffer.push(line);
      continue;
    }
    if (inFence && line.startsWith('```')) {
      const parsed = parseFence(fenceLang, fenceBody.join('\n'));
      if (parsed) blocks.push(parsed);
      inFence = false;
      fenceLang = '';
      fenceBody = [];
      continue;
    }
    if (inFence) {
      fenceBody.push(line);
      continue;
    }
    buffer.push(line);
  }
  flushMarkdown();
  return blocks;
}

function parseFence(lang: string, body: string): Block | null {
  const trimmed = body.trim();
  if (!trimmed) return null;
  try {
    switch (lang) {
      case 'takeaways':
        return { type: 'takeaways', items: parseBulletList(trimmed) };
      case 'checklist':
        return { type: 'checklist', items: parseBulletList(trimmed) };
      case 'warning':
        return { type: 'warning', value: trimmed };
      case 'taltake':
        return { type: 'taltake', value: trimmed };
      case 'example': {
        const data = JSON.parse(trimmed);
        return {
          type: 'example',
          title: data.title,
          assumptions: Array.isArray(data.assumptions) ? data.assumptions : [],
        };
      }
      case 'timeline': {
        const data = JSON.parse(trimmed);
        return { type: 'timeline', stages: Array.isArray(data.stages) ? data.stages : [] };
      }
      case 'table': {
        const data = JSON.parse(trimmed);
        return {
          type: 'table',
          caption: data.caption,
          headers: data.headers || [],
          align: data.align,
          rows: data.rows || [],
          totals: data.totals || [],
        };
      }
      case 'faq': {
        const data = JSON.parse(trimmed);
        return { type: 'faq', items: Array.isArray(data) ? data : [] };
      }
      case 'cta': {
        const data = JSON.parse(trimmed);
        return {
          type: 'cta',
          kind: data.kind || 'primary',
          heading: data.heading || '',
          body: data.body || '',
          buttons: Array.isArray(data.buttons) ? data.buttons : [],
        };
      }
      case 'sources': {
        const data = JSON.parse(trimmed);
        return { type: 'sources', items: Array.isArray(data) ? data : [] };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

function parseBulletList(body: string): string[] {
  return body
    .split('\n')
    .map((l) => l.replace(/^\s*[-*]\s+/, '').trim())
    .filter(Boolean);
}

export function readingTime(content: string): { minutes: number; label: string } {
  const words = content.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.round(words / 240));
  return { minutes, label: `${minutes} min read` };
}

// Extract the FAQ items from parsed blocks (used for FAQPage schema).
export function extractFaqSchemaItems(blocks: Block[]): { q: string; a: string }[] {
  const faq = blocks.find((b) => b.type === 'faq') as Extract<Block, { type: 'faq' }> | undefined;
  return faq?.items || [];
}
