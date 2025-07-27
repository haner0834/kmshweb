import { useEffect } from "react";
import type { NavbarButtonType } from "../widgets/Navbar";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";

const Intro = () => {
  const { setNavbarButtonsByType } = useNavbarButtons();
  useEffect(() => {
    const buttons: NavbarButtonType[] = ["logo", "themeToggle"];
    if (!localStorage.getItem("isLoggedIn")) buttons.push("login");

    setNavbarButtonsByType(buttons);
  }, []);

  return (
    // TODO: Complete intro page
    <div className="w-screen flex h-screen items-center justify-center">
      <p className="font-bold text-5xl">Introduction Page</p>
    </div>
  );
};

export default Intro;
