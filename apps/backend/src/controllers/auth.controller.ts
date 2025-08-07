import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { AppError, AuthError } from '../types/error.types';
import { AuthRequest, LoginRequestBody, RefreshRequestBody, Tokens } from '../types/auth.types';
import { DeviceType } from '@prisma/client';
import { logger } from '../utils/logger.utils';
import { AuthHandler, TypedResponse } from '../types/api.types';
import { getRefreshTokenMaxAge } from '../services/token.service';

const refreshTokenCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/auth'
}

type RegisterResponse = { id: string, name: string }

/**
 * Handles user registration.
 * @param req Express Request object, expects `id` and `password` in the body.
 * @param res Express Response object.
 * @returns void
 */
export const registerHandler = async (req: Request, res: TypedResponse<{ id: string, name: string }>): Promise<void> => {
    const { id, password } = req.body

    if (!id || !password) {
        res.fail("MISSING_ID_PASSWORD", "Missing student ID or password in the request body.", 400)
        return
    }

    try {
        const student = await authService.register(id, password);
        res.success({ id: student.id, name: student.name }, undefined, 201)
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "auth-service",
                action: "register",
                error: error,
                context: {
                    studentId: id,
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while registering.")
        return
    }
}

/**
 * Handles user login.
 * @param req Express Request object, expects `id`, `password`, `deviceInfo`, and optionally `trustDevice` in the body.
 * @param res Express Response object.
 * @returns void
 */
export const loginHandler = async (req: Request, res: TypedResponse<Tokens>): Promise<void> => {
    const { id, password, trustDevice = false, deviceInfo }: LoginRequestBody = req.body;

    if (!id || !password) {
        res.fail("MISSING_ID_PASSWORD", "Missing student ID or password in the request body.")
        return
    }

    if (!deviceInfo || !deviceInfo.clientSideDeviceId || !Object.values(DeviceType).includes(deviceInfo.type)) {
        res.fail("MISSING_REQUIRED_INFO", "Missing deviceInfo, deviceInfo.clientSideDeviceId or deviceInfo.type")
        return
    }
    if (deviceInfo.type !== 'web' && !deviceInfo.pushToken) {
        res.fail("NO_PUSH_TOKEN", "Missing push token from mobile client.")
        return
    }

    try {
        const ipAddress = req.ip || "No ip";
        const userAgent = req.headers["user-agent"] || "unknown"

        const tokens = await authService.login(id, password, trustDevice, deviceInfo, ipAddress, userAgent)

        res.cookie('refreshToken', tokens.refreshToken, {
            ...refreshTokenCookieOptions,
            maxAge: tokens.cookieMaxAge,
        })

        res.success({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        })
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "auth-service",
                action: "login",
                error: error,
                context: {
                    studentId: id,
                    deviceInfo,
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while login.")
    }
}

type LoginOrRegisterResponse = Tokens | RegisterResponse

export const wrappedLoginHandler = async (req: Request, res: TypedResponse<LoginOrRegisterResponse>) => {
    const { id, password } = req.body
    if (!id || !password) {
        res.fail("MISSING_ID_PASSWORD", "Missing student ID or password in the request body.")
        return
    }

    if (await authService.checkIfStudentExist(id)) {
        await loginHandler(req, res)
    } else {
        await registerHandler(req, res)
    }
}


/**
 * Handles refreshing of access tokens using a refresh token.
 * @param req Express Request object, expects `refreshToken` in the body or cookies.
 * @param res Express Response object.
 * @returns void
 */
export const refreshHandler = async (req: Request, res: TypedResponse<Tokens>): Promise<void> => {
    const { refreshToken: bodyToken }: RefreshRequestBody = req.body
    const cookieToken = req.cookies.refreshToken
    const refreshToken = cookieToken || bodyToken

    if (!refreshToken) {
        res.fail("MISSING_REFRESH_TOKEN", "Missing refresh token from cookie/body.")
        return
    }

    try {
        const newTokens = await authService.refresh(refreshToken)

        if (cookieToken) {
            res.cookie('refreshToken', newTokens.refreshToken, {
                ...refreshTokenCookieOptions,
                maxAge: newTokens.cookieMaxAge,
            })
        }

        res.success({
            accessToken: newTokens.accessToken,
            refreshToken: newTokens.refreshToken, // For app client
            message: "Token refreshed successfully."
        })
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "auth-service",
                action: "refresh",
                error: error,
                context: {
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while refreshing.")
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
export const forceLogoutHandler = async (req: AuthRequest, res: TypedResponse<{}>): Promise<void> => {
    // The user performing the action, identified by the protect middleware.
    const actorStudentId = req.student?.id
    // The device to be logged out, specified in the request body.
    const { deviceId } = req.body

    if (!actorStudentId) {
        // This should not happen if `protect` middleware is used correctly.
        // res.status(401).json({ message: "Unauthorized: Couldn't identify user." })
        res.noStudentId()
        return
    }

    if (!deviceId) {
        res.fail("MISSING_DEVICE_ID", "The device ID (deviceId) to sign out is required.")
        return
    }

    try {
        await authService.forceLogout(actorStudentId, deviceId)
        res.status(204).send() // 204 No Content is appropriate for a successful action with no body.
    } catch (error) {
        if (error instanceof AppError) {
            logger.error({
                service: "auth-service",
                action: "refresh",
                error: error,
                context: {
                }
            })
            res.fail(error.code, error.message, error.statusCode)
            return
        }
        res.internalServerError("An unexpected error occurred while force logout.")
    }
}
