import { useNavigate } from "react-router-dom";

const LoginButton = () => {
  const navigate = useNavigate();
  const toLoginPage = () => {
    navigate("/login");
  };

  return (
    <button onClick={toLoginPage} className="btn btn-gost">
      Login
    </button>
  );
};

export default LoginButton;
