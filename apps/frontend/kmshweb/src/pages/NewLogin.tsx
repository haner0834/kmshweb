import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useModal } from "../widgets/ModalContext";
import { ShieldAlert } from "@icons";
import { useAuthFetch } from "../auth/useAuthFetch";

const NewLogin = () => {
  const { id } = useParams();
  const [notification, setNotification] = useState<Notification | undefined>(
    undefined
  );
  const { showModal } = useModal();
  const { authedFetch } = useAuthFetch();

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
    setNotification(data);
  };

  useEffect(() => {
    getNotification();
  }, []);

  return (
    <div className="min-h-screen bg-base-100 pt-18 flex flex-col justify-center items-center space-y-4">
      <div className="mx-15 max-w-md flex flex-col justify-center text-center items-center">
        <ShieldAlert className="w-25 h-25 text-error" />
        <p className="text-lg font-bold">您的帳號在其他設備上登入</p>
        <p className="text-sm opacity-50">{notification?.body}</p>
      </div>
    </div>
  );
};

export default NewLogin;
