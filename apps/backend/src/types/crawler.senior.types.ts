import { Exam, Semester, Subject } from "@prisma/client";

export const FncType = {
    scoreTable: { id: '010090' },
    userProfile: { id: '010210' },
    disciplinary: { id: '010040' },
} as const

export type FncTypeKey = keyof typeof FncType

export interface SeniorLoginData {
    sid: string;
    password: string;
}

export type SemesterWithDetails = Semester & {
    exams: (Exam & {
        subjects: Subject[]
    })[]
}
