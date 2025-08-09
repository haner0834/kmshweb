import prisma from "../config/database"
import redis from "../config/redis"
import { Student, NotificationOption } from "@prisma/client"
import { generateTokens, verifyRefreshToken } from "./token.service"
import { StudentPayload, Tokens, DeviceInfo } from "../types/auth.types"
import * as cryptoUtil from "../utils/crypto.utils"
import { notifyOtherTrustedDevices } from "./notification.service"
import { loginStudentAccount, getStudentDataFromOldSite } from "./student.service"
import { AppError, AuthError, InternalError, NotFoundError, PermissionError } from "../types/error.types"
import { logger } from "../utils/logger.utils"
import { hash } from "crypto"
import { StudentData } from "../types/student.types"

const hashSecureValueFromDeviceInfo = (deviceInfo: DeviceInfo) => {
    return {
        type: deviceInfo.type,
        cidHash: hash("sha256", deviceInfo.clientSideDeviceId),
        pushTokenHash: deviceInfo.pushToken ? hash("sha256", deviceInfo.pushToken) : undefined
    }
}

export async function checkIfStudentExist(studentId: string): Promise<boolean> {
    const exist = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true }
    })
    return !!exist
}

/**
 * Register a new student account.
 * 
 * **Note**: The function is not completed currently.
 * 
 * @param id Student ID (學號).
 * @param password Plain text password(used to login old website).
 * @returns The created Student object (mocked, not yet saved to DB).
 * @throws {AuthError} If the account already exists.
 */
export async function register(sid: string, password: string): Promise<StudentData> {
    const existingStudent = await prisma.student.findUnique({ where: { id: sid } })
    if (existingStudent) {
        throw new AuthError("ACCOUNT_REGISTERED", "This accound has been registered", 409)
    }

    loginStudentAccount(sid, password)

    // --- ENCRYPTION FLOW ---
    const uek = cryptoUtil.generateUek();
    const encryptedPassword = cryptoUtil.encryptWithUek(password, uek)
    const encryptedUek = cryptoUtil.encryptUek(uek)

    const studentData = await getStudentDataFromOldSite(sid, password)

    let relatedClass = await prisma.schoolClass.findUnique({
        where: {
            unique_class_key: {
                stream: studentData.stream,
                name: studentData.classLabel,
                grade: studentData.grade,
            }
        }
    })

    if (!relatedClass) {
        // The class hasn't been created, create it
        const newClass = await prisma.schoolClass.create({
            data: {
                name: studentData.classLabel,
                grade: studentData.grade,
                stream: studentData.stream,
                number: studentData.classNumber
            }
        })
        relatedClass = newClass
    }

    await prisma.student.create({
        data: {
            name: studentData.name,
            id: studentData.sid,
            password: encryptedPassword,
            encryptedUek: encryptedUek,
            gender: studentData.gender,
            birthDate: studentData.birthDate,
            enrollmentDate: studentData.enrollmentDate,
            graduationDate: null,
            graduationSchool: studentData.graduationSchool,
            status: studentData.enrollmentStatus,
            credential: studentData.credential,
            classId: relatedClass.id,
            enabledNotifications: Object.values(NotificationOption),
            isQuickAccessOpen: true,
            tokensValidFrom: null
        }
    })

    return studentData
}

/**
 * Authenticates a student and issues tokens.
 * @param id Student ID.
 * @param password Plain text password.
 * @param trustDevice Whether to trust this device.
 * @param deviceInfo Device information. Conatins `clientSideDeviceId`, `type` and `pushToken` if using app client.
 * @param ipAddress IP address of the client.
 * @param userAgent User agent string.
 * @returns JWT access and refresh tokens.
 * @throws {Error} If authentication fails.
 */
export async function login(
    id: string,
    password: string,
    trustDevice: boolean,
    deviceInfo: DeviceInfo,
    ipAddress: string,
    userAgent: string
): Promise<Tokens> {
    logger.info('Login attempt', {
        service: "auth-service",
        action: "login",
        studentId: id,
        ip: ipAddress,
        deviceInfo: hashSecureValueFromDeviceInfo(deviceInfo),
        trusted: trustDevice,
        userAgent
    });

    const student = await prisma.student.findUnique({ where: { id } })

    if (!student) {
        throw new AuthError("WRONG_ID_PASSWORD", "Wrong ID or password", 401)
    }

    const uek = cryptoUtil.decryptUek(Buffer.from(student.encryptedUek))
    if (!uek) {
        logger.warn("UEK decrypt failed", {
            service: "auth-service",
            action: "login",
            studentId: id,
        })
        throw new InternalError("Couldn't decrypt UEK")
    }
    const decryptedPassword = cryptoUtil.decryptWithUek(Buffer.from(student.password), uek)
    if (decryptedPassword !== password) {
        logger.warn("Incorrect password", {
            service: "auth-service",
            action: "login",
            studentId: id,
        })
        throw new AuthError("WRONG_ID_PASSWORD", "Wrong ID or password", 401)
    }

    const payload: StudentPayload = {
        id: student.id,
        name: student.name,
        classId: student.classId
    }

    const tokens = generateTokens(payload, trustDevice)
    const hashedToken = await cryptoUtil.hashRefreshToken(tokens.refreshToken)
    const verifiedToken = verifyRefreshToken(tokens.refreshToken)
    if (!verifiedToken?.exp) {
        logger.warn("Invalid generated refresh token", {
            service: "auth-service",
            action: "login",
            studentId: id,
            tokens,
        })
        throw new InternalError("Couldn't generate valid token")
    }
    const expiresAt = new Date(verifiedToken.exp * 1000)

    const newDevice = await prisma.$transaction(async (tx) => {
        // Find if a device record already exists for this client-side ID.
        const existingDevice = await tx.device.findUnique({
            where: {
                unique_device_key: {
                    studentId: student.id,
                    clientSideDeviceId: deviceInfo.clientSideDeviceId
                }
            },
            select: { refreshTokenId: true }
        })

        // If a device existed, delete its old, now-stale refresh token.
        if (existingDevice) {
            try {
                // This makes the previous session's refresh token invalid.
                await tx.refreshToken.delete({
                    where: { id: existingDevice.refreshTokenId },
                });
            } catch (error) {
                // This catch block handles the rare edge case where the token might have
                // been deleted by another process (e.g., logout) between the find and delete operations.
                // It's safe to ignore this error and proceed.
                const message = `Could not find old refresh token ${existingDevice.refreshTokenId} to delete. It might have been deleted already. IT'S SAFE TO IGNORE.`
                logger.warn(message, {
                    service: "auth-service",
                    action: "login",
                    studentId: id
                })
            }
        }

        const newRefreshToken = await tx.refreshToken.create({
            data: {
                studentId: student.id,
                hashedToken,
                isTrusted: trustDevice,
                expiresAt
            }
        })

        const deviceData = {
            studentId: student.id,
            clientSideDeviceId: deviceInfo.clientSideDeviceId,
            refreshTokenId: newRefreshToken.id, // Link to the new session's refresh token
            isTrusted: trustDevice,
            type: deviceInfo.type,
            pushToken: deviceInfo.pushToken,
            lastLoginIp: ipAddress,
            lastLoginAt: new Date(),
            userAgent: userAgent,
        };

        return await tx.device.upsert({
            where: {
                unique_device_key: {
                    studentId: student.id,
                    clientSideDeviceId: deviceInfo.clientSideDeviceId
                }
            },
            update: {
                refreshTokenId: newRefreshToken.id,
                isTrusted: trustDevice,
                pushToken: deviceInfo.pushToken,
                lastLoginIp: ipAddress,
                lastLoginAt: new Date(),
                userAgent: userAgent
            },
            create: deviceData
        })
    })

    await notifyOtherTrustedDevices(student.id, newDevice)

    logger.info('Login successful', {
        service: "auth-service",
        action: "login",
        studentId: student.id,
        deviceInfo: hashSecureValueFromDeviceInfo(deviceInfo),
        trusted: trustDevice,
        ip: ipAddress,
        deviceUpdated: true
    });

    return tokens
}

export async function wrappedLogin(
    studentId: string,
    password: string,
    trustDevice: boolean,
    deviceInfo: DeviceInfo,
    ipAddress: string,
    userAgent: string
) {
    logger.info("Wrapped login attempt", {
        service: "auth-service",
        action: "wrapped-login",
        studentId,
        deviceInfo: hashSecureValueFromDeviceInfo(deviceInfo),
    })
    if (await checkIfStudentExist(studentId)) {
        login(studentId, password, trustDevice, deviceInfo, ipAddress, userAgent)
    } else {
        register(studentId, password)
    }
}

/**
 * Refreshes JWT tokens using a valid refresh token.
 * @param oldRefreshToken The refresh token to verify and rotate.
 * @returns New JWT access and refresh tokens.
 * @throws {AuthError} If the refresh token is invalid or expired.
 */
export async function refresh(oldRefreshToken: string): Promise<Tokens> {
    logger.info("Refresh attempt", {
        service: "auth-service",
        action: "refresh",
    })
    const verifiedPayload = verifyRefreshToken(oldRefreshToken)
    if (!verifiedPayload?.sub) {
        logger.warn("Invalid or expired refresh token", { subject: verifiedPayload?.sub })
        throw new AuthError("INVALID_REFRESH", "Invalid or expired refresh token", 401)
    }
    const studentId = verifiedPayload.sub

    const userTokens = await prisma.refreshToken.findMany({ where: { studentId } })

    let dbTokenRecord = null

    for (const token of userTokens) {
        if (await cryptoUtil.compareRefreshToken(oldRefreshToken, token.hashedToken)) {
            dbTokenRecord = token
            break
        }
    }

    if (!dbTokenRecord || new Date() > dbTokenRecord.expiresAt) {
        if (dbTokenRecord) {
            await prisma.refreshToken.delete({ where: { id: dbTokenRecord.id } })
        }
        throw new AuthError("INVALID_REFRESH", "Refresh Token expired or not exist", 401)
    }

    const student = await prisma.student.findUnique({ where: { id: dbTokenRecord.studentId } })
    if (!student) {
        logger.warn("Token related student not found", {
            service: "auth-service",
            action: "refresh",
            tokenId: dbTokenRecord.id
        })
        throw new NotFoundError("STUDENT")
    }

    const studentPayload: StudentPayload = { id: student.id, name: student.name, classId: student.classId }
    const newTokens = generateTokens(studentPayload, dbTokenRecord.isTrusted)
    const newHashedToken = await cryptoUtil.hashRefreshToken(newTokens.refreshToken)
    const newVerifiedToken = verifyRefreshToken(newTokens.refreshToken)
    if (!newVerifiedToken?.exp) {
        logger.warn("Invalid generated refresh token")
        throw new InternalError("Couldn't generate valid token")
    }

    const newExpiresAt = new Date(newVerifiedToken.exp * 1000);

    await prisma.refreshToken.update({
        where: { id: dbTokenRecord.id },
        data: {
            hashedToken: newHashedToken,
            expiresAt: newExpiresAt,
        },
    })
    logger.info("Token updated", {
        service: "auth-service",
        action: "refresh",
    })

    return newTokens
}

/**
 * Logs out a user by deleting the refresh token from the database.
 * @param refreshToken The refresh token to invalidate.
 * @returns void
 */
export async function logout(refreshToken: string): Promise<void> {
    logger.info("Logout attempt", {
        service: "auth-service",
        action: "logout",
    })
    const verifiedPayload = verifyRefreshToken(refreshToken)
    if (!verifiedPayload?.sub) {
        logger.warn("Missing subject from token", { subject: verifiedPayload?.sub })
        throw new InternalError("Invalid refresh token.")
    }

    const userTokens = await prisma.refreshToken.findMany({ where: { studentId: verifiedPayload.sub } })

    for (const token of userTokens) {
        if (await cryptoUtil.compareRefreshToken(refreshToken, token.hashedToken)) {
            await prisma.refreshToken.delete({ where: { id: token.id } })
            break
        }
    }

    logger.info("Logout successful", {
        service: "auth-service",
        action: "logout",
    })
}

/**
 * Forces logout of a specific device for a student.
 * @param actorStudentId The ID of the student performing the action.
 * @param deviceToLogoutId The ID of the device to log out.
 * @returns void
 * @throws {AuthError} If the device does not exist or does not belong to the student.
 */
export async function forceLogout(actorStudentId: string, deviceToLogoutId: string): Promise<void> {
    logger.info("Force logout attempt", {
        service: "auth-service",
        action: "force-logout",
        actorStudentId,
        deviceToLogoutId: hash("sha256", deviceToLogoutId),
    })
    const deviceToLogout = await prisma.device.findUnique({
        where: { id: deviceToLogoutId },
        include: {
            // Include student to verify ownership
            student: { select: { id: true } },
            // Include refreshToken to delete it
            refreshToken: { select: { id: true } }
        }
    })

    if (!deviceToLogout) {
        throw new NotFoundError("DEVICE", "Couldn't find related device.")
    }

    // Security Check: Ensure the user trying to log out a device owns that device.
    if (deviceToLogout.student.id !== actorStudentId) {
        logger.warn(`No permission to logout`, {
            service: "auth-service",
            action: "force-logout",
            actorStudentId,
            deviceToLogoutId: hash("sha256", deviceToLogoutId),
        })
        throw new PermissionError("Insufficient permissions to log out of a device that does not belong to you.")
    }

    await prisma.$transaction(async (tx) => {
        // 1. Delete the RefreshToken, which will cascade and delete the Device record.
        if (deviceToLogout.refreshToken) {
            await tx.refreshToken.delete({
                where: { id: deviceToLogout.refreshToken.id }
            })
        }

        // 2. Invalidate all access tokens issued before now for this user.
        await tx.student.update({
            where: { id: actorStudentId },
            data: { tokensValidFrom: new Date() }
        })
    })

    logger.info("Force logout successful", {
        service: "auth-service",
        action: "force-logout",
        actorStudentId,
    })
}