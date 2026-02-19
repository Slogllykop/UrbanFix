"use client";

import { IconMapPin } from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, useMapEvents } from "react-leaflet";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";

interface Location {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  initialPosition?: { lat: number; lng: number };
  onLocationSelect: (location: Location) => void;
}

interface MapEventBridgeProps {
  onCenterChange: (location: Location) => void;
}

const OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIBUTION = "&copy; OpenStreetMap contributors";
const STREET_LEVEL_ZOOM = 19;

function MapEventBridge({ onCenterChange }: MapEventBridgeProps) {
  const map = useMapEvents({
    moveend: () => {
      const center = map.getCenter();
      onCenterChange({ lat: center.lat, lng: center.lng });
    },
  });

  useEffect(() => {
    const center = map.getCenter();
    onCenterChange({ lat: center.lat, lng: center.lng });
  }, [map, onCenterChange]);

  return null;
}

export function LocationPicker({
  initialPosition,
  onLocationSelect,
}: LocationPickerProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  const initialCenter = useMemo(
    () => initialPosition || DEFAULT_MAP_CENTER,
    [initialPosition],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectLocation = useCallback(
    (location: Location) => {
      setCurrentLocation(location);
      onLocationSelect(location);
    },
    [onLocationSelect],
  );

  if (!isMounted) {
    return (
      <div className="h-[clamp(320px,52svh,560px)] rounded-lg bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-[clamp(320px,52svh,560px)] overflow-hidden rounded-lg">
        <MapContainer
          center={[initialCenter.lat, initialCenter.lng]}
          zoom={STREET_LEVEL_ZOOM}
          zoomControl={false}
          attributionControl
          dragging
          scrollWheelZoom
          doubleClickZoom
          boxZoom
          keyboard={false}
          className="absolute inset-0"
        >
          <TileLayer url={OSM_TILE_URL} attribution={OSM_ATTRIBUTION} />
          <MapEventBridge onCenterChange={selectLocation} />
        </MapContainer>

        <div className="pointer-events-none absolute left-1/2 top-1/2 z-500 -translate-x-1/2 -translate-y-full">
          <div className="rounded-full bg-background/90 p-1 shadow-md backdrop-blur">
            <IconMapPin className="h-7 w-7 text-primary" />
          </div>
        </div>
      </div>

      {currentLocation && (
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <IconMapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Selected Coordinates</p>
            <p className="text-xs text-muted-foreground">
              {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
            </p>
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground text-center">
        Move the map to place the pin at the exact issue location
      </p>
    </div>
  );
}
