import prisma from "../config/database"
import { Device, DeviceType, Prisma, NotificationType, NotificationIcon } from "@prisma/client"
import { NotFoundError, PermissionError } from "../types/error.types"
import { UAParser } from "ua-parser-js"
import { JsonValue } from "@prisma/client/runtime/library"
import { env } from "../utils/env.utils"

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
            params: sanitizeForPrisma(params),
            queries: sanitizeForPrisma(queries),
            payload
        }
    })
}

function sanitizeForPrisma(obj: any): any {
    if (obj === undefined) return null;       // 將 undefined 改成 null
    if (obj === null || typeof obj !== 'object') return obj; // 基本類型直接返回
    if (Array.isArray(obj)) return obj.map(sanitizeForPrisma); // 遞迴處理陣列
    const newObj: any = {};
    for (const key in obj) {
        newObj[key] = sanitizeForPrisma(obj[key]);
    }
    return newObj;
}

interface LocationInfo {
    text: string | "未知地點",
    latitude: number | null,
    longitude: number | null,
    country: string | null,
    city: string | null
    region: string | null,
    is_vpn: boolean,
}

async function getLocationInfo(ip: string): Promise<LocationInfo | undefined> {
    try {
        const ABSTRACT_API_KEY = env("ABSTRACT_API_KEY");
        const geoRes = await fetch(
            `https://ipgeolocation.abstractapi.com/v1/?api_key=${ABSTRACT_API_KEY}&ip_address=${ip}`
        );

        if (geoRes.ok) {
            const geoData = (await geoRes.json()) as {
                city?: string;
                regionName?: string;
                country?: string;
                security?: { is_vpn?: boolean };
                longitude?: number;
                latitude?: number;
            };

            const parts = [geoData.city, geoData.regionName, geoData.country].filter(Boolean);
            const text = parts.length > 0 ? parts.join(", ") : "未知地點";

            const location = {
                text,
                latitude: geoData.latitude ?? null,
                longitude: geoData.longitude ?? null,
                country: geoData.country ?? null,
                city: geoData.city ?? null,
                region: geoData.regionName ?? null,
                is_vpn: geoData.security?.is_vpn ?? false,
            };

            return location
        }
        return undefined
    } catch (error) {
        console.error(error)
        return undefined
    }
}

export const notifyOtherTrustedDevices = async (
    studentId: string,
    newDevice: Device
) => {
    const otherTrustedDevices = await prisma.device.findMany({
        where: {
            studentId: studentId,
            isTrusted: true,
            id: { not: newDevice.id }
        }
    });

    if (otherTrustedDevices.length === 0) return;

    // 解析 User-Agent
    const parser = new UAParser();
    parser.setUA(newDevice.userAgent ?? "Unknown");
    const result = parser.getResult();

    const deviceName = newDevice.type === "web"
        ? `${result.os.name ?? "Unknown"}`
        : result.device.model ?? "Unknown";
    const browserName = result.browser.name ?? "Unknown";
    const deviceInfo = `${deviceName}, ${browserName}`;

    // 取得 IP 地理位置
    let location: LocationInfo | null = {
        text: "未知地點",
        latitude: null,
        longitude: null,
        country: null,
        city: null,
        region: null,
        is_vpn: false,
    };
    if (newDevice.lastLoginIp) {
        location = await getLocationInfo(newDevice.lastLoginIp) ?? null
    }

    const loginTime = new Date().toLocaleString("zh-TW");
    const title = "新設備登入提醒";
    const body = `您的帳號於 ${loginTime} 在 ${location?.text ?? "Unknown"} 使用新的裝置（${deviceInfo}）登入。如非本人操作，請立即檢查帳號安全。`;

    const parsedUa = {
        browser: {
            name: result.browser.name ?? null,
            version: result.browser.major ?? null,
        },
        os: {
            name: result.os.name ?? null,
            version: result.os.version ?? null,
        },
        device: {
            model: result.device.model ?? null,
            type: result.device.type
                ?? (["macos", "windows", "linux"].includes((result.os.name || "").toLowerCase())
                    ? "desktop"
                    : null),
        }
    }

    const notificationPayload: Prisma.JsonObject = {
        action: 'NEW_DEVICE_LOGIN',
        deviceId: newDevice.id,
        deviceName: deviceName || 'Unknown Device',
        parsedUa: parsedUa,
        location: (location as any), // NOTE: WTH is this 
        ip: newDevice.lastLoginIp,
    };

    const route = "/:id/new-login";

    await createInAppNotification(studentId, title, "warn", "auth", body, notificationPayload, route);

    for (const device of otherTrustedDevices) {
        if (device.pushToken && device.type !== "web") {
            await sendPushNotification(device.pushToken, device.type, title, body, notificationPayload);
        }
    }
};


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