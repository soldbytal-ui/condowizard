/**
 * Generate simplified 3D building models as .glb files.
 * Writes GLB binary format directly without three.js runtime.
 *
 * Usage: npx tsx scripts/generate-models.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^=\s#]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
}

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'models');

// ============================================================
// GLB Writer — writes valid glTF 2.0 binary format
// ============================================================

interface MeshData {
  positions: Float32Array;  // xyz vertex positions
  indices: Uint16Array;     // triangle indices
  color: [number, number, number, number]; // RGBA 0-1
}

function createBoxMesh(
  cx: number, cy: number, cz: number,
  sx: number, sy: number, sz: number,
  color: [number, number, number, number],
  rotY: number = 0
): MeshData {
  const hx = sx / 2, hy = sy / 2, hz = sz / 2;
  // 8 vertices of a box
  let verts = [
    [-hx, -hy, -hz], [hx, -hy, -hz], [hx, hy, -hz], [-hx, hy, -hz],
    [-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz],
  ];

  // Apply Y rotation
  if (rotY !== 0) {
    const cos = Math.cos(rotY);
    const sin = Math.sin(rotY);
    verts = verts.map(([x, y, z]) => [x * cos - z * sin, y, x * sin + z * cos]);
  }

  // Translate
  verts = verts.map(([x, y, z]) => [x + cx, y + cy, z + cz]);

  // 12 triangles (2 per face, 6 faces)
  const indices = [
    0,1,2, 0,2,3, // front
    4,6,5, 4,7,6, // back
    0,4,5, 0,5,1, // bottom
    2,6,7, 2,7,3, // top
    0,3,7, 0,7,4, // left
    1,5,6, 1,6,2, // right
  ];

  return {
    positions: new Float32Array(verts.flat()),
    indices: new Uint16Array(indices),
    color,
  };
}

function createCylinderMesh(
  cx: number, cy: number, cz: number,
  radius: number, height: number,
  segments: number,
  color: [number, number, number, number]
): MeshData {
  const positions: number[] = [];
  const indices: number[] = [];

  // Bottom center
  positions.push(cx, cy, cz);
  // Top center
  positions.push(cx, cy + height, cz);

  // Bottom ring + top ring
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = cx + radius * Math.cos(angle);
    const z = cz + radius * Math.sin(angle);
    positions.push(x, cy, z); // bottom vertex: index 2 + i
    positions.push(x, cy + height, z); // top vertex: index 2 + segments + i... wait
  }

  // Simpler approach: bottom ring starts at index 2, top ring at 2+segments
  // Actually let me redo:
  positions.length = 0;
  // 0: bottom center, 1: top center
  positions.push(cx, cy, cz);
  positions.push(cx, cy + height, cz);
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = cx + radius * Math.cos(angle);
    const z = cz + radius * Math.sin(angle);
    positions.push(x, cy, z);
  }
  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = cx + radius * Math.cos(angle);
    const z = cz + radius * Math.sin(angle);
    positions.push(x, cy + height, z);
  }

  // Bottom cap
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(0, 2 + next, 2 + i);
  }
  // Top cap
  const topStart = 2 + segments;
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    indices.push(1, topStart + i, topStart + next);
  }
  // Side
  for (let i = 0; i < segments; i++) {
    const next = (i + 1) % segments;
    const b0 = 2 + i, b1 = 2 + next;
    const t0 = topStart + i, t1 = topStart + next;
    indices.push(b0, b1, t1);
    indices.push(b0, t1, t0);
  }

  return {
    positions: new Float32Array(positions),
    indices: new Uint16Array(indices),
    color,
  };
}

function mergeMeshes(meshes: MeshData[]): MeshData {
  let totalVerts = 0;
  let totalIndices = 0;
  for (const m of meshes) {
    totalVerts += m.positions.length / 3;
    totalIndices += m.indices.length;
  }

  const positions = new Float32Array(totalVerts * 3);
  const indices = new Uint16Array(totalIndices);
  let vOffset = 0;
  let iOffset = 0;
  let vertCount = 0;

  for (const m of meshes) {
    positions.set(m.positions, vOffset);
    for (let i = 0; i < m.indices.length; i++) {
      indices[iOffset + i] = m.indices[i] + vertCount;
    }
    vOffset += m.positions.length;
    iOffset += m.indices.length;
    vertCount += m.positions.length / 3;
  }

  return { positions, indices, color: meshes[0].color };
}

function writeGLB(meshes: MeshData[]): Buffer {
  // Merge all meshes, using the primary color
  const merged = mergeMeshes(meshes);
  const color = meshes[0].color;

  // Create a minimal valid glTF 2.0 GLB
  const posBuffer = Buffer.from(merged.positions.buffer);
  const idxBuffer = Buffer.from(merged.indices.buffer);

  // Pad to 4-byte alignment
  const pad = (buf: Buffer) => {
    const remainder = buf.length % 4;
    if (remainder === 0) return buf;
    return Buffer.concat([buf, Buffer.alloc(4 - remainder)]);
  };

  const paddedPos = pad(posBuffer);
  const paddedIdx = pad(idxBuffer);
  const binBuffer = Buffer.concat([paddedIdx, paddedPos]);

  // Compute bounding box
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < merged.positions.length; i += 3) {
    minX = Math.min(minX, merged.positions[i]);
    maxX = Math.max(maxX, merged.positions[i]);
    minY = Math.min(minY, merged.positions[i + 1]);
    maxY = Math.max(maxY, merged.positions[i + 1]);
    minZ = Math.min(minZ, merged.positions[i + 2]);
    maxZ = Math.max(maxZ, merged.positions[i + 2]);
  }

  const gltf = {
    asset: { version: '2.0', generator: 'preconstructionmiami-modelgen' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{
      primitives: [{
        attributes: { POSITION: 1 },
        indices: 0,
        material: 0,
      }],
    }],
    materials: [{
      pbrMetallicRoughness: {
        baseColorFactor: color,
        metallicFactor: 0.7,
        roughnessFactor: 0.25,
      },
    }],
    accessors: [
      {
        bufferView: 0,
        componentType: 5123, // UNSIGNED_SHORT
        count: merged.indices.length,
        type: 'SCALAR',
        max: [Math.max(...Array.from(merged.indices))],
        min: [0],
      },
      {
        bufferView: 1,
        componentType: 5126, // FLOAT
        count: merged.positions.length / 3,
        type: 'VEC3',
        max: [maxX, maxY, maxZ],
        min: [minX, minY, minZ],
      },
    ],
    bufferViews: [
      {
        buffer: 0,
        byteOffset: 0,
        byteLength: paddedIdx.length,
        target: 34963, // ELEMENT_ARRAY_BUFFER
      },
      {
        buffer: 0,
        byteOffset: paddedIdx.length,
        byteLength: posBuffer.length,
        target: 34962, // ARRAY_BUFFER
      },
    ],
    buffers: [{
      byteLength: binBuffer.length,
    }],
  };

  const jsonStr = JSON.stringify(gltf);
  // Pad JSON to 4-byte alignment with spaces
  const jsonPadded = jsonStr + ' '.repeat((4 - (jsonStr.length % 4)) % 4);
  const jsonBuffer = Buffer.from(jsonPadded, 'utf-8');

  // GLB structure: 12-byte header + JSON chunk + BIN chunk
  const totalLength = 12 + 8 + jsonBuffer.length + 8 + binBuffer.length;
  const glb = Buffer.alloc(totalLength);
  let offset = 0;

  // Header
  glb.writeUInt32LE(0x46546C67, offset); offset += 4; // magic "glTF"
  glb.writeUInt32LE(2, offset); offset += 4;           // version
  glb.writeUInt32LE(totalLength, offset); offset += 4;  // total length

  // JSON chunk
  glb.writeUInt32LE(jsonBuffer.length, offset); offset += 4;
  glb.writeUInt32LE(0x4E4F534A, offset); offset += 4; // "JSON"
  jsonBuffer.copy(glb, offset); offset += jsonBuffer.length;

  // BIN chunk
  glb.writeUInt32LE(binBuffer.length, offset); offset += 4;
  glb.writeUInt32LE(0x004E4942, offset); offset += 4; // "BIN\0"
  binBuffer.copy(glb, offset);

  return glb;
}

// ============================================================
// Building Generators
// ============================================================

const GREEN: [number, number, number, number] = [0.0, 0.9, 0.7, 1.0];
const BLUE: [number, number, number, number] = [0.22, 0.71, 1.0, 1.0];
const SILVER: [number, number, number, number] = [0.75, 0.85, 0.94, 1.0];
const GOLD: [number, number, number, number] = [0.79, 0.66, 0.43, 1.0];

function buildWaldorf(): MeshData[] {
  // Twisting tower — stack of rotated boxes tapering toward top
  const meshes: MeshData[] = [];
  const floors = 25; // Simplified — 4 floors per box
  for (let i = 0; i < floors; i++) {
    const t = i / floors;
    const scale = 1 - t * 0.45;
    const w = 30 * scale, d = 20 * scale;
    const h = 16;
    const twist = t * 0.35;
    meshes.push(createBoxMesh(0, i * h + h / 2, 0, w, h * 0.92, d, BLUE, twist));
  }
  // Spire
  meshes.push(createCylinderMesh(0, 25 * 16, 0, 1.5, 30, 8, [1, 1, 1, 1]));
  return meshes;
}

function buildMercedes(): MeshData[] {
  // Stepped offset boxes
  return [
    createBoxMesh(0, 40, 0, 40, 80, 25, BLUE),
    createBoxMesh(3, 120, -2, 35, 80, 22, BLUE),
    createBoxMesh(-2, 190, 2, 30, 60, 20, BLUE),
    createBoxMesh(4, 245, -1, 25, 48, 18, BLUE),
    // Sky deck cantilever
    createBoxMesh(5, 160, 0, 50, 2, 30, SILVER),
  ];
}

function build888(): MeshData[] {
  // Slim supertall with crown
  const meshes: MeshData[] = [];
  meshes.push(createBoxMesh(0, 180, 0, 22, 360, 22, GOLD));
  // Tapered crown
  for (let i = 0; i < 5; i++) {
    const t = i / 5;
    const scale = 1 - t * 0.5;
    meshes.push(createBoxMesh(0, 360 + i * 5 + 2.5, 0, 22 * scale, 4, 22 * scale, GOLD));
  }
  // Gold spire
  meshes.push(createCylinderMesh(0, 385, 0, 1, 20, 6, GOLD));
  return meshes;
}

function buildBaccarat(): MeshData[] {
  // Faceted stepped tower
  const meshes: MeshData[] = [];
  meshes.push(createBoxMesh(0, 60, 0, 28, 120, 24, SILVER));
  meshes.push(createBoxMesh(0, 170, 0, 24, 100, 20, SILVER, 0.05));
  meshes.push(createBoxMesh(0, 264, 0, 18, 88, 16, SILVER, -0.03));
  // Crystal-like accent edges
  for (const [dx, dz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    meshes.push(createBoxMesh(dx * 14, 60, dz * 12, 2, 120, 2, [1, 1, 1, 1], Math.PI / 4));
  }
  return meshes;
}

function buildOra(): MeshData[] {
  // Curved facade approximated with angled slices
  const meshes: MeshData[] = [];
  const floors = 19; // 4 floors per slice
  for (let i = 0; i < floors; i++) {
    const t = i / floors;
    const scale = 1 - t * 0.15;
    const w = 28 * scale;
    const d = 18 * scale;
    const h = 16;
    // Slight curve by offsetting Z
    const curveZ = 3 * Math.sin(t * Math.PI);
    meshes.push(createBoxMesh(0, i * h + h / 2, curveZ, w, h * 0.9, d, GREEN));
  }
  return meshes;
}

// ============================================================
// Main
// ============================================================

interface BuildingDef {
  slug: string;
  filename: string;
  build: () => MeshData[];
}

const BUILDINGS: BuildingDef[] = [
  { slug: 'waldorf-astoria-residences-miami', filename: 'waldorf-astoria.glb', build: buildWaldorf },
  { slug: 'mercedes-benz-places-miami', filename: 'mercedes-benz.glb', build: buildMercedes },
  { slug: '888-brickell-by-dolce-and-gabbana', filename: '888-brickell.glb', build: build888 },
  { slug: 'baccarat-residences-miami', filename: 'baccarat.glb', build: buildBaccarat },
  { slug: 'ora-by-casa-tua', filename: 'ora-casa-tua.glb', build: buildOra },
];

async function main() {
  console.log('Generating 3D building models...\n');
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const building of BUILDINGS) {
    console.log(`Building: ${building.slug}`);
    const meshes = building.build();
    const glb = writeGLB(meshes);
    const outputPath = path.join(OUTPUT_DIR, building.filename);
    fs.writeFileSync(outputPath, glb);
    console.log(`  -> Saved ${building.filename} (${(glb.length / 1024).toFixed(1)} KB, ${meshes.length} meshes)`);

    // Update Supabase
    const modelUrl = `/models/${building.filename}`;
    const { error } = await supabase
      .from('projects')
      .update({ modelUrl })
      .eq('slug', building.slug);

    if (error) {
      console.log(`  -> DB error: ${error.message}`);
    } else {
      console.log(`  -> Updated DB: modelUrl = ${modelUrl}`);
    }
  }

  console.log('\nDone! All models generated.');
}

main().catch(console.error);
