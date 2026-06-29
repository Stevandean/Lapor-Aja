"use client";

import { useEffect } from "react";
import L from "leaflet";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { toast } from "sonner";

type ReportLocationMapProps = {
  gpsLatitude: string;
  gpsLongitude: string;
  selectedLatitude: string;
  selectedLongitude: string;
  radiusKm: number;
  onLocationChange: (latitude: string, longitude: string) => void;
};

const selectedLocationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width: 22px;
      height: 22px;
      border-radius: 9999px;
      background: var(--primary);
      border: 3px solid white;
      box-shadow: 0 8px 20px rgba(0,0,0,.25);
    "></div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export function ReportLocationMap({
  gpsLatitude,
  gpsLongitude,
  selectedLatitude,
  selectedLongitude,
  radiusKm,
  onLocationChange,
}: ReportLocationMapProps) {
  const gpsLat = Number(gpsLatitude);
  const gpsLng = Number(gpsLongitude);
  const selectedLat = Number(selectedLatitude);
  const selectedLng = Number(selectedLongitude);

  const center: [number, number] = [gpsLat, gpsLng];
  const selectedPosition: [number, number] = [selectedLat, selectedLng];

  function handleSelectLocation(latitude: number, longitude: number) {
    const distanceKm = calculateDistanceKm(gpsLat, gpsLng, latitude, longitude);

    if (distanceKm > radiusKm) {
      toast.error("Location is outside the allowed radius", {
        description: `Please select a point within ${radiusKm} km from your GPS location.`,
      });

      return false;
    }

    onLocationChange(String(latitude), String(longitude));
    return true;
  }

  return (
    <div className="h-80 overflow-hidden rounded-2xl border border-border bg-muted">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        className="h-full w-full"
      >
        <MapResize />
        <MapClickHandler onSelectLocation={handleSelectLocation} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={center}
          radius={radiusKm * 1000}
          pathOptions={{
            color: "var(--primary)",
            fillColor: "var(--primary)",
            fillOpacity: 0.08,
            opacity: 0.55,
            weight: 2,
          }}
        />

        <Marker
          key={`${selectedLatitude}-${selectedLongitude}`}
          position={selectedPosition}
          icon={selectedLocationIcon}
          draggable
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const nextPosition = marker.getLatLng();

              const accepted = handleSelectLocation(
                nextPosition.lat,
                nextPosition.lng
              );

              if (!accepted) {
                marker.setLatLng(selectedPosition);
              }
            },
          }}
        >
          <Popup>
            <div className="space-y-1 text-sm">
              <p className="font-semibold text-slate-900">
                Selected Report Location
              </p>

              <p className="text-xs text-slate-600">
                Lat: {selectedLatitude}
              </p>

              <p className="text-xs text-slate-600">
                Lng: {selectedLongitude}
              </p>

              <p className="text-xs text-slate-600">
                Radius limit: {radiusKm} km from GPS point
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}

function MapClickHandler({
  onSelectLocation,
}: {
  onSelectLocation: (latitude: number, longitude: number) => boolean;
}) {
  useMapEvents({
    click(event) {
      onSelectLocation(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
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

function calculateDistanceKm(
  latitudeA: number,
  longitudeA: number,
  latitudeB: number,
  longitudeB: number
) {
  const earthRadiusKm = 6371;

  const deltaLatitude = toRadians(latitudeB - latitudeA);
  const deltaLongitude = toRadians(longitudeB - longitudeA);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}