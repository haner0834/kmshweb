import * as seniorSystem from "./crawler.senior.service";
import { parseProfile, convertToStudentData } from "./parser.senior/profile.service";
import redis from "../config/redis";
import { SENIOR_SID_LENGTH, JUNIOR_SID_LENGTH, StudentData } from "../types/student.types";
import { decryptUek, decryptWithUek } from "../utils/crypto.utils";
import prisma from "../config/database";
import { Prisma } from "@prisma/client";

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

            await redis.set(redisKey, cookie, "EX", 15 * 60)

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
        const redisKey = `session:senior:${sid}`
        let cookie = await redis.get(redisKey)

        if (!cookie) {
            // Re-login to the original system and get the cookie
            const newCookie = await seniorSystem.loginAndGetCookie({ sid, password })

            await redis.set(redisKey, newCookie)

            cookie = newCookie

            await seniorSystem.initializeSession(cookie)
        }

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
 * @param includeExams Whether to include exams.
 * @param includeSubjects Whether to include subjects within exams.
 * @returns The current semester or null if none found.
 */
export const getCurrentStudentSemester = async (
    studentId: string,
    includeExams: boolean,
    includeSubjects: boolean
) => {
    const includeOptions = buildSemesterIncludeOptions(includeExams, includeSubjects);
    return prisma.semester.findFirst({
        where: { studentId: studentId },
        orderBy: { sortOrder: "desc" },
        include: includeOptions,
    });
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