import React, { useEffect, useState, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useModal } from "../widgets/ModalContext";
import { useAuthFetch } from "../auth/useAuthFetch";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import "mapbox-gl/dist/mapbox-gl.css";
import { type Notification } from "../types/student";
import { TriangleAlert } from "@icons";
import { getErrorMessage } from "../utils/errors";

const MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY;

const MapboxMap = React.lazy(() =>
  import("../widgets/MapboxMap").then((m) => ({ default: m.MapboxMapLazy }))
);

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
        <div className="h-50 w-full flex flex-col">
          {notification?.payload?.location.longitude != null &&
          notification?.payload?.location.latitude != null ? (
            <Suspense
              fallback={
                <div className="font-medium opacity-50">Loading map...</div>
              }
            >
              <MapboxMap
                lng={notification.payload.location.longitude}
                lat={notification.payload.location.latitude}
                className="flex-1 w-full h-full rounded-field shadow-md"
              />
            </Suspense>
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
