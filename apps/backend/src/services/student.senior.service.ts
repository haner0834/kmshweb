import { extractSemesterTerm, getSemesterName, parseScoresTable } from "./parser.senior/scoretable.service"
import { getScoreTable, initializeSession, loginAndGetCookie } from "./crawler.senior.service"
import prisma from "../config/database"
import { getLoginCookie } from "../utils/redis.utils"
import { Subject, Exam, Prisma } from "@prisma/client"
import { getCurrentStudentSemesterFromDb } from "./student.service"
import { SemesterWithDetails } from "../types/crawler.senior.types"

export const fetchScoreDataFromOldSeniorSite = async (sid: string, password: string): Promise<SemesterWithDetails | null> => {
    // Get login session cookie
    let cookie = await getLoginCookie(sid)
    if (!cookie) {
        // Re-login to the old site
        const newCookie = await loginAndGetCookie({ sid, password })
        await initializeSession(newCookie)
        cookie = newCookie
    }

    const scoreTable = await getScoreTable(cookie)
    const scoresMap = parseScoresTable(scoreTable) // The id of both subjects and exams are empty, so avoid using it while creating/updating.
    const semesterName = getSemesterName(scoreTable)

    // Get current semester from DB or create a new one
    let currentSemester = await prisma.semester.findFirst({
        where: { studentId: sid, name: semesterName },
        include: {
            exams: {
                orderBy: { defaultOrder: "asc" },
                include: { subjects: { orderBy: { sortOrder: "asc" } } }
            }
        }
    })

    if (!currentSemester) {
        currentSemester = await prisma.semester.create({
            data: {
                name: semesterName,
                term: extractSemesterTerm(semesterName),
                studentId: sid
            },
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
    }

    // Now, create or update exams and subjects within a transaction
    await prisma.$transaction(async (tx) => {
        for (const [examData, subjectsData] of scoresMap.entries()) {
            let existingExam = currentSemester.exams.find(e => e.name === examData.name)
            let upsertedExam: Exam & { subjects: Subject[] }

            if (existingExam) {
                // Update existing exam
                const { id, semesterId, subjects, ...dataToUpdate } = existingExam
                upsertedExam = await tx.exam.update({
                    where: { id: existingExam.id },
                    data: { ...dataToUpdate },
                    include: { subjects: true }
                })
            } else {
                // Create new exam
                const { id, ...examWithoutId } = examData
                upsertedExam = await tx.exam.create({
                    data: {
                        ...examWithoutId,
                        semesterId: currentSemester.id
                    },
                    include: { subjects: true }
                })
            }

            // Prepare subjects for bulk creation or update
            const subjectsToCreate: Prisma.SubjectCreateManyInput[] = []
            const subjectsToUpdate: Promise<any>[] = []

            for (const subject of subjectsData) {
                const existingSubject = upsertedExam.subjects.find(s => s.name === subject.name)
                const { id, ...subjectWithoutId } = subject
                if (existingSubject) {
                    // Add update operation to a promise array
                    subjectsToUpdate.push(
                        tx.subject.update({
                            where: { id: existingSubject.id },
                            data: { ...subjectWithoutId, examId: upsertedExam.id }
                        })
                    )
                } else {
                    // Add new subject to the create list
                    subjectsToCreate.push({ ...subjectWithoutId, examId: upsertedExam.id })
                }
            }

            // Execute batch operations
            if (subjectsToCreate.length > 0) {
                await tx.subject.createMany({
                    data: subjectsToCreate,
                })
            }

            if (subjectsToUpdate.length > 0) {
                await Promise.all(subjectsToUpdate)
            }
        }
    })

    // Refetch the semester with all updated data to ensure the returned value is fresh
    const updatedSemester = await prisma.semester.findUnique({
        where: { id: currentSemester.id },
        include: {
            exams: {
                orderBy: { defaultOrder: "asc" },
                include: { subjects: { orderBy: { sortOrder: "asc" } } }
            }
        }
    })

    return updatedSemester
}