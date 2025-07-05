import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AuthError } from '../services/auth.service';
import { AuthRequest, LoginRequestBody, RefreshRequestBody } from '../types/auth.types';
import { DeviceType } from '@prisma/client';

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/api/auth'
}

/**
 * Handles user registration.
 * @param req Express Request object, expects `id` and `password` in the body.
 * @param res Express Response object.
 * @returns void
 */
export const registerHandler = async (req: Request, res: Response): Promise<void> => {
    const { id, password } = req.body

    if (!id || !password) {
        res.status(400).json({ message: "ID and password are both required." })
        return
    }

    try {
        const student = await authService.register(id, password);
        res.status(201).json({
            message: "Register successed.",
            student: { id: student.id, name: student.name }
        })
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(409).json({ message: error.message })
            return
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error." })
        return
    }
}

/**
 * Handles user login.
 * @param req Express Request object, expects `id`, `password`, `deviceInfo`, and optionally `trustDevice` in the body.
 * @param res Express Response object.
 * @returns void
 */
export const loginHandler = async (req: Request, res: Response): Promise<void> => {
    const { id, password, trustDevice = false, deviceInfo }: LoginRequestBody = req.body;

    if (!id || !password) {
        res.status(400).json({ message: "ID and password are both required." })
        return
    }

    if (!deviceInfo || !deviceInfo.clientSideDeviceId || !Object.values(DeviceType).includes(deviceInfo.type)) {
        res.status(400).json({ message: "Valid equipment information must be provided." })
        return
    }
    if (deviceInfo.type !== 'web' && !deviceInfo.pushToken) {
        res.status(400).json({ message: "The mobile client must provide a push token." })
        return
    }

    try {
        const ipAddress = req.ip || "No ip";
        const userAgent = req.headers["user-agent"] || "unknown"

        const tokens = await authService.login(id, password, trustDevice, deviceInfo, ipAddress, userAgent)

        res.cookie('refreshToken', tokens.refreshToken, refreshTokenCookieOptions)

        res.status(200).json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            message: "Login successed"
        })
    } catch (error) {
        if (error instanceof AuthError) {
            res.status(401).json({ message: error.message })
            return
        }
        console.error(error)
        res.status(500).json({ message: "Internal server error." })
        return
    }
}

/**
 * Handles refreshing of access tokens using a refresh token.
 * @param req Express Request object, expects `refreshToken` in the body or cookies.
 * @param res Express Response object.
 * @returns void
 */
export const refreshHandler = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken: bodyToken }: RefreshRequestBody = req.body
    const cookieToken = req.cookies.refreshToken
    const refreshToken = cookieToken || bodyToken

    if (!refreshToken) {
        res.status(401).json({ message: "Refresh token not provided" })
        return
    }

    try {
        const newTokens = await authService.refresh(refreshToken)

        if (cookieToken) {
            res.cookie('refreshToken', newTokens.refreshToken, refreshTokenCookieOptions)
        }

        res.status(200).json({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken, // For app client
            message: "Token refreshed successfully."
        })
    } catch (error) {
        if (error instanceof AuthError) {
            if (cookieToken) {
                res.clearCookie("refreshToken", refreshTokenCookieOptions)
            }
            res.status(403).json({ message: error.message })
            return
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" })
        return
    }
}

/**
 * Handles user logout and clears the refresh token cookie.
 * @param req Express Request object, expects `refreshToken` in the body or cookies.
 * @param res Express Response object.
 * @returns void
 */
export const logoutHandler = async (req: Request, res: Response) => {
    const { refreshToken: bodyToken }: RefreshRequestBody = req.body
    const cookieToken = req.cookies.refreshToken
    const refreshToken = cookieToken || bodyToken

    if (refreshToken) {
        await authService.logout(refreshToken)
    }

    // Delete client's cookie anyway
    res.clearCookie("refreshToken", refreshTokenCookieOptions)
    res.status(204).send()
}

/**
 * Handler for forcing another device to log out.
 * @param req AuthRequest object, expects `student.id` from middleware and `deviceId` in the body.
 * @param res Express Response object.
 * @returns void
 */
export const forceLogoutHandler = async (req: AuthRequest, res: Response): Promise<void> => {
    // The user performing the action, identified by the protect middleware.
    const actorStudentId = req.student?.id
    // The device to be logged out, specified in the request body.
    const { deviceId } = req.body

    if (!actorStudentId) {
        // This should not happen if `protect` middleware is used correctly.
        res.status(401).json({ message: "Unauthorized: Couldn't identify user." })
        return
    }

    if (!deviceId) {
        res.status(400).json({ message: "The device ID (deviceId) to sign out is required." })
        return
    }

    try {
        await authService.forceLogout(actorStudentId, deviceId)
        res.status(204).send() // 204 No Content is appropriate for a successful action with no body.
    } catch (error) {
        if (error instanceof AuthError) {
            // Use 403 Forbidden for permission issues, 404 for not found.
            if (error.message.includes("Insufficient permissions.")) {
                res.status(403).json({ message: error.message })
                return
            }
            res.status(404).json({ message: error.message })
            return
        }
        console.error(error);
        res.status(500).json({ message: 'Internal server error' })
        return
    }
}
