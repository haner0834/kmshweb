import { useMediaQuery } from "react-responsive";
import logo from "../assets/react.svg";
import coffeeroll from "@shared/app_icons/coffee_roll.png";
import { useNavigate } from "react-router-dom";

type CardProbs = {
  img: string;
  title: string;
  path: string;
};

const CardForMobile = ({ img, title, path }: CardProbs) => {
  const navigate = useNavigate();
  const toPath = () => {
    navigate(path);
  };
  return (
    <div
      onClick={toPath}
      className="bg-base-100 w-full shadow-sm h-20 rounded-xl flex justify-start items-center px-4 gap-4"
    >
      <img src={img} alt="" className="h-12 w-12 rounded-full" />
      <p className="font-semibold">{title}</p>
    </div>
  );
};

const CardForBigScreen = ({ img, title }: CardProbs) => {
  return (
    <div className="card bg-base-100 w-50 shadow-sm">
      <figure>
        <img src={img} alt="Shoes" />
      </figure>
      <div className="card-body bg-neutral rounded-b-2xl">
        <h2 className="card-title text-base-100">{title}</h2>
      </div>
    </div>
  );
};

const Card = ({ img, title, path }: CardProbs) => {
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  return isMobile ? (
    <CardForMobile img={img} title={title} path={path} />
  ) : (
    <CardForBigScreen img={img} title={title} path={path} />
  );
};

const CARD_ITEMS: CardProbs[] = [
  {
    img: coffeeroll,
    title: "考試成績",
    path: "/examscore",
  },
  //   {
  //     img: logo,
  //     title: "學習歷程",
  //   },
  //   {
  //     img: logo,
  //     title: "社團",
  //   },
  {
    img: coffeeroll,
    title: "獎懲",
    path: "/disciplinary",
  },
  // {
  //   img: coffeeroll,
  //   title: "課表",
  //   path: "/classschedule",
  // },
  {
    img: coffeeroll,
    title: "車表",
    path: "/busschedule",
  },
];

const Home = () => {
  const isMobile = useMediaQuery({ query: "(max-width: 767px)" });

  return (
    <div className="w-screen min-h-screen flex justify-center bg-base-300">
      <div className={`${isMobile ? "w-screen" : ""} pb-8`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-20 p-8">
          {CARD_ITEMS.map((item) => (
            <Card img={item.img} title={item.title} path={item.path} />
          ))}
        </div>

        <ul className="list bg-base-100 rounded-box shadow-md mx-8">
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
