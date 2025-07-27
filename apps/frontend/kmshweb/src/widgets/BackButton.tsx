import { useNavigate } from "react-router-dom";
import ChevronLeft from "@shared/icons/chevron_left.svg?react";

const BackButton = () => {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);

  return (
    <button
      className="flex items-center focus:opacity-40 hover:opacity-65"
      onClick={goBack}
    >
      <ChevronLeft className="w-7 h-7" />
      返回
    </button>
  );
};

export default BackButton;
