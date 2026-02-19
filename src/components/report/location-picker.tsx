"use client";

import { IconMapPin } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";

interface Location {
  lat: number;
  lng: number;
}

interface LocationPickerProps {
  initialPosition?: { lat: number; lng: number };
  onLocationSelect: (location: Location) => void;
}

declare global {
  interface Window {
    google: typeof google;
  }
}

const IP_LOCATION_ENDPOINT = "/api/ip-location";
const GOOGLE_MAPS_SCRIPT_ID = "google-maps-javascript-api";

export function LocationPicker({
  initialPosition,
  onLocationSelect,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const onLocationSelectRef = useRef(onLocationSelect);
  const hasAppliedInitialCenterRef = useRef(false);
  const hasUserInteractedRef = useRef(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);

  useEffect(() => {
    onLocationSelectRef.current = onLocationSelect;
  }, [onLocationSelect]);

  const selectLocation = useCallback((location: Location) => {
    setCurrentLocation(location);
    onLocationSelectRef.current(location);
  }, []);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API key not configured");
      setIsLoading(false);
      return;
    }

    if (window.google?.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    const handleLoad = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };

    const handleError = () => {
      console.error("Failed to load Google Maps");
      setIsLoading(false);
    };

    const existingScript = document.getElementById(
      GOOGLE_MAPS_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad);
      existingScript.addEventListener("error", handleError);
      return () => {
        existingScript.removeEventListener("load", handleLoad);
        existingScript.removeEventListener("error", handleError);
      };
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = handleLoad;
    script.onerror = handleError;

    document.head.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!isLoaded || !mapRef.current || googleMapRef.current) return;

    const center = initialPosition || DEFAULT_MAP_CENTER;

    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: DEFAULT_MAP_ZOOM,
      gestureHandling: "greedy",
      clickableIcons: false,
      disableDefaultUI: true,
      zoomControl: false,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#1d1d1d" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#1d1d1d" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#2d2d2d" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#0e1626" }],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [{ color: "#1a1a1a" }],
        },
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "transit",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
      ],
    });

    selectLocation(center);

    const syncLocationToCenter = () => {
      const mapCenter = googleMapRef.current?.getCenter();
      if (!mapCenter) return;

      selectLocation({
        lat: mapCenter.lat(),
        lng: mapCenter.lng(),
      });
    };

    googleMapRef.current.addListener("dragstart", () => {
      hasUserInteractedRef.current = true;
    });
    googleMapRef.current.addListener("zoom_changed", () => {
      hasUserInteractedRef.current = true;
    });

    // Uber-style: map moves under a fixed center pin.
    googleMapRef.current.addListener("idle", syncLocationToCenter);

    // Intentionally no click-to-pan behavior: user positions via map drag only.
  }, [isLoaded, initialPosition, selectLocation]);

  // Approximate initial position using IP geolocation (no reverse geocoding).
  useEffect(() => {
    if (!isLoaded || initialPosition || hasAppliedInitialCenterRef.current) {
      return;
    }

    hasAppliedInitialCenterRef.current = true;

    const controller = new AbortController();

    const detectFromIp = async () => {
      try {
        const response = await fetch(IP_LOCATION_ENDPOINT, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = (await response.json()) as {
          lat?: number;
          lng?: number;
        };

        if (typeof data.lat !== "number" || typeof data.lng !== "number") {
          return;
        }

        const ipLocation = {
          lat: data.lat,
          lng: data.lng,
        };

        // Never override once user has started placing location manually.
        if (!hasUserInteractedRef.current && googleMapRef.current) {
          googleMapRef.current.panTo(ipLocation);
          googleMapRef.current.setZoom(DEFAULT_MAP_ZOOM);
          selectLocation(ipLocation);
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        // Fallback to default center silently for local dev resilience.
      }
    };

    void detectFromIp();

    return () => {
      controller.abort();
    };
  }, [isLoaded, initialPosition, selectLocation]);

  if (isLoading) {
    return (
      <div className="h-[clamp(320px,52svh,560px)] rounded-lg bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="h-[clamp(320px,52svh,560px)] rounded-lg bg-muted flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Google Maps API key not configured. Please add
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative h-[clamp(320px,52svh,560px)] overflow-hidden rounded-lg">
        <div ref={mapRef} className="absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-full">
          <div className="rounded-full bg-background/90 p-1 shadow-md backdrop-blur">
            <IconMapPin className="h-7 w-7 text-primary" />
          </div>
        </div>
      </div>

      {currentLocation && (
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <IconMapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
