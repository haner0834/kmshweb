import { Request, Response, NextFunction } from "express";
import prisma from "../config/database"
import { verifyAccessToken } from "../services/token.service";
import { AuthRequest } from "../types/auth.types";
import jwt from "jsonwebtoken"

/**
 * Express middleware to protect routes.
 * It verifies the JWT Access Token and checks if it has been revoked.
 * If valid, it attaches the student payload to the request object.
 */
export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Unauthorized: Missing token。" })
        return
    }

    const token = authHeader.split(' ')[1]
    const decodedPayload = jwt.decode(token)

    if (!decodedPayload || typeof decodedPayload !== "object" || !decodedPayload.sub) {
        res.status(401).json({ message: "Unauthorized: Missing token。" })
        return
    }

    // First, verify the token signature and expiration
    const studentPayload = verifyAccessToken(token);
    if (!studentPayload) {
        res.status(401).json({ message: "Unauthorized: Invalid or expired token." })
        return
    }

    // Check for token revocation
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentPayload.id },
            select: { tokensValidFrom: true }
        })

        if (!student) {
            res.status(401).json({ message: "Unauthorized: Couldn't find user." })
            return
        }

        // If a 'tokensValidFrom' timestamp is set, check if the token was issued before it.
        if (student.tokensValidFrom) {
            // 'iat' is in seconds, so we convert Date to seconds.
            const tokenIssuedAt = (jwt.decode(token) as jwt.JwtPayload).iat
            const validFromSeconds = Math.floor(student.tokensValidFrom.getTime() / 1000)

            if (tokenIssuedAt && tokenIssuedAt < validFromSeconds) {
                res.status(401).json({ message: "Unauthorized: The token has been deprecated." })
                return
            }
        }

        req.student = studentPayload
        next()
    } catch (error) {
        console.error("Error during token validation:", error)
        res.status(500).json({ message: "Internal server error" })
        return
    }
}
