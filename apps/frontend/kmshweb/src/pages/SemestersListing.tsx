import { semesterSummarys, type SemesterSummary } from "../types/student";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import { useEffect, useState } from "react";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import Section from "../widgets/Section";
import { useNavigate } from "react-router-dom";

const SemesterContent = ({ semester }: { semester: SemesterSummary }) => {
  return (
    <div className="my-2 flex justify-between items-center">
      <div>
        {/* title */}
        <p className="whitespace-nowrap">{semester.shortenedTitle}</p>
        <p className="whitespace-nowrap opacity-50 text-xs">
          {semester.title + " " + semester.subtitle}
        </p>
        <p className="mt-4">平均：{semester.averageScore}</p>
        <p className="">通過率：{(semester.passRate * 100).toFixed(2)}%</p>
      </div>
    </div>
  );
};

const SemesterCard = ({ semester }: { semester: SemesterSummary }) => {
  const navigate = useNavigate();
  const select = () => {
    if (!semester.exams || !semester.exams[0]?.id) {
      // if the exams is empty, go to 404 page
      navigate("/404");
    } else {
      navigate(`/examscore?examid=${semester.exams[0]?.id}`);
    }
  };

  return (
    <ul
      className="max-w-2xl mx-auto hover:scale-102 duration-200"
      onClick={select}
    >
      <Section content={<SemesterContent semester={semester} />} />
    </ul>
  );
};

const SemesterListing = () => {
  const { setNavbarButtons } = useNavbarButtons();
  const [semesterSummaries, setSemesterSummaries] = useState<SemesterSummary[]>(
    []
  );

  useEffect(() => {
    const baseButtons: NavbarButton[] = (["back"] as NavbarButtonType[])
      .map((type) => NavbarButtonTypeMap.get(type))
      .filter(Boolean) as NavbarButton[];

    const title: NavbarButton = {
      placement: "center",
      id: "semesterlisting_title",
      content: <p className="font-semibold">學期</p>,
    };
    setNavbarButtons([...baseButtons, title]);

    // TODO: Use correct api
    setSemesterSummaries(semesterSummarys);
  }, []);

  return (
    <div className="w-screen flex join-vertical min-h-screen justify-start pt-16 bg-base-300">
      <ul className="space-y-4 pt-4">
        {semesterSummaries.map((summary) => (
          <SemesterCard key={summary.id} semester={summary} />
        ))}
      </ul>

      <p className="text-xs opacity-40 w-full text-center mt-10">
        註：此處僅顯示已記錄於此系統之學期資料
      </p>
    </div>
  );
};

export default SemesterListing;
