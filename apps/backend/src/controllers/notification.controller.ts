import { getNotificationById, getNotificationCount, getNotificationsWithPagination, readNotification } from "../services/notification.service"
import { AuthHandler } from "../types/api.types"
import { AppError, BadRequestError } from "../types/error.types"
import { StudentData } from "../types/student.types"
import { logger } from "../utils/logger.utils"

export const getNotificationCountHandler: AuthHandler<number> = async (req, res) => {
    const studentId = req.student?.id

    if (!studentId) {
        res.noStudentId()
        return
    }

    const role = req.query.role
    let isRead: boolean | null = null
    if (role === "read") isRead = true
    if (role === "unread") isRead = false

    try {
        const count = await getNotificationCount(studentId, isRead)
        res.success(count)
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "student-service",
                action: "get notification count",
                error: error,
                context: {
                    studentId,
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while getting notifications count.")
    }
}

export const getNotificationsWithPaginationHandler: AuthHandler<StudentData> = async (req, res) => {
    const studentId = req.student?.id
    if (!studentId) {
        res.noStudentId()
        return
    }

    const page = Number(req.query.page)
    const pageSize = Number(req.query.pagesize)
    if (!page || !pageSize) {
        res.fail("BAD_REQUEST", "Page and page size are both required in query.", 400)
        return
    }

    try {
        const { data, meta } = await getNotificationsWithPagination(studentId, page, pageSize)
        res.success(data, meta)
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "student-service",
                action: "get notification with pagination",
                error: error,
                context: {
                    studentId,
                    page,
                    pageSize,
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while getting notifications with pagination.")
    }
}

export const readNotificationHandler: AuthHandler<{ notificationId: string }> = async (req, res) => {
    const studentId = req.student?.id
    if (!studentId) {
        res.noStudentId()
        return
    }

    const notificationId = req.params.id
    if (!notificationId) {
        res.fail("BAD_REQUEST", "Notification ID is required.", 400)
    }

    try {
        await readNotification(studentId, notificationId)
        res.success({ notificationId })
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "student-service",
                action: "get notification with pagination",
                error: error,
                context: {
                    studentId,
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while getting notifications with pagination.")
    }
}

export const getNotificationByIdHandler: AuthHandler<Notification> = async (req, res) => {
    const studentId = req.student?.id
    if (!studentId) {
        res.noStudentId()
        return
    }

    const notificationId = req.params.id
    if (!notificationId) {
        res.fail("BAD_REQUEST", "Notification ID is required.", 400)
    }

    try {
        const notification = await getNotificationById(studentId, notificationId)
        res.success(notification)
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "student-service",
                action: "get notification with pagination",
                error: error,
                context: {
                    studentId,
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while getting notifications with pagination.")
    }
}