import { createContext, type ReactNode, useState, useContext } from "react";
import type { Student } from "../types/student";
import { Outlet } from "react-router-dom";

export interface StudentContextValue {
  setStudent: React.Dispatch<React.SetStateAction<Student>>;
  clearStudent: () => void;
  student: Student;
  id: string;
  setId: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  trustDevice: boolean;
  setTrustDevice: React.Dispatch<React.SetStateAction<boolean>>;
  clearData: () => void;
}

export const StudentContext = createContext<StudentContextValue | undefined>(
  undefined
);

export const StudentProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudent] = useState<Student>({
    sid: "",
    name: "",
    grade: "junior1",
    birthDate: "",
    enrollmentDate: "",
    enrollmentStatus: "enrolled",
    gender: "male",
    stream: "science",
    classLabel: "",
    classNumber: 0,
    credential: "",
  });
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);

  const clearStudent = () => {
    setStudent({
      sid: "",
      name: "",
      grade: "junior1",
      birthDate: "",
      enrollmentDate: "",
      enrollmentStatus: "enrolled",
      gender: "male",
      stream: "science",
      classLabel: "",
      classNumber: 0,
      credential: "",
    });
  };

  const clearData = () => {
    setId("");
    setPassword("");
    setTrustDevice(false);
    clearStudent();
  };

  return (
    <StudentContext.Provider
      value={{
        student,
        setStudent,
        clearStudent,
        id,
        setId,
        password,
        setPassword,
        trustDevice,
        setTrustDevice,
        clearData,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
};

export const useStudent = (): StudentContextValue => {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error("StudentContext MUST be used in StudentProvider");
  }
  return context;
};

export const SharedStudent = () => {
  return (
    <StudentProvider>
      <Outlet />
    </StudentProvider>
  );
};
