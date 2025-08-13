import { useEffect, useState } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import Section from "../widgets/Section";
import {
  type Report,
  type ReportCategory,
  type ReportStatus,
} from "../types/student";
import { getReportCategoryText } from "./ReportEditor";
import { useNavigate } from "react-router-dom";
import {
  Clock3,
  Blocks,
  Bug,
  CircleX,
  CircleCheck,
  CircleMinus,
  Plus,
  Frame,
  Star,
  Lightbulb,
} from "@icons";

const ReportStatusIcon = ({ status }: { status: ReportStatus }) => {
  switch (status) {
    case "inProgress":
      return <Clock3 className="w-full h-full text-amber-300" />;
    case "closed":
      return <CircleX className="w-full h-full text-error" />;
    case "resolved":
      return <CircleCheck className="w-full h-full text-success" />;
    case "open":
      return <CircleMinus className="w-full h-full text-info" />;
  }
};

const getStatusText = (status: ReportStatus) => {
  switch (status) {
    case "inProgress":
      return "處理中";
    case "closed":
      return "已關閉";
    case "open":
      return "等待中";
    case "resolved":
      return "已解決";
  }
};

export const ReportCategoryIcon = ({
  category,
}: {
  category: ReportCategory;
}) => {
  switch (category) {
    case "bug":
      return <Bug width={12} />;
    case "ui":
      return <Frame width={12} />;
    case "feature_request":
      return <Star width={12} />;
    case "suggestion":
      return <Lightbulb width={12} />;
  }
};

const ReportListing = () => {
  const { setNavbarButtonsByType, setNavbarTitle } = useNavbarButtons();
  const [reports, setReports] = useState<Report[]>([]);
  const navigate = useNavigate();

  const toNewReport = () => {
    navigate("/report/new");
  };

  useEffect(() => {
    setNavbarButtonsByType(["back", "themeToggle"]);
    setNavbarTitle("回報");

    setReports([
      {
        id: "1",
        title: "成績頁面閃退",
        description:
          "你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好你好",
        category: "bug",
        featureId: "",
        feature: {
          id: "123",
          title: "某個功能",
          description: "",
          code: ":D",
          isUpcoming: false,
        },
        status: "inProgress",
        createdAt: new Date(),
      },
      {
        id: "1",
        title: "個人頁面打不開",
        description: "你好你好你好",
        category: "ui",
        featureId: "",
        status: "closed",
        createdAt: new Date(),
      },
      {
        id: "1",
        title: "突然被要求重新登入",
        description: "沃草怎麼就這麼崩了",
        category: "feature_request",
        featureId: "",
        status: "resolved",
        createdAt: new Date(),
      },
      {
        id: "1",
        title: "突然被要求重新登入",
        description: "沃草怎麼就這麼崩了",
        category: "suggestion",
        featureId: "",
        status: "open",
        createdAt: new Date(),
      },
    ]);
  }, []);

  return (
    <div className="min-h-screen bg-base-300 pt-18 flex justify-center">
      <ul className="pt-4 mx-auto w-full max-w-xl space-y-4 pb-30">
        {reports.map((report) => (
          <Section
            content={
              <div className="space-y-1 w-full">
                <div className="flex justify-between">
                  <div className="me-10">
                    <p className="text-lg font-semibold">{report.title}</p>
                    <p className="opacity-50 text-sm line-clamp-1">
                      {report.description}
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10">
                      <ReportStatusIcon status={report.status} />
                    </div>
                    <p className="opacity-40 text-xs whitespace-nowrap">
                      {getStatusText(report.status)}
                    </p>
                  </div>
                </div>

                <div className="divider"></div>

                <div className="flex space-x-2">
                  <div className="badge badge-soft badge-primary">
                    <Blocks width={12} />
                    {report.feature?.title || "未選擇"}
                  </div>

                  <div className="badge badge-soft badge-info">
                    <ReportCategoryIcon category={report.category} />
                    {getReportCategoryText(report.category)}
                  </div>
                </div>
              </div>
            }
          />
        ))}
      </ul>

      <button
        onClick={toNewReport}
        className="btn btn-circle w-16 h-16 btn-primary fixed bottom-6 right-6"
      >
        <Plus className="text-base-100 w-10 h-10" strokeWidth={2.5} />
      </button>
    </div>
  );
};

export default ReportListing;
