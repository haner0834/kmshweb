import { useEffect, useState, type ReactNode } from "react";
import { useNavbarButtons } from "../widgets/NavbarButtonsContext";
import Section from "../widgets/Section";
import SectionTitle from "../widgets/SectionTitle";
import type { Student } from "../types/student";
import { useAuthFetch } from "../auth/useAuthFetch";
import {
  getGradeText,
  getGenderText,
  getEnrollmentStatusText,
  getStreamText,
} from "../utils/student";
import {
  Person,
  IdCard,
  CalendarCheck,
  GraduationCap as GraduationHat,
  Venus,
  Mars,
  School,
  Users,
  Hash,
} from "@icons";

export const Row = ({
  icon,
  title = "",
  value = "",
}: {
  icon?: ReactNode;
  title?: string;
  value?: string | ReactNode;
}) => {
  return (
    <div className="items-center flex space-x-2">
      {icon}
      <p className="w-full flex">{title}</p>
      <div className="whitespace-nowrap">{value}</div>
    </div>
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
              <>
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
                    student?.enrollmentStatus ?? "enrolled"
                  )}`}
                />
              </>
            }
          />

          <SectionTitle title="班級" />
          <Section
            content={
              <>
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
              </>
            }
          />
        </ul>
      </div>
    </div>
  );
};

export default Profile;
