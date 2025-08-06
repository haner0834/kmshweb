import { Outlet } from "react-router";
import { useEffect, useState } from "react";
import { useNavbarButtons } from "./NavbarButtonsContext";

export type NavbarButtonType =
  | "logo"
  | "themeToggle"
  | "login"
  | "inbox"
  | "navbarTitle"
  | "sidebarToggle"
  | "back"
  | "profile";

type NavbarButtonPlacement = "start" | "center" | "end";

export type NavbarButton = {
  placement?: NavbarButtonPlacement;
  id?: string;
  order?: number;
  content: React.ReactNode;
};

const Navbar = () => {
  const [positionedButtons, setPositionedButtons] =
    useState<Map<NavbarButtonPlacement, NavbarButton[]>>();

  const { navbarButtons } = useNavbarButtons();

  useEffect(() => {
    const map = new Map<NavbarButtonPlacement, NavbarButton[]>();
    for (const button of navbarButtons) {
      map.set(button.placement ?? "end", [
        ...(map.get(button.placement ?? "end") ?? []),
        button,
      ]);
    }
    setPositionedButtons(map);
  }, [navbarButtons]);

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-screen navbar bg-base-100 shadow-sm p-4">
        <div className="navbar-start">
          {(positionedButtons?.get("start") ?? []).map((button) => (
            <div key={button.id}>{button.content}</div>
          ))}
        </div>

        <div className="navbar-center">
          {(positionedButtons?.get("center") ?? []).map((button) => (
            <div key={button.id}>{button.content}</div>
          ))}
        </div>

        <div className="navbar-end">
          {(positionedButtons?.get("end") ?? []).map((button) => (
            <div key={button.id}>{button.content}</div>
          ))}
        </div>
      </div>

      <Outlet />
    </>
  );
};

export default Navbar;
