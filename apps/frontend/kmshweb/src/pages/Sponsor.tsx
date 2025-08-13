import { useEffect } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { HeartHandshake } from "@icons";

const Sponsor = () => {
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();

  const toRickRoll = () => {
    location.href = "https://youtu.be/xvFZjo5PgG0?si=9ScqkDjnTJJn_no4";
  };

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
    setNavbarTitle("你真是個好人");
  }, []);

  return (
    <div className="h-screen flex flex-col text-center justify-center items-center">
      <HeartHandshake className="w-40 h-40 text-pink-300" />
      <h1 className="font-bold text-lg">感謝您的好心</h1>
      <p className="opacity-50 max-w-xs">
        目前沒有開放贊助的打算，如果你真的很想很想很想贊助我再按這個按鈕
      </p>

      <button onClick={toRickRoll} className="btn btn-primary mt-4 btn-wide">
        贊助
      </button>
    </div>
  );
};

export default Sponsor;
