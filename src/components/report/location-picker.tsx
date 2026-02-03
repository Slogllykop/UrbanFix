"use client";

import { IconCurrentLocation, IconMapPin } from "@tabler/icons-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";

interface Location {
  lat: number;
  lng: number;
  address?: string;
}

interface LocationPickerProps {
  initialPosition?: { lat: number; lng: number };
  onLocationSelect: (location: Location) => void;
}

// Declare google maps types
declare global {
  interface Window {
    google: typeof google;
    initMap: () => void;
  }
}

export function LocationPicker({
  initialPosition,
  onLocationSelect,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.error("Google Maps API key not configured");
      setIsLoading(false);
      return;
    }

    // Check if already loaded
    if (window.google?.maps) {
      setIsLoaded(true);
      setIsLoading(false);
      return;
    }

    // Load script
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
      setIsLoading(false);
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps");
      setIsLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script on unmount to allow caching
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    const center = initialPosition || DEFAULT_MAP_CENTER;

    // Create map
    googleMapRef.current = new google.maps.Map(mapRef.current, {
      center,
      zoom: DEFAULT_MAP_ZOOM,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      styles: [
        // Dark mode styles
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
      ],
    });

    // Create marker
    markerRef.current = new google.maps.Marker({
      position: center,
      map: googleMapRef.current,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    // Create geocoder
    geocoderRef.current = new google.maps.Geocoder();

    // Get initial address
    geocodeLocation(center);

    // Handle marker drag
    markerRef.current.addListener("dragend", () => {
      const position = markerRef.current?.getPosition();
      if (position) {
        const location = {
          lat: position.lat(),
          lng: position.lng(),
        };
        geocodeLocation(location);
      }
    });

    // Handle map click - move marker
    googleMapRef.current.addListener(
      "click",
      (e: google.maps.MapMouseEvent) => {
        if (e.latLng && markerRef.current) {
          markerRef.current.setPosition(e.latLng);
          const location = {
            lat: e.latLng.lat(),
            lng: e.latLng.lng(),
          };
          geocodeLocation(location);
        }
      },
    );
  }, [isLoaded, initialPosition, geocodeLocation]);

  // Geocode location to get address
  const geocodeLocation = useCallback(
    async (location: { lat: number; lng: number }) => {
      if (!geocoderRef.current) return;

      try {
        const response = await geocoderRef.current.geocode({
          location: { lat: location.lat, lng: location.lng },
        });

        const address = response.results[0]?.formatted_address;
        const newLocation: Location = {
          ...location,
          address,
        };

        setCurrentLocation(newLocation);
        onLocationSelect(newLocation);
      } catch (error) {
        console.error("Geocoding error:", error);
        const newLocation: Location = { ...location };
        setCurrentLocation(newLocation);
        onLocationSelect(newLocation);
      }
    },
    [onLocationSelect],
  );

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      console.error("Geolocation not supported");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Update map and marker
        if (googleMapRef.current && markerRef.current) {
          googleMapRef.current.panTo(location);
          googleMapRef.current.setZoom(17);
          markerRef.current.setPosition(location);

          // Add bounce animation
          markerRef.current.setAnimation(google.maps.Animation.BOUNCE);
          setTimeout(() => {
            markerRef.current?.setAnimation(null);
          }, 1500);
        }

        geocodeLocation(location);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  }, [geocodeLocation]);

  if (isLoading) {
    return (
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="aspect-video rounded-lg bg-muted flex items-center justify-center p-4">
        <p className="text-sm text-muted-foreground text-center">
          Google Maps API key not configured. Please add
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment variables.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Map container */}
      <div className="relative aspect-video overflow-hidden rounded-lg">
        <div ref={mapRef} className="absolute inset-0" />

        {/* Current location button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute bottom-4 right-4 h-10 w-10 rounded-full shadow-lg"
          onClick={getCurrentLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          ) : (
            <IconCurrentLocation className="h-5 w-5" />
          )}
          <span className="sr-only">Use current location</span>
        </Button>
      </div>

      {/* Selected location display */}
      {currentLocation && (
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <IconMapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Selected Location</p>
            {currentLocation.address ? (
              <p className="text-xs text-muted-foreground truncate">
                {currentLocation.address}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {currentLocation.lat.toFixed(6)},{" "}
                {currentLocation.lng.toFixed(6)}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-muted-foreground text-center">
        Drag the pin or tap on the map to select the exact location
      </p>
    </div>
  );
}
