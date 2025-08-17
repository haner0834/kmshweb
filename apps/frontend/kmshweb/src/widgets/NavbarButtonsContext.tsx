import { createContext, useContext, useState, type ReactNode } from "react";
import { type NavbarButton, type NavbarButtonType } from "./Navbar";
import NavbarLogo from "./NavbarLogo";
import InboxDropdown from "./InboxDropdown";
import ThemeToggle from "./ThemeToggle";
import LoginButton from "./LoginButton";
import BackButton from "./BackButton";
import ProfileButton from "./ProfileButton";
import HomeButton from "./HomeButton";

type NavbarButtonsContextType = {
  navbarButtons: NavbarButton[];
  setNavbarButtons: (buttons: NavbarButton[]) => void;
  appendDefaultNavbarButton: (type: NavbarButtonType) => void;
  setNavbarButtonsByType: (types: NavbarButtonType[]) => void;
  appendNavbarButton: (button: NavbarButton) => void;
  navbarTitle?: string;
  setNavbarTitle: (title: string | undefined) => void;
};

const NavbarButtonsContext = createContext<
  NavbarButtonsContextType | undefined
>(undefined);

export const useNavbarButtons = () => {
  const context = useContext(NavbarButtonsContext);
  if (!context) {
    throw new Error(
      "useNavbarButtons must be used within a NavbarButtonsProvider"
    );
  }
  return context;
};

export const NavbarButtonTypeMap = new Map<NavbarButtonType, NavbarButton>([
  // -- start
  [
    "logo",
    {
      placement: "start",
      id: "navbar_logo",
      order: 100,
      content: <NavbarLogo />,
    },
  ],
  // -- center --

  // -- end --
  [
    "themeToggle",
    {
      placement: "end",
      id: "navbar_theme_toggle",
      order: 0,
      content: <ThemeToggle />,
    },
  ],
  [
    "inbox",
    {
      placement: "end",
      id: "navbar_inbox",
      order: 1,
      content: <InboxDropdown />,
    },
  ],
  [
    "login",
    {
      placement: "end",
      id: "navbar_login",
      order: 2,
      content: <LoginButton />,
    },
  ],
  [
    "back",
    {
      placement: "start",
      id: "navbar_back",
      order: -1,
      content: <BackButton />,
    },
  ],
  [
    "profile",
    {
      placement: "end",
      id: "navbar_profile",
      order: 0,
      content: <ProfileButton />,
    },
  ],
  [
    "home",
    {
      placement: "end",
      id: "navbar_home",
      order: 0,
      content: <HomeButton />,
    },
  ],
]);

type NavbarButtonsProviderProps = {
  children: ReactNode;
};

export const NavbarButtonsProvider = ({
  children,
}: NavbarButtonsProviderProps) => {
  const [navbarButtons, setNavbarButtons] = useState<NavbarButton[]>([]);
  const [navbarTitle, setNavbarTitle] = useState<string | undefined>(undefined);

  const appendDefaultNavbarButton = (type: NavbarButtonType) => {
    const button = NavbarButtonTypeMap.get(type);
    if (button) {
      setNavbarButtons([...navbarButtons, button]);
    }
  };

  const setNavbarButtonsByType = (types: NavbarButtonType[]) => {
    const buttons = types
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter((button) => !!button);
    setNavbarButtons(buttons);
  };

  const appendNavbarButton = (button: NavbarButton) => {
    setNavbarButtons([...navbarButtons, button]);
  };

  return (
    <NavbarButtonsContext.Provider
      value={{
        navbarButtons,
        setNavbarButtons,
        appendDefaultNavbarButton,
        setNavbarButtonsByType,
        appendNavbarButton,
        navbarTitle,
        setNavbarTitle,
      }}
    >
      {children}
    </NavbarButtonsContext.Provider>
  );
};
