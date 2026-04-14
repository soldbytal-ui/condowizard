'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import Map, { Popup, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface PreconProject {
  name: string;
  slug: string;
  lat: number;
  lng: number;
  floors: number | null;
  priceMin: number | null;
  developer: string | null;
  image: string | null;
}

interface Props {
  projects: PreconProject[];
  boundary: number[][][] | null;
  neighbourhoodName: string;
}

const FILL_PAINT = { 'fill-color': '#FBBF24', 'fill-opacity': 0.06 };
const LINE_PAINT = { 'line-color': '#FBBF24', 'line-width': 2, 'line-opacity': 0.5 };

function createBuildingFootprint(lat: number, lng: number, floors: number): number[][] {
  const baseSize = 0.00015;
  const sizeMultiplier = floors > 50 ? 2.5 : floors > 30 ? 2.0 : floors > 15 ? 1.5 : 1.0;
  const size = baseSize * sizeMultiplier;
  const aspect = 0.7;
  return [
    [lng - size, lat - size * aspect],
    [lng + size, lat - size * aspect],
    [lng + size, lat + size * aspect],
    [lng - size, lat + size * aspect],
    [lng - size, lat - size * aspect],
  ];
}

export default function PreconMiniMap({ projects, boundary, neighbourhoodName }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<PreconProject | null>(null);

  useEffect(() => {
    if (!mapRef.current || !boundary?.[0]?.length) return;
    const ring = boundary[0];
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    for (const [lng, lat] of ring) {
      if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
    }
    setTimeout(() => {
      mapRef.current?.getMap().fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 40, duration: 0 });
    }, 100);
  }, [boundary]);

  // Add 3D city buildings from Mapbox composite source
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const layers = map.getStyle().layers || [];
    const labelLayerId = layers.find((l: any) => l.type === 'symbol' && l.layout?.['text-field'])?.id;

    if (!map.getLayer('3d-buildings-mini')) {
      map.addLayer({
        id: '3d-buildings-mini',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 12,
        paint: {
          'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'height'], 0, '#16181e', 50, '#1e2028', 100, '#252730'],
          'fill-extrusion-height': ['get', 'height'],
          'fill-extrusion-base': ['get', 'min_height'],
          'fill-extrusion-opacity': 0.7,
        },
      }, labelLayerId);
    }
  }, []);

  const boundaryGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!boundary) return { type: 'FeatureCollection', features: [] };
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: boundary }, properties: {} }] };
  }, [boundary]);

  // Polygon footprints for 3D extrusion
  const buildingsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.filter(p => p.lat && p.lng).map(p => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Polygon' as const,
        coordinates: [createBuildingFootprint(p.lat, p.lng, p.floors || 20)],
      },
      properties: {
        height: (p.floors || 20) * 3.5,
        floors: p.floors || 20,
        name: p.name,
        slug: p.slug,
      },
    })),
  }), [projects]);

  // Separate point source for labels
  const pointsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.filter(p => p.lat && p.lng).map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: { name: p.name, slug: p.slug },
    })),
  }), [projects]);

  const handleClick = useCallback((e: any) => {
    const f = e.features?.[0];
    if (f?.properties?.slug) {
      const p = projects.find(pr => pr.slug === f.properties.slug);
      if (p) setPopup(p);
    }
  }, [projects]);

  if (projects.length === 0) return null;

  return (
    <div className="h-72 md:h-96 rounded-xl overflow-hidden border border-border">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -79.38, latitude: 43.65, zoom: 13, pitch: 55, bearing: -15 }}
        onLoad={handleLoad}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onClick={handleClick}
        interactiveLayerIds={['precon-3d-mini']}
        cursor="pointer"
      >
        <NavigationControl position="top-right" showCompass={false} />

        <Source id="precon-boundary" type="geojson" data={boundaryGeoJSON}>
          <Layer id="precon-fill" type="fill" paint={FILL_PAINT} />
          <Layer id="precon-border" type="line" paint={LINE_PAINT} />
        </Source>

        {/* 3D building extrusions */}
        <Source id="precon-buildings-mini" type="geojson" data={buildingsGeoJSON}>
          <Layer id="precon-glow-mini" type="fill-extrusion" paint={{
            'fill-extrusion-color': '#FBBF24',
            'fill-extrusion-height': ['*', ['get', 'height'], 1.15],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.12,
          }} />
          <Layer id="precon-3d-mini" type="fill-extrusion" paint={{
            'fill-extrusion-color': ['interpolate', ['linear'], ['get', 'floors'], 1, '#F59E0B', 15, '#FBBF24', 35, '#FCD34D', 60, '#FDE68A'],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.85,
          }} />
        </Source>

        {/* Labels on points */}
        <Source id="precon-points-mini" type="geojson" data={pointsGeoJSON}>
          <Layer id="precon-dot-mini" type="circle" paint={{
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 4, 16, 7],
            'circle-color': '#FBBF24', 'circle-opacity': 0.6, 'circle-blur': 0.4,
          }} />
          <Layer id="precon-labels-mini" type="symbol" layout={{
            'text-field': ['get', 'name'], 'text-size': 10,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-offset': [0, -2], 'text-anchor': 'bottom', 'text-optional': true,
          }} paint={{ 'text-color': '#FBBF24', 'text-halo-color': 'rgba(0,0,0,0.85)', 'text-halo-width': 1.2 }} minzoom={13} />
        </Source>

        {popup && (
          <Popup latitude={popup.lat} longitude={popup.lng} closeButton closeOnClick={false} anchor="bottom" offset={12} onClose={() => setPopup(null)}>
            <div className="min-w-[200px] bg-gray-900 text-white rounded-lg overflow-hidden">
              {popup.image && <img src={popup.image} alt={popup.name} className="w-full h-28 object-cover" />}
              <div className="p-2">
                <p className="font-semibold text-sm">{popup.name}</p>
                {popup.developer && <p className="text-xs text-gray-400">{popup.developer}</p>}
                <p className="font-serif font-bold text-sm mt-1 text-yellow-400">{popup.priceMin ? `From $${popup.priceMin.toLocaleString()}` : 'Contact for pricing'}</p>
                {popup.floors && <p className="text-xs text-gray-400">{popup.floors} floors</p>}
                <a href={`/properties/${popup.slug}`} className="block mt-2 text-center text-xs font-medium text-yellow-400 hover:underline">View Project &rarr;</a>
              </div>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
