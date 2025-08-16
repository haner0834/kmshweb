import { useStudent } from "../widgets/StudentContext";
import { getEnrollmentStatusText, getGradeText } from "../utils/student";
import { useEffect } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { useNavigate } from "react-router-dom";
import type { LoginRequestBody } from "../types/auth";
import { getClientDeviceId } from "../utils/device";
import { getErrorMessage } from "../utils/errors";
import { useModal } from "../widgets/ModalContext";
import { useAuth } from "../auth/AuthContext";
import type { Student } from "../types/student";
import { Person, IdCard as IDCard, GraduationCap } from "@icons";

const LoginCheck = () => {
  const { student, id, password, trustDevice, clearData } = useStudent();
  const { setNavbarButtons } = useNavbarButtons();
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { setAccessToken } = useAuth();

  const back = () => {
    navigate("/login", { replace: true });
  };

  function shallowEqual(obj1: object, obj2: object): boolean {
    return (
      Object.keys(obj1).length === Object.keys(obj2).length &&
      Object.entries(obj1).every(([key, value]) => (obj2 as any)[key] === value)
    );
  }

  const isStudentCleared = (): boolean => {
    const defaultStudent: Student = {
      sid: "",
      name: "",
      grade: "junior1",
      birthDate: "",
      enrollmentDate: "",
      enrollmentStatus: "enrolled",
      gender: "male",
      stream: "science",
      classLabel: "",
      classNumber: 0,
      credential: "",
    };
    return (
      shallowEqual(student, defaultStudent) && id === "" && password === ""
    );
  };

  const login = async () => {
    const loginBody: LoginRequestBody = {
      id,
      password,
      trustDevice,
      deviceInfo: {
        clientSideDeviceId: getClientDeviceId(),
        type: "web",
      },
    };
    const response = await fetch("http://localhost:3000/api/auth/login", {
      credentials: "include",
      method: "POST",
      body: JSON.stringify(loginBody),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const json = await response.json();

    const success = json.success;
    if (!success) {
      showModal({
        title: "登入失敗",
        description: getErrorMessage(json.error.code),
        buttons: [
          {
            label: "關閉",
          },
        ],
      });
      return;
    }

    const accessToken = json.data.accessToken;
    if (!accessToken) {
      showModal({
        title: "未知錯誤",
        description: "無法取得 JWT token",
        buttons: [
          {
            label: "取消",
          },
          {
            label: "回報問題",
            role: "primary",
            style: "btn-primary",
            // TODO: Add linking action
          },
        ],
      });
    }
    setAccessToken(accessToken);

    localStorage.setItem("isLoggedIn", "true");

    clearData();

    navigate("/home");
  };

  useEffect(() => {
    setNavbarButtons([
      {
        content: <p className="font-bold">:D</p>,
        placement: "center",
        id: "navbar_title_:D",
      },
    ]);

    if (isStudentCleared()) {
      showModal({
        title: "請不要隨便刷新 謝謝",
        description: "資料已丟失，請重新登入",
        buttons: [
          {
            label: "返回登入",
            role: "primary",
            style: "btn-primary",
            onClick: () => navigate("/login"),
          },
        ],
      });
    }
  }, []);

  return (
    <div className="bg-base-100 min-h-screen flex join-vertical justify-center items-center">
      <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
        <legend className="fieldset-legend">基本資料</legend>

        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 flex items-center rounded-4xl justify-center bg-gray-400">
            <Person className="w-11 h-11 text-base-100" />
          </div>

          <div>
            <p className="font-semibold text-lg">
              {student.name || "Coffee Roll"}
            </p>
            <p className="text-sm opacity-50">
              {getGradeText(student?.grade ?? "junior1")} ·{" "}
              {student?.classLabel || "虫合"}
            </p>
          </div>
        </div>

        <div className="divider"></div>

        <ul className="space-y-4 text-base">
          <li className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <IDCard className="w-6 h-6" />
              <p>學號</p>
            </div>

            <p className="">{student.sid || "幹嘛勒那麼想駭我網站"}</p>
          </li>

          <li className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-6 h-6" />
              <p>就學狀態</p>
            </div>

            <p className="">
              {getEnrollmentStatusText(student.enrollmentStatus)}
            </p>
          </li>
        </ul>
      </fieldset>

      <p className="text-sm mt-8 mb-2 opacity-50">這是你嗎？</p>

      <div className="space-x-4 flex justify-center w-xs">
        <button onClick={back} className="btn btn-outline rounded-4xl w-1/2">
          返回
        </button>
        <button onClick={login} className="btn rounded-4xl btn-primary w-1/2">
          這是我，登入
        </button>
      </div>
    </div>
  );
};

export default LoginCheck;
