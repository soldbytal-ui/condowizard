'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/mapbox';
import MapTooltip from './MapTooltip';
import MapPropertyCard from './MapPropertyCard';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const INITIAL_VIEW_STATE = {
  longitude: -79.3832,
  latitude: 43.6532,
  zoom: 12.5,
  pitch: 55,
  bearing: -15,
};

export type MapProject = {
  id: string;
  name: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  floors: number | null;
  totalUnits: number | null;
  priceMin: number | null;
  priceMax: number | null;
  status: string;
  category: string;
  address: string | null;
  developer: { name: string } | null;
  neighborhood: { name: string; slug: string } | null;
  estCompletion: string | null;
  description: string | null;
  mainImageUrl: string | null;
};

type HoverInfo = {
  x: number;
  y: number;
  object: MapProject;
} | null;

/** Generate a small circle polygon (8 sides) centered at lat/lng with given radius in meters */
function createCirclePoly(lat: number, lng: number, radiusM: number): GeoJSON.Polygon {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  const coords: [number, number][] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    coords.push([
      lng + (radiusM * Math.cos(angle)) / mPerDegLng,
      lat + (radiusM * Math.sin(angle)) / mPerDegLat,
    ]);
  }
  coords.push(coords[0]); // close
  return { type: 'Polygon', coordinates: [coords] };
}

function formatPrice(val: number | null) {
  if (!val) return '';
  if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
  return `$${(val / 1000).toFixed(0)}K`;
}

export default function TorontoMap({ projects }: { projects: MapProject[] }) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo>(null);
  const [selectedProject, setSelectedProject] = useState<MapProject | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [geojsonData, setGeojsonData] = useState<GeoJSON.FeatureCollection | null>(null);
  const mapRef = useRef<MapRef>(null);

  // Fetch building footprints from API
  useEffect(() => {
    fetch('/api/buildings-geojson')
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.type === 'FeatureCollection' && Array.isArray(data.features)) {
          console.log(`[TorontoMap] GeoJSON features: ${data.features.length}`);
          setGeojsonData(data);
        } else {
          console.warn('[TorontoMap] Invalid or empty GeoJSON response');
        }
      })
      .catch((err) => console.warn('[TorontoMap] Failed to load geojson:', err));
  }, []);

  const projectLookup = useRef<Record<string, MapProject>>({});
  useEffect(() => {
    const lookup: Record<string, MapProject> = {};
    for (const p of projects) lookup[p.id] = p;
    projectLookup.current = lookup;
  }, [projects]);

  // Build column markers GeoJSON — small circle polygons for each project
  const columnMarkersGeoJSON = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!geojsonData) return null;
    const features = geojsonData.features.map((f: any) => {
      const p = f.properties;
      return {
        type: 'Feature' as const,
        geometry: createCirclePoly(p.latitude, p.longitude, 10),
        properties: { ...p },
      };
    });
    return { type: 'FeatureCollection', features };
  }, [geojsonData]);

  // Build labels GeoJSON — point features for buildings
  const labelsGeoJSON = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!geojsonData) return null;
    const features = geojsonData.features
      .map((f: any) => {
        const p = f.properties;
        const label = p.priceMin
          ? `${p.name}\nFrom ${formatPrice(p.priceMin)}`
          : p.name;
        return {
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
          properties: { ...p, label },
        };
      });
    return { type: 'FeatureCollection', features };
  }, [geojsonData]);

  // Ground glow circles — flat circles at base
  const glowDotsGeoJSON = useMemo((): GeoJSON.FeatureCollection | null => {
    if (!geojsonData) return null;
    const features = geojsonData.features.map((f: any) => {
      const p = f.properties;
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [p.longitude, p.latitude] },
        properties: { id: p.id, status: p.status },
      };
    });
    return { type: 'FeatureCollection', features };
  }, [geojsonData]);

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const layers = map.getStyle()?.layers;
    if (!layers) return;
    const labelLayerId = layers.find(
      (layer: any) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

    // Dark city 3D buildings
    if (!map.getLayer('3d-buildings')) {
      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 12,
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#16181e', 50, '#1e2028', 100, '#252730', 200, '#2d3040'],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'height']],
          'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'min_height']],
          'fill-extrusion-opacity': 0.75,
        },
      }, labelLayerId);
    }
  }, []);

  const buildProjectFromProps = useCallback((props: any): MapProject => {
    return projectLookup.current[props.id] || {
      id: props.id, name: props.name, slug: props.slug,
      latitude: props.latitude, longitude: props.longitude,
      floors: props.floors, totalUnits: props.totalUnits,
      priceMin: props.priceMin, priceMax: props.priceMax,
      status: props.status, category: props.category,
      address: props.address,
      developer: props.developer ? { name: props.developer } : null,
      neighborhood: props.neighborhood ? { name: props.neighborhood, slug: props.neighborhoodSlug || '' } : null,
      estCompletion: props.estCompletion, description: props.description,
      mainImageUrl: props.mainImageUrl,
    };
  }, []);

  const onMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features;
    if (features && features.length > 0) {
      const props = features[0].properties;
      if (!props) return;
      setHoveredId(props.id);
      setHoverInfo({ x: e.point.x, y: e.point.y, object: buildProjectFromProps(props) });
    } else {
      setHoveredId(null);
      setHoverInfo(null);
    }
  }, [buildProjectFromProps]);

  const onMouseLeave = useCallback(() => {
    setHoveredId(null);
    setHoverInfo(null);
  }, []);

  const onBuildingClick = useCallback((e: MapLayerMouseEvent) => {
    const features = e.features;
    if (!features || features.length === 0) return;
    const props = features[0].properties;
    if (!props) return;
    setSelectedProject(buildProjectFromProps(props));
    setHoverInfo(null);
    setViewState((prev) => ({ ...prev, longitude: props.longitude, latitude: props.latitude, zoom: 15 }));
  }, [buildProjectFromProps]);

  // Color expressions
  const statusColor: any = [
    'match', ['get', 'status'],
    'PRE_LAUNCH', '#00E5B4', 'PRE_CONSTRUCTION', '#00E5B4',
    'UNDER_CONSTRUCTION', '#38B6FF', 'NEAR_COMPLETION', '#FF7A3D',
    'COMPLETED', '#8A9098', '#8A9098',
  ];

  const columnColor: any = hoveredId
    ? ['case', ['==', ['get', 'id'], hoveredId], '#ffffff', statusColor]
    : statusColor;

  const glowOpacity: any = hoveredId
    ? ['case', ['==', ['get', 'id'], hoveredId], 0.5, 0.12]
    : 0.12;

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={onMapLoad}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        onClick={onBuildingClick}
        interactiveLayerIds={columnMarkersGeoJSON ? ['column-markers', 'footprint-extrusions'] : []}
        cursor={hoveredId ? 'pointer' : 'grab'}
        reuseMaps
        attributionControl={false}
        pitch={viewState.pitch}
        bearing={viewState.bearing}
        scrollZoom={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {/* Building footprint extrusions */}
        {geojsonData && (
          <Source id="footprints" type="geojson" data={geojsonData}>
            <Layer
              id="footprint-glow"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': statusColor,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4.5],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': glowOpacity as any,
              }}
            />
            <Layer
              id="footprint-extrusions"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': columnColor,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* 3D column markers — small extruded circles at each project location */}
        {columnMarkersGeoJSON && (
          <Source id="column-markers-src" type="geojson" data={columnMarkersGeoJSON}>
            {/* Column glow — slightly larger, transparent */}
            <Layer
              id="column-glow"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': statusColor,
                'fill-extrusion-height': ['*', ['get', 'floors'], 3.8],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.15,
              }}
            />
            {/* Main columns */}
            <Layer
              id="column-markers"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': columnColor,
                'fill-extrusion-height': ['*', ['get', 'floors'], 3.5],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.95,
              }}
            />
          </Source>
        )}

        {/* Ground glow dots — flat circles at the base of each column */}
        {glowDotsGeoJSON && (
          <Source id="glow-dots-src" type="geojson" data={glowDotsGeoJSON}>
            <Layer
              id="glow-dots"
              type="circle"
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 6, 18, 12],
                'circle-color': statusColor,
                'circle-opacity': 0.6,
                'circle-blur': 0.8,
              }}
            />
            <Layer
              id="glow-dots-outer"
              type="circle"
              paint={{
                'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 14, 18, 25],
                'circle-color': statusColor,
                'circle-opacity': 0.15,
                'circle-blur': 1,
              }}
            />
          </Source>
        )}

        {/* Building labels — native Mapbox symbol layer */}
        {labelsGeoJSON && (
          <Source id="labels-src" type="geojson" data={labelsGeoJSON}>
            <Layer
              id="featured-labels"
              type="symbol"
              layout={{
                'text-field': ['get', 'label'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 14],
                'text-anchor': 'bottom',
                'text-offset': [0, -3],
                'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
                'text-max-width': 12,
                'text-allow-overlap': true,
              }}
              paint={{
                'text-color': '#F0EDE8',
                'text-halo-color': 'rgba(17, 19, 23, 0.9)',
                'text-halo-width': 2,
                'text-halo-blur': 1,
              }}
            />
          </Source>
        )}
      </Map>

      {hoverInfo && !selectedProject && <MapTooltip info={hoverInfo} />}

      {selectedProject && (
        <MapPropertyCard
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
        />
      )}
    </div>
  );
}
