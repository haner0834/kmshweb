import { type SemesterSummary } from "../types/student";
import {
  NavbarButtonTypeMap,
  useNavbarButtons,
} from "../widgets/NavbarButtonsContext";
import { useEffect, useState } from "react";
import type { NavbarButton, NavbarButtonType } from "../widgets/Navbar";
import Section from "../widgets/Section";
import { useNavigate } from "react-router-dom";
import { useAuthFetch } from "../auth/useAuthFetch";
import { Info } from "@icons";
import { useModal } from "../widgets/ModalContext";

const SemesterContent = ({ semester }: { semester: SemesterSummary }) => {
  return (
    <div className="my-2 flex justify-between items-center">
      <div>
        {/* title */}
        <p className="whitespace-nowrap">{semester.shortenedTitle}</p>
        <p className="whitespace-nowrap opacity-50 text-xs">
          {semester.title + " " + semester.subtitle}
        </p>
        <p className="mt-4">
          平均：
          {semester.averageScore.toFixed(2)}
        </p>
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
  const { authedFetch } = useAuthFetch();

  const { showModal } = useModal();

  const showMoreModal = () => {
    showModal({
      title: "此處僅顯示已記錄於此系統之學期資訊",
      description:
        "由於遊戲，此處僅顯示在您登入本系統後，記錄於本系統之學期資訊。若是您希望查詢如「歷年學期成績」，請至原系統查詢。",
      showDismissButton: true,
    });
  };

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

    const a = async () => {
      try {
        const response = await authedFetch(
          "http://localhost:3000/api/student/summary/semesters"
        );

        if (!response.success) {
          console.error("Not available response");
          return;
        }

        setSemesterSummaries(response.data);
      } catch (error) {
        console.error("Failed to get semester summary.");
      }
    };

    a();
  }, []);

  return (
    <div className="w-screen flex join-vertical min-h-screen justify-start pt-16 bg-base-300">
      <ul className="space-y-4 pt-4">
        {semesterSummaries.map((summary) => (
          <SemesterCard key={summary.id} semester={summary} />
        ))}
      </ul>

      <div className="text-xs opacity-40 space-x-1 flex justify-center items-center w-full mt-10">
        <Info onClick={showMoreModal} className="w-3.5 h-3.5" />

        <p>
          此處僅顯示已記錄於此系統之學期資訊。
          <button onClick={showMoreModal} className="link">
            查看更多
          </button>
        </p>
      </div>
    </div>
  );
};

export default SemesterListing;
