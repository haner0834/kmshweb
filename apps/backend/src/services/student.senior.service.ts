import { extractSemesterTerm, getSemesterName, parseScoresTable } from "./parser.senior/scoretable.service"
import { getScoreTable, initializeSession, loginAndGetCookie } from "./crawler.senior.service"
import prisma from "../config/database"
import { getLoginCookie } from "../utils/redis.utils"
import { Subject, Exam } from "@prisma/client"
import { getCurrentStudentSemesterFromDb } from "./student.service"

export const fetchScoreDataFromOldSeniorSite = async (sid: string, password: string) => {
    // Get login session cookie
    let cookie = await getLoginCookie(sid)
    if (!cookie) {
        // Re-login to the old site
        const newCookie = await loginAndGetCookie({ sid, password })
        await initializeSession(newCookie)
        cookie = newCookie
    }

    const scoreTable = await getScoreTable(cookie)
    const scoresMap = parseScoresTable(scoreTable)

    // From DB
    let currentSemester = await getCurrentStudentSemesterFromDb(sid)
    const semesterName = getSemesterName(scoreTable)

    if (!currentSemester || semesterName !== (currentSemester?.name ?? "")) {
        const newSemester = await prisma.semester.create({
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

        currentSemester = newSemester
    }

    if (!currentSemester.exams) {
        return
    }

    // Now, create/update it
    await prisma.$transaction(async (tx) => {
        for (const [exam, subjects] of scoresMap) {
            exam.semesterId = currentSemester.id
            const { id, ...examToUpdate } = exam
            let foundExam = currentSemester.exams.find(e => e.name === exam.name)
            let createdExam: typeof exam & { subjects: Subject[] }
            if (foundExam) {
                // update existing exam
                const { id, subjects, ...e } = foundExam
                createdExam = await tx.exam.update({
                    where: { id: foundExam.id },
                    data: e,
                    include: {
                        subjects: true
                    }
                })
            } else {
                createdExam = await prisma.exam.create({
                    data: examToUpdate,
                    include: {
                        subjects: true
                    }
                })
            }

            // use created exam's id for subjects
            const subjectsWithoutId = subjects.map(({ id, ...rest }) => rest)
            subjectsWithoutId.forEach((subject) => { subject.examId = createdExam.id })

            let subjectsToCreate = [] as Omit<Subject, "id">[]
            let subjectsToUpdate = [] as Omit<Subject, "id">[]

            for (const s of subjectsWithoutId) {
                if (createdExam.subjects.some(createdSubject => createdSubject.name === s.name)) {
                    subjectsToUpdate.push(s)
                } else {
                    subjectsToCreate.push(s)
                }
            }

            if (!subjectsToCreate) {
                await tx.subject.createMany({
                    data: subjectsToCreate
                })
            }

            if (!subjectsToUpdate) {
                await tx.subject.updateMany({
                    data: subjectsToUpdate
                })
            }
        }
    })
}