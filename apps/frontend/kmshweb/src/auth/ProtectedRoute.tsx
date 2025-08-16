import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { useEffect, type ReactNode } from "react";
import { Calendar } from "../generated/icons";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { useModal } from "../widgets/ModalContext";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { setNavbarButtons } = useNavbarButtons();
  const { accessToken, refreshAccessToken } = useAuth();
  const navigate = useNavigate();
  const { showModal } = useModal();

  const setupErrorPage = () => {
    setNavbarButtons([
      {
        placement: "center",
        content: <p className="font-bold">ㄏㄚˋㄏㄚˋㄏㄚˋ</p>,
      },
    ]);

    showModal({
      title: "登入已過期",
      description: "重新登入以繼續使用",
      icon: <Calendar className="w-30 h-30" />,
      buttons: [
        {
          label: "OK",
          style: "btn-primary",
          role: "primary",
          onClick: () => navigate("/login"),
        },
      ],
    });
  };

  useEffect(() => {
    const a = async () => {
      try {
        if (!accessToken) {
          await refreshAccessToken();
        }
      } catch (error) {
        setupErrorPage();
        console.error("Failed to refresh access token.");
      }
    };

    a();
  }, [accessToken]);

  return accessToken ? (
    children
  ) : (
    <div className="pt-16 w-screen h-screen justify-center flex items-center bg-base-300">
      你看不到我 :D
      <br />
      偷偷跟你們說一件事 我其實是天才🙂‍↕️
    </div>
  );
};

export default ProtectedRoute;
