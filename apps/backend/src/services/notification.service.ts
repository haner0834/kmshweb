import prisma from "../config/database"
import { Device, DeviceType, Prisma } from "@prisma/client"

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
    body: string,
    payload: Prisma.JsonObject
) => {
    prisma.notification.create({
        data: {
            studentId,
            title,
            body
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

    const title = "新設備登入"
    const body = `您的帳號於 ${new Date().toLocaleString("zh-TW")} 在新的裝置（ ${newDevice.userAgent} ）上登入。`

    const notificationPayload: Prisma.JsonObject = {
        action: 'NEW_DEVICE_LOGIN',
        deviceId: newDevice.id,
        deviceName: newDevice.userAgent || 'Unknown Device',
    }

    await createInAppNotification(studentId, title, body, notificationPayload)

    for (const device of otherTrustedDevices) {
        if (device.pushToken && device.type !== "web") {
            await sendPushNotification(device.pushToken, device.type, title, body, notificationPayload)
        }
    }
}