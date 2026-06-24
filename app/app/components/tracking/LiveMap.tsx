import { useEffect, useRef } from 'react';

interface LiveMapProps {
  driverLat?: number;
  driverLng?: number;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
}

export function LiveMap(props: LiveMapProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    mapContainer.current.innerHTML = `
      <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;border-radius:12px;flex-direction:column;gap:8px;color:#666;font-family:system-ui;">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
        <span>Map placeholder — Leaflet would render here</span>
        <div style="font-size:12px;color:#999">
          Pickup: (${props.pickupLat?.toFixed(4)}, ${props.pickupLng?.toFixed(4)})<br/>
          Dropoff: (${props.dropoffLat?.toFixed(4)}, ${props.dropoffLng?.toFixed(4)})
          ${props.driverLat ? `<br/>Driver: (${props.driverLat.toFixed(4)}, ${props.driverLng?.toFixed(4)})` : ''}
        </div>
      </div>
    `;
  });

  return <div ref={mapContainer} className="w-full h-80 rounded-xl bg-gray-100" />;
}
