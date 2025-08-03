import { useEffect, useState } from "react";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import type { DisciplinaryEvent, DisciplinaryLevel } from "../types/student";
import ThumbUp from "@shared/icons/thumbs_up.svg?react";
import ThumbDown from "@shared/icons/thumbs_down.svg?react";
import Star from "@shared/icons/star.svg?react";
import Medal from "@shared/icons/medal.svg?react";
import AlertTriangle from "@shared/icons/triangle_alert.svg?react";
import AlertCircle from "@shared/icons/circle_alert.svg?react";

const disciplinaryEvents: DisciplinaryEvent[] = [
  //   {
  //     studentId: "abc",
  //     incidentDate: new Date().toISOString(),
  //     approvalDate: new Date().toISOString(),
  //     reason: "?",
  //     type: "minorMerit",
  //     count: 2,
  //   },
  //   {
  //     studentId: "abc",
  //     incidentDate: new Date().toISOString(),
  //     approvalDate: new Date().toISOString(),
  //     reason: "???",
  //     type: "majorMerit",
  //     count: 2,
  //   },
  //   {
  //     studentId: "abc",
  //     incidentDate: new Date().toISOString(),
  //     approvalDate: new Date().toISOString(),
  //     reason: "IDK what it is",
  //     type: "commendation",
  //     count: 2,
  //   },
  //   {
  //     studentId: "abc",
  //     incidentDate: new Date().toISOString(),
  //     approvalDate: new Date().toISOString(),
  //     reason: "Fuck ur gf",
  //     type: "majorDemerit",
  //     count: 1,
  //   },
  //   {
  //     studentId: "abc",
  //     incidentDate: new Date().toISOString(),
  //     approvalDate: new Date().toISOString(),
  //     reason: "Smoke",
  //     type: "warning",
  //     count: 1,
  //   },
  //   {
  //     studentId: "abc",
  //     incidentDate: new Date().toISOString(),
  //     approvalDate: new Date().toISOString(),
  //     reason: "Playing ur gf",
  //     type: "minorDemerit",
  //     count: 2,
  //   },
];

const getIcon = (level: DisciplinaryLevel) => {
  if (level === "commendation") {
    return <ThumbUp className="w-8" />;
  } else if (level === "minorMerit") {
    return <Star className="w-8" />;
  } else if (level === "majorMerit") {
    return <Medal className="w-8 pt-0.5" />;
  } else if (level === "warning") {
    return <ThumbDown className="w-8 pt-1" />;
  } else if (level === "minorDemerit") {
    return <AlertCircle className="w-8" />;
  } else if (level === "majorDemerit") {
    return <AlertTriangle className="w-8 stroke-2" />;
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

const formatDate = (isoString: string) => {
  const date = new Date(isoString);
  return `${date.getFullYear() - 2000}/${date.getMonth()}/${date.getDate()}`;
};

const Disciplinary = () => {
  const { setNavbarButtonsByType } = useNavbarButtons();
  const [events, setEvents] = useState<Record<string, DisciplinaryEvent[]>>({});

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

  useEffect(() => {
    setNavbarButtonsByType(["back"]);

    setEvents(splitEvents(disciplinaryEvents));
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
                      className="my-3 ms-2 items-center flex space-x-2"
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

                      <p className="whitespace-nowrap">
                        {getTitle(event.type)} × {event.count}
                      </p>
                    </li>
                  ))}
                />
              </ul>
            </div>
          ))}
        </ul>
      ) : (
        <div className="flex join-vertical space-y-4 items-center justify-center min-h-[60vh] text-center">
          <p className="text-xl">你還真是個人才啥都沒有 :D</p>

          <div className="space-x-4">
            <button
              className="btn btn-success"
              onClick={() => {
                window.location.href =
                  "https://youtu.be/YQZEoZ4W0ac?si=YXEI9jdM3LU0d9x1";
              }}
            >
              取得嘉獎
            </button>

            <button
              className="btn btn-error"
              onClick={() => {
                window.location.href = "http://203.71.221.50/army/";
                ("");
              }}
            >
              取得警告
            </button>

            <button className="btn btn-primary">主頁</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Disciplinary;
