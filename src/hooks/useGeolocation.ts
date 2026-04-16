"use client";
// Hook para obtener la geolocalización del usuario
import { useState, useEffect } from "react";

interface GeolocationState {
  lat:     number | null;
  lng:     number | null;
  error:   string | null;
  loading: boolean;
}

export function useGeolocation(autoFetch = true): GeolocationState & { fetch: () => void } {
  const [state, setState] = useState<GeolocationState>({
    lat:     null,
    lng:     null,
    error:   null,
    loading: false,
  });

  const fetchLocation = () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: "Geolocalización no soportada" }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat:     pos.coords.latitude,
          lng:     pos.coords.longitude,
          error:   null,
          loading: false,
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          error:   err.message,
          loading: false,
        }));
      },
      { timeout: 10000, maximumAge: 300000 } // 5 minutos de cache
    );
  };

  useEffect(() => {
    if (autoFetch) fetchLocation();
  }, [autoFetch]);

  return { ...state, fetch: fetchLocation };
}
