import { EnrollmentStatus, Gender, Grade, Stream } from "@prisma/client"

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
