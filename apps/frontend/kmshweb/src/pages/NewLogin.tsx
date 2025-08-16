import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../widgets/ModalContext";
import { useAuthFetch } from "../auth/useAuthFetch";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import mapboxgl, { Map } from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import * as turf from "@turf/turf";
import { type Notification } from "../types/student";
import { TriangleAlert } from "@icons";
import { getErrorMessage } from "../utils/errors";

const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY;

mapboxgl.accessToken = MAPBOX_KEY;

interface MapboxMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  radiusMeters?: number;
  className?: string; // 容器樣式由父層決定
}

export function MapboxMap({
  lng,
  lat,
  zoom = 11,
  radiusMeters = 2500,
  className,
}: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom,
    });

    const markerEl = document.createElement("div");
    markerEl.style.backgroundColor = "#3B28CC";
    markerEl.style.width = "16px";
    markerEl.style.height = "16px";
    markerEl.style.borderRadius = "50%";
    markerEl.style.boxShadow = "0 0 4px rgba(0,0,0,0.3)";
    markerEl.style.border = "2px solid white";

    new mapboxgl.Marker({ element: markerEl }).setLngLat([lng, lat]).addTo(map);

    const options = { steps: 64, units: "meters" as const };
    const circle = turf.circle([lng, lat], radiusMeters, options);

    map.on("load", () => {
      map.addSource("circle-radius", {
        type: "geojson",
        data: circle,
      });

      map.addLayer({
        id: "circle-radius-fill",
        type: "fill",
        source: "circle-radius",
        paint: {
          "fill-color": "#3F8EFC",
          "fill-opacity": 0.2,
        },
      });

      map.addLayer({
        id: "circle-radius-outline",
        type: "line",
        source: "circle-radius",
        paint: {
          "line-color": "#3F8EFC",
          "line-width": 2,
        },
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lng, lat, zoom]);

  return <div ref={mapContainerRef} className={className} />;
}

const NewLogin = () => {
  const { id } = useParams();
  const [notification, setNotification] = useState<Notification>();
  const { showModal } = useModal();
  const { authedFetch } = useAuthFetch();
  const navigate = useNavigate();
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();

  const toHome = () => {
    navigate("/home");
  };

  const askForBlock = () => {
    showModal({
      title: "確認登出該裝置？",
      description: "此操作無法復原",
      buttons: [
        {
          label: "取消",
        },
        {
          label: "確認登出該裝置",
          role: "error",
          style: "btn-error",
          onClick: forceLogout,
        },
      ],
    });
  };

  const forceLogout = async () => {
    if (!notification) {
      showError();
      return;
    }
    const body = {
      deviceId: notification.payload?.deviceId,
    };
    const { error } = await authedFetch(
      `http://localhost:3000/api/auth/force-logout`,
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );

    console.log("Error:", error);

    if (!!error) {
      showModal({
        title: "登出失敗",
        description: getErrorMessage(error.code),
        buttons: [
          {
            label: "關閉",
          },
        ],
      });
    } else {
      showModal({
        title: "已登出該裝置",
        description: ":D",
        buttons: [
          {
            label: "關閉",
          },
        ],
      });
    }
  };

  const getNotification = async () => {
    if (!id) {
      showModal({
        title: "Invalid URL",
        description: "Notification ID is required in url params",
      });
      return;
    }

    const { success, error, data } = await authedFetch(
      `http://localhost:3000/api/student/notifications/${id}`
    );
    if (!success) {
      console.error(error);
      return;
    }

    if (data.type !== "warn" || data.icon !== "auth") {
      showModal({
        title: "Invalid notification",
        description: "Given notification is not for warning login",
      });
    }

    setNotification(data);
  };

  const showError = () => {
    setNavbarTitle("I LOVE U <3");
    console.error(
      "Fuck u all, go fuck urself im done. THAT FUCKING SHITTY MAPBOX KEY IS MISSING."
    );
    showModal({
      title: "Unexpected error occured",
      description: "The developer is doing some shit",
      buttons: [
        {
          label: "Home",
          onClick: () => navigate("/home"),
        },
        {
          label: "Report",
          onClick: () => navigate("/report"),
        },
        {
          label: "Fuck Developer",
          role: "error",
          style: "btn-error",
          onClick: () =>
            (location.href =
              "https://www.instagram.com/coffee_.roll?igsh=MWt0eGVub3B4aTV0Zw%3D%3D"),
        },
      ],
    });
  };

  useEffect(() => {
    if (!MAPBOX_KEY) {
      showError();
      return;
    }

    getNotification();

    setNavbarButtonsByType(["back", "themeToggle"]);
    setNavbarTitle("可疑登入");
  }, []);

  return (
    <div className="min-h-screen bg-base-100 pt-18 flex flex-col justify-center items-center mx-4">
      <div className="min-w-xs max-w-xl w-full flex flex-col justify-center text-center items-center space-y-2">
        <div className="h-50 w-full flex flex-col border-primary">
          {notification?.payload?.location.longitude != null &&
          notification?.payload?.location.latitude != null ? (
            <MapboxMap
              lng={notification.payload.location.longitude}
              lat={notification.payload.location.latitude}
              zoom={11}
              className="flex-1 w-full h-full rounded-field shadow-md"
            />
          ) : (
            <div className="flex flex-col font-bold text-sm bg-base-300 rounded-field w-full h-full items-center justify-center">
              <TriangleAlert className="w-8 h-8 text-error" />
              <p>Unknown Location</p>
            </div>
          )}
        </div>

        <p className="text-lg font-bold mt-4">您的帳號在其他設備上登入</p>
        <p>
          {notification?.payload?.deviceName ?? "Unknown"} |{" "}
          {notification?.payload?.location?.text ?? ""}
        </p>
        {/* TODO: Replace "macOS (Desktop), Chrome" with "maxOS, Chrome" */}
        <p className="text-xs opacity-50">{notification?.body}</p>

        <div className="w-full mt-10 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 items-center justify-center">
          <button
            onClick={toHome}
            className="btn btn-primary btn-wide btn-soft"
          >
            這是我
          </button>
          <button onClick={askForBlock} className="btn btn-error btn-wide">
            這不是我，登出該裝置
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewLogin;
