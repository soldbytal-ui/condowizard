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

const FILL_PAINT = { 'fill-color': '#FBBF24', 'fill-opacity': 0.08 };
const LINE_PAINT = { 'line-color': '#FBBF24', 'line-width': 2, 'line-opacity': 0.6 };
const PIN_PAINT = { 'circle-radius': 7, 'circle-color': '#FBBF24', 'circle-stroke-width': 2, 'circle-stroke-color': '#ffffff', 'circle-opacity': 0.95 };

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

  const boundaryGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!boundary) return { type: 'FeatureCollection', features: [] };
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: boundary }, properties: {} }] };
  }, [boundary]);

  const pinsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.filter(p => p.lat && p.lng).map(p => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [p.lng, p.lat] },
      properties: { slug: p.slug, name: p.name },
    })),
  }), [projects]);

  const extrusionsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: projects.filter(p => p.lat && p.lng).map(p => {
      const s = 0.0003;
      return {
        type: 'Feature' as const,
        geometry: { type: 'Polygon' as const, coordinates: [[[p.lng-s,p.lat-s],[p.lng+s,p.lat-s],[p.lng+s,p.lat+s],[p.lng-s,p.lat+s],[p.lng-s,p.lat-s]]] },
        properties: { height: (p.floors || 5) * 3.5, name: p.name },
      };
    }),
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
        initialViewState={{ longitude: -79.38, latitude: 43.65, zoom: 13, pitch: 50, bearing: -15 }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        onClick={handleClick}
        interactiveLayerIds={['precon-pins']}
        cursor="pointer"
      >
        <NavigationControl position="top-right" showCompass={false} />

        <Source id="precon-boundary" type="geojson" data={boundaryGeoJSON}>
          <Layer id="precon-fill" type="fill" paint={FILL_PAINT} />
          <Layer id="precon-border" type="line" paint={LINE_PAINT} />
        </Source>

        <Source id="precon-extrusions" type="geojson" data={extrusionsGeoJSON}>
          <Layer id="precon-extrusion-layer" type="fill-extrusion" paint={{
            'fill-extrusion-color': '#FBBF24', 'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': 0, 'fill-extrusion-opacity': 0.6,
          }} />
        </Source>

        <Source id="precon-pins-src" type="geojson" data={pinsGeoJSON}>
          <Layer id="precon-pins" type="circle" paint={PIN_PAINT} />
          <Layer id="precon-labels" type="symbol" layout={{
            'text-field': ['get', 'name'], 'text-size': 10,
            'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
            'text-offset': [0, 1.2], 'text-anchor': 'top', 'text-optional': true,
          }} paint={{ 'text-color': '#FBBF24', 'text-halo-color': 'rgba(0,0,0,0.8)', 'text-halo-width': 1 }} minzoom={13} />
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
