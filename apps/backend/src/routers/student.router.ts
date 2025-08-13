import { Router } from "express";
import { protect } from "../middleware/auth.middleware";
import { getSemestersHandler, getCurrentSemesterHandler, getExamByNameInCurrentSemesterHandler, getCurrentSemesterAndUpdateHandler, getStudentProfileHandler, getSemesterByIdHandler, getDisciplinaryHandler, getSemesterSummaryHandler, getExamByIdHandler, rateFeatureHandler, getRateScoreHandler } from "../controllers/student.controller";
import { getNotificationByIdHandler, getNotificationCountHandler, getNotificationsWithPaginationHandler, readNotificationHandler } from "../controllers/notification.controller";

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
router.get("/notifications/:id", protect, getNotificationByIdHandler)
router.patch("/notifications/:id/read", protect, readNotificationHandler)

router.get("/disciplinary", protect, getDisciplinaryHandler)

router.post("/rate", protect, rateFeatureHandler)
router.get("/rate", protect, getRateScoreHandler)

export default router