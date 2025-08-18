import learningPortfolioLinks from "@shared/jsons/learning-portfolio.json";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import { Adobe, FileUp } from "@icons";
import { Link } from "./More";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import { useEffect } from "react";

const icons: Record<string, React.ReactNode> = {
  Adobe: <Adobe className="w-6 h-6" />,
  FileUp: <FileUp />,
};

const LearningPortfolio = () => {
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
    setNavbarTitle("學習歷程");
  });
  return (
    <div className="min-h-screen bg-base-100 pt-18">
      <div role="alert" className="alert">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          className="stroke-info h-6 w-6 shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <span>12 unread messages. Tap to see.</span>
      </div>

      <ul className="pt-4 mx-auto w-full max-w-xl">
        {Object.entries(learningPortfolioLinks).map(([sectionTitle, links]) => (
          <div key={sectionTitle}>
            <SectionTitle title={sectionTitle} />
            <Section
              content={
                <>
                  {(links as any[]).map((item, i) => (
                    <Link
                      key={i}
                      icon={icons[item.icon]}
                      title={item.title}
                      link={item.link}
                    />
                  ))}
                </>
              }
            />
          </div>
        ))}
      </ul>
    </div>
  );
};

export default LearningPortfolio;
