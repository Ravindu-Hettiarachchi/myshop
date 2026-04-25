'use client';

import { useEffect, useRef } from 'react';

interface MapPickerProps {
  defaultLat?: number;
  defaultLng?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// Colombo city centre defaults
const DEFAULT_LAT = 6.9271;
const DEFAULT_LNG = 79.8612;

export default function MapPicker({ defaultLat = DEFAULT_LAT, defaultLng = DEFAULT_LNG, onLocationSelect }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import('leaflet').Map | null>(null);
  const markerRef = useRef<import('leaflet').Marker | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let isMounted = true;

    import('leaflet').then((L) => {
      if (!isMounted || !containerRef.current || mapRef.current) return;

      // Fix default marker icon paths (broken by webpack)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!).setView([defaultLat, defaultLng], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      marker.bindPopup('📍 Delivery here').openPopup();

      // Click anywhere to move marker
      map.on('click', (e: import('leaflet').LeafletMouseEvent) => {
        marker.setLatLng(e.latlng);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
        marker.bindPopup('📍 Delivery here').openPopup();
      });

      // Drag marker to fine-tune
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationSelect(pos.lat, pos.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When defaultLat/Lng props change externally (e.g. geolocation), fly map there
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    const latlng: [number, number] = [defaultLat, defaultLng];
    mapRef.current.flyTo(latlng, 15, { duration: 1.2 });
    markerRef.current.setLatLng(latlng);
  }, [defaultLat, defaultLng]);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '380px', borderRadius: '16px', overflow: 'hidden' }}
    />
  );
}
