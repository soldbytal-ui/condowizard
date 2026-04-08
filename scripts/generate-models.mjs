/**
 * Generate simplified 3D building models as .glb files.
 * Pure Node.js — no three.js, no tsx.
 *
 * Usage: node scripts/generate-models.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=\s#]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OUTPUT_DIR = path.resolve(__dirname, '..', 'public', 'models');
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ============================================================
// Geometry helpers
// ============================================================

function createBox(cx, cy, cz, sx, sy, sz, rotY = 0) {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  let verts = [
    [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
    [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
  ];
  if (rotY !== 0) {
    const c = Math.cos(rotY), s = Math.sin(rotY);
    verts = verts.map(([x, y, z]) => [x * c - z * s, y, x * s + z * c]);
  }
  verts = verts.map(([x, y, z]) => [x + cx, y + cy, z + cz]);
  const idx = [0,1,2, 0,2,3, 4,6,5, 4,7,6, 0,4,5, 0,5,1, 2,6,7, 2,7,3, 0,3,7, 0,7,4, 1,5,6, 1,6,2];
  return { positions: verts.flat(), indices: idx };
}

function createCylinder(cx, cy, cz, radius, height, segments) {
  const positions = [cx, cy, cz, cx, cy + height, cz];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions.push(cx + radius * Math.cos(a), cy, cz + radius * Math.sin(a));
  }
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    positions.push(cx + radius * Math.cos(a), cy + height, cz + radius * Math.sin(a));
  }
  const indices = [];
  for (let i = 0; i < segments; i++) {
    indices.push(0, 2 + ((i + 1) % segments), 2 + i);
  }
  const ts = 2 + segments;
  for (let i = 0; i < segments; i++) {
    indices.push(1, ts + i, ts + ((i + 1) % segments));
  }
  for (let i = 0; i < segments; i++) {
    const n = (i + 1) % segments;
    indices.push(2 + i, 2 + n, ts + n, 2 + i, ts + n, ts + i);
  }
  return { positions, indices };
}

function mergeMeshes(meshes) {
  const allPos = [];
  const allIdx = [];
  let vertOffset = 0;
  for (const m of meshes) {
    allPos.push(...m.positions);
    for (const idx of m.indices) allIdx.push(idx + vertOffset);
    vertOffset += m.positions.length / 3;
  }
  return { positions: allPos, indices: allIdx };
}

// ============================================================
// GLB Writer
// ============================================================

function writeGLB(merged, color) {
  const positions = new Float32Array(merged.positions);
  const indices = new Uint16Array(merged.indices);

  const posBuf = Buffer.from(positions.buffer);
  const idxBuf = Buffer.from(indices.buffer);

  // Pad to 4 bytes
  const padBuf = (b) => {
    const r = b.length % 4;
    return r === 0 ? b : Buffer.concat([b, Buffer.alloc(4 - r)]);
  };
  const paddedIdx = padBuf(idxBuf);
  const binBuffer = Buffer.concat([paddedIdx, posBuf]);

  // Bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < positions.length; i += 3) {
    minX = Math.min(minX, positions[i]); maxX = Math.max(maxX, positions[i]);
    minY = Math.min(minY, positions[i+1]); maxY = Math.max(maxY, positions[i+1]);
    minZ = Math.min(minZ, positions[i+2]); maxZ = Math.max(maxZ, positions[i+2]);
  }

  let maxIdx = 0;
  for (const i of indices) if (i > maxIdx) maxIdx = i;

  const gltf = {
    asset: { version: '2.0', generator: 'pcm-modelgen' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 1 }, indices: 0, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: color, metallicFactor: 0.7, roughnessFactor: 0.25 } }],
    accessors: [
      { bufferView: 0, componentType: 5123, count: indices.length, type: 'SCALAR', max: [maxIdx], min: [0] },
      { bufferView: 1, componentType: 5126, count: positions.length / 3, type: 'VEC3', max: [maxX, maxY, maxZ], min: [minX, minY, minZ] },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: paddedIdx.length, target: 34963 },
      { buffer: 0, byteOffset: paddedIdx.length, byteLength: posBuf.length, target: 34962 },
    ],
    buffers: [{ byteLength: binBuffer.length }],
  };

  const jsonStr = JSON.stringify(gltf);
  const jsonPad = jsonStr + ' '.repeat((4 - (jsonStr.length % 4)) % 4);
  const jsonBuf = Buffer.from(jsonPad, 'utf-8');

  const total = 12 + 8 + jsonBuf.length + 8 + binBuffer.length;
  const glb = Buffer.alloc(total);
  let off = 0;
  glb.writeUInt32LE(0x46546C67, off); off += 4;
  glb.writeUInt32LE(2, off); off += 4;
  glb.writeUInt32LE(total, off); off += 4;
  glb.writeUInt32LE(jsonBuf.length, off); off += 4;
  glb.writeUInt32LE(0x4E4F534A, off); off += 4;
  jsonBuf.copy(glb, off); off += jsonBuf.length;
  glb.writeUInt32LE(binBuffer.length, off); off += 4;
  glb.writeUInt32LE(0x004E4942, off); off += 4;
  binBuffer.copy(glb, off);
  return glb;
}

// ============================================================
// Building designs
// ============================================================

function buildWaldorf() {
  const meshes = [];
  for (let i = 0; i < 25; i++) {
    const t = i / 25;
    const s = 1 - t * 0.45;
    meshes.push(createBox(0, i * 16 + 8, 0, 30 * s, 15.5, 20 * s, t * 0.35));
  }
  meshes.push(createCylinder(0, 400, 0, 1.5, 30, 8));
  return { meshes, color: [0.22, 0.71, 1.0, 1.0] };
}

function buildMercedes() {
  const meshes = [
    createBox(0, 40, 0, 40, 80, 25),
    createBox(3, 120, -2, 35, 80, 22),
    createBox(-2, 190, 2, 30, 60, 20),
    createBox(4, 245, -1, 25, 48, 18),
    createBox(5, 160, 0, 50, 2, 30),
  ];
  return { meshes, color: [0.22, 0.71, 1.0, 1.0] };
}

function build888() {
  const meshes = [createBox(0, 180, 0, 22, 360, 22)];
  for (let i = 0; i < 5; i++) {
    const s = 1 - (i / 5) * 0.5;
    meshes.push(createBox(0, 360 + i * 5 + 2.5, 0, 22 * s, 4, 22 * s));
  }
  meshes.push(createCylinder(0, 385, 0, 1, 20, 6));
  return { meshes, color: [0.79, 0.66, 0.43, 1.0] };
}

function buildBaccarat() {
  const meshes = [
    createBox(0, 60, 0, 28, 120, 24),
    createBox(0, 170, 0, 24, 100, 20, 0.05),
    createBox(0, 264, 0, 18, 88, 16, -0.03),
  ];
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    meshes.push(createBox(dx * 14, 60, dz * 12, 2, 120, 2, Math.PI / 4));
  }
  return { meshes, color: [0.75, 0.85, 0.94, 1.0] };
}

function buildOra() {
  const meshes = [];
  for (let i = 0; i < 19; i++) {
    const t = i / 19;
    const s = 1 - t * 0.15;
    const curveZ = 3 * Math.sin(t * Math.PI);
    meshes.push(createBox(0, i * 16 + 8, curveZ, 28 * s, 15, 18 * s));
  }
  return { meshes, color: [0.0, 0.9, 0.7, 1.0] };
}

// ============================================================
// Main
// ============================================================

const BUILDINGS = [
  { slug: 'waldorf-astoria-residences-miami', filename: 'waldorf-astoria.glb', ...buildWaldorf() },
  { slug: 'mercedes-benz-places-miami', filename: 'mercedes-benz.glb', ...buildMercedes() },
  { slug: '888-brickell-by-dolce-and-gabbana', filename: '888-brickell.glb', ...build888() },
  { slug: 'baccarat-residences-miami', filename: 'baccarat.glb', ...buildBaccarat() },
  { slug: 'ora-by-casa-tua', filename: 'ora-casa-tua.glb', ...buildOra() },
];

for (const b of BUILDINGS) {
  console.log(`Building: ${b.slug}`);
  const merged = mergeMeshes(b.meshes);
  const glb = writeGLB(merged, b.color);
  const outPath = path.join(OUTPUT_DIR, b.filename);
  fs.writeFileSync(outPath, glb);
  console.log(`  -> ${b.filename} (${(glb.length / 1024).toFixed(1)} KB)`);

  const modelUrl = `/models/${b.filename}`;
  const { error } = await supabase.from('projects').update({ modelUrl }).eq('slug', b.slug);
  if (error) console.log(`  -> DB error: ${error.message}`);
  else console.log(`  -> DB updated: modelUrl = ${modelUrl}`);
}

console.log('\nDone!');
