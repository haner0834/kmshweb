import { useEffect, useState } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import type { Feature, ReportCategory } from "../types/student";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import { Row } from "./Profile";
import { useModal } from "../widgets/ModalContext";

export const getReportCategoryText = (category: ReportCategory) => {
  switch (category) {
    case "bug":
      return "Bug";
    case "ui":
      return "畫面";
    case "feature_request":
      return "功能期許";
    case "suggestion":
      return "建議";
  }
};

const ReportEditor = () => {
  const { setNavbarButtonsByType } = useNavbarButtons();
  const [features, setFeatures] = useState<Feature[]>([]);
  const { showModal } = useModal();
  const [categories] = useState<ReportCategory[]>([
    "bug",
    "ui",
    "feature_request",
    "suggestion",
  ]);

  const [problemTitle, setProblemTitle] = useState("");
  const [problemDescription, setProblemDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | "">(
    ""
  );
  const [selectedFeatureId, setSelectedFeatureId] = useState("");
  const [showHint, setShowHint] = useState(false);

  const getFeatures = async () => {
    setFeatures([
      {
        id: "1",
        title: "學習歷程",
        code: "LEARNING_PORTFOLIO",
        description:
          "將會整合上傳、壓縮等繁瑣的操作為一體，並結合AI生成心得，省下您寶貴的時間。",
        isUpcoming: true,
      },
      {
        id: "2",
        title: "成績查詢",
        code: "EXAM_SCORE",
        description: ":D",
        isUpcoming: true,
      },
    ]);
  };

  const askForClear = () => {
    showModal({
      title: "清除表單",
      description: "此操作無法還原，確認清除？",
      buttons: [
        {
          label: "取消",
        },
        {
          label: "清除",
          role: "error",
          style: "btn-error",
          onClick: handleClear,
        },
      ],
    });
  };

  const handleClear = () => {
    setProblemTitle("");
    setProblemDescription("");
    setSelectedCategory("");
    setSelectedFeatureId("");
  };

  const handleSubmit = () => {
    if (
      !problemTitle ||
      !problemDescription ||
      !selectedCategory ||
      !selectedFeatureId
    ) {
      setShowHint(true);
      return;
    }
  };

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
    getFeatures();
  }, []);

  return (
    <div className="min-h-screen bg-base-300 pt-18 flex justify-center">
      <ul className="pt-4 mx-auto w-full max-w-xl">
        <Section
          content={
            <div className="space-y-1">
              <p className="text-lg font-semibold">問題回報</p>
              <p className="opacity-50 text-sm">
                請將您遇到的問題詳細描述，以便開發組提供更好的解決方案與服務。
              </p>
            </div>
          }
        />

        <SectionTitle title="問題描述" />

        <Section
          content={
            <div className="space-y-2">
              <p>請描述您遇到的問題</p>
              <input
                type="text"
                className={`input w-full ${
                  showHint && !problemTitle ? "border-error" : ""
                }`}
                placeholder="例：點開成績看不到東西"
                value={problemTitle}
                maxLength={50}
                onChange={(e) => setProblemTitle(e.target.value)}
              />

              <textarea
                className={`textarea w-full mt-2 ${
                  showHint && !problemDescription ? "border-error" : ""
                }`}
                maxLength={200}
                placeholder="詳細描述您遇到的問題"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
              ></textarea>
            </div>
          }
        />

        <SectionTitle title="類別" />

        <Section
          content={
            <Row
              title="回報類別為"
              value={
                <select
                  className={`select w-auto ${
                    showHint && !selectedCategory ? "select-error" : ""
                  }`}
                  value={selectedCategory || ""}
                  onChange={(e) =>
                    setSelectedCategory(e.target.value as ReportCategory)
                  }
                >
                  <option value="" disabled>
                    選擇類別
                  </option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {getReportCategoryText(category)}
                    </option>
                  ))}
                </select>
              }
            />
          }
        />

        <SectionTitle title="功能" />

        <Section
          content={
            <Row
              title="具體是哪個功能出現問題"
              value={
                <select
                  className={`select w-auto ${
                    showHint && !selectedFeatureId ? "select-error" : ""
                  }`}
                  value={selectedFeatureId || ""}
                  onChange={(e) => setSelectedFeatureId(e.target.value)}
                >
                  <option value="" disabled>
                    選擇功能
                  </option>
                  {features.map((feature) => (
                    <option key={feature.id} value={feature.id}>
                      {feature.title}
                    </option>
                  ))}
                </select>
              }
            />
          }
        />

        <div className="m-4 flex justify-between">
          <button className="btn btn-ghost" onClick={askForClear}>
            清空表單
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            送出
          </button>
        </div>
      </ul>
    </div>
  );
};

export default ReportEditor;
