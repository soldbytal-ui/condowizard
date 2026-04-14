'use client';

import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import Map, { Popup, NavigationControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapProject {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  floors: number;
  price: number | null;
  image: string | null;
  developer: string | null;
}

interface Props {
  projects: MapProject[];
  highlightedSlug: string | null;
  onHighlight?: (slug: string | null) => void;
}

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

export default function PreconMap({ projects, highlightedSlug, onHighlight }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<MapProject | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -79.3832, latitude: 43.6632, zoom: 12, pitch: 55, bearing: -15,
  });

  // Add 3D city buildings from Mapbox composite source on map load
  const handleLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const layers = map.getStyle().layers || [];
    const labelLayerId = layers.find((l: any) => l.type === 'symbol' && l.layout?.['text-field'])?.id;

    if (!map.getLayer('3d-buildings')) {
      map.addLayer({
        id: '3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 12,
        paint: {
          'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'height'],
            0, '#16181e', 50, '#1e2028', 100, '#252730', 200, '#2d3040',
          ],
          'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'height']],
          'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 12, 0, 12.5, ['get', 'min_height']],
          'fill-extrusion-opacity': 0.7,
        },
      }, labelLayerId);
    }
  }, []);

  // Fly to highlighted project
  useEffect(() => {
    if (!highlightedSlug || !mapRef.current) return;
    const p = projects.find((pr) => pr.slug === highlightedSlug);
    if (p) {
      mapRef.current.getMap().flyTo({ center: [p.lng, p.lat], zoom: 15, pitch: 60, duration: 1000 });
      setPopup(p);
    }
  }, [highlightedSlug, projects]);

  // Polygon footprints for fill-extrusion (height by floor count)
  const buildingsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.filter(p => p.lat && p.lng).map((p) => ({
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
        price: p.price || 0,
        developer: p.developer || '',
      },
    })),
  }), [projects]);

  // Separate point source for labels and glow dots (symbol layers need Points)
  const pointsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.filter(p => p.lat && p.lng).map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: { name: p.name, slug: p.slug, floors: p.floors || 20, price: p.price || 0 },
    })),
  }), [projects]);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature?.properties?.slug) {
      const slug = feature.properties.slug;
      const p = projects.find((pr) => pr.slug === slug);
      if (p) { setPopup(p); onHighlight?.(slug); }
    }
  }, [projects, onHighlight]);

  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature?.properties?.slug) {
      const p = projects.find((pr) => pr.slug === feature.properties!.slug);
      setPopup(p || null);
    } else {
      setPopup(null);
    }
  }, [projects]);

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onLoad={handleLoad}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPopup(null)}
      interactiveLayerIds={['precon-3d']}
      cursor={popup ? 'pointer' : 'grab'}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* 3D building extrusions — polygon footprints with height */}
      <Source id="precon-buildings" type="geojson" data={buildingsGeoJSON}>
        {/* Glow base layer */}
        <Layer
          id="precon-glow"
          type="fill-extrusion"
          paint={{
            'fill-extrusion-color': '#FBBF24',
            'fill-extrusion-height': ['*', ['get', 'height'], 1.15],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.12,
          }}
        />
        {/* Main 3D columns */}
        <Layer
          id="precon-3d"
          type="fill-extrusion"
          paint={{
            'fill-extrusion-color': [
              'interpolate', ['linear'], ['get', 'floors'],
              1, '#F59E0B',
              15, '#FBBF24',
              35, '#FCD34D',
              60, '#FDE68A',
            ],
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.85,
          }}
        />
      </Source>

      {/* Labels and glow dots — separate Point source */}
      <Source id="precon-points" type="geojson" data={pointsGeoJSON}>
        {/* Glow dot at base */}
        <Layer
          id="precon-dot"
          type="circle"
          paint={{
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 2, 14, 5, 16, 8],
            'circle-color': '#FBBF24',
            'circle-opacity': 0.6,
            'circle-blur': 0.4,
          }}
        />
        {/* Name labels */}
        <Layer
          id="precon-labels"
          type="symbol"
          layout={{
            'text-field': ['get', 'name'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 15, 12],
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-offset': [0, -2],
            'text-anchor': 'bottom',
            'text-allow-overlap': false,
            'text-optional': true,
          }}
          paint={{
            'text-color': '#FBBF24',
            'text-halo-color': 'rgba(0,0,0,0.85)',
            'text-halo-width': 1.2,
          }}
          minzoom={13}
        />
      </Source>

      {/* Popup */}
      {popup && (
        <Popup latitude={popup.lat} longitude={popup.lng} closeButton={false} closeOnClick={false} anchor="bottom" offset={20}>
          <div className="min-w-[220px]">
            {popup.image && <img src={popup.image} alt={popup.name} className="w-full h-28 object-cover rounded-t" />}
            <div className="p-2">
              <p className="font-semibold text-sm">{popup.name}</p>
              {popup.developer && <p className="text-xs text-gray-500">{popup.developer}</p>}
              <p className="font-serif font-bold text-sm mt-1">{popup.price ? `From $${popup.price.toLocaleString()}` : 'Contact for pricing'}</p>
              {popup.floors > 0 && <p className="text-xs text-gray-500">{popup.floors} floors</p>}
              <a href={`/properties/${popup.slug}`} className="block mt-2 text-center text-xs font-medium text-accent-blue hover:underline">View Project &rarr;</a>
            </div>
          </div>
        </Popup>
      )}
    </Map>
  );
}
