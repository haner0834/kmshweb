import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, type ReactNode } from "react";
import Calendar from "@shared/icons/calendar_clock.svg?react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { setNavbarButtons } = useNavbarButtons();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!accessToken) {
      setNavbarButtons([
        {
          placement: "center",
          content: <p className="font-bold">ㄏㄚˋㄏㄚˋㄏㄚˋ</p>,
        },
      ]);
    }
  }, []);

  return accessToken ? (
    children
  ) : (
    <div className="pt-16 w-screen h-screen justify-center flex items-center bg-base-300">
      <div className="flex flex-col items-center justify-center min-w-xs max-w-md m-6 bg-base-100 p-8 rounded-2xl">
        <Calendar className="w-30 h-30" />

        <div className="my-5 text-center">
          <p className="text-lg font-bold">登入已過期</p>
          <p className="opacity-50">重新登入以繼續使用</p>
        </div>

        <button
          className="btn btn-primary btn-wide rounded-4xl"
          onClick={() => navigate("/login")}
        >
          登入
        </button>
      </div>
    </div>
  );
};

export default ProtectedRoute;
