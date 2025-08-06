import Person from "@shared/icons/person.svg?react";
import { useNavigate } from "react-router-dom";

const ProfileButton = () => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate("/profile")}
      className="btn btn-circle btn-ghost ms-2"
    >
      <div className="h-7.5 w-7.5 rounded-4xl bg-neutral flex justify-center items-center">
        <Person className="w-5 h-5 text-base-100" />
      </div>
    </button>
  );
};

export default ProfileButton;
