import { useCallback, useEffect, useRef, useState } from "react";

export type UserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

export type GeolocationPermissionState = PermissionState | "unknown" | "unsupported";

function getGeolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Standortzugriff wurde abgelehnt. Erlaube ihn in den Website-Einstellungen deines Browsers.";
    case error.POSITION_UNAVAILABLE:
      return "Dein Standort konnte nicht bestimmt werden. Prüfe, ob die Ortungsdienste aktiviert sind.";
    case error.TIMEOUT:
      return "Die Standortbestimmung hat zu lange gedauert. Bitte versuche es erneut.";
    default:
      return "Dein Standort konnte nicht bestimmt werden.";
  }
}

export function useGeolocation() {
  const [permission, setPermission] = useState<GeolocationPermissionState>("unknown");
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const requestIdRef = useRef(0);
  const latestSettledRequestIdRef = useRef(0);
  const pendingManualRequestCountRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      return () => {
        mountedRef.current = false;
      };
    }

    let permissionStatus: PermissionStatus | null = null;
    let cancelled = false;

    const updatePermission = () => {
      if (permissionStatus && !cancelled && mountedRef.current) {
        setPermission(permissionStatus.state);
        if (permissionStatus.state === "denied") {
          setLocation(null);
        } else {
          setError(null);
        }
      }
    };

    if (navigator.permissions?.query) {
      navigator.permissions
        .query({ name: "geolocation" })
        .then((status) => {
          if (cancelled || !mountedRef.current) return;
          permissionStatus = status;
          updatePermission();
          permissionStatus.addEventListener("change", updatePermission);
        })
        .catch(() => {
          // Some browsers support geolocation but not querying its permission.
          // The actual request below remains the authoritative fallback.
        });
    }

    return () => {
      cancelled = true;
      mountedRef.current = false;
      requestIdRef.current += 1;
      permissionStatus?.removeEventListener("change", updatePermission);
    };
  }, []);

  const performLocationRequest = useCallback((showLoading: boolean) => {
    if (!("geolocation" in navigator)) {
      setPermission("unsupported");
      setError("Standortbestimmung wird von diesem Browser nicht unterstützt.");
      return;
    }

    if (!window.isSecureContext) {
      setError("Standortbestimmung ist nur über eine sichere HTTPS-Verbindung verfügbar.");
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (showLoading) {
      pendingManualRequestCountRef.current += 1;
      setIsLocating(true);
      setError(null);
    }

    const finishRequest = () => {
      if (!showLoading) return;

      pendingManualRequestCountRef.current = Math.max(0, pendingManualRequestCountRef.current - 1);

      if (mountedRef.current) {
        setIsLocating(pendingManualRequestCountRef.current > 0);
      }
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        finishRequest();
        if (!mountedRef.current || requestId < latestSettledRequestIdRef.current) return;

        latestSettledRequestIdRef.current = requestId;

        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
        setPermission("granted");
        setError(null);
      },
      (positionError) => {
        finishRequest();
        if (!mountedRef.current || requestId < latestSettledRequestIdRef.current) return;

        latestSettledRequestIdRef.current = requestId;

        if (positionError.code === positionError.PERMISSION_DENIED) {
          setPermission("denied");
          setLocation(null);
        }
        setError(getGeolocationErrorMessage(positionError));
      },
      {
        enableHighAccuracy: true,
        timeout: 12_000,
        maximumAge: 0,
      },
    );
  }, []);

  const requestLocation = useCallback(() => {
    performLocationRequest(true);
  }, [performLocationRequest]);

  const refreshLocation = useCallback(() => {
    performLocationRequest(false);
  }, [performLocationRequest]);

  return {
    permission,
    location,
    error,
    isLocating,
    requestLocation,
    refreshLocation,
  };
}
