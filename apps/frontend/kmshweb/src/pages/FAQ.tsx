import { useEffect } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import FaqJson from "@shared/jsons/faq.json";

const FAQ = () => {
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
    setNavbarTitle("常見問題");
  }, []);

  return (
    <div className="bg-base-200 pt-22 min-h-screen p-4 pb-20">
      {Object.entries(FaqJson).map(([key, faqs], index) => (
        <div className="mb-4 space-y-2">
          <p className="text-lg font-bold">{key}</p>

          {faqs.map(({ question, answer }, index) => (
            <div
              tabIndex={index}
              className="collapse collapse-arrow bg-base-100 border-base-300 border"
            >
              <div className="collapse-title font-semibold">{question}</div>
              <div className="collapse-content text-sm">{answer}</div>
            </div>
          ))}

          {index + 1 !== Object.keys(FaqJson).length && (
            <div className="divider" />
          )}
        </div>
      ))}
    </div>
  );
};
export default FAQ;
