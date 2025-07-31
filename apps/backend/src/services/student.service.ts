import * as seniorSystem from "./crawler.senior.service";
import { parseProfile, convertToStudentData } from "./parser.senior/profile.service";
import redis from "../config/redis";
import { SENIOR_SID_LENGTH, JUNIOR_SID_LENGTH, StudentData, getStudentLevel, ExamSummary, SemesterSummary } from "../types/student.types";
import { decryptUek, decryptWithUek } from "../utils/crypto.utils";
import prisma from "../config/database";
import { Exam, Prisma, Semester } from "@prisma/client";
import { extractRocYear, extractSemesterTerm, getSemesterName } from "./parser.senior/scoretable.service";
import { fetchScoreDataFromOldSeniorSite } from "./student.senior.service";
import { getLoginCookieFromRedis, setLoginCookieToRedis } from "../utils/redis.utils";
import { SemesterWithDetails } from "../types/crawler.senior.types";
import { DisciplinaryEventDTO, extractStudentName, parseStudentDisciplinaryPage } from "./parser.senior/disciplinarypage.service";
import { AuthError } from "./auth.service";

/**
 * Get login cookie from Redis if exist, otherwise re-login to the original website and get session cookie.
 * @param studentId Student ID.
 * @returns Cookie from Redis or original website.
 */
export const getLoginCookie = async (studentId: string): Promise<string> => {
    let cookie = await getLoginCookieFromRedis(studentId)
    if (!cookie) {
        // Re-login to the original system and get the cookie
        const secureData = await prisma.student.findUnique({
            where: { id: studentId },
            select: {
                password: true,
                encryptedUek: true
            }
        })
        if (!secureData) { throw new Error("Couldn't find student.") }

        const uek = decryptUek(Buffer.from(secureData.encryptedUek))
        if (!uek) { throw new Error("Failed to decrypt User Encryption Key (UEK).") }

        const password = decryptWithUek(Buffer.from(secureData.password), uek)
        if (!password) { throw new Error("Failed to decrypt password.") }

        const newCookie = await seniorSystem.loginAndGetCookie({ sid: studentId, password })
        await seniorSystem.initializeSession(newCookie)

        await setLoginCookieToRedis(newCookie, studentId)

        cookie = newCookie

        await seniorSystem.initializeSession(cookie)
    }

    return cookie
}

// MARK: Shared
/**
 * Log in original school site based on the sid length and save the cookie on redis.
 * @param sid Student ID (學號).
 * @param password Plain text password(used to login old website).
 */
export const loginStudentAccount = async (sid: string, password: string) => {
    try {
        if (sid.length === SENIOR_SID_LENGTH) {
            // Login senior system
            const redisKey = `session:senior:${sid}`
            redis.del(redisKey)

            const cookie = await seniorSystem.loginAndGetCookie({ sid, password })
            seniorSystem.initializeSession(cookie)

            await setLoginCookieToRedis(cookie, sid)
        } else if (sid.length === JUNIOR_SID_LENGTH) {
            // Login junior system
        } else {
            throw new Error("Invalid sid format")
        }
    } catch (error) {
        if (error instanceof seniorSystem.SeniorLoginError) {
            console.log(`Senior login error with id: ${sid}, message: ${error.message}`)
        }
        console.log(`Unknown error:`, error)
    }
}

export const getStudentDataFromOldSite = async (sid: string, password: string): Promise<StudentData> => {
    if (sid.length === SENIOR_SID_LENGTH) {
        let cookie = await getLoginCookie(sid)

        const profileContent = await seniorSystem.getStudentProfile(cookie)
        const parsedProfile = parseProfile(profileContent)

        if (!parsedProfile) throw new Error("Failed to get profile.")

        parsedProfile["sid"] = sid

        return convertToStudentData(parsedProfile)
    } else if (sid.length === JUNIOR_SID_LENGTH) {
        throw new Error("Function not completed.")
    } else {
        throw new Error("Function not completed.")
    }
}

const buildSemesterIncludeOptions = (includeExams: boolean, includeSubjects: boolean): Prisma.SemesterInclude => {
    const include: Prisma.SemesterInclude = {};
    if (includeExams) {
        if (includeSubjects) {
            include.exams = {
                orderBy: { defaultOrder: "asc" },
                include: {
                    subjects: {
                        orderBy: { sortOrder: "asc" },
                    },
                },
            };
        } else {
            include.exams = {
                orderBy: { defaultOrder: "asc" },
            };
        }
    }
    return include;
};


/**
 * Retrieves a student's profile from the database.
 * @param studentId The ID of the student.
 * @returns StudentData or null if not found.
 */
export const getStudentProfileFromDb = async (studentId: string): Promise<StudentData | null> => {
    const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { class: true }
    });

    if (!student) {
        return null;
    }

    if (!student.class) {
        return null
    }

    // This mapping logic belongs here too
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
    };

    return studentData;
};

/**
 * Fetches student data from the old site and updates the database.
 * @param sid The student ID.
 * @returns The updated StudentData.
 * @throws Error if decryption fails or student not found/updated.
 */
export const updateStudentProfileFromOldSite = async (sid: string): Promise<StudentData> => {
    const secureData = await prisma.student.findUnique({
        where: { id: sid },
        select: {
            password: true,
            encryptedUek: true
        }
    });

    if (!secureData) {
        throw new Error(`Student with ID ${sid} not found in the database.`);
    }
    if (!secureData.encryptedUek || !secureData.password) {
        throw new Error("Missing encrypted UEK or password for decryption.");
    }

    const uek = decryptUek(Buffer.from(secureData.encryptedUek));
    if (!uek) {
        throw new Error("Failed to decrypt User Encryption Key (UEK).");
    }
    const plaintextPassword = decryptWithUek(Buffer.from(secureData.password), uek);
    if (!plaintextPassword) {
        throw new Error("Failed to decrypt password using the UEK.");
    }

    // Assuming studentService.getStudentDataFromOldSite is already defined
    const studentData = await getStudentDataFromOldSite(sid, plaintextPassword);

    await prisma.$transaction(async (tx) => {
        const existingClass = await tx.schoolClass.upsert({
            where: {
                unique_class_key: {
                    grade: studentData.grade,
                    stream: studentData.stream,
                    name: studentData.classLabel
                }
            },
            update: { number: studentData.classNumber },
            create: {
                name: studentData.classLabel,
                stream: studentData.stream,
                grade: studentData.grade,
                number: studentData.classNumber
            }
        });

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
        });
    });

    return studentData;
};

/**
 * Retrieves all semesters for a given student.
 * @param studentId The ID of the student.
 * @param includeExams Whether to include exams.
 * @param includeSubjects Whether to include subjects within exams.
 * @returns Array of semesters.
 */
export const getStudentSemesters = async (
    studentId: string,
    includeExams: boolean,
    includeSubjects: boolean
) => {
    const includeOptions = buildSemesterIncludeOptions(includeExams, includeSubjects);
    return prisma.semester.findMany({
        where: { studentId: studentId },
        orderBy: { sortOrder: "asc" },
        include: includeOptions,
    });
};

/**
 * Retrieves the current (latest) semester for a given student.
 * @param studentId The ID of the student.
 * @returns The current semester or null if none found.
 */
export const getCurrentStudentSemesterFromDb = async (
    studentId: string
) => {
    // year        terms
    // 2025 -> [113-2, 114-1]
    // 113 + 2 = 114 + 1 = 115 -> 2025 - 115 = 1910 -> in general, < current_year - (roc_year + term) > will be 1910
    // The problem is that <ROC_YEAR>-1 will take jan and a lit feb of the next year
    // for ex, 113-1, which starts from 2024/9, will continue to 2025/1
    // sort order: increase every insert (autoincrement())
    const latestSemester = await prisma.semester.findFirst({
        where: { studentId: studentId },
        orderBy: { sortOrder: "desc" },
        include: {
            exams: {
                orderBy: { defaultOrder: "asc" },
                include: {
                    subjects: {
                        orderBy: { sortOrder: "asc" }
                    }
                }
            }
        },
    });
    // if (!latestSemester) throw new Error("No semester existing.")
    if (!latestSemester) {
        console.log("No semester.")
        return null
    }

    // Now, check if the semester is currently available
    // first, check if the < current_ad_year - (roc_year + term) > is 1910
    const rocYear = extractRocYear(latestSemester.name)
    const term = extractSemesterTerm(latestSemester.name)
    const termNumber = term === "first" ? 1 : 2
    const currentAdYear = new Date().getFullYear()

    if (rocYear + termNumber + 1910 === currentAdYear) {
        return latestSemester
    } else {
        // Second, check if current month is jan and < current_year - (roc_year + term) > is 1911
        const currentMonth = new Date().getMonth()
        if (rocYear + termNumber + 1911 === currentAdYear && currentMonth + 1 === 1) { // month is zero-based counting
            return latestSemester
        }
    }

    // throw new Error("No semester available.")
    return null
};

/**
 * Retrieves a specific exam by name within the current (latest) semester for a student.
 * @param studentId The ID of the student.
 * @param examName The name of the exam to find.
 * @returns The found exam or null if not found.
 */
export const getExamByNameInCurrentSemester = async (
    studentId: string,
    examName: string
) => {
    const currentSemester = await prisma.semester.findFirst({
        where: { studentId: studentId },
        orderBy: { sortOrder: "desc" },
        include: {
            exams: {
                where: { name: examName },
                include: { subjects: { orderBy: { sortOrder: "asc" } } },
                take: 1
            }
        }
    });

    return currentSemester?.exams[0] || null;
};

export const getExamById = async (studentId: string, id: string): Promise<Exam | null> => {
    const exam = await prisma.exam.findUnique({
        where: { id },
        include: {
            semester: {
                select: {
                    studentId: true,
                },
            },
        },
    })

    if (exam?.semester.studentId !== studentId) {
        throw new AuthError("Unauthorized access. Permission denied.")
    }
    const { semester, ...pureExam } = exam
    return pureExam
}

export const getCurrentSemesterAndUpdate = async (studentId: string): Promise<SemesterWithDetails | null> => {
    const secureData = await prisma.student.findUnique({
        where: { id: studentId },
        select: {
            password: true,
            encryptedUek: true
        }
    })
    if (!secureData) { throw new Error("Couldn't find student.") }

    const uek = decryptUek(Buffer.from(secureData.encryptedUek))
    if (!uek) { throw new Error("Failed to decrypt User Encryption Key (UEK).") }

    const password = decryptWithUek(Buffer.from(secureData.password), uek)
    if (!password) { throw new Error("Failed to decrypt password.") }


    const studentLevel = getStudentLevel(studentId.length)
    if (studentLevel === "senior") {
        return await fetchScoreDataFromOldSeniorSite(studentId, password)
    } else if (studentLevel === "junior") {
        throw new Error("Function not implemented.")
    }

    throw new Error("Unknown student ID format.")
}

export const getSemesterById = async (studentId: string, id: string): Promise<Semester | null> => {
    const semester = await prisma.semester.findUnique({
        where: { id },
        include: {
            exams: {
                orderBy: { defaultOrder: "asc" },
                include: {
                    subjects: { orderBy: { sortOrder: "asc" } }
                }
            }
        }
    })

    if (semester?.studentId !== studentId) {
        throw new Error("No permission")
    }

    return semester
}

const extractSemesterName = (name: string): { title: string, subtitle: string } => {
    const [title, subtitle] = name.split(" ")
    return { title, subtitle }
}

export const getSemesterSummary = async (studentId: string): Promise<SemesterSummary[]> => {
    const semesters = await prisma.semester.findMany({
        where: { studentId },
        select: {
            id: true,
            name: true,
            exams: {
                select: {
                    id: true,
                    name: true,
                    averageScore: true,
                    subjects: {
                        select: {
                            score: true,
                        },
                        orderBy: {
                            score: "asc",
                        },
                    },
                },
            },
        },
    })

    // converting to summary by calculating the values
    const subjectScoreStrings = semesters.flatMap(semester => semester.exams).flatMap(exam => exam.subjects.map(x => x.score))
    const subjectScores = subjectScoreStrings.map(string => Number(string)).filter(num => !isNaN(num))

    const highestScore = Math.max(...subjectScores)
    const lowestScore = Math.min(...subjectScores)

    const passCount = subjectScores.filter(score => score >= 60).length
    const passRate = subjectScores.length > 0 ? passCount / subjectScores.length : 0
    const averageScore = subjectScores.length > 0 ? subjectScores.reduce((x, p) => x + p) / subjectScores.length : 0
    const summary: SemesterSummary[] = semesters.map(semester => ({
        id: semester.id,
        ...extractSemesterName(semester.name),
        shortenedTitle: "", // TODO: Calculate shortened title when fetching it from origin site
        exams: semester.exams.map(exam => ({
            id: exam.id,
            name: exam.name,
            averageScore: exam.averageScore,
        })),
        lowestScore,
        highestScore,
        averageScore,
        passRate,
    }))

    return summary
}

/**
 * Updates the disciplinary events for a given student by synchronizing the latest events
 * from the external senior system with the local database.
 *
 * This function performs the following steps:
 * 1. Retrieves the login cookie for the student.
 * 2. Fetches and parses the student's disciplinary page.
 * 3. Extracts and maps unique disciplinary events.
 * 4. Compares the parsed events with existing events in the database to determine which
 *    events need to be created or deleted.
 * 5. Executes a database transaction to create new events and delete obsolete ones.
 *
 * @param studentId - The unique identifier of the student whose disciplinary events are to be updated.
 * @returns A promise that resolves to an array of `DisciplinaryEventDTO` representing the latest disciplinary events.
 * @throws Will throw an error if the semester name or student is not found.
 */
export const updateDisplinary = async (studentId: string): Promise<DisciplinaryEventDTO[]> => {
    const cookie = await getLoginCookie(studentId)

    const page = await seniorSystem.getDisciplinaryPage(cookie)
    const parsedDisciplinary = parseStudentDisciplinaryPage(page)
    const semesterName = extractStudentName(page)
    if (!semesterName) throw new Error("No semester name found with given html page.")

    const mapped = parsedDisciplinary.events.map((event, index) => {
        return {
            index,
            uniqueKey: event.approvalDate + event.incidentDate + event.reason + parsedDisciplinary.student.id + event.type
        }
    })

    await prisma.$transaction(async (tx) => {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { disciplinaryEvents: true }
        })
        if (!student) throw new Error("No student found.")

        // there're 3 types of events: 
        // 1. to create
        // 2. to delete
        // 3. to update
        // maybe there would not be any events to update, but idk
        const existingEvents = student.disciplinaryEvents
        // to filter out events to update, use unique_disciplinary_event,
        // which consists of approval date, incident date, student id, reason, and type.
        const mappedExistingEvents = existingEvents.map((event, index) => {
            return {
                index,
                uniqueKey: event.approvalDate.toISOString()
                    + event.incidentDate.toISOString()
                    + event.reason
                    + parsedDisciplinary.student.id
                    + event.type
            }
        })
        // now, compare them with the new one
        const eventsToCreate = mapped.filter(event =>
            !mappedExistingEvents.some(e =>
                e.uniqueKey === event.uniqueKey
            )
        ).map(event => parsedDisciplinary.events[event.index])

        const eventsToDelete = mappedExistingEvents.filter(event =>
            !mapped.some(e =>
                e.uniqueKey === event.uniqueKey
            )
        ).map(event => existingEvents[event.index])

        for (const event of eventsToCreate) {
            await tx.disciplinaryEvent.create({
                data: {
                    studentId,
                    approvalDate: new Date(event.approvalDate),
                    incidentDate: new Date(event.incidentDate),
                    type: event.type,
                    reason: event.reason,
                    count: event.count
                }
            })
        }

        for (const event of eventsToDelete) {
            await tx.disciplinaryEvent.create({
                data: {
                    studentId,
                    approvalDate: event.approvalDate,
                    incidentDate: event.incidentDate,
                    type: event.type,
                    reason: event.reason,
                    count: event.count
                }
            })
        }
    })

    return parsedDisciplinary.events
}

/**
 * Get the disciplinary events for a given student id from database.
 * @param studentId - The unique identifier of the student whose disciplinary events are to be query.
 * @returns A promise that resolves to an array of `DisciplinaryEventDTO` representing the latest disciplinary events. 
 */
export const getDisciplinaryFromDb = async (studentId: string): Promise<DisciplinaryEventDTO[] | null> => {
    const events = await prisma.disciplinaryEvent.findMany({
        where: { studentId }
    })

    return events.map(event => ({
        approvalDate: event.approvalDate.toISOString(),
        incidentDate: event.incidentDate.toISOString(),
        studentId: event.studentId,
        reason: event.reason,
        type: event.type,
        count: event.count,
    }))
}