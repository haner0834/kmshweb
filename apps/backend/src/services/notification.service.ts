import prisma from "../config/database"
import { Device, DeviceType, Prisma, NotificationType, NotificationIcon } from "@prisma/client"
import { NotFoundError, PermissionError } from "../types/error.types"

/**
 * A placeholder for sending push notification.
 * @param pushToken 
 * @param title 
 * @param body 
 * @returns 
 */
const sendPushNotification = async (
    pushToken: string,
    deviceType: DeviceType,
    title: string,
    body: string,
    payload: Prisma.JsonObject
) => {
    console.log(`--- MOCK PUSH NOTIFICATION ---`)
    console.log(`TO: ${pushToken}`)
    console.log(`TITLE: ${title}`)
    console.log(`BODY: ${body}`)
    console.log(`------------------------------`)

    if (deviceType === 'ios') {
        console.log(`iOS notification`)
    } else if (deviceType === 'android') {
        console.log(`Android notification`)
    }

    return Promise.resolve()
}

const createInAppNotification = async (
    studentId: string,
    title: string,
    type: NotificationType,
    icon: NotificationIcon,
    body: string,
    payload: Prisma.JsonObject,
    route?: string,
    params?: Prisma.JsonObject,
    queries?: Prisma.JsonObject,
) => {
    await prisma.notification.create({
        data: {
            studentId,
            title,
            type,
            icon,
            body,
            route,
            params,
            queries,
            payload
        }
    })
}

export const notifyOtherTrustedDevices = async (
    studentId: string,
    newDevice: Device
) => {
    const otherTrustedDevices = await prisma.device.findMany({
        where: {
            studentId: studentId,
            isTrusted: true,
            id: {
                not: newDevice.id
            }
        }
    })

    if (otherTrustedDevices.length === 0) {
        return
    }

    // TODO: Use code instead of hardcoding the title
    const title = "新設備登入"
    const body = `您的帳號於 ${new Date().toLocaleString("zh-TW")} 在新的裝置（ ${newDevice.userAgent} ）上登入。`

    const notificationPayload: Prisma.JsonObject = {
        action: 'NEW_DEVICE_LOGIN',
        deviceId: newDevice.id,
        deviceName: newDevice.userAgent || 'Unknown Device',
    }

    const route = "/notifications/:id/new-login"

    await createInAppNotification(studentId, title, "warn", "auth", body, notificationPayload, route)

    for (const device of otherTrustedDevices) {
        if (device.pushToken && device.type !== "web") {
            await sendPushNotification(device.pushToken, device.type, title, body, notificationPayload)
        }
    }
}

export const getNotificationsWithPagination = async (
    studentId: string,
    page: number,
    pageSize: number
) => {
    const skip = (page - 1) * pageSize;

    const notifications = await prisma.notification.findMany({
        where: { studentId },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
    })

    const totalCount = await prisma.notification.count({
        where: { studentId },
    })

    return {
        data: notifications,
        meta: {
            page,
            pageSize,
            totalPages: Math.ceil(totalCount / pageSize),
            totalCount,
        }
    }
}

export const getNotificationCount = async (studentId: string, isRead: boolean | null) => {
    if (isRead === null) {
        return await prisma.notification.count({
            where: { studentId }
        })
    }

    return await prisma.notification.count({
        where: { studentId, isRead }
    })
}

export const readNotification = async (studentId: string, notificationId: string) => {
    const updated = await prisma.notification.updateMany({
        where: {
            id: notificationId,
            studentId,
        },
        data: {
            isRead: true,
        },
    });

    if (updated.count === 0) {
        throw new PermissionError();
    }
}

export const getNotificationById = async (studentId: string, notificationId: string) => {
    const notification = await prisma.notification.findUnique({
        where: { id: notificationId }
    })

    if (!notification) {
        throw new NotFoundError("NOTIFICATION")
    }
    if (notification.studentId !== studentId) {
        throw new PermissionError()
    }

    return notification
}