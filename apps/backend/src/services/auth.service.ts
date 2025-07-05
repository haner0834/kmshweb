import prisma from "../config/database"
import redis from "../config/redis"
import { Student, NotificationType } from "@prisma/client"
import { generateTokens, verifyRefreshToken } from "./token.service"
import { StudentPayload, Tokens, DeviceInfo } from "../types/auth.types"
import * as cryptoUtil from "../utils/crypto.utils"
import { notifyOtherTrustedDevices } from "./notification.service"
import { loginStudentAccount, getStudentDataFromOldSite } from "./student.service"


export class AuthError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "AuthError"
    }
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
export const register = async (sid: string, password: string): Promise<Student> => {
    const existingStudent = await prisma.student.findUnique({ where: { id: sid } })
    if (existingStudent) {
        throw new AuthError("This accound has been registered")
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

    return await prisma.student.create({
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
            phoneNumber: Buffer.from(''),
            classId: relatedClass.id,
            enabledNotifications: Object.values(NotificationType),
            isQuickAccessOpen: true,
            tokensValidFrom: null
        }
    })
}

/**
 * Authenticates a student and issues tokens.
 * @param id Student ID.
 * @param password Plain text password.
 * @param trustDevice Whether to trust this device.
 * @param deviceInfo Device information.
 * @param ipAddress IP address of the client.
 * @param userAgent User agent string.
 * @returns JWT access and refresh tokens.
 * @throws {Error} If authentication fails.
 */
export const login = async (
    id: string,
    password: string,
    trustDevice: boolean,
    deviceInfo: DeviceInfo,
    ipAddress: string,
    userAgent: string
): Promise<Tokens> => {
    const student = await prisma.student.findUnique({ where: { id } })

    if (!student) {
        throw new Error("Wrong ID or password")
    }

    const uek = cryptoUtil.decryptUek(Buffer.from(student.encryptedUek))
    if (!uek) {
        throw new Error("Fatal Error: Couldn't decrypt UEK")
    }
    const decryptedPassword = cryptoUtil.decryptWithUek(Buffer.from(student.password), uek)
    if (decryptedPassword !== password) {
        throw new Error("Wrong ID or password")
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
        throw new Error("Couldn't generate valid token")
    }
    const expiresAt = new Date(verifiedToken.exp * 1000)

    const newDevice = await prisma.$transaction(async (tx) => {
        const newRefreshToken = await tx.refreshToken.create({
            data: {
                studentId: student.id,
                hashedToken,
                isTrusted: trustDevice,
                expiresAt
            }
        })

        return tx.device.create({
            data: {
                studentId: student.id,
                refreshTokenId: newRefreshToken.id,
                isTrusted: trustDevice,
                type: deviceInfo.type,
                pushToken: deviceInfo.pushToken,
                lastLoginIp: ipAddress,
                lastLoginAt: new Date(),
                userAgent: userAgent,
            },
        })
    })

    await notifyOtherTrustedDevices(student.id, newDevice)

    return tokens
}

/**
 * Refreshes JWT tokens using a valid refresh token.
 * @param oldRefreshToken The refresh token to verify and rotate.
 * @returns New JWT access and refresh tokens.
 * @throws {AuthError} If the refresh token is invalid or expired.
 */
export const refresh = async (oldRefreshToken: string): Promise<Tokens> => {
    const verifiedPayload = verifyRefreshToken(oldRefreshToken)
    if (!verifiedPayload?.sub) {
        throw new AuthError("Invalid or expired refresh token")
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
        throw new AuthError('Refresh Token expired or not exist')
    }

    const student = await prisma.student.findUnique({ where: { id: dbTokenRecord.studentId } })
    if (!student) {
        throw new AuthError("Couldn't find related student")
    }

    const studentPayload: StudentPayload = { id: student.id, name: student.name, classId: student.classId }
    const newTokens = generateTokens(studentPayload, dbTokenRecord.isTrusted)
    const newHashedToken = await cryptoUtil.hashRefreshToken(newTokens.refreshToken)
    const newVerifiedToken = verifyRefreshToken(newTokens.refreshToken)
    if (!newVerifiedToken?.exp) {
        throw new AuthError("Couldn't generate valid token")
    }

    const newExpiresAt = new Date(newVerifiedToken.exp * 1000);

    await prisma.refreshToken.update({
        where: { id: dbTokenRecord.id },
        data: {
            hashedToken: newHashedToken,
            expiresAt: newExpiresAt,
        },
    })

    return newTokens
}

/**
 * Logs out a user by deleting the refresh token from the database.
 * @param refreshToken The refresh token to invalidate.
 * @returns void
 */
export const logout = async (refreshToken: string): Promise<void> => {
    const verifiedPayload = verifyRefreshToken(refreshToken)
    if (!verifiedPayload?.sub) {
        return
    }

    const userTokens = await prisma.refreshToken.findMany({ where: { studentId: verifiedPayload.sub } })

    for (const token of userTokens) {
        if (await cryptoUtil.compareRefreshToken(refreshToken, token.hashedToken)) {
            await prisma.refreshToken.delete({ where: { id: token.id } })
            break
        }
    }
}

/**
 * Forces logout of a specific device for a student.
 * @param actorStudentId The ID of the student performing the action.
 * @param deviceToLogoutId The ID of the device to log out.
 * @returns void
 * @throws {AuthError} If the device does not exist or does not belong to the student.
 */
export const forceLogout = async (actorStudentId: string, deviceToLogoutId: string): Promise<void> => {
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
        throw new AuthError("Couldn't find related device.")
    }

    // Security Check: Ensure the user trying to log out a device owns that device.
    if (deviceToLogout.student.id !== actorStudentId) {
        throw new AuthError("Insufficient permissions to log out of a device that does not belong to you.")
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
}