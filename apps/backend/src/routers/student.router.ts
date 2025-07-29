import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getStudentProfileAndUpdateHandler, getSemestersHandler, getCurrentSemesterHandler, getExamByNameInCurrentSemesterHandler, getCurrentSemesterAndUpdateHandler, getStudentProfileHandler, getSemesterByIdHandler, getNotificationCountHandler, getNotificationsWithPaginationHandler, getDisciplinaryHandler } from "../controllers/student.controller";

const router = Router()

router.get("/profile", protect, getStudentProfileHandler)
router.get("/profile/update", protect, getStudentProfileAndUpdateHandler)

router.get("/semesters", protect, getSemestersHandler)
router.get("/semesters/current", protect, getCurrentSemesterHandler)
router.get("/semesters/current/exam", protect, getExamByNameInCurrentSemesterHandler)
router.get("/semesters/current/update", protect, getCurrentSemesterAndUpdateHandler)
router.get("/semesters/:id", protect, getSemesterByIdHandler)

router.get("/notifications/count", protect, getNotificationCountHandler)
router.get("/notifications", protect, getNotificationsWithPaginationHandler)

router.get("/disciplinary", protect, getDisciplinaryHandler)

export default router