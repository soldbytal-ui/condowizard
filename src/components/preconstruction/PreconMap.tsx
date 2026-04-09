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
}

const PIN_PAINT = {
  'circle-radius': ['case', ['boolean', ['feature-state', 'highlighted'], false], 9, 6],
  'circle-color': '#FBBF24',
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.95,
};

export default function PreconMap({ projects, highlightedSlug }: Props) {
  const mapRef = useRef<MapRef>(null);
  const [popup, setPopup] = useState<MapProject | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -79.3832, latitude: 43.6632, zoom: 12, pitch: 55, bearing: -15,
  });

  // Fly to highlighted project
  useEffect(() => {
    if (!highlightedSlug || !mapRef.current) return;
    const p = projects.find((pr) => pr.slug === highlightedSlug);
    if (p) {
      mapRef.current.getMap().flyTo({
        center: [p.lng, p.lat],
        zoom: 15,
        pitch: 60,
        duration: 1000,
      });
      setPopup(p);
    }
  }, [highlightedSlug, projects]);

  // GeoJSON for project pins
  const pinsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.map((p) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: { slug: p.slug, name: p.name, price: p.price, floors: p.floors, developer: p.developer, image: p.image },
    })),
  }), [projects]);

  // GeoJSON for 3D building extrusions (height based on floor count)
  const extrusionsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.map((p) => {
      // Create a small polygon around the point for extrusion
      const size = 0.0003; // ~30m
      return {
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [[
            [p.lng - size, p.lat - size], [p.lng + size, p.lat - size],
            [p.lng + size, p.lat + size], [p.lng - size, p.lat + size],
            [p.lng - size, p.lat - size],
          ]],
        },
        properties: { height: (p.floors || 5) * 3.5, name: p.name, slug: p.slug },
      };
    }),
  }), [projects]);

  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature?.properties?.slug) {
      window.open(`/properties/${feature.properties.slug}`, '_self');
    }
  }, []);

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
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPopup(null)}
      interactiveLayerIds={['precon-pins']}
      cursor={popup ? 'pointer' : 'grab'}
      mapboxAccessToken={MAPBOX_TOKEN}
      mapStyle="mapbox://styles/mapbox/dark-v11"
      style={{ width: '100%', height: '100%' }}
      attributionControl={false}
    >
      <NavigationControl position="top-right" />

      {/* 3D Building extrusions */}
      <Source id="precon-extrusions" type="geojson" data={extrusionsGeoJSON}>
        <Layer
          id="precon-extrusion-layer"
          type="fill-extrusion"
          paint={{
            'fill-extrusion-color': '#FBBF24',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.6,
          }}
        />
      </Source>

      {/* Project pins */}
      <Source id="precon-pins-source" type="geojson" data={pinsGeoJSON}>
        <Layer id="precon-pins" type="circle" paint={PIN_PAINT as any} />
        <Layer
          id="precon-labels" type="symbol"
          layout={{
            'text-field': ['get', 'name'],
            'text-size': 10,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-offset': [0, 1.2],
            'text-anchor': 'top',
            'text-optional': true,
          }}
          paint={{ 'text-color': '#FBBF24', 'text-halo-color': 'rgba(0,0,0,0.8)', 'text-halo-width': 1 }}
          minzoom={13}
        />
      </Source>

      {/* Popup */}
      {popup && (
        <Popup latitude={popup.lat} longitude={popup.lng} closeButton={false} closeOnClick={false} anchor="bottom" offset={15}>
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
