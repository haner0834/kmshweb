import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getStudentProfileAndUpdateHandler, getSemestersHandler, getCurrentSemesterHandler, getExamByNameInCurrentSemesterHandler, getCurrentSemesterAndUpdateHandler, getStudentProfileHandler, getSemesterByIdHandler, getNotificationCountHandler, getNotificationsWithPaginationHandler, getDisciplinaryHandler, getSemesterSummaryHandler, getExamByIdHandler } from "../controllers/student.controller";

const router = Router()

router.get("/profile", protect, getStudentProfileHandler)

router.get("/semesters", protect, getSemestersHandler)
router.get("/semesters/current", protect, getCurrentSemesterHandler)
router.get("/semesters/current/exam", protect, getExamByNameInCurrentSemesterHandler)
router.get("/semesters/:id", protect, getSemesterByIdHandler)

router.get("/exams/:id", protect, getExamByIdHandler)

router.get("/summary/semesters", protect, getSemesterSummaryHandler)

router.get("/notifications/count", protect, getNotificationCountHandler)
router.get("/notifications", protect, getNotificationsWithPaginationHandler)

router.get("/disciplinary", protect, getDisciplinaryHandler)

export default router