export type Grade =
  | "junior1"
  | "junior2"
  | "junior3"
  | "senior1"
  | "senior2"
  | "senior3";

export type Gender = "male" | "female";

export type EnrollmentStatus =
  | "enrolled"
  | "suspended"
  | "graduated"
  | "withdraw";

export type Stream = "science" | "social" | "all" | "other";

export interface Student {
  sid: string;
  name: string;
  grade: Grade;
  birthDate: string;
  enrollmentDate: string;
  status: EnrollmentStatus;
  gender: Gender;
  stream: Stream;
  classLabel: string;
  classNumber: number;
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

export type DisciplinaryLevel =
  | "commendation"
  | "minorMerit"
  | "majorMerit"
  | "warning"
  | "minorDemerit"
  | "majorDemerit";

export interface DisciplinaryEvent {
  studentId: string;
  incidentDate: string;
  approvalDate: string;
  reason: string;
  type: DisciplinaryLevel;
  count: number;
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
  title: string;
  subtitle: string;
  shortenedTitle?: string;
  createAt: Date;
  sortOrder: number;
  studentId: string;
  classOfficer?: string;
  term: SemesterTerm;
  exams: Exam[];
}

export interface SemesterSummary {
  id: string;
  title: string;
  subtitle: string;
  shortenedTitle: string;
  exams: ExamSummary[];
  highestScore: number;
  lowestScore: number;
  averageScore: number;
  passRate: number;
}

interface ExamSummary {
  id: string;
  name: string;
  averageScore?: number;
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

export const subjects: Subject[] = [
  {
    id: "1",
    name: "國文",
    type: "nationalMandatory",
    credit: 4,
    score: "",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "2",
    name: "數學",
    type: "nationalMandatory",
    credit: 4,
    score: "95",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "3",
    name: "化學",
    type: "nationalMandatory",
    credit: 4,
    score: "98",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "4",
    name: "英文",
    type: "nationalMandatory",
    credit: 4,
    score: "92",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
];

const subjects2: Subject[] = [
  {
    id: "1",
    name: "國文",
    type: "nationalMandatory",
    credit: 4,
    score: "90",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "2",
    name: "數學",
    type: "nationalMandatory",
    credit: 4,
    score: "95",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "3",
    name: "化學",
    type: "nationalMandatory",
    credit: 4,
    score: "98",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "4",
    name: "英文",
    type: "nationalMandatory",
    credit: 4,
    score: "92",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "5",
    name: "化學",
    type: "otherElective",
    credit: 4,
    score: "98",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
  {
    id: "6",
    name: "英文",
    type: "schoolElective",
    credit: 4,
    score: "92",
    isCreditGained: true,
    examId: "1",
    sortOrder: 0,
  },
];

export const exams: Exam[] = [
  {
    id: "1",
    name: "一週",
    defaultOrder: 3,
    timeOrder: 0,
    type: "main",
    semesterId: "",
    subjects: subjects,
  },
  {
    id: "2",
    name: "一段",
    defaultOrder: 0,
    timeOrder: 1,
    type: "main",
    semesterId: "",
    subjects: subjects2,
  },
  {
    id: "3",
    name: "二週",
    defaultOrder: 4,
    timeOrder: 2,
    type: "main",
    semesterId: "",
    subjects: subjects,
  },
  {
    id: "4",
    name: "二段",
    defaultOrder: 1,
    timeOrder: 3,
    type: "main",
    semesterId: "",
    subjects: subjects2,
  },
  {
    id: "5",
    name: "三週",
    defaultOrder: 2,
    timeOrder: 4,
    type: "main",
    semesterId: "",
    subjects: subjects,
  },
  {
    id: "6",
    name: "三段",
    defaultOrder: 5,
    timeOrder: 5,
    type: "main",
    semesterId: "",
    subjects: subjects,
  },
  {
    id: "7",
    name: "一週",
    defaultOrder: 3,
    timeOrder: 0,
    type: "main",
    semesterId: "",
    subjects: subjects,
  },
  {
    id: "8",
    name: "一段",
    defaultOrder: 0,
    timeOrder: 1,
    type: "main",
    semesterId: "",
    subjects: subjects2,
  },
  {
    id: "12",
    name: "學期總成績",
    defaultOrder: 4,
    timeOrder: 2,
    type: "main",
    semesterId: "",
    subjects: subjects2,
  },
];

export const semesters: Semester[] = [
  {
    id: "1",
    title: "一一四學年",
    subtitle: "第一學期",
    shortenedTitle: "高二上",
    createAt: new Date(),
    sortOrder: 0,
    studentId: "111",
    term: "first",
    exams: exams,
  },
  {
    id: "2",
    title: "一一四學年",
    subtitle: "第二學期",
    shortenedTitle: "高二下",
    createAt: new Date(),
    sortOrder: 2,
    studentId: "111",
    term: "second",
    exams: [],
  },
  {
    id: "3",
    title: "一一五學年",
    subtitle: "第一學期",
    shortenedTitle: "高三上",
    createAt: new Date(),
    sortOrder: 3,
    studentId: "111",
    term: "first",
    exams: [],
  },
  {
    id: "4",
    title: "一一五學年",
    subtitle: "第二學期",
    shortenedTitle: "高三下",
    createAt: new Date(),
    sortOrder: 4,
    studentId: "111",
    term: "second",
    exams: [],
  },
];

export const semesterSummarys: SemesterSummary[] = [
  {
    id: "1",
    title: "一一四學年",
    subtitle: "第一學期",
    shortenedTitle: "高二上",
    exams: exams.map((exam) => ({
      id: exam.id,
      name: exam.name,
      averageScore: exam.subjects
        ? exam.subjects
            .map((s) => Number(s.score) ?? 0)
            .reduce((p, s) => s + p, 0) / exam.subjects.length
        : 0,
    })),
    highestScore: 0,
    lowestScore: 0,
    averageScore: 0,
    passRate: 0,
  },
  {
    id: "2",
    title: "一一四學年",
    subtitle: "第二學期",
    shortenedTitle: "高二下",
    exams: [],
    highestScore: 0,
    lowestScore: 0,
    averageScore: 0,
    passRate: 0,
  },
  {
    id: "3",
    title: "一一五學年",
    subtitle: "第一學期",
    shortenedTitle: "高三上",
    exams: [],
    highestScore: 0,
    lowestScore: 0,
    averageScore: 0,
    passRate: 0,
  },
  {
    id: "4",
    title: "一一五學年",
    subtitle: "第二學期",
    shortenedTitle: "高三下",
    exams: [],
    highestScore: 0,
    lowestScore: 0,
    averageScore: 0,
    passRate: 0,
  },
];
