/**
 * Scrape/re-scrape OG images for imported Toronto pre-con projects.
 * Uses shared logic from scrape-precon-images-lib.mjs.
 *
 * Usage:
 *   node scripts/scrape-precon-images.mjs                → all missing
 *   node scripts/scrape-precon-images.mjs --force        → re-scrape even if set
 *   node scripts/scrape-precon-images.mjs --limit=10
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { findBestImage } from './scrape-precon-images-lib.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(function loadEnv() {
  const text = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
})();

const prisma = new PrismaClient();
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const LIMIT = args.limit ? parseInt(args.limit, 10) : 999;
const FORCE = !!args.force;

function parseCsv(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++;
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      field += c; i++;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map((h) => h.trim());
  return rows.filter(r => r.some(v => v && v.trim())).map((r) => Object.fromEntries(header.map((h, idx) => [h, (r[idx] || '').trim()])));
}

async function main() {
  const csvPath = path.join(process.env.HOME, 'Desktop/toronto_precon_100_v2 - Toronto Precon 100.csv');
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));

  const projects = await prisma.project.findMany({ orderBy: { createdAt: 'asc' }, take: LIMIT });
  console.log(`Scanning ${projects.length} projects for images...\n`);

  const hits = [], misses = [];
  for (const p of projects) {
    if (p.mainImageUrl && !FORCE) {
      console.log(`  · [skip] ${p.name} already has image`);
      continue;
    }

    const cleanProjName = p.name.toLowerCase();
    const csvRow = rows.find(r => {
      const csv = r['Project Name'].toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
      return csv === cleanProjName || cleanProjName.startsWith(csv) || csv.startsWith(cleanProjName);
    });
    if (!csvRow) { console.log(`  ? [no CSV] ${p.name}`); continue; }

    process.stdout.write(`  → ${p.name} ... `);
    const result = await findBestImage(p.name, csvRow['Source'], csvRow['Website']);
    if (result) {
      await prisma.project.update({
        where: { id: p.id },
        data: { mainImageUrl: result.mainImageUrl, images: { gallery: result.allImages } },
      });
      hits.push({ name: p.name, url: result.mainImageUrl, source: result.sourceUrl });
      console.log(`✓ ${new URL(result.sourceUrl).hostname}`);
    } else {
      misses.push(p.name);
      console.log('✗ no image found');
    }
    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n── Image scrape summary ──`);
  console.log(`Hits:   ${hits.length}`);
  console.log(`Misses: ${misses.length}`);
  if (misses.length) console.log('Missing:', misses.join(', '));

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
