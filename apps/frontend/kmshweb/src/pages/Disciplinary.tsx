import { useEffect, useState } from "react";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import type { DisciplinaryEvent, DisciplinaryLevel } from "../types/student";
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  Medal,
  TriangleAlert,
  CircleAlert,
} from "@icons";
import { useAuthFetch } from "../auth/useAuthFetch";
import { useNavigate } from "react-router-dom";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import PieProgress from "../widgets/PieProgress";

const getIcon = (level: DisciplinaryLevel) => {
  if (level === "commendation") {
    return <ThumbsUp className="w-8" />;
  } else if (level === "minorMerit") {
    return <Star className="w-8" />;
  } else if (level === "majorMerit") {
    return <Medal className="w-8 pt-0.5" />;
  } else if (level === "warning") {
    return <ThumbsDown className="w-8 mt-1" />;
  } else if (level === "minorDemerit") {
    return <CircleAlert className="w-8" />;
  } else if (level === "majorDemerit") {
    return <TriangleAlert className="w-8 stroke-2" />;
  }

  return null;
};

const getTitle = (level: DisciplinaryLevel) => {
  if (level === "commendation") {
    return "嘉獎";
  } else if (level === "minorMerit") {
    return "小功";
  } else if (level === "majorMerit") {
    return "大功";
  } else if (level === "warning") {
    return "警告";
  } else if (level === "minorDemerit") {
    return "小過";
  } else if (level === "majorDemerit") {
    return "大過";
  }
};

const getBadgeStyle = (level: DisciplinaryLevel) => {
  if (level === "commendation") {
    return "badge-info";
  } else if (level === "minorMerit") {
    return "badge-primary";
  } else if (level === "majorMerit") {
    return "badge-success";
  } else if (level === "warning") {
    return "badge-neutral";
  } else if (level === "minorDemerit") {
    return "badge-warning";
  } else if (level === "majorDemerit") {
    return "badge-error";
  }
};

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getFullYear() - 2000}/${date.getMonth()}/${date.getDate()}`;
};

const Disciplinary = () => {
  const { setNavbarButtons, setNavbarTitle } = useNavbarButtons();
  const [events, setEvents] = useState<Record<string, DisciplinaryEvent[]>>({});
  const { authedFetch } = useAuthFetch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const splitEvents = (
    events: DisciplinaryEvent[]
  ): Record<string, DisciplinaryEvent[]> => {
    const result: Record<string, DisciplinaryEvent[]> = {};
    for (const event of events) {
      if (
        event.type === "commendation" ||
        event.type === "minorMerit" ||
        event.type === "majorMerit"
      ) {
        result["獎勵"] = [...(result["獎勵"] ?? []), event].filter((e) => !!e);
      } else {
        result["懲罰"] = [...(result["懲罰"] ?? []), event].filter((e) => !!e);
      }
    }

    console.log(result);

    return result;
  };

  const getEvents = async (origin: boolean = false) => {
    const res = await authedFetch(
      `http://localhost:3000/api/student/disciplinary${
        origin ? "?source=origin" : ""
      }`
    );
    if (!res.success) {
      console.error(res.error);
      return;
    }

    const { data } = res;

    setEvents(splitEvents(data));
  };

  useEffect(() => {
    const baseButtons: NavbarButton[] = (
      ["back", "themeToggle"] as NavbarButtonType[]
    )
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    if (isLoading) {
      baseButtons.push({
        placement: "end",
        content: (
          <PieProgress
            duration={1300}
            strokeWidth={3.6}
            color="var(--color-primary)"
          />
        ),
        order: 1000,
        id: "navbar_loading",
      });
    }
    setNavbarButtons(baseButtons);
    setNavbarTitle("獎懲");
  }, [isLoading]);

  useEffect(() => {
    const a = async () => {
      await getEvents();
      setIsLoading(true);
      await getEvents(true);
      setIsLoading(false);
    };

    a();
  }, []);

  return (
    <div className="pt-16 bg-base-300 min-h-screen w-full flex justify-center">
      {Object.keys(events).length > 0 ? (
        <ul className="w-full max-w-2xl mx-auto">
          {Object.entries(events).map(([category, value]) => (
            <div key={category}>
              <SectionTitle title={category} />

              <ul className="space-y-4">
                <Section
                  content={value.map((event) => (
                    <li
                      className="items-center flex space-x-2"
                      key={
                        event.approvalDate + event.incidentDate + event.reason
                      }
                    >
                      {getIcon(event.type)}

                      <div className="flex-1">
                        <p>{event.reason}</p>
                        <p className="text-xs opacity-40">
                          事發：{formatDate(event.incidentDate)} | 簽呈：
                          {formatDate(event.approvalDate)}
                        </p>
                      </div>

                      <span
                        className={`whitespace-nowrap badge badge-soft ${getBadgeStyle(
                          event.type
                        )}`}
                      >
                        {getTitle(event.type)} × {event.count}
                      </span>
                    </li>
                  ))}
                />
              </ul>
            </div>
          ))}
        </ul>
      ) : (
        <div className="flex items-center justify-center flex-col">
          <div className="bg-base-100 w-xs p-4 rounded-box text-center">
            <p className="font-bold">尚無獎懲紀錄</p>
            <p className="opacity-50 mb-4 text-sm">您真是個乖寶寶</p>

            <div className="space-y-4">
              <button
                className="btn btn-success btn-soft w-full rounded-full"
                onClick={() => {
                  window.location.href =
                    "https://youtu.be/YQZEoZ4W0ac?si=YXEI9jdM3LU0d9x1";
                }}
              >
                取得嘉獎
              </button>
              <button
                className="btn btn-error btn-soft w-full rounded-full"
                onClick={() => {
                  window.location.href = "http://203.71.221.50/army/";
                }}
              >
                取得警告
              </button>
              <button
                onClick={() => navigate("/home")}
                className="btn btn-primary btn-soft w-full rounded-full"
              >
                Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disciplinary;
