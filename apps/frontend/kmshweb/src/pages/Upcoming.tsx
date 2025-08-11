import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import FileUp from "@shared/icons/file-up.svg?react";
import Calendar from "@shared/icons/calendar.svg?react";
import TableOfContent from "@shared/icons/table-of-contents.svg?react";
import Bus from "@shared/icons/bus-front.svg?react";
import Info from "@shared/icons/info.svg?react";
import { useModal } from "../widgets/ModalContext";
import { useAuthFetch } from "../auth/useAuthFetch";
import confetti from "canvas-confetti";

const map = {
  learninghistory: {
    icon: <FileUp className="text-blue-400 w-10 h-10" />,
    name: "學習歷程",
    code: "LEARNING_HISTORY",
    description:
      "將會整合上傳、壓縮等繁瑣的操作為一體，並結合AI生成心得，省下您寶貴的時間。",
  },
  classschedule: {
    icon: <TableOfContent className="text-teal-400 w-10 h-10" />,
    name: "課表",
    code: "CLASS_SCHEDULE",
    description:
      "隨時隨地查詢你的課表，不限時間段。支持依老師或班級篩選，讓你省下抄課表的時間",
  },
  busschedule: {
    icon: <Bus className="text-purple-400 w-10 h-10" />,
    name: "車表",
    code: "BUS_SCHEDULE",
    description:
      "全面整合站點、路線、Google Map與時間資訊，讓你輕鬆掌握最新校車動態。無論上下學還是臨時改站想查詢，都能享受真正便捷的線上化車表體驗，而不是艱難的查找那張破表。",
  },
  calendar: {
    icon: <Calendar className="text-indigo-400 w-10 h-10" />,
    name: "行事曆",
    code: "CALENDAR",
    description:
      "不只是查詢、標記與通知，還有一項尚未公開的神秘功能，將讓你的行事曆徹底顛覆想像。",
  },
} as const;

type FuncName = keyof typeof map;

const getName = (name: FuncName) => {
  return map[name].name;
};

function isFuncName(value: string): value is FuncName {
  return value in map;
}

const Upcoming = () => {
  const { name } = useParams<{ name: FuncName }>();
  const { setNavbarButtons } = useNavbarButtons();
  const [rate, setRate] = useState(3);
  const { showModal } = useModal();
  const { authedFetch } = useAuthFetch();
  const [isDefault, setIsDefault] = useState(true);
  const [tapTimes, setTapTimes] = useState(0);

  const showDescription = () => {
    showModal({
      showDismissButton: true,
      title: "向功能評分",
      description:
        "您的寶貴意見能幫助我們持續改進！請為尚未推出的功能留下評分，讓我們了解您的期待與需求。",
    });
  };

  const sendRate = async (check: boolean = true) => {
    if (!name || !isFuncName(name)) {
      showModal({
        title: "未知功能",
        description: "不支援給定的功能名稱",
        showDismissButton: true,
      });
      return;
    }

    if (tapTimes >= 7) {
      showModal({
        title: "好了啦你要按幾次",
        description: "按爽沒",
        showDismissButton: true,
      });
      return;
    }

    if (rate <= 1 && check) {
      showModal({
        title: "真的要打1分嗎🥲",
        description: "我們的感情就到此為止了 哭了",
        buttons: [
          {
            label: "對，我就是那麼無情",
            onClick: () => sendRate(false),
          },
          {
            label: "再思考思考",
            role: "primary",
            style: "btn-primary",
          },
        ],
      });
    }

    const body = {
      featureCode: map[name].code,
      score: rate,
    };

    await authedFetch(`http://localhost:3000/api/student/rate`, {
      method: "POST",
      body: JSON.stringify(body),
    });

    setIsDefault(false);

    confetti({
      particleCount: 100, // 彩帶數量
      spread: 60, // 擴散角度
      origin: { y: 0.8 }, // 起始位置 (y 越小越靠上)
    });
    setTapTimes((prev) => prev + 1);
  };

  const getRate = async (): Promise<number> => {
    const res = await authedFetch(
      `http://localhost:3000/api/student/rate?feature=${map[name!].code}`
    );
    if (!res.success) {
      console.error(res);
    }
    return res.data;
  };

  useEffect(() => {
    const updateRate = async () => {
      const rate = await getRate();
      setIsDefault(false);
      setRate(rate);
    };

    if (!name || !isFuncName(name)) {
      showModal({
        title: "未知功能名稱",
        description: "不支援給定的功能名稱",
        showDismissButton: true,
      });
      return;
    }

    const baseButtons: NavbarButton[] = (
      ["back", "themeToggle"] as NavbarButtonType[]
    )
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    const title: NavbarButton = {
      placement: "center",
      order: 0,
      id: "upcoming_title",
      content: <p className="font-bold">{getName(name ?? "busschedule")}</p>,
    };

    setNavbarButtons([...baseButtons, title]);

    updateRate();
  }, []);

  return (
    <div className="px-4 flex join-vertical justify-center items-center min-h-screen bg-base-300">
      <div className="space-y-4">
        <h1 className="font-bold text-xl">功能即將到來，敬請期待！</h1>

        <div className="w-xs rounded-box bg-base-100 shadow-sm p-4">
          <div className="flex space-x-2 items-center">
            {map[name ?? "busschedule"].icon}
            <p className="font-semibold text-lg">
              {getName(name ?? "busschedule")}
            </p>
          </div>

          <div className="divider"></div>

          <p className="mt-2 mx-2">{map[name ?? "busschedule"].description}</p>

          <div className="divider"></div>

          <div className="flex items-center space-x-1">
            <p>您對此功能的期待程度？</p>

            <button onClick={showDescription} className="btn btn-xs btn-circle">
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full max-w-xs">
            <input
              type="range"
              min={1}
              max={5}
              value={`${rate}`}
              onChange={(e) => setRate(Number(e.target.value))}
              className={`range range-xs ${isDefault ? "" : "range-primary"}`}
              step={1}
            />
            <div className="flex justify-between px-2.5 mt-2 text-xs">
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
              <span>|</span>
            </div>
            <div className="flex justify-between px-2.5 mt-2 text-xs">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          <div className="flex w-full justify-end mt-4">
            <button
              onClick={() => sendRate()}
              className="btn btn-primary w-full"
            >
              送出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Upcoming;
