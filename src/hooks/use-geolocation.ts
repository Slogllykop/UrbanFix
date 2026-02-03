"use client";

import { useCallback, useState } from "react";

interface GeolocationState {
  position: { lat: number; lng: number } | null;
  error: GeolocationPositionError | null;
  isLoading: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 0,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    position: null,
    error: null,
    isLoading: false,
  });

  const getPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: {
          code: 2,
          message: "Geolocation is not supported",
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError,
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          position: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          error: null,
          isLoading: false,
        });
      },
      (error) => {
        setState({
          position: null,
          error,
          isLoading: false,
        });
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      },
    );
  }, [enableHighAccuracy, timeout, maximumAge]);

  return {
    ...state,
    getPosition,
  };
}
