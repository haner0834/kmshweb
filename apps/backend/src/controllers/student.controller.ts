import { Response } from "express";
import * as studentService from "../services/student.service"
import { AuthRequest } from "../types/auth.types";
import { getNotificationCount, getNotificationsWithPagination } from "../services/notification.service";
import { SemesterSummary, StudentData } from "../types/student.types";
import { Exam, Semester } from "@prisma/client";
import { AuthError } from "../services/auth.service";
import { AuthHandler } from "../types/api.types";
import { SemesterWithDetails } from "../types/crawler.senior.types";
import { DisciplinaryEventDTO } from "../services/parser.senior/disciplinarypage.service";

/**
 * Handles the HTTP request to retrieve a student's profile by their student ID (sid).
 *
 * Expects a query parameter `sid` of type string. Responds with the student's profile data if found,
 * or an appropriate error message and status code if not found or if an error occurs.
 *
 * @param req - Express request object, expects `sid` in the query parameters.
 * @param res - Express response object used to send the response.
 * @returns A Promise that resolves to void.
 */
export const getStudentProfileHandler: AuthHandler<StudentData> = async (req, res) => {
    const sid = req.student?.id
    if (!sid) {
        // res.status(400).json({ message: "Authentication error: Student ID is missing from the request payload." })
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return
    }

    const source = req.query.source

    try {
        let studentData: StudentData | null = null

        if (source === "origin") {
            studentData = await studentService.updateStudentProfileFromOldSite(sid)
        } else {
            studentData = await studentService.getStudentProfileFromDb(sid)
        }

        if (!studentData) {
            // res.status(404).json({ message: `Student with ID ${sid} not found.` });
            res.fail("STUDENT_NOT_FOUND", `Student with ID ${sid} not found.`, 404)
            return;
        }
        // res.status(200).json(studentData);
        res.success(studentData)
    } catch (error) {
        console.error("Error getting student profile:", error);
        // res.status(500).json({ message: "An unexpected error occurred while fetching student profile." });
        res.internalServerError("An unexpected error occurred while fetching student profile.")
    }
};

/**
 * Handles the request to retrieve and update a student's profile from the old site.
 *
 * This controller expects the authenticated student's ID to be present in the request payload.
 * It attempts to update the student's profile by calling the student service, and returns the updated
 * student data in the response. Handles authentication errors and unexpected failures gracefully.
 *
 * @param req - The authenticated request object containing the student information.
 * @param res - The response object used to send back the result or error message.
 * @returns A promise that resolves when the response has been sent.
 */
export const getStudentProfileAndUpdateHandler: AuthHandler<StudentData> = async (req, res) => {
    const sid = req.student?.id;

    if (!sid) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing from the request payload." });
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return;
    }

    try {
        const studentData = await studentService.updateStudentProfileFromOldSite(sid);
        res.success(studentData)
    } catch (error) {
        console.error("Error updating student profile from old site:", error);
        if (error instanceof Error) {
            res.internalServerError(`Failed to update student profile: ${error.message}`)
        } else {
            // res.status(500).json({ message: "An unexpected error occurred while updating student profile." });
            res.internalServerError("An unexpected error occurred while updating student profile.")
        }
    }
};

// MARK: Scores

export const getSemestersHandler: AuthHandler<Semester[]> = async (req, res) => {
    const includeExams = req.query.includeExams === "true";
    const includeSubjects = req.query.includeSubjects === "true";
    const studentId = req.student?.id;

    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." });
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return;
    }

    try {
        const semesters = await studentService.getStudentSemesters(studentId, includeExams, includeSubjects);
        // res.status(200).json(semesters);
        res.success(semesters)
    } catch (error) {
        console.error("Error getting semesters:", error);
        // res.status(500).json({ message: "An unexpected error occurred while fetching semesters." });
        res.internalServerError(`An unexpected error occurred while fetching semesters: ${error}`)
    }
};

export const getSemesterByIdHandler: AuthHandler<Semester> = async (req, res) => {
    const semesterId = req.params.id
    if (!semesterId) {
        // res.status(400).json({ message: "Bad request: Missing semester id." })
        res.fail("NO_SEMESTER_ID", "Bad request: Missing semester id", 400)
        return
    }

    const studentId = req.student?.id

    if (!studentId) {
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return
    }

    try {
        const semester = await studentService.getSemesterById(studentId, semesterId)
        if (!semester) {
            // res.status(404).json({ message: "No semester found with given id." })
            res.fail("SEMESTER_NOT_FOUND", "No semester found with given id.", 404)
        }
        res.success(semester)
    } catch (error: any) {
        if (error.message === "No permission") {
            // res.status(403).json({ message: "Forbidden: You don't have access to this semester." })
            res.fail("NO_PERMISSION", "Forbidden: You don't have access to this semester.", 403)
        } else {
            // res.status(500).json({ message: "Internal server error" })
            res.internalServerError(`An unexpected error occured while getting semester by id (${semesterId}): ${error}`)
        }
    }
}

export const getCurrentSemesterHandler: AuthHandler<Semester> = async (req, res) => {
    const studentId = req.student?.id;

    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." });
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return;
    }

    const source = req.query.source

    try {
        let currentSemester: Semester | null = null
        if (source === "origin") {
            currentSemester = await studentService.getCurrentSemesterAndUpdate(studentId);
        } else {
            currentSemester = await studentService.getCurrentStudentSemesterFromDb(studentId)
        }

        if (!currentSemester) {
            // res.status(404).json({ message: `No semesters found for student ID ${studentId}.` });
            res.fail("SEMESTER_NOT_FOUND", `No semesters found for student ID ${studentId}.`, 404)
            return;
        }
        // res.status(200).json(currentSemester);
        res.success(currentSemester)
    } catch (error) {
        console.error("Error getting current semester:", error);
        // res.status(500).json({ message: "An unexpected error occurred while fetching the current semester." });
        res.internalServerError("An unexpected error occurred while fetching the current semester.")
    }
};

/**
 * Handles the request to retrieve an exam by its name for the currently authenticated student in the current semester.
 *
 * @param req - The authenticated request object containing the student's information and query parameters.
 * @param res - The response object used to send the HTTP response.
 * @returns A promise that resolves to void. Sends a JSON response with the exam data if found, or an appropriate error message and status code otherwise.
 *
 * @remarks
 * - Requires the `examName` query parameter to be provided as a string.
 * - Requires the student to be authenticated (student ID must be present in the request).
 * - Responds with:
 *   - 200 and the exam data if found.
 *   - 400 if the exam name is missing or invalid.
 *   - 401 if the student is not authenticated.
 *   - 404 if the exam is not found in the current semester.
 *   - 500 for unexpected server errors.
 */
export const getExamByNameInCurrentSemesterHandler: AuthHandler<Exam[]> = async (req, res) => {
    const examName = req.query.examName;
    const studentId = req.student?.id;

    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." });
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return;
    }
    if (typeof examName !== 'string' || !examName) {
        // res.status(400).json({ message: "Exam name (examName) is required and must be a string." });
        res.fail("NO_EXAM_NAME_IN_QUERY", "Exam name (examName) is required and must be a string.", 400)
        return;
    }

    try {
        const foundExam = await studentService.getExamByNameInCurrentSemester(studentId, examName);

        if (!foundExam) {
            // res.status(404).json({ message: `Exam with name '${examName}' not found in the current semester.` });
            res.fail("EXAM_NOT_FOUND", `Exam with name '${examName}' not found in the current semester.`, 404)
            return;
        }
        // res.status(200).json(foundExam);
    } catch (error) {
        console.error("Error getting exam by name in current semester:", error);
        // res.status(500).json({ message: "An unexpected error occurred while fetching the exam." });
        res.internalServerError("An unexpected error occurred while fetching the exam.")
    }
};

export const getExamByIdHandler: AuthHandler<Exam> = async (req, res) => {
    const examId = req.params.id
    const studentId = req.student?.id
    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." });
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return;
    }

    try {
        const exam = await studentService.getExamById(studentId, examId)
        if (!exam) {
            // res.status(404).json({ message: `Exam with id '${examId}' not found in the current semester.` })
            res.fail("EXAM_NOT_FOUND", "Exam with id '${examId}' not found in the current semester.", 404)
            return
        }
        // res.status(200).json(exam)
        res.success(exam)
    } catch (error) {
        if (error instanceof AuthError) {
            // res.status(403).json({ message: error.message })
            res.fail("NO_PERMISSION", error.message, 403)
            return
        }
        // res.status(500).json({ message: "An unexpected error occurred while fetching the exam." })
        res.internalServerError("An unexpected error occurred while fetching the exam.")
    }
}
/**
 * Handles the request to retrieve and update the current semester for a student.
 *
 * This controller expects the authenticated student's ID to be available on the request object.
 * It supports optional query parameters to include exams and subjects in the response.
 * 
 * Note: This operation will be slow for senior students, because it fetch data fromthe old website.
 *
 * Responses:
 * - 200: Returns the current semester data (optionally including exams and subjects).
 * - 401: If the student ID is missing from the request (authentication error).
 * - 500: If an unexpected error occurs while fetching or updating the current semester.
 *
 * @param req - The authenticated request object, containing the student information and query parameters.
 * @param res - The response object used to send the HTTP response.
 * @returns A Promise that resolves when the response is sent.
 */
export const getCurrentSemesterAndUpdateHandler: AuthHandler<SemesterWithDetails | null> = async (req, res) => {
    const sid = req.student?.id

    if (!sid) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." })
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return
    }

    try {
        const semester = await studentService.getCurrentSemesterAndUpdate(sid)
        // res.status(200).json(semester)
        res.success(semester)
    } catch (error) {
        console.error("Error getting/updating current semester:", error);
        // res.status(500).json({ message: "An unexpected error occurred while fetching the current semester." });
        res.internalServerError("An unexpected error occurred while fetching the current semester.")
    }
}

export const getSemesterSummaryHandler: AuthHandler<SemesterSummary> = async (req, res) => {
    const studentId = req.student?.id
    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." })
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return
    }

    try {
        const semesterSummary = await studentService.getSemesterSummary(studentId)
        // res.status(200).json(semesterSummary)
        res.success(semesterSummary)
    } catch (error) {
        console.error("Error getting semester summary:", error)
        // res.status(500).json({ message: "An unexpected error occurred while getting summary of semesters." })
        res.internalServerError("An unexpected error occurred while getting summary of semesters.")
    }
}

export const getNotificationCountHandler: AuthHandler<number> = async (req, res) => {
    const studentId = req.student?.id

    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." })
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return
    }

    const role = req.query.role
    let isRead: boolean | null = null
    if (role === "read") isRead = true
    if (role === "unread") isRead = false

    try {
        const count = await getNotificationCount(studentId, isRead)
        // res.status(200).json({ data: count })
        res.success(count)
    } catch (error) {
        console.error("Error getting notifications count:", error)
        // res.status(500).json({ message: "An unexpected error occurred while getting notifications count." })
        res.internalServerError("An unexpected error occurred while getting notifications count.")
    }
}

export const getNotificationsWithPaginationHandler: AuthHandler<StudentData> = async (req, res) => {
    const studentId = req.student?.id
    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." })
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return
    }

    const page = Number(req.query.page)
    const pageSize = Number(req.query.pagesize)
    if (!page || !pageSize) {
        // res.status(400).json({ message: "Page and page size are both required in query." })
        res.fail("BAD_REQUEST", "Page and page size are both required in query.", 400)
        return
    }

    try {
        const { data, meta } = await getNotificationsWithPagination(studentId, page, pageSize)
        // res.status(200).json(data)
        res.success(data, meta)
    } catch (error) {
        console.error("Error getting notifications with pagination:", error)
        // res.status(500).json({ message: "An unexpected error occurred while getting notifications with pagination." })
        res.internalServerError("An unexpected error occurred while getting notifications with pagination.")
    }
}

export const getDisciplinaryHandler: AuthHandler<DisciplinaryEventDTO[]> = async (req, res) => {
    const studentId = req.student?.id
    if (!studentId) {
        // res.status(401).json({ message: "Authentication error: Student ID is missing." })
        res.fail("NO_SID", "Authentication error: Student ID is missing from the request payload.", 401)
        return
    }

    try {
        const displinaryEvents = await studentService.updateDisplinary(studentId)
        // res.status(200).json(displinaryEvents)
        res.success(displinaryEvents)
    } catch (error) {
        // res.status(500).json({ message: "An unexpected error occurred while getting disciplinary events." })
        res.internalServerError("An unexpected error occurred while getting disciplinary events.")
    }
}