import { useEffect, useState, type ReactNode } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import Person from "@shared/icons/person.svg?react";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import IdCard from "@shared/icons/id-card.svg?react";
import CalendarCheck from "@shared/icons/calendar-check.svg?react";
import GraduationHat from "@shared/icons/graduation-cap.svg?react";
import Venus from "@shared/icons/venus.svg?react";
import Mars from "@shared/icons/mars.svg?react";
import School from "@shared/icons/school.svg?react";
import Users from "@shared/icons/users.svg?react";
import Hash from "@shared/icons/hash.svg?react";
import type {
  EnrollmentStatus,
  Gender,
  Grade,
  Stream,
  Student,
} from "../types/student";
import { useAuthFetch } from "../auth/useAuthFetch";

const getGenderText = (gender: Gender): string => {
  switch (gender) {
    case "female":
      return "女";
    case "male":
      return "男";
    default:
      return "wtf";
  }
};

const getGradeText = (grade: Grade): string => {
  switch (grade) {
    case "junior1":
      return "國一";
    case "junior2":
      return "國二";
    case "junior3":
      return "國三";
    case "senior1":
      return "高一";
    case "senior2":
      return "高二";
    case "senior3":
      return "高三";
    default:
      return "wtf";
  }
};

const getEnrollmentStatusText = (status: EnrollmentStatus): string => {
  switch (status) {
    case "enrolled":
      return "在學中";
    case "graduated":
      return "已畢業";
    case "suspended":
      return "休學";
    case "withdraw":
      return "退學";
  }
};

const getStreamText = (stream: Stream): string => {
  switch (stream) {
    case "all":
      return "不分組";
    case "science":
      return "自然組";
    case "social":
      return "社會組";
    case "other":
      return "虫合組";
  }
};

const Row = ({
  icon,
  title = "",
  value = "",
}: {
  icon: ReactNode;
  title?: string;
  value?: string;
}) => {
  return (
    <li className="my-3 ms-2 items-center flex space-x-2">
      {icon}
      <p className="w-full flex">{title}</p>
      <div className="whitespace-nowrap">{value}</div>
    </li>
  );
};

const Profile = () => {
  const [student, setStudent] = useState<Student | null>();
  const { setNavbarButtonsByType } = useNavbarButtons();
  const { authedFetch } = useAuthFetch();

  useEffect(() => {
    setNavbarButtonsByType(["back"]);

    const a = async () => {
      const response = await authedFetch(
        "http://localhost:3000/api/student/profile"
      );

      if (!response.success) {
        console.error("Failed to get available response.");
        return;
      }

      setStudent(response.data);
    };

    a();
  }, []);

  return (
    <div className="pt-16 bg-base-300 min-h-screen w-full flex justify-center">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex p-4 pt-6 space-x-4 items-center">
          <div className="w-16 h-16 flex items-center rounded-4xl justify-center bg-gray-400">
            <Person className="w-11 h-11 text-base-100" />
          </div>
          <div>
            <p className="font-semibold text-lg">{student?.name}</p>
            <p className="opacity-50 text-sm">
              {getGradeText(student?.grade ?? "junior1")} ·{" "}
              {student?.classLabel}
            </p>
          </div>
        </div>
        <ul>
          <SectionTitle title="基本資料" />
          <Section
            content={
              <ul>
                <Row
                  icon={
                    student?.gender === "male" ? (
                      <Mars className="w-7" />
                    ) : (
                      <Venus className="w-7" />
                    )
                  }
                  title="性別"
                  value={`${getGenderText(student?.gender ?? "female")}`}
                />
                <Row
                  icon={<IdCard className="w-7 h-7" />}
                  title="學號"
                  value={`${student?.sid}`}
                />
                <Row
                  icon={<CalendarCheck className="w-7 h-7" />}
                  title="入學日期"
                  value={`${new Date(
                    student?.enrollmentDate ?? ""
                  ).toLocaleDateString("zh-TW")}`}
                />
                <Row
                  icon={<GraduationHat className="w-7 h-7" />}
                  title="就學狀態"
                  value={`${getEnrollmentStatusText(
                    student?.status ?? "enrolled"
                  )}`}
                />
              </ul>
            }
          />

          <SectionTitle title="班級" />
          <Section
            content={
              <ul>
                <Row
                  icon={<School className="w-7 h-7" strokeWidth={1.75} />}
                  title="年級"
                  value={`${getGradeText(student?.grade ?? "junior1")}`}
                />
                <Row
                  icon={<Hash className="w-7 h-7" strokeWidth={1.75} />}
                  title="班級"
                  value={`${student?.classLabel} (${student?.classNumber})`}
                />
                <Row
                  icon={<Users className="w-7 h-7" />}
                  title="組別"
                  value={`${getStreamText(student?.stream ?? "all")}`}
                />
              </ul>
            }
          />
        </ul>
      </div>
    </div>
  );
};

export default Profile;
