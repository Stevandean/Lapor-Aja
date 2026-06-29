"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

type ReportLocationPreviewMapProps = {
  latitude: number | string;
  longitude: number | string;
  title?: string;
  address?: string | null;
};

const reportMarkerIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 24px;
      height: 24px;
      border-radius: 9999px;
      background: var(--primary);
      border: 4px solid white;
      box-shadow: 0 10px 24px rgba(0,0,0,.28);
    "></div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export function ReportLocationPreviewMap({
  latitude,
  longitude,
  title = "Report Location",
  address,
}: ReportLocationPreviewMapProps) {
  const lat = Number(latitude);
  const lng = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return (
      <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
        Location map is unavailable.
      </div>
    );
  }

  const position: [number, number] = [lat, lng];

  return (
    <div className="h-72 overflow-hidden rounded-2xl border border-border bg-muted">
      <MapContainer
        center={position}
        zoom={16}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <MapResize />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Marker position={position} icon={reportMarkerIcon}>
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">{title}</p>

              {address ? (
                <p className="text-xs leading-5 text-slate-600">{address}</p>
              ) : null}

              <p className="text-xs text-slate-600">
                Lat: {lat}, Lng: {lng}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timeout);
  }, [map]);

  return null;
}