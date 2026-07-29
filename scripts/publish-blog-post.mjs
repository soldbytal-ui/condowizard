#!/usr/bin/env node
// Publish one or more blog posts from content/blog/*.md into Supabase blog_posts.
//
// Frontmatter format (YAML-lite, no external deps):
//
//   ---
//   slug: my-slug
//   title: Article title
//   metaTitle: SEO title 50-60 chars
//   metaDescription: 145-160 char meta description
//   targetKeyword: primary keyword
//   featuredImage: /images/blog/foo.webp   (optional)
//   author: Tal Shelef, Sales Representative, Rare Real Estate Inc., Brokerage
//   publishedAt: 2026-07-25
//   excerpt: One-sentence summary that appears on /blog cards.
//   ---
//
// Body is markdown. First H1 is stripped only if it duplicates the title.
//
// Usage:
//   node scripts/publish-blog-post.mjs [--all] [content/blog/file.md ...]

import fs from 'node:fs/promises';
import path from 'node:path';
import { Client } from 'pg';
import 'dotenv/config';

const REPO = path.resolve(new URL('..', import.meta.url).pathname);
const CONTENT_DIR = path.join(REPO, 'content', 'blog');

function parseFrontmatter(raw) {
  if (!raw.startsWith('---')) throw new Error('Missing YAML frontmatter');
  const end = raw.indexOf('\n---', 3);
  if (end === -1) throw new Error('Unterminated YAML frontmatter');
  const head = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const data = {};
  for (const line of head.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const m = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!m) throw new Error(`Bad frontmatter line: ${line}`);
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    data[m[1]] = value;
  }
  return { data, body };
}

async function loadFiles(argv) {
  const wantAll = argv.includes('--all');
  const explicit = argv.filter((a) => !a.startsWith('--'));
  if (wantAll || explicit.length === 0) {
    const entries = await fs.readdir(CONTENT_DIR);
    return entries.filter((f) => f.endsWith('.md')).map((f) => path.join(CONTENT_DIR, f));
  }
  return explicit.map((f) => path.resolve(f));
}

function requiredFields(data, file) {
  const required = ['slug', 'title', 'metaTitle', 'metaDescription', 'targetKeyword', 'author'];
  for (const key of required) {
    if (!data[key]) throw new Error(`${file}: frontmatter missing "${key}"`);
  }
  if (data.metaDescription.length < 140 || data.metaDescription.length > 165) {
    console.warn(
      `WARN ${file}: metaDescription length ${data.metaDescription.length} outside 140-165`,
    );
  }
  if (data.metaTitle.length < 45 || data.metaTitle.length > 65) {
    console.warn(
      `WARN ${file}: metaTitle length ${data.metaTitle.length} outside 45-65`,
    );
  }
}

async function main() {
  const argv = process.argv.slice(2);
  const files = await loadFiles(argv);
  if (!files.length) {
    console.error('No markdown files found under content/blog/. Nothing to publish.');
    process.exit(1);
  }

  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error('DIRECT_URL or DATABASE_URL required');

  const client = new Client({
    connectionString: url,
    ssl: url.includes('pooler.supabase') || url.includes('supabase.co')
      ? { rejectUnauthorized: false }
      : undefined,
  });
  await client.connect();

  try {
    for (const file of files) {
      const raw = await fs.readFile(file, 'utf8');
      const { data, body } = parseFrontmatter(raw);
      requiredFields(data, file);

      const id = data.slug;
      const publishedAt = data.publishedAt ? new Date(data.publishedAt).toISOString() : null;

      const res = await client.query(
        `INSERT INTO blog_posts
           (id, slug, title, content, excerpt, "metaTitle", "metaDescription",
            "targetKeyword", "featuredImage", "publishedAt", author, category, "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12, now(), now())
         ON CONFLICT (slug) DO UPDATE SET
           title = EXCLUDED.title,
           content = EXCLUDED.content,
           excerpt = EXCLUDED.excerpt,
           "metaTitle" = EXCLUDED."metaTitle",
           "metaDescription" = EXCLUDED."metaDescription",
           "targetKeyword" = EXCLUDED."targetKeyword",
           "featuredImage" = EXCLUDED."featuredImage",
           "publishedAt" = COALESCE(EXCLUDED."publishedAt", blog_posts."publishedAt"),
           author = EXCLUDED.author,
           category = COALESCE(EXCLUDED.category, blog_posts.category),
           "updatedAt" = now()
         RETURNING slug, "publishedAt"`,
        [
          id,
          data.slug,
          data.title,
          body,
          data.excerpt || null,
          data.metaTitle,
          data.metaDescription,
          data.targetKeyword,
          data.featuredImage || null,
          publishedAt,
          data.author,
          data.category || 'BUYER GUIDE',
        ],
      );
      const row = res.rows[0];
      console.log(
        `OK  ${data.slug}${row.publishedAt ? '  published=' + new Date(row.publishedAt).toISOString().slice(0, 10) : '  draft'}`,
      );
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
