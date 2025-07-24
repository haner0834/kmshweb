import coffeeRoll from "@shared/app_icons/coffee_roll.png";
import { useNavigate } from "react-router-dom";

const NavbarLogo = () => {
  const navigate = useNavigate();
  const toRoot = () => navigate("/");
  return (
    <div onClick={toRoot} className="flex justify-center cursor-pointer">
      <div className="avatar">
        <div className="w-10 h-10 rounded-full shadow-md">
          <img src={coffeeRoll} />
        </div>
      </div>
      <a className="font-bold text-xl m-2 font-outfit">Coffee Roll</a>
    </div>
  );
};

export default NavbarLogo;
