// MapboxMapLazy.tsx
import { useEffect, useRef } from "react";

interface MapboxMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  radiusMeters?: number;
  className?: string;
}

export function MapboxMapLazy({
  lng,
  lat,
  zoom = 11,
  radiusMeters = 2500,
  className,
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let map: any;
    (async () => {
      const mapboxgl = await import("mapbox-gl");
      const turf = await import("@turf/turf");
      await import("mapbox-gl/dist/mapbox-gl.css");

      mapboxgl.default.accessToken = import.meta.env.VITE_MAPBOX_KEY;

      map = new mapboxgl.default.Map({
        container: mapContainerRef.current!,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [lng, lat],
        zoom,
      });

      const circle = turf.circle([lng, lat], radiusMeters, {
        steps: 64,
        units: "meters",
      });

      map.on("load", () => {
        map.addSource("circle-radius", {
          type: "geojson",
          data: circle,
        });
        map.addLayer({
          id: "circle-radius-fill",
          type: "fill",
          source: "circle-radius",
          paint: { "fill-color": "#3F8EFC", "fill-opacity": 0.2 },
        });
        map.addLayer({
          id: "circle-radius-outline",
          type: "line",
          source: "circle-radius",
          paint: { "line-color": "#3F8EFC", "line-width": 2 },
        });
      });
    })();

    return () => {
      if (map) map.remove();
    };
  }, [lng, lat, zoom]);

  return <div ref={mapContainerRef} className={className} />;
}
