import { useEffect, useState } from "react";
import { useModal } from "../widgets/ModalContext";
import { useNavigate } from "react-router-dom";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { useAuthFetch } from "../auth/useAuthFetch";
import type { LoginRequestBody } from "../types/auth";
import { getClientDeviceId } from "../utils/device";

const Login = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const { showModal } = useModal();
  const [password, setPassword] = useState("");
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const { setNavbarButtonsByType } = useNavbarButtons();
  const { authedFetch } = useAuthFetch();
  const [waiting, setWaiting] = useState(false);

  const openModal = () => {
    showModal({
      showDismissButton: true,
      title: "Password",
      description: "National Identification, Student ID is ur math grade",
    });
  };

  const openLoginFailedModal = () => {
    showModal({
      showDismissButton: true,
      title: "登入失敗",
      description: "檢查您的學號、密碼是否正確",
    });
  };

  const isSIDValid = (): boolean => {
    return /^[0-9]*$/.test(studentId);
  };

  const handleLogin = async () => {
    setWasSubmitted(true);
    if (!isSIDValid() || !studentId || !password) {
      return;
    }

    try {
      setWaiting(true);
      const loginBody: LoginRequestBody = {
        id: studentId,
        password,
        trustDevice: false,
        deviceInfo: {
          clientSideDeviceId: getClientDeviceId(),
          type: "web",
        },
      };
      const data = await authedFetch("kmshweb.com/api/auth/login", {
        method: "POST",
        body: JSON.stringify(loginBody),
      });

      const success = !!data.accessToken;
      if (!success) {
        setWaiting(false);
        openLoginFailedModal();
        return;
      }

      navigate("/home");
    } catch (error) {}
  };

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
  }, []);

  return (
    <>
      <div className="h-screen w-screen bg-base-100 flex justify-center items-center">
        <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
          {/* Login input field */}
          <legend className="fieldset-legend">登入</legend>
          <label className="label">學號</label>
          <input
            type="text"
            className={`input ${
              (!isSIDValid() || !studentId) && wasSubmitted
                ? "border-error"
                : ""
            }`}
            required
            maxLength={7}
            pattern="[0-9]*"
            placeholder="學號"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          />
          {!isSIDValid() ? (
            <div className="text-xs text-error">只可包含數字</div>
          ) : !studentId && wasSubmitted ? (
            <div className="text-xs text-error">必填</div>
          ) : null}

          {/* Password input field */}
          <label className="label">密碼</label>
          <input
            type="password"
            className={`input ${
              !password && wasSubmitted ? "border-error" : ""
            }`}
            required
            placeholder="密碼"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {!password && wasSubmitted && (
            <div className="text-xs text-error">必填</div>
          )}

          {/* Forgot password */}
          <div className="flex justify-start">
            <a
              className="link"
              href="https://youtu.be/xvFZjo5PgG0?si=XR3JFabyXj1UtZww"
            >
              忘記密碼？
            </a>
          </div>

          <button
            onClick={handleLogin}
            className={`btn mt-4 ${
              waiting ? "skeleton rounded-field text-gray-400" : "btn-neutral"
            }`}
          >
            登入
          </button>

          <div className="flex justify-end mt-2">
            <button
              onClick={openModal}
              className="btn btn-ghost btn-circle btn-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </button>
          </div>
        </fieldset>
      </div>
    </>
  );
};

export default Login;
