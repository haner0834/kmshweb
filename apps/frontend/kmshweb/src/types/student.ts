export type Grade =
  | "junior1"
  | "junior2"
  | "junior3"
  | "senior1"
  | "senior2"
  | "senior3";

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  birthDate: Date;
  enrollmentDate: Date;
  status: string;
  credential: string;
}

export type NotificationType = "update" | "warning" | "other";

export type NotificationIcon = "score" | "auth" | "bus" | "disciplinary";

export interface Notification {
  id: string;
  title: string;
  type: NotificationType;
  icon: NotificationIcon;
  path: string;
  isRead: boolean;
}

const SubjectType = {
  nationalMandatory: {
    tag: "nationalMandatory",
    name: "部訂必修",
  },
  schoolMandatory: {
    tag: "schoolMandatory",
    name: "校訂必修",
  },
  schoolElective: {
    tag: "schoolElective",
    name: "選修-多元選修",
  },
  otherElective: {
    tag: "otherElective",
    name: "選修-其他",
  },
  unknown: {
    tag: "unknown",
    name: "未知",
  },
} as const;

export type SubjectType = (typeof SubjectType)[keyof typeof SubjectType]["tag"];

export const getSubjectTypeName = (type: SubjectType): string => {
  return SubjectType[type].name;
};

export interface Subject {
  id: string;
  name: string;
  classRanking?: number;
  rankingCount?: number;
  classAverage?: number;
  type: SubjectType;
  credit: number;
  score: string;
  isCreditGained: boolean;
  examId: string;
  sortOrder: number;
}

export type SemesterTerm = "first" | "second";

export interface Semester {
  id: string;
  name: string;
  createAt: Date;
  sortOrder: number;
  studentId: string;
  classOfficer?: string;
  term: SemesterTerm;
  exams: Exam[];
}

export interface Exam {
  id: string;
  name: string;
  defaultOrder: number;
  timeOrder: number;
  type: ExamType;
  totalScore?: number;
  totalWeightedScore?: number;
  averageScore?: number;
  weightedAverageScore?: number;
  classRanking?: number;
  streamRanking?: number;
  gradeRanking?: number;
  semesterId: string;
  subjects: Subject[];
}

export type ExamType = "main" | "weekly" | "other";
