import ThemeToggle from "./ThemeToggle";
import { useNavigate } from "react-router";
import { Outlet } from "react-router";
import coffeeRoll from "../assets/coffee_roll.png";
import InboxDropdown from "./InboxDropdown";

type NavbarButton = "themeToggle" | "login" | "inbox" | "sidebarToggle";

type NavbarProps = {
  buttons: NavbarButton[];
};

const Navbar = ({ buttons }: NavbarProps) => {
  const navigate = useNavigate();
  const toLoginPage = () => {
    navigate("/login");
  };
  const toHome = () => {
    navigate("/");
  };

  return (
    <>
      <div className="fixed top-0 left-0 z-50 w-screen navbar bg-base-100 shadow-sm p-4">
        <div className="navbar-start">
          {buttons.includes("sidebarToggle") && (
            <button className="btn btn-square btn-ghost">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="inline-block h-5 w-5 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                ></path>
              </svg>
            </button>
          )}

          <div onClick={toHome} className="flex justify-center">
            <div className="avatar">
              <div className="w-10 h-10 rounded-full shadow-md">
                <img src={coffeeRoll} />
              </div>
            </div>
            <a className="font-bold text-xl m-2">Coffe Roll</a>
          </div>
        </div>

        <div className="navbar-end">
          <div className="me-2">
            <ThemeToggle />
          </div>

          {buttons.includes("inbox") && <InboxDropdown />}

          {buttons.includes("login") && (
            <button onClick={toLoginPage} className="btn btn-gost m-4">
              Login
            </button>
          )}
        </div>
      </div>

      <Outlet />
    </>
  );
};

export default Navbar;
