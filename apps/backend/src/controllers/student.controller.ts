import { Request, Response } from "express";
import * as studentService from "../services/student.service"
import { AuthRequest } from "../types/auth.types";

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
export const getStudentProfileHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const sid = req.student?.id
    if (!sid) {
        res.status(400).json({ message: "Authentication error: Student ID is missing from the request payload." })
        return
    }

    try {
        const studentData = await studentService.getStudentProfileFromDb(sid);

        if (!studentData) {
            res.status(404).json({ message: `Student with ID ${sid} not found.` });
            return;
        }
        res.status(200).json(studentData);
    } catch (error) {
        console.error("Error getting student profile:", error);
        res.status(500).json({ message: "An unexpected error occurred while fetching student profile." });
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
export const getStudentProfileAndUpdateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const sid = req.student?.id;

    if (!sid) {
        res.status(401).json({ message: "Authentication error: Student ID is missing from the request payload." });
        return;
    }

    try {
        const studentData = await studentService.updateStudentProfileFromOldSite(sid);
        res.status(200).json(studentData);
    } catch (error) {
        console.error("Error updating student profile from old site:", error);
        if (error instanceof Error) {
            res.status(500).json({ message: `Failed to update student profile: ${error.message}` });
        } else {
            res.status(500).json({ message: "An unexpected error occurred while updating student profile." });
        }
    }
};

// MARK: Scores

export const getSemestersHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const includeExams = req.query.includeExams === "true";
    const includeSubjects = req.query.includeSubjects === "true";
    const studentId = req.student?.id;

    if (!studentId) {
        res.status(401).json({ message: "Authentication error: Student ID is missing." });
        return;
    }

    try {
        const semesters = await studentService.getStudentSemesters(studentId, includeExams, includeSubjects);
        res.status(200).json(semesters);
    } catch (error) {
        console.error("Error getting semesters:", error);
        res.status(500).json({ message: "An unexpected error occurred while fetching semesters." });
    }
};

export const getSemesterByIdHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const semesterId = req.query.id as string
    if (!semesterId) {
        res.status(400).json({ message: "Bad request: Missing semester id." })
        return
    }

    const studentId = req.student?.id

    if (!studentId) {
        res.status(401).json({ message: "Authentication error: Student ID is missing." })
        return
    }

    try {
        const semester = studentService.getSemesterById(studentId, semesterId)
        if (!semester) {
            res.status(404).json({ message: "No semester found with given id." })
        }


    } catch (error: any) {
        if (error.message === "No permission") {
            res.status(403).json({ message: "Forbidden: You don't have access to this semester." })
        } else {
            res.status(500).json({ message: "Internal server error" })
        }
    }
}

export const getCurrentSemesterHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const studentId = req.student?.id;

    if (!studentId) {
        res.status(401).json({ message: "Authentication error: Student ID is missing." });
        return;
    }

    try {
        const currentSemester = await studentService.getCurrentStudentSemesterFromDb(studentId);

        if (!currentSemester) {
            res.status(404).json({ message: `No semesters found for student ID ${studentId}.` });
            return;
        }
        res.status(200).json(currentSemester);
    } catch (error) {
        console.error("Error getting current semester:", error);
        res.status(500).json({ message: "An unexpected error occurred while fetching the current semester." });
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
export const getExamByNameInCurrentSemesterHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const examName = req.query.examName;
    const studentId = req.student?.id;

    if (!studentId) {
        res.status(401).json({ message: "Authentication error: Student ID is missing." });
        return;
    }
    if (typeof examName !== 'string' || !examName) {
        res.status(400).json({ message: "Exam name (examName) is required and must be a string." });
        return;
    }

    try {
        const foundExam = await studentService.getExamByNameInCurrentSemester(studentId, examName);

        if (!foundExam) {
            res.status(404).json({ message: `Exam with name '${examName}' not found in the current semester.` });
            return;
        }
        res.status(200).json(foundExam);
    } catch (error) {
        console.error("Error getting exam by name in current semester:", error);
        res.status(500).json({ message: "An unexpected error occurred while fetching the exam." });
    }
};

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
export const getCurrentSemesterAndUpdateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    const sid = req.student?.id

    if (!sid) {
        res.status(401).json({ message: "Authentication error: Student ID is missing." })
        return
    }

    try {
        const semester = await studentService.getCurrentSemesterAndUpdate(sid)
        res.status(200).json(semester)
    } catch (error) {
        console.error("Error getting/updating current semester:", error);
        res.status(500).json({ message: "An unexpected error occurred while fetching the current semester." });
    }
}