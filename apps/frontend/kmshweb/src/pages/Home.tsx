import { useMediaQuery } from "react-responsive";
import logo from "../assets/react.svg";
import { useNavigate } from "react-router-dom";
import { useEffect, type ReactNode } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import TextFile from "@shared/icons/file_text.svg?react";
import Medal from "@shared/icons/medal.svg?react";
import Ellipsis from "@shared/icons/ellipsis.svg?react";
import FileUp from "@shared/icons/file-up.svg?react";
import Bus from "@shared/icons/bus-front.svg?react";
import Calendar from "@shared/icons/calendar.svg?react";

type CardProbs = {
  img: ReactNode;
  title: string;
  path: string;
  isEnabled?: boolean;
};

const CardForMobile = ({ img, title, path, isEnabled }: CardProbs) => {
  const navigate = useNavigate();
  const toPath = () => {
    navigate(isEnabled ? path : `/upcoming/${path.slice(1, path.length)}`);
  };
  return (
    <div
      onClick={toPath}
      className="bg-base-100 w-full shadow-sm h-20 rounded-xl flex justify-center items-center px-4 gap-2"
    >
      {img}
      <p className="font-semibold">{title}</p>
    </div>
  );
};

const CardForBigScreen = ({ img, title }: CardProbs) => {
  return (
    <div className="card bg-base-100 w-50 shadow-sm">
      <figure>
        {/* <img src={img} alt="Shoes" /> */}
        {img}
      </figure>
      <div className="card-body bg-neutral rounded-b-2xl">
        <h2 className="card-title text-base-100">{title}</h2>
      </div>
    </div>
  );
};

const Card = ({ img, title, path, isEnabled = false }: CardProbs) => {
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  return isMobile ? (
    <CardForMobile img={img} title={title} path={path} isEnabled={isEnabled} />
  ) : (
    <CardForBigScreen
      img={img}
      title={title}
      path={path}
      isEnabled={isEnabled}
    />
  );
};

const CARD_ITEMS: CardProbs[] = [
  {
    img: <TextFile className="text-amber-400" />,
    title: "成績",
    path: "/examscore",
    isEnabled: true,
  },
  {
    img: <FileUp className="text-blue-400" />,
    title: "學習歷程",
    path: "/learninghistory",
  },
  {
    img: <Medal className="text-pink-400" />,
    title: "獎懲",
    path: "/disciplinary",
    isEnabled: true,
  },
  {
    img: <Calendar className="text-teal-400" />,
    title: "課表",
    path: "/class-schedule",
  },
  {
    img: <Bus className="text-purple-400" />,
    title: "車表",
    path: "/bus-schedule",
    isEnabled: false,
  },
  {
    img: <Ellipsis className="" />,
    title: "更多",
    path: "/more",
    isEnabled: true,
  },
];

const Home = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });
  const { setNavbarButtonsByType } = useNavbarButtons();

  useEffect(() => {
    setNavbarButtonsByType(["logo", "themeToggle", "inbox", "profile"]);
  }, []);

  return (
    <div className="w-screen min-h-screen flex justify-center bg-base-300">
      <div className={`${isMobile ? "w-screen" : ""} pb-8`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-20 p-4">
          {CARD_ITEMS.map((item) => (
            <Card
              key={item.title}
              img={item.img}
              title={item.title}
              path={item.path}
              isEnabled={item.isEnabled}
            />
          ))}
        </div>

        <ul className="list bg-base-100 rounded-box shadow-sm mx-4 mt-4">
          <li className="p-4 pb-2 text-xs opacity-60 tracking-wide uppercase">
            Calendar
          </li>

          <li className="list-row">
            <div className="text-center">
              <div className="text-2xl font-thin opacity-40 tabular-nums">
                01
              </div>
              <div className="font-light opacity-40">Feb</div>
            </div>
            <div>
              <img className="size-10 rounded-box" src={logo} />
            </div>
            <div className="list-col-grow">
              <div>Midterm Exam</div>
              <div className="text-xs text-error uppercase font-semibold">
                important
              </div>
            </div>
            <button className="btn btn-ghost btn-circle">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Home;
