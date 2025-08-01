import { useEffect, useState } from "react";
import {
  exams,
  getSubjectTypeName,
  type Exam,
  type Subject,
} from "../types/student";
import "../App.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useModal } from "../widgets/ModalContext";
import MenuIcon from "@shared/icons/menu.svg?react";
import ChevronRight from "@shared/icons/chevron_right.svg?react";
import CheckMark from "@shared/icons/checkmark.svg?react";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import ResponsiveSheet from "../widgets/ResponsiveSheet";
import { useDevice } from "../widgets/DeviceContext";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import BackButton from "../widgets/BackButton";

interface ExamTabsProps {
  exams: Exam[];
}

const DisplayDataMap = {
  score: "分數",
  ranking: "排名",
  average: "平均",
};

type DisplayData = keyof typeof DisplayDataMap;

const getDisplayDataName = (type: DisplayData) => {
  return DisplayDataMap[type];
};

const ExamTabs: React.FC<ExamTabsProps> = ({ exams }) => {
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();

  const select = (id: string) => {
    setSelectedExamId(id);
    searchParams.set("examid", id);
    setSearchParams(searchParams, { replace: true });
  };

  useEffect(() => {
    const examId = searchParams.get("examid");
    if (!examId) {
      select(exams[0]?.id ?? "");
    } else {
      setSelectedExamId(examId);
    }
  }, [searchParams]); // Occured everytime the query changed

  return (
    <div className="overflow-x-auto hide-scrollbar bg-base-100">
      <div className="flex justify-center space-x-4 border-b border-base-300 w-max min-w-full px-2">
        {exams.map((exam) => {
          const isSelected = exam.id === selectedExamId;
          return (
            <button
              key={exam.id}
              onClick={() => select(exam.id)}
              className={`relative px-3 py-2 text-sm whitespace-nowrap ${
                isSelected ? "opacity-100" : ""
              } hover:opacity-80 cursor-pointer opacity-50`}
            >
              <span
                className={`transition-colors whitespace-nowrap ${
                  isSelected ? "text-primary opacity-100 font-semibold" : ""
                }`}
              >
                {exam.name}
              </span>
              <div
                className={`absolute left-1/2 -translate-x-1/2 bottom-0 h-[3px] rounded-full bg-primary transition-all duration-300 ${
                  isSelected ? "w-8 opacity-100" : "w-0 opacity-0"
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const OptionalText = ({
  text,
  children,
}: {
  text?: any;
  children: React.ReactNode;
}) => {
  return (
    <p
      className={`me-2 ${!text ? "opacity-50 whitespace-nowrap text-xs" : ""}`}
    >
      {!text ? "尚無資料" : children}
    </p>
  );
};

const SubjectsDisplay = ({
  subjects,
  displayData,
}: {
  subjects: Subject[];
  displayData: DisplayData;
}) => {
  // basically, the subjects are sorted by backend, so what we need to do is only categorize them by `type`.
  const [categorizedSubjects, setCategorizedSubjects] = useState(
    () => new Map()
  );
  const [searchParams] = useSearchParams();
  const { isMobile } = useDevice();

  // get config from localStorage

  useEffect(() => {
    // iterate through all subjects, categorize them
    const map = new Map<string, Subject[]>();
    for (const subject of subjects) {
      map.set(getSubjectTypeName(subject.type), [
        ...(map.get(getSubjectTypeName(subject.type)) ?? []),
        subject,
      ]);
    }
    setCategorizedSubjects(map);
  }, [searchParams]);

  return (
    <ul className="space-y-4">
      {[...categorizedSubjects.entries()].map(
        ([type, subjects]: [string, Subject[]]) => (
          <Section
            key={type}
            title={type}
            itemTitles={
              isMobile
                ? [getDisplayDataName(displayData)]
                : ["排名", "班平均", "分數"]
            }
            content={subjects.map((subject) => (
              <li
                key={subject.id}
                className="ms-4 flex my-3 items-center justify-end"
              >
                <p className={isMobile ? "w-full" : "basis-1/4"}>
                  {subject.name}
                </p>

                {(!isMobile || displayData === "ranking") && (
                  <div className="basis-1/4 flex items-center justify-end">
                    <OptionalText text={subject.classRanking}>
                      <p>{subject.classRanking ?? 0}</p>

                      <p className="opacity-50 text-sm ms-1">
                        / {subject.rankingCount ?? 0}
                      </p>
                    </OptionalText>
                  </div>
                )}

                {(!isMobile || displayData === "average") && (
                  <div className="basis-1/4 flex items-end justify-end">
                    <OptionalText text={subject.classAverage}>
                      {subject.classAverage ?? 0}
                    </OptionalText>
                  </div>
                )}

                {(!isMobile || displayData === "score") && (
                  <div className="whitespace-nowrap basis-1/4 flex items-center justify-end">
                    <p
                      className={`me-2 ${
                        subject.score === ""
                          ? "opacity-50 whitespace-nowrap text-xs"
                          : ""
                      }`}
                    >
                      {subject.score === "" ? "尚無資料" : subject.score}
                    </p>
                    <p className="opacity-50">×{subject.credit}</p>
                  </div>
                )}
              </li>
            ))}
          />
        )
      )}
    </ul>
  );
};

const MenuToggle = ({ onClick }: { onClick: () => void }) => {
  return (
    <div onClick={onClick} className="btn btn-square btn-ghost">
      <MenuIcon className="w-6 h-6 text-neutral" />
    </div>
  );
};

const DisplayDataDropdown = ({
  displayData,
  setDisplayData,
}: {
  displayData: DisplayData;
  setDisplayData: (data: DisplayData) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className={`dropdown dropdown-end ${isOpen ? "dropdown-open" : ""}`}
      onBlur={() => setIsOpen(false)}
    >
      <div
        tabIndex={0}
        role="button"
        className="btn btn-ghost m-1 flex items-center"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <p className="whitespace-nowrap">{getDisplayDataName(displayData)}</p>

        <ChevronRight
          className={`transition-transform w-4 h-4 duration-300 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </div>
      <ul
        tabIndex={0}
        className="menu dropdown-content bg-base-100 rounded-box z-1 w-52 p-2 shadow-md"
      >
        {(Object.keys(DisplayDataMap) as DisplayData[]).map((data) => (
          <li onClick={() => setDisplayData(data)}>
            <div className="flex items-center justify-between w-full">
              <p className="flex-1 text-start">{getDisplayDataName(data)}</p>

              {data === displayData && <CheckMark className="w-4 h-4" />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

const SheetContent = ({
  displayData,
  setDisplayData,
}: {
  displayData: DisplayData;
  setDisplayData: (data: DisplayData) => void;
}) => {
  const { isMobile } = useDevice();

  return (
    <div className="w-full items-start justify-start px-2 space-y-4">
      {isMobile && (
        <div className="flex items-center">
          <p className="w-full">顯示資料</p>

          <DisplayDataDropdown
            displayData={displayData}
            setDisplayData={setDisplayData}
          />
        </div>
      )}
    </div>
  );
};

const SemesterTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center" onClick={() => navigate("/semesters")}>
      <div className="join-vertical flex justify-center items-center">
        <p className="font-bold text-sm">{title}</p>
        <p className="opacity-60 text-xs">{subtitle}</p>
      </div>

      <ChevronRight className="w-6 h-6" />
    </div>
  );
};

const summaryItems = (exam: Exam) => [
  {
    id: "average_score_no_weighted",
    name: "平均分",
    value: exam.totalScore,
  },
  {
    id: "average_score_weighted",
    name: "平均分（加權）",
    value: exam.totalScore,
  },
  {
    id: "total_score_no_weighted",
    name: "總分",
    value: exam.totalScore,
  },
  {
    id: "total_score_weighted",
    name: "總分（加權）",
    value: exam.totalWeightedScore,
  },
];

const rankingItems = (exam: Exam) => [
  {
    id: "ranking_class",
    name: "班排",
    value: exam.classRanking,
  },
  {
    id: "ranking_stream",
    name: "組排",
    value: exam.streamRanking,
  },
];

const ExamScore = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { showModal } = useModal();
  const navigate = useNavigate();
  const { setNavbarButtons } = useNavbarButtons();
  const [isSheetOn, setIsSheetOn] = useState(false);
  const [displayData, setDisplayData] = useState<DisplayData>("score");

  const examId = searchParams.get("examid");
  const getExam = (): Exam | undefined => {
    // TODO: Get this from kmshweb.com/api/student/exams?id=${examId}
    return exams.find((exam) => exam.id === examId);
  };

  const exam = getExam();

  const showAlert = () => {
    const isXSSAttack = examId?.includes("<") || examId?.includes(">");
    if (!isXSSAttack) {
      showModal({
        // title: "Exam Not Found or Access Denied",
        // description: `No exam was found with the ID "${examId}", or you don't have the permissions to access it.`,
        title: "Exam Not Found",
        description: `ID "${examId}" is invalid or you lack access.`,
        showDismissButton: false,
        buttons: [
          {
            label: "Cancel",
            role: "default",
            style: "",
            onClick: () => {
              searchParams.set("examid", exams[0]?.id ?? "");
              setSearchParams(searchParams);
            },
          },
          {
            label: "Home",
            role: "primary",
            style: "btn-primary",
            onClick: () => navigate("/home"),
          },
        ],
      });
    } else {
      showModal({
        title: "Bro Don't do that",
        description: `My website is opensource, please go to GitHub and make your own contribution.
          Make sure you read CONTRIBUTING.md before contribution.`,
        buttons: [
          {
            label: "Home",
            role: "default",
            style: "",
            onClick: () => navigate("/home"),
          },
          {
            label: "GitHub",
            role: "primary",
            style: "btn-primary",
            onClick: () =>
              (window.location.href =
                "https://github.com/haner0834/kmshweb/blob/main/CONTRIBUTING.md"),
          },
        ],
      });
    }
  };

  useEffect(() => {
    // If the exam id not specified, not to show the alert
    if (!exam && examId) {
      showAlert();
    }
  }, [searchParams]);

  useEffect(() => {
    const baseButtons: NavbarButton[] = ([] as NavbarButtonType[])
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    const menuToggleButton: NavbarButton = {
      placement: "end",
      order: 100,
      id: "navbar_menu_toggle",
      content: (
        <MenuToggle
          onClick={() => {
            console.log("hello");
            setIsSheetOn(true);
          }}
        />
      ),
    };

    const backButton: NavbarButton = {
      placement: "start",
      order: 0,
      id: "back_button",
      content: <BackButton />,
    };

    const title: NavbarButton = {
      placement: "center",
      order: 0,
      id: "semester_title",
      // TODO: Use real semester got from backend
      content: <SemesterTitle title="一一四學年" subtitle="第一學期" />,
    };

    setNavbarButtons([...baseButtons, menuToggleButton, backButton, title]);
  }, []);

  // TODO: Then, fetch exams from kmshweb.com/api/student/semester/current/examlist

  return (
    <div className="w-screen flex join-vertical min-h-screen justify-start pt-18 bg-base-300">
      <ExamTabs exams={exams} />

      {exam && (
        <div className="mb-30 w-full flex flex-col items-center justify-center">
          <div className="w-full max-w-2xl">
            <SectionTitle title="科目" />

            <SubjectsDisplay
              subjects={exam.subjects}
              displayData={displayData}
            />

            <SectionTitle title="總結" />

            <ul className="space-y-4">
              <Section
                content={summaryItems(exam).map((item) => (
                  <li
                    key={item.id}
                    className="ms-4 flex my-3 me-2 items-center"
                  >
                    <p className="w-full flex">{item.name}</p>
                    <p
                      className={
                        item.value ? "" : "opacity-50 whitespace-nowrap text-xs"
                      }
                    >
                      {item.value ?? "尚無資料"}
                    </p>
                  </li>
                ))}
              />
            </ul>

            <SectionTitle title="排名" />

            <ul className="space-y-4">
              <Section
                content={rankingItems(exam).map((item) => (
                  <li
                    key={item.id}
                    className="ms-4 flex my-3 me-2 items-center"
                  >
                    <p className="w-full flex">{item.name}</p>
                    <div
                      className={
                        item.value ? "" : "opacity-50 whitespace-nowrap text-xs"
                      }
                    >
                      {item.value ?? "尚無資料"}
                    </div>
                  </li>
                ))}
              />
            </ul>
          </div>
        </div>
      )}

      <ResponsiveSheet
        isOn={isSheetOn}
        height="2/5"
        onClose={() => {
          setIsSheetOn(false);
        }}
      >
        <SheetContent
          displayData={displayData}
          setDisplayData={setDisplayData}
        />
      </ResponsiveSheet>
    </div>
  );
};

export default ExamScore;
