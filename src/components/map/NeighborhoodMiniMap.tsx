'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import Map, { NavigationControl, Source, Layer, Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef, MapLayerMouseEvent } from 'react-map-gl/mapbox';
import Link from 'next/link';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

type MiniProject = {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  floors: number;
  status: string;
  priceMin: number | null;
};

export default function NeighborhoodMiniMap({
  center,
  neighborhoodName,
  neighborhoodId,
}: {
  center: [number, number];
  neighborhoodName: string;
  neighborhoodId: string;
}) {
  const mapRef = useRef<MapRef>(null);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [projects, setProjects] = useState<MiniProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<MiniProject | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/buildings-geojson')
      .then((res) => res.json())
      .then((data) => {
        setGeojsonData(data);
        const projs: MiniProject[] = [];
        for (const f of data.features || []) {
          const p = f.properties;
          if (p) {
            projs.push({
              id: p.id, name: p.name, slug: p.slug,
              latitude: p.latitude, longitude: p.longitude,
              floors: p.floors, status: p.status, priceMin: p.priceMin,
            });
          }
        }
        setProjects(projs);
      })
      .catch(console.error);
  }, [neighborhoodId]);

  const onLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    const layers = map.getStyle()?.layers;
    if (!layers) return;
    const labelLayerId = layers.find(
      (layer: any) => layer.type === 'symbol' && layer.layout?.['text-field']
    )?.id;

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

  const colorExpr: any = [
    'match', ['get', 'status'],
    'PRE_LAUNCH', '#00E5B4', 'PRE_CONSTRUCTION', '#00E5B4',
    'UNDER_CONSTRUCTION', '#38B6FF', 'NEAR_COMPLETION', '#FF7A3D',
    'COMPLETED', '#8A9098', '#8A9098',
  ];

  const onMapClick = useCallback((e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (f?.properties) {
      const p = f.properties;
      setSelectedProject({
        id: p.id, name: p.name, slug: p.slug,
        latitude: p.latitude, longitude: p.longitude,
        floors: p.floors, status: p.status, priceMin: p.priceMin,
      });
    } else {
      setSelectedProject(null);
    }
  }, []);

  const statusColor = (status: string) => {
    if (status === 'PRE_LAUNCH' || status === 'PRE_CONSTRUCTION') return '#00E5B4';
    if (status === 'UNDER_CONSTRUCTION') return '#38B6FF';
    if (status === 'NEAR_COMPLETION') return '#FF7A3D';
    return '#8A9098';
  };

  return (
    <div className="w-full h-[400px] rounded-2xl overflow-hidden border border-border relative">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center[1],
          latitude: center[0],
          zoom: 15,
          pitch: 55,
          bearing: -20,
        }}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        onLoad={onLoad}
        onClick={onMapClick}
        interactiveLayerIds={geojsonData ? ['mini-extrusions'] : []}
        attributionControl={false}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {geojsonData && (
          <Source id="mini-buildings" type="geojson" data={geojsonData}>
            <Layer
              id="mini-glow"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': colorExpr,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4.5],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.1,
              }}
            />
            <Layer
              id="mini-extrusions"
              type="fill-extrusion"
              paint={{
                'fill-extrusion-color': colorExpr,
                'fill-extrusion-height': ['*', ['get', 'floors'], 4],
                'fill-extrusion-base': 0,
                'fill-extrusion-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* Dot markers with larger click targets */}
        {projects.map((p) => (
          <Marker key={p.id} longitude={p.longitude} latitude={p.latitude} anchor="center">
            <div
              className="relative cursor-pointer flex items-center justify-center"
              style={{ width: 32, height: 32 }}
              onClick={(e) => { e.stopPropagation(); setSelectedProject(p); }}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <div
                className="mini-map-dot"
                style={{
                  background: statusColor(p.status),
                  boxShadow: `0 0 10px ${statusColor(p.status)}88`,
                  transform: hoveredId === p.id ? 'scale(1.4)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }}
              />
            </div>
          </Marker>
        ))}

        {/* Popup on click */}
        {selectedProject && (
          <Popup
            longitude={selectedProject.longitude}
            latitude={selectedProject.latitude}
            anchor="bottom"
            onClose={() => setSelectedProject(null)}
            closeButton={false}
            className="mini-map-popup"
          >
            <div className="p-3 min-w-[180px]">
              <h4 className="text-sm font-semibold text-text-primary leading-tight">{selectedProject.name}</h4>
              <p className="text-xs text-text-muted mt-1">
                {selectedProject.floors} floors
                {selectedProject.priceMin && selectedProject.priceMin >= 1000000
                  ? ` · From $${(selectedProject.priceMin / 1000000).toFixed(1)}M`
                  : selectedProject.priceMin ? ` · From $${(selectedProject.priceMin / 1000).toFixed(0)}K` : ''}
              </p>
              <Link
                href={`/properties/${selectedProject.slug}`}
                className="inline-block mt-2 text-xs text-accent-blue font-medium hover:underline"
              >
                View Listing &rarr;
              </Link>
            </div>
          </Popup>
        )}
      </Map>

      {/* Neighborhood overlay */}
      <div className="absolute bottom-4 left-4 glass-panel-dark rounded-lg px-4 py-2 pointer-events-none">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Explore</span>
        <h3 className="text-sm font-semibold text-white">{neighborhoodName}</h3>
      </div>

      <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-bg to-transparent pointer-events-none" />
    </div>
  );
}
