import { Request, Response } from "express";
import prisma from "../config/database";
import * as studentService from "../services/student.service"
import { StudentData } from "../types/student.types";
import { decryptUek, decryptWithUek } from "../utils/crypto.utils";
import { AuthRequest } from "../types/auth.types";
import { Prisma } from "@prisma/client";

// MARK: Student Profile

/**
 * Get student profile from DB.
 * @param req Express Request object, expects `sid` in the query.
 * @param res Express Response object.
 * @returns void
 */
export const getStudentProfileHandler = async (req: Request, res: Response) => {
    // Get student data from DB, instead of require it from old site.
    const sid = req.query.sid as string

    if (!sid) {
        res.status(400).json("SID is required.")
        return
    }

    const student = await prisma.student.findUnique({
        where: { id: sid },
        include: {
            class: true
        }
    })

    if (!student) {
        res.status(404).json({ message: "Couldn't find student." })
        return
    }

    const studentData: StudentData = {
        sid: student.id,
        name: student.name,
        enrollmentStatus: student.status,
        credential: student.credential,
        birthDate: student.birthDate,
        graduationSchool: student.graduationSchool,
        enrollmentDate: student.enrollmentDate,
        gender: student.gender,
        stream: student.class.stream,
        grade: student.class.grade,
        classLabel: student.class.name,
        classNumber: student.class.number
    }

    res.status(200).json(studentData)
}

/**
 * Get student profile from old site and update.
 * @param req Express Request object, expects `sid` in the query.
 * @param res Express Response object.
 * @returns void
 */
export const getStudentProfileAndUpdateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const sid = req.student?.id
    if (!sid) {
        res.status(400).json({ message: "SID is reuquired." })
        return
    }

    const secureData = await prisma.student.findUnique({
        where: { id: sid },
        select: {
            password: true,
            encryptedUek: true
        }
    })

    if (!secureData) {
        res.status(404).json({ message: "Student doesn't exist." })
        return
    }

    const uek = decryptUek(Buffer.from(secureData.encryptedUek))
    if (!uek) {
        res.status(500).json({ message: "Failed to decrypt UEK." })
        return
    }
    const plaintextPassword = decryptWithUek(Buffer.from(secureData.password), uek)
    if (!plaintextPassword) {
        res.status(500).json({ message: "Failed to decrypt password." })
        return
    }

    const studentData = await studentService.getStudentDataFromOldSite(sid, plaintextPassword!)

    await prisma.$transaction(async (tx) => {
        const existingClass = await tx.schoolClass.upsert({
            where: {
                unique_class_key: {
                    grade: studentData.grade,
                    stream: studentData.stream,
                    name: studentData.classLabel
                }
            },
            update: {},
            create: {
                name: studentData.classLabel,
                stream: studentData.stream,
                grade: studentData.grade,
                number: studentData.classNumber
            }
        })

        // Update student data
        await tx.student.update({
            where: { id: sid },
            data: {
                name: studentData.name,
                birthDate: studentData.birthDate,
                status: studentData.enrollmentStatus,
                credential: studentData.credential,
                graduationSchool: studentData.graduationSchool,
                enrollmentDate: studentData.enrollmentDate,
                gender: studentData.gender,
                classId: existingClass.id
            }
        })
    })

    res.status(200).json(studentData)
}

// MARK: Scores

/**
 * Get all semester of the student.
 * @param req Express Request object, expects `includeExams`, `includeSubjects` in the query.
 * @param res Express Response object.
 * @returns void
 */
export const getSemestersHandler = async (req: AuthRequest, res: Response) => {
    const includeExams = req.query.includeExams === "true"
    const includeSubjects = req.query.includeSubjects === "true"

    const studentPayload = req.student
    if (!studentPayload) {
        res.sendStatus(400)
        return
    }

    const include: Prisma.SemesterInclude = {}

    if (includeExams) {
        include.exams = {
            orderBy: { defaultOrder: "asc" },
        }

        if (includeSubjects) {
            include.exams.include = {
                subjects: {
                    orderBy: { sortOrder: "asc" },
                },
            }
        }
    }

    const semesters = await prisma.semester.findMany({
        where: { studentId: studentPayload.id },
        orderBy: { sortOrder: "asc" },
        include,
    })

    res.json(semesters)
}

export const getCurrentSemesterHandler = async (req: AuthRequest, res: Response) => {
    const includeExams = req.query.includeExams === "true"
    const includeSubjects = req.query.includeSubjects === "true"

    const studentPayload = req.student
    if (!studentPayload) {
        res.sendStatus(400).json({ message: "Missing student payload." })
        return
    }

    const include: any = {}

    if (includeExams) {
        include.exams = {
            orderBy: { defaultOrder: "asc" },
        }

        if (includeSubjects) {
            include.exams.include = {
                subjects: {
                    orderBy: { sortOrder: "asc" },
                },
            }
        }
    }

    const semesters = await prisma.semester.findMany({
        where: { studentId: studentPayload.id },
        orderBy: { sortOrder: "asc" },
        include,
    })

    // Semesters are sorted by the sort order, which increase every insert
    res.json(semesters.length > 0 ? semesters[semesters.length - 1] : {})
}

export const getExamByNameInCurrentSemesterHandler = async (req: AuthRequest, res: Response) => {
    const examName = req.query.examName

    const studentPayload = req.student
    if (!studentPayload) {
        res.status(400).json({ message: "Missing student payload." })
        return
    }

    const semesters = await prisma.semester.findMany({
        where: { studentId: studentPayload.id },
        orderBy: { sortOrder: "asc" },
        include: {
            exams: {
                orderBy: { defaultOrder: "asc" },
                include: {
                    subjects: {
                        orderBy: { sortOrder: "asc" }
                    }
                }
            }
        }
    })

    if (!semesters) {
        res.status(404).json({ message: "Couldn't find current semester." })
        return
    }

    const currentSemester = semesters[semesters.length - 1]
    const foundExam = currentSemester.exams.find(exam => exam.name === examName)

    if (!foundExam) {
        res.status(404).json({ message: `Exam with name (${examName}) doesn't exist in current semester.` })
        return
    }

    res.status(200).json(foundExam)
}