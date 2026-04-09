'use client';

import { useRef, useCallback, useState, useEffect, useMemo } from 'react';
import Map, { Popup, NavigationControl, FullscreenControl, Source, Layer } from 'react-map-gl/mapbox';
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/mapbox';
import { UnifiedListing, BUILDING_TYPE_COLORS } from '@/types/listing';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';
const SOLD_PIN_COLOR = '#9CA3AF';

interface CommunityBoundary {
  name: string;
  boundary: number[][][];
  lat: number;
  lng: number;
}

interface SearchMapProps {
  listings: UnifiedListing[];
  highlightedId: string | null;
  onMarkerHover: (id: string | null) => void;
  onBoundsChange?: (bounds: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } }) => void;
  isSoldView?: boolean;
  onCommunityClick?: (code: string, name: string) => void;
  selectedNeighbourhood?: string;
}

// Static paint constants — stable references prevent layer re-creation
const BASE_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.05 };
const BASE_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 1.5, 'line-opacity': 0.35 };
const HOVER_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.18 };
const HOVER_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 2.5, 'line-opacity': 0.7 };
const SELECTED_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.25 };
const SELECTED_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 3, 'line-opacity': 0.9 };

// Listing circle layer paint — static, uses data-driven 'color' property
const CIRCLE_PAINT = {
  'circle-radius': 5,
  'circle-color': ['get', 'color'],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.9,
};

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange, isSoldView, onCommunityClick, selectedNeighbourhood }: SearchMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [boundaries, setBoundaries] = useState<CommunityBoundary[]>([]);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);
  const [communityTooltip, setCommunityTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [popupListing, setPopupListing] = useState<UnifiedListing | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -79.3832, latitude: 43.6832, zoom: 11.5, pitch: 40, bearing: -10,
  });

  // Fetch boundaries once
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/repliers/communities');
        if (!res.ok) return;
        const data = await res.json();
        const locs: CommunityBoundary[] = (data.locations || []).filter(
          (c: any) => c.boundary?.[0]?.length >= 3
        );
        setBoundaries(locs);
        console.log(`[Map] ${locs.length} communities loaded`);
      } catch (err) {
        console.error('[Map] Failed to load communities:', err);
      }
    })();
  }, []);

  // ===== GeoJSON sources (all useMemo for stable references) =====

  const boundariesGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaries.map((b, i) => ({
      type: 'Feature' as const, id: i,
      geometry: { type: 'Polygon' as const, coordinates: b.boundary },
      properties: { name: b.name },
    })),
  }), [boundaries]);

  const labelsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: boundaries.filter((b) => b.lat && b.lng).map((b) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [b.lng, b.lat] },
      properties: { name: b.name },
    })),
  }), [boundaries]);

  const hoverGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!hoveredCommunity) return { type: 'FeatureCollection', features: [] };
    const b = boundaries.find((c) => c.name === hoveredCommunity);
    if (!b) return { type: 'FeatureCollection', features: [] };
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: b.boundary }, properties: { name: b.name } }] };
  }, [hoveredCommunity, boundaries]);

  const selectedGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    if (!selectedNeighbourhood) return { type: 'FeatureCollection', features: [] };
    const b = boundaries.find((c) => c.name === selectedNeighbourhood);
    if (!b) return { type: 'FeatureCollection', features: [] };
    return { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: b.boundary }, properties: { name: b.name } }] };
  }, [selectedNeighbourhood, boundaries]);

  // Listing pins as GeoJSON circle layer — NO HTML Markers blocking clicks
  const listingsGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: listings.filter((l) => l.lat && l.lng).map((l) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [l.lng, l.lat] },
      properties: {
        id: l.id,
        color: (isSoldView || l.soldPrice) ? SOLD_PIN_COLOR
          : l.source === 'precon' ? '#FBBF24'
          : (BUILDING_TYPE_COLORS[l.buildingType] || '#6B7280'),
        mlsNumber: l.mlsNumber || '',
        slug: l.slug || '',
        source: l.source,
        address: l.address || '',
        priceDisplay: (isSoldView && l.soldPrice) ? `$${l.soldPrice.toLocaleString()} sold` : l.priceDisplay || '',
        beds: l.beds || 0,
        baths: l.baths || 0,
        sqft: l.sqft || '',
        mainImage: l.images?.[0] || '',
      },
    })),
  }), [listings, isSoldView]);

  // ===== Event handlers =====

  const handleMoveEnd = useCallback(() => {
    if (!mapRef.current || !onBoundsChange) return;
    const map = mapRef.current.getMap();
    const bounds = map.getBounds();
    onBoundsChange({
      ne: { lat: bounds.getNorthEast().lat, lng: bounds.getNorthEast().lng },
      sw: { lat: bounds.getSouthWest().lat, lng: bounds.getSouthWest().lng },
    });
  }, [onBoundsChange]);

  // Unified click handler — checks which layer was clicked
  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) return;

    if (feature.layer?.id === 'community-fill') {
      const name = feature.properties?.name;
      if (name) {
        console.log(`[Map] Community clicked: ${name}`);
        onCommunityClick?.(name, name);
        // Zoom to bbox
        if (feature.geometry.type === 'Polygon') {
          const coords = (feature.geometry as GeoJSON.Polygon).coordinates[0];
          let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
          for (const [lng, lat] of coords) {
            if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
            if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
          }
          mapRef.current?.getMap().fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
        }
      }
    } else if (feature.layer?.id === 'listings-circle') {
      const src = feature.properties?.source;
      const href = src === 'mls'
        ? `/listing/${feature.properties?.mlsNumber}`
        : `/projects/${feature.properties?.slug}`;
      if (href !== '/listing/' && href !== '/projects/') {
        window.open(href, '_blank');
      }
    }
  }, [onCommunityClick]);

  // Unified hover handler
  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (!feature) {
      setHoveredCommunity(null);
      setCommunityTooltip(null);
      setPopupListing(null);
      onMarkerHover(null);
      return;
    }

    if (feature.layer?.id === 'community-fill') {
      const name = feature.properties?.name;
      setHoveredCommunity(name || null);
      setCommunityTooltip(name ? { name, x: e.point.x, y: e.point.y } : null);
      setPopupListing(null);
      onMarkerHover(null);
    } else if (feature.layer?.id === 'listings-circle') {
      const id = feature.properties?.id;
      const listing = listings.find((l) => l.id === id);
      setPopupListing(listing || null);
      onMarkerHover(id || null);
      setHoveredCommunity(null);
      setCommunityTooltip(null);
    }
  }, [listings, onMarkerHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCommunity(null);
    setCommunityTooltip(null);
    setPopupListing(null);
    onMarkerHover(null);
  }, [onMarkerHover]);

  // Both layers are interactive
  const interactiveLayers = useMemo(() => {
    const layers = ['community-fill'];
    if (listings.length > 0) layers.push('listings-circle');
    return layers;
  }, [listings.length]);

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onMoveEnd={handleMoveEnd}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        interactiveLayerIds={interactiveLayers}
        cursor={(hoveredCommunity || popupListing) ? 'pointer' : 'grab'}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        reuseMaps
        maxBounds={[[-80.2, 43.2], [-78.6, 44.4]]}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />

        {/* Layer 1: Community fill (bottom — clickable) */}
        {boundaries.length > 0 && (
          <Source id="community-boundaries" type="geojson" data={boundariesGeoJSON}>
            <Layer id="community-fill" type="fill" paint={BASE_FILL_PAINT} />
            <Layer id="community-border" type="line" paint={BASE_LINE_PAINT} />
          </Source>
        )}

        {/* Layer 2: Hover overlay */}
        <Source id="community-hover" type="geojson" data={hoverGeoJSON}>
          <Layer id="community-hover-fill" type="fill" paint={HOVER_FILL_PAINT} />
          <Layer id="community-hover-line" type="line" paint={HOVER_LINE_PAINT} />
        </Source>

        {/* Layer 3: Selected overlay */}
        <Source id="community-selected" type="geojson" data={selectedGeoJSON}>
          <Layer id="community-selected-fill" type="fill" paint={SELECTED_FILL_PAINT} />
          <Layer id="community-selected-line" type="line" paint={SELECTED_LINE_PAINT} />
        </Source>

        {/* Layer 4: Listing pins as GL circles (NOT HTML Markers) */}
        <Source id="listings-pins" type="geojson" data={listingsGeoJSON}>
          <Layer id="listings-circle" type="circle" paint={CIRCLE_PAINT as any} />
        </Source>

        {/* Layer 5: Community labels (on top) */}
        {boundaries.length > 0 && (
          <Source id="community-labels" type="geojson" data={labelsGeoJSON}>
            <Layer
              id="community-label-text" type="symbol"
              layout={{
                'text-field': ['get', 'name'],
                'text-size': ['interpolate', ['linear'], ['zoom'], 11, 9, 13, 12, 15, 14],
                'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
                'text-allow-overlap': false, 'text-optional': true, 'text-padding': 4,
              }}
              paint={{ 'text-color': 'rgba(100,160,255,0.7)', 'text-halo-color': 'rgba(0,0,0,0.9)', 'text-halo-width': 1.5 }}
              minzoom={11}
            />
          </Source>
        )}

        {/* Listing popup on hover */}
        {popupListing && popupListing.lat && popupListing.lng && (
          <Popup latitude={popupListing.lat} longitude={popupListing.lng} closeButton={false} closeOnClick={false} anchor="bottom" offset={12} className="search-map-popup">
            <div className="p-0 min-w-[200px]">
              {popupListing.images?.[0] && <img src={popupListing.images[0]} alt={popupListing.address} className="w-full h-28 object-cover rounded-t" />}
              <div className="p-2">
                <p className="font-serif font-bold text-sm">{isSoldView && popupListing.soldPrice ? `$${popupListing.soldPrice.toLocaleString()} sold` : popupListing.priceDisplay}</p>
                <p className="text-xs text-gray-600 truncate">{popupListing.address}</p>
                <div className="flex gap-2 text-xs text-gray-500 mt-1">
                  {popupListing.beds > 0 && <span>{popupListing.beds} bd</span>}
                  {popupListing.baths > 0 && <span>{popupListing.baths} ba</span>}
                  {popupListing.sqft && <span>{popupListing.sqft} sqft</span>}
                </div>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Community tooltip */}
      {communityTooltip && (
        <div className="absolute z-20 pointer-events-none bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap" style={{ left: communityTooltip.x + 12, top: communityTooltip.y - 10 }}>
          {communityTooltip.name}
        </div>
      )}
    </div>
  );
}
