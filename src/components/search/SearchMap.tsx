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
  area: number; // precomputed polygon area for sort
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

// Static paint — stable references
const BASE_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.05 };
const BASE_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 1.5, 'line-opacity': 0.35 };
const HOVER_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.18 };
const HOVER_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 2.5, 'line-opacity': 0.7 };
const SELECTED_FILL_PAINT = { 'fill-color': '#0066FF', 'fill-opacity': 0.25 };
const SELECTED_LINE_PAINT = { 'line-color': '#0066FF', 'line-width': 3, 'line-opacity': 0.9 };
const CIRCLE_PAINT = {
  'circle-radius': 5,
  'circle-color': ['get', 'color'],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-opacity': 0.9,
};

// Ray-casting point-in-polygon — works for ANY polygon complexity
function pointInPolygon(point: [number, number], ring: number[][]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

// Approximate polygon area (for sorting smallest-first)
function polygonArea(ring: number[][]): number {
  let area = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    area += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(area / 2);
}

export default function SearchMap({ listings, highlightedId, onMarkerHover, onBoundsChange, isSoldView, onCommunityClick, selectedNeighbourhood }: SearchMapProps) {
  const mapRef = useRef<MapRef>(null);
  const [boundaries, setBoundaries] = useState<CommunityBoundary[]>([]);
  const [hoveredCommunity, setHoveredCommunity] = useState<string | null>(null);
  const [communityTooltip, setCommunityTooltip] = useState<{ name: string; x: number; y: number } | null>(null);
  const [popupListing, setPopupListing] = useState<UnifiedListing | null>(null);

  const [viewState, setViewState] = useState({
    longitude: -79.3832, latitude: 43.6832, zoom: 11.5, pitch: 40, bearing: -10,
  });

  // Fetch boundaries once, sort by area (smallest first for overlap priority)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/repliers/communities');
        if (!res.ok) return;
        const data = await res.json();
        const locs: CommunityBoundary[] = (data.locations || [])
          .filter((c: any) => c.boundary?.[0]?.length >= 3)
          .map((c: any) => ({ ...c, area: polygonArea(c.boundary[0]) }))
          .sort((a: CommunityBoundary, b: CommunityBoundary) => a.area - b.area); // smallest first
        setBoundaries(locs);
        console.log(`[Map] ${locs.length} communities loaded, sorted by area (smallest first)`);
      } catch (err) {
        console.error('[Map] Failed to load communities:', err);
      }
    })();
  }, []);

  // Find community at a point — returns first match (smallest polygon due to sort)
  const findCommunityAtPoint = useCallback((lng: number, lat: number): CommunityBoundary | null => {
    const pt: [number, number] = [lng, lat];
    for (const c of boundaries) {
      if (pointInPolygon(pt, c.boundary[0])) return c;
    }
    return null;
  }, [boundaries]);

  // ===== GeoJSON sources =====

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

  // Click: check listing pins first (via Mapbox), then point-in-polygon for communities
  const handleClick = useCallback((e: MapLayerMouseEvent) => {
    // 1. Check if a listing pin was clicked (Mapbox handles this via interactiveLayerIds)
    const pinFeature = e.features?.find((f: any) => f.layer?.id === 'listings-circle');
    if (pinFeature) {
      const src = pinFeature.properties?.source;
      const href = src === 'mls'
        ? `/listing/${pinFeature.properties?.mlsNumber}`
        : `/projects/${pinFeature.properties?.slug}`;
      if (href !== '/listing/' && href !== '/projects/') {
        window.open(href, '_blank');
      }
      return;
    }

    // 2. Manual point-in-polygon for community detection
    const community = findCommunityAtPoint(e.lngLat.lng, e.lngLat.lat);
    if (community) {
      console.log(`[Map] Point-in-polygon match: ${community.name}`);
      onCommunityClick?.(community.name, community.name);

      // Zoom to bbox
      const ring = community.boundary[0];
      let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
      for (const [lng, lat] of ring) {
        if (lng < minLng) minLng = lng; if (lng > maxLng) maxLng = lng;
        if (lat < minLat) minLat = lat; if (lat > maxLat) maxLat = lat;
      }
      mapRef.current?.getMap().fitBounds([[minLng, minLat], [maxLng, maxLat]], { padding: 60, duration: 800 });
    }
  }, [findCommunityAtPoint, onCommunityClick]);

  // Hover: listing pins via Mapbox, communities via point-in-polygon
  const handleMouseMove = useCallback((e: MapLayerMouseEvent) => {
    // Check listing pins first
    const pinFeature = e.features?.find((f: any) => f.layer?.id === 'listings-circle');
    if (pinFeature) {
      const id = pinFeature.properties?.id;
      const listing = listings.find((l) => l.id === id);
      setPopupListing(listing || null);
      onMarkerHover(id || null);
      setHoveredCommunity(null);
      setCommunityTooltip(null);
      return;
    }

    // Community detection via point-in-polygon
    const community = findCommunityAtPoint(e.lngLat.lng, e.lngLat.lat);
    if (community) {
      setHoveredCommunity(community.name);
      setCommunityTooltip({ name: community.name, x: e.point.x, y: e.point.y });
      setPopupListing(null);
      onMarkerHover(null);
    } else {
      setHoveredCommunity(null);
      setCommunityTooltip(null);
      setPopupListing(null);
      onMarkerHover(null);
    }
  }, [findCommunityAtPoint, listings, onMarkerHover]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCommunity(null);
    setCommunityTooltip(null);
    setPopupListing(null);
    onMarkerHover(null);
  }, [onMarkerHover]);

  // Only listing pins use Mapbox interactiveLayerIds — community detection is manual
  const interactiveLayers = useMemo(() =>
    listings.length > 0 ? ['listings-circle'] : undefined
  , [listings.length]);

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

        {/* Community fill + border (visual only — click detection is manual) */}
        {boundaries.length > 0 && (
          <Source id="community-boundaries" type="geojson" data={boundariesGeoJSON}>
            <Layer id="community-fill" type="fill" paint={BASE_FILL_PAINT} />
            <Layer id="community-border" type="line" paint={BASE_LINE_PAINT} />
          </Source>
        )}

        {/* Hover highlight */}
        <Source id="community-hover" type="geojson" data={hoverGeoJSON}>
          <Layer id="community-hover-fill" type="fill" paint={HOVER_FILL_PAINT} />
          <Layer id="community-hover-line" type="line" paint={HOVER_LINE_PAINT} />
        </Source>

        {/* Selected highlight */}
        <Source id="community-selected" type="geojson" data={selectedGeoJSON}>
          <Layer id="community-selected-fill" type="fill" paint={SELECTED_FILL_PAINT} />
          <Layer id="community-selected-line" type="line" paint={SELECTED_LINE_PAINT} />
        </Source>

        {/* Listing pins as GL circles */}
        <Source id="listings-pins" type="geojson" data={listingsGeoJSON}>
          <Layer id="listings-circle" type="circle" paint={CIRCLE_PAINT as any} />
        </Source>

        {/* Community labels */}
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

        {/* Listing popup */}
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
