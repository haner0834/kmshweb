import { useEffect, useState } from "react";
import { useModal } from "../widgets/ModalContext";
import { useNavigate } from "react-router-dom";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { useAuthFetch } from "../auth/useAuthFetch";
import type { LoginRequestBody } from "../types/auth";
import { getClientDeviceId } from "../utils/device";
import NavbarLogo from "../widgets/NavbarLogo";

const Login = () => {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState("");
  const { showModal } = useModal();
  const [password, setPassword] = useState("");
  const [wasSubmitted, setWasSubmitted] = useState(false);
  const { setNavbarButtonsByType } = useNavbarButtons();
  const { authedFetch } = useAuthFetch();
  const [waiting, setWaiting] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const openModal = () => {
    showModal({
      showDismissButton: true,
      title: "你怎麼這也能忘",
      description: "密碼：身分證字號",
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
    if (!isSIDValid() || !studentId || !password || !agreed) {
      return;
    }

    try {
      setWaiting(true);
      const loginBody: LoginRequestBody = {
        id: studentId,
        password,
        trustDevice: trustDevice,
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
        <div>
          <button disabled>
            <NavbarLogo />
          </button>

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

            <div className="flex justify-between items-end my-2">
              <div className="space-y-2">
                <label className="label flex">
                  <input
                    type="checkbox"
                    className="checkbox rounded-field checkbox-sm"
                    checked={trustDevice}
                    onChange={(e) => setTrustDevice(e.target.checked)}
                  />
                  信任此設備
                </label>

                <label className="label flex">
                  <input
                    type="checkbox"
                    className={`checkbox rounded-field checkbox-sm validator ${
                      !agreed && wasSubmitted ? "border-error" : ""
                    }`}
                    required
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  本人已詳細閱讀並同意本產品之
                  <a className="link" href="https://youtube.com">
                    用戶協議
                  </a>
                </label>
                {!agreed && wasSubmitted && (
                  <p className="text-xs text-error">必填</p>
                )}
              </div>
            </div>

            <button
              onClick={handleLogin}
              className={`btn ${
                waiting ? "skeleton rounded-field text-gray-400" : "btn-neutral"
              }`}
            >
              登入
            </button>

            {/* Forgot password */}
            <div className="flex justify-start"></div>

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
      </div>
    </>
  );
};

export default Login;
