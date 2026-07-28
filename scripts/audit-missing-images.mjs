/**
 * Audit projects with no mainImageUrl and try to find images from
 * every source the scraper knows about (homebaba, precondo, gta-homes,
 * condos.ca, buzzbuzzhome, newinhomes, talkcondo).
 *
 * Runs 5 in parallel. Updates DB in place.
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

async function main() {
  const missing = await prisma.project.findMany({
    where: { mainImageUrl: null },
    select: { id: true, name: true, buildingType: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Auditing ${missing.length} projects with no image...\n`);

  const hits = [], misses = [];
  const CONCURRENCY = 5;

  for (let i = 0; i < missing.length; i += CONCURRENCY) {
    const batch = missing.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (p) => {
      const result = await findBestImage(p.name, null, null);
      if (result) {
        await prisma.project.update({
          where: { id: p.id },
          data: {
            mainImageUrl: result.mainImageUrl,
            images: { gallery: result.gallery },
          },
        });
        return { ok: true, id: p.id, name: p.name, buildingType: p.buildingType, url: result.mainImageUrl, source: result.sourceUrl };
      }
      return { ok: false, id: p.id, name: p.name, buildingType: p.buildingType };
    }));
    for (const r of results) {
      if (r.ok) {
        hits.push(r);
        process.stdout.write(`✓ [${r.buildingType}] ${r.name.padEnd(40)} ← ${new URL(r.source).hostname}\n`);
      } else {
        misses.push(r);
        process.stdout.write(`· [${r.buildingType}] ${r.name.padEnd(40)}   (still no image)\n`);
      }
    }
    process.stdout.write(`--- ${i + batch.length}/${missing.length} scanned. Hits: ${hits.length} | Misses: ${misses.length} ---\n`);
  }

  console.log(`\n════════════════════════════════`);
  console.log(`Hits:   ${hits.length}`);
  console.log(`Misses: ${misses.length}`);
  console.log(`Hit rate: ${Math.round(hits.length / missing.length * 100)}%`);

  const byType = { CONDO: { hit: 0, miss: 0 }, HOME: { hit: 0, miss: 0 } };
  hits.forEach(h => byType[h.buildingType].hit++);
  misses.forEach(m => byType[m.buildingType].miss++);
  console.log(`\nCONDO: ${byType.CONDO.hit} hit / ${byType.CONDO.miss} miss`);
  console.log(`HOME:  ${byType.HOME.hit} hit / ${byType.HOME.miss} miss`);

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
