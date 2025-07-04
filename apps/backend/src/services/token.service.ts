import jwt from "jsonwebtoken"
import { StudentPayload, Tokens } from "../types/auth.types"
import crypto from "crypto"
import ms from "ms"

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "WTF IS THIS SHIT?? U DIDN'T SET ENV VALUE"
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "WTF IS THIS SHIT?? U DIDN'T SET ENV VALUE"
const JWT_ACCESS_EXPIRES_IN: ms.StringValue = "15m"
const JWT_REFRESH_EXPIRES_IN: ms.StringValue = "7d"
const JWT_TRUSTED_DEVICE_EXPIRES_IN: ms.StringValue = "30d"

export const generateAccessToken = (payload: StudentPayload): string => {
    return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES_IN, subject: payload.id })
}

export const generateRefreshToken = (studentId: string, isTrusted: boolean): string => {
    const expiresIn = isTrusted ? JWT_TRUSTED_DEVICE_EXPIRES_IN : JWT_REFRESH_EXPIRES_IN

    const payload = {
        jti: crypto.randomBytes(16).toString("hex")
    }

    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        subject: studentId,
        expiresIn
    })
}

export const generateTokens = (payload: StudentPayload, isTrusted: boolean): Tokens => {
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload.id, isTrusted)
    return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string): StudentPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_ACCESS_SECRET)

        if (typeof decoded === "object" && decoded !== null && "id" in decoded && "name" in decoded) {
            return decoded as StudentPayload
        }

        return null
    } catch (error) {
        return null
    }
}

export const verifyRefreshToken = (token: string): jwt.JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET)
        return typeof decoded === 'object' ? decoded : null
    } catch (error) {
        return null
    }
}