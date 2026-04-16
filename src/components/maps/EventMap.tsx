"use client";
// Mapa interactivo con Leaflet + OpenStreetMap — 100% gratuito, sin API key
import { useEffect, useRef, useState } from "react";
import type { Event } from "@/types";
import { formatEventDate, formatPrice, cn } from "@/lib/utils";
import { EVENT_TYPE_EMOJIS } from "@/types";

interface Props {
  events:            Event[];
  center?:           [number, number]; // [lat, lng]
  zoom?:             number;
  className?:        string;
  selectionMode?:    boolean;
  selectedLat?:      number;
  selectedLng?:      number;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export default function EventMap({
  events,
  center = [19.432, -99.133], // CDMX por defecto — [lat, lng] en Leaflet
  zoom = 11,
  className,
  selectionMode = false,
  selectedLat,
  selectedLng,
  onLocationSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markersRef   = useRef<any[]>([]);
  const selectedRef  = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Limpiar estado de Leaflet si quedó colgado (ej. HMR o StrictMode)
    if ((containerRef.current as any)._leaflet_id) {
      (containerRef.current as any)._leaflet_id = undefined;
    }

    // Flag para cancelar si el cleanup corre antes de que termine el import async
    let active = true;

    import("leaflet").then((L) => {
      if (!active || !containerRef.current) return;

      // Fix para el ícono por defecto roto en webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!, {
        center,
        zoom,
        zoomControl: true,
      });

      // Tiles de OpenStreetMap — gratuito, sin key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setMapReady(true); // Señal para que los efectos de marcadores se re-ejecuten

      // Modo selección de ubicación
      if (selectionMode && onLocationSelect) {
        map.on("click", (e: any) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }
    });

    return () => {
      active = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Solo al montar

  // Actualizar marcador de selección
  useEffect(() => {
    if (!mapRef.current || !selectionMode) return;
    import("leaflet").then((L) => {
      if (selectedRef.current) selectedRef.current.remove();
      if (selectedLat && selectedLng) {
        const icon = L.divIcon({
          html: `<div style="font-size:28px;line-height:1">📍</div>`,
          className: "",
          iconAnchor: [14, 28],
        });
        selectedRef.current = L.marker([selectedLat, selectedLng], { icon })
          .addTo(mapRef.current);
        mapRef.current.setView([selectedLat, selectedLng], 15);
      }
    });
  }, [selectedLat, selectedLng, selectionMode, mapReady]);

  // Actualizar marcadores de eventos
  useEffect(() => {
    if (!mapRef.current || selectionMode) return;
    import("leaflet").then((L) => {
      // Limpiar marcadores anteriores
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      events.forEach((event) => {
        const emoji = EVENT_TYPE_EMOJIS[event.tipo] || "✨";
        const icon  = L.divIcon({
          html: `
            <div style="
              width:36px;height:36px;
              background:#FF385C;
              border-radius:50%;border:2px solid white;
              display:flex;align-items:center;justify-content:center;
              font-size:16px;cursor:pointer;
              box-shadow:0 2px 8px rgba(255,56,92,0.4);
            ">${emoji}</div>`,
          className:  "",
          iconAnchor: [18, 18],
        });

        const precio  = event.precio ? `$${event.precio} ${event.moneda}` : "Gratis";
        const fecha   = formatEventDate(event.fechaInicio);
        const portada = event.media?.[0]?.url;

        const popup = L.popup({ maxWidth: 260, className: "eventure-popup" }).setContent(`
          <div style="font-family:Inter,sans-serif;background:#ffffff;border-radius:12px;overflow:hidden;min-width:220px;border:1px solid #dddddd;">
            ${portada
              ? `<img src="${portada}" style="width:100%;height:110px;object-fit:cover;" />`
              : `<div style="height:60px;background:#FF385C;"></div>`
            }
            <div style="padding:12px;">
              <p style="color:#222222;font-weight:700;font-size:14px;margin:0 0 6px;">${event.nombre}</p>
              <p style="color:#717171;font-size:12px;margin:0 0 2px;">📅 ${fecha}</p>
              <p style="color:#717171;font-size:12px;margin:0 0 8px;">📍 ${event.ciudad || event.direccion}</p>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="color:#FF385C;font-weight:700;font-size:13px;">${precio}</span>
                <a href="/evento/${event.id}" style="background:#FF385C;color:white;padding:5px 12px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none;">Ver →</a>
              </div>
            </div>
          </div>
        `);

        const marker = L.marker([event.lat, event.lng], { icon })
          .bindPopup(popup)
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });
    });
  }, [events, selectionMode, mapReady]);

  // Actualizar center cuando cambie (ej. geolocalización del usuario) o cuando el mapa esté listo
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setView(center, zoom);
  }, [center[0], center[1], zoom, mapReady]);

  return (
    <div className={cn("relative w-full h-full rounded-2xl overflow-hidden", className)}>
      {/* CSS de Leaflet vía CDN */}
      <style>{`
        @import url("https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css");
        .leaflet-container { background: #f7f7f7 !important; }
        .leaflet-control-zoom a { background: #ffffff !important; color: #222222 !important; border-color: #dddddd !important; }
        .leaflet-control-zoom a:hover { background: #f0f0f0 !important; }
        .leaflet-popup-content-wrapper { background: transparent !important; border: none !important; box-shadow: 0 4px 24px rgba(0,0,0,0.15) !important; padding: 0 !important; border-radius: 12px !important; overflow: hidden; }
        .leaflet-popup-tip { background: #ffffff !important; }
        .leaflet-popup-content { margin: 0 !important; }
        .leaflet-attribution-flag { display: none !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,0.8) !important; color: #717171 !important; font-size: 10px !important; }
        .leaflet-control-attribution a { color: #717171 !important; }
      `}</style>

      <div ref={containerRef} className="w-full h-full" />

      {selectionMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-sm border border-surface-500 rounded-xl px-4 py-2 text-sm text-gray-600 pointer-events-none">
          Haz clic en el mapa para seleccionar la ubicación
        </div>
      )}
    </div>
  );
}

// Alias de compatibilidad con imports anteriores
export function EventMarker({ tipo }: { tipo: string }) {
  return null;
}
export function EventMarkerPin({ tipo }: { tipo: string }) {
  return null;
}
