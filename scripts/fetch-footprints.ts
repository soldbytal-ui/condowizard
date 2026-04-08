/**
 * Fetch building footprints from OpenStreetMap Overpass API
 * and save as GeoJSON polygons in Supabase projects.footprint column.
 *
 * Usage: npx tsx scripts/fetch-footprints.ts
 */

import * as fs from "fs";
import * as path from "path";

// Load .env manually
const envPath = path.resolve(process.cwd(), ".env");
const envContent = fs.readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const match = line.match(/^([^=\s#]+)=(.*)$/);
  if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Pre-defined footprints for buildings that won't have OSM data (pre-construction)
const MANUAL_FOOTPRINTS: Record<
  string,
  { width: number; height: number; rotation: number }
> = {
  "waldorf-astoria-residences-miami": { width: 60, height: 40, rotation: -20 },
  "waldorf-astoria-pompano-beach": { width: 60, height: 40, rotation: -20 },
  "mercedes-benz-places-miami": { width: 80, height: 35, rotation: -25 },
  "888-brickell-by-dolce-and-gabbana": { width: 45, height: 35, rotation: -20 },
  "baccarat-residences-miami": { width: 50, height: 40, rotation: -15 },
  "ora-by-casa-tua": { width: 55, height: 35, rotation: -20 },
};

// Default rectangular footprint for fallback
const DEFAULT_FOOTPRINT = { width: 30, height: 20, rotation: -20 };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a rectangular GeoJSON polygon centered on lat/lng
 * with given dimensions in meters and rotation in degrees.
 */
function generateRectFootprint(
  lat: number,
  lng: number,
  widthM: number,
  heightM: number,
  rotationDeg: number
): GeoJSON.Polygon {
  // Convert meters to approximate degrees
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);

  const halfW = widthM / 2 / mPerDegLng;
  const halfH = heightM / 2 / mPerDegLat;

  // Corners before rotation (relative to center)
  const corners = [
    [-halfW, -halfH],
    [halfW, -halfH],
    [halfW, halfH],
    [-halfW, halfH],
  ];

  // Rotate
  const rad = (rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  const rotated = corners.map(([dx, dy]) => [
    lng + dx * cosR - dy * sinR,
    lat + dx * sinR + dy * cosR,
  ]);

  // Close the polygon
  rotated.push(rotated[0]);

  return {
    type: "Polygon",
    coordinates: [rotated],
  };
}

/**
 * Query Overpass API for the nearest building footprint polygon
 */
async function fetchOSMFootprint(
  lat: number,
  lng: number
): Promise<GeoJSON.Polygon | null> {
  const query = `[out:json][timeout:10];way["building"](around:50,${lat},${lng});out body;>;out skel qt;`;

  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      console.log(`    Overpass HTTP ${res.status}`);
      return null;
    }

    const data = await res.json();

    // Build node lookup
    const nodes: Record<number, [number, number]> = {};
    for (const el of data.elements) {
      if (el.type === "node") {
        nodes[el.id] = [el.lon, el.lat];
      }
    }

    // Find the first way with enough nodes
    for (const el of data.elements) {
      if (el.type === "way" && el.nodes && el.nodes.length >= 4) {
        const coords: [number, number][] = [];
        let valid = true;
        for (const nodeId of el.nodes) {
          if (nodes[nodeId]) {
            coords.push(nodes[nodeId]);
          } else {
            valid = false;
            break;
          }
        }
        if (valid && coords.length >= 4) {
          // Ensure polygon is closed
          if (
            coords[0][0] !== coords[coords.length - 1][0] ||
            coords[0][1] !== coords[coords.length - 1][1]
          ) {
            coords.push(coords[0]);
          }
          return {
            type: "Polygon",
            coordinates: [coords],
          };
        }
      }
    }

    return null;
  } catch (err) {
    console.log(`    Overpass error: ${err}`);
    return null;
  }
}

async function main() {
  console.log("Fetching projects with coordinates from Supabase...");

  const { data: projects, error } = await supabase
    .from("projects")
    .select("id, name, slug, latitude, longitude, floors, status, category")
    .not("latitude", "is", null)
    .not("longitude", "is", null);

  if (error) {
    console.error("Failed to fetch projects:", error);
    process.exit(1);
  }

  console.log(`Found ${projects.length} projects with coordinates\n`);

  let osmHits = 0;
  let manualHits = 0;
  let fallbackHits = 0;

  for (const project of projects) {
    console.log(`Processing: ${project.name} (${project.slug})`);
    console.log(`  Coords: ${project.latitude}, ${project.longitude}`);

    let footprint: GeoJSON.Polygon;

    // Check if we have a manual footprint definition
    if (MANUAL_FOOTPRINTS[project.slug]) {
      const { width, height, rotation } = MANUAL_FOOTPRINTS[project.slug];
      console.log(
        `  Using manual footprint: ${width}m x ${height}m @ ${rotation}°`
      );
      footprint = generateRectFootprint(
        project.latitude,
        project.longitude,
        width,
        height,
        rotation
      );
      manualHits++;
    } else {
      // Try Overpass API
      console.log("  Querying Overpass API...");
      const osmFootprint = await fetchOSMFootprint(
        project.latitude,
        project.longitude
      );

      if (osmFootprint) {
        console.log(
          `  OSM footprint found (${osmFootprint.coordinates[0].length} points)`
        );
        footprint = osmFootprint;
        osmHits++;
      } else {
        // Fallback to default rectangle
        console.log("  No OSM match, using default rectangle");
        const { width, height, rotation } = DEFAULT_FOOTPRINT;
        footprint = generateRectFootprint(
          project.latitude,
          project.longitude,
          width,
          height,
          rotation
        );
        fallbackHits++;
      }

      // Rate limit: 1 request per second for Overpass
      await sleep(1100);
    }

    // Save to Supabase
    const { error: updateError } = await supabase
      .from("projects")
      .update({ footprint })
      .eq("id", project.id);

    if (updateError) {
      console.log(`  ERROR saving: ${updateError.message}`);
    } else {
      console.log("  Saved to Supabase\n");
    }
  }

  console.log("=".repeat(50));
  console.log(`Done!`);
  console.log(`  OSM footprints: ${osmHits}`);
  console.log(`  Manual footprints: ${manualHits}`);
  console.log(`  Fallback rectangles: ${fallbackHits}`);
  console.log(`  Total: ${projects.length}`);
}

main().catch(console.error);
