import { EnrollmentStatus, Gender, Grade, Stream } from "@prisma/client"
import { InternalError } from "./error.types"

export interface StudentData {
    sid: string
    name: string
    enrollmentStatus: EnrollmentStatus
    credential: string
    birthDate: Date
    graduationSchool: string
    enrollmentDate: Date
    gender: Gender
    stream: Stream
    grade: Grade
    classLabel: string
    classNumber: number
}

export const SENIOR_SID_LENGTH = 6
export const JUNIOR_SID_LENGTH = 7

const StudentLevel = {
    senior: "senior",
    junior: "junior"
} as const;

export type StudentLevel = (typeof StudentLevel)[keyof typeof StudentLevel];

export const convertToStudentLevel = (grade: Grade): StudentLevel => {
    if (grade.startsWith("junior")) return "junior"
    if (grade.startsWith("senior")) return "senior"
    throw new InternalError("Unknown grade")
}

export const getStudentLevel = (sidLength: number): StudentLevel => {
    if (sidLength === JUNIOR_SID_LENGTH) return "junior"
    if (sidLength === SENIOR_SID_LENGTH) return "senior"
    throw new InternalError("Unknown SID length")
}

export interface ExamSummary {
    id: string;
    name: string;
    averageScore: number | null;
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