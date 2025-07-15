import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const Root = () => {
  const navigate = useNavigate();
  const { refreshAccessToken } = useAuth();
  // Get whether the device has logged in
  useEffect(() => {
    const checkLoginAndNavigate = async () => {
      try {
        const isLoggedIn = localStorage.getItem("isLoggedIn");
        if (isLoggedIn === "true") {
          await refreshAccessToken();
          navigate("/home");
        } else {
          navigate("/intro");
        }
      } catch (error) {
        console.error("Error refreshing access token:", error);
        navigate("/error/redirectfailed");
      }
    };

    checkLoginAndNavigate();
  }, []);

  return null;
};

export default Root;
