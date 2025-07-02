import * as seniorSystem from "./crawler.senior.service";
import { parseProfile, convertToStudentData } from "./parser.senior/profile.service";
import redis from "../config/redis";
import { SENIOR_SID_LENGTH, JUNIOR_SID_LENGTH, StudentData } from "../types/student.types";

// MARK: Shared
/**
 * Log in original school site based on the sid length and save the cookie on redis.
 * @param sid Student ID (學號).
 * @param password Plain text password(used to login old website).
 */
export const loginStudentAccount = async (sid: string, password: string) => {
    try {
        if (sid.length === SENIOR_SID_LENGTH) {
            // Login senior system
            const redisKey = `session:senior:${sid}`
            redis.del(redisKey)

            const cookie = await seniorSystem.loginAndGetCookie({ sid, password })
            seniorSystem.initializeSession(cookie)

            await redis.set(redisKey, cookie, "EX", 15 * 60)

        } else if (sid.length === JUNIOR_SID_LENGTH) {
            // Login junior system
        } else {
            throw new Error("Invalid sid format")
        }
    } catch (error) {
        if (error instanceof seniorSystem.SeniorLoginError) {
            console.log(`Senior login error with id: ${sid}, message: ${error.message}`)
        }
        console.log(`Unknown error:`, error)
    }
}

export const getStudentDataFromOldSite = async (sid: string, password: string): Promise<StudentData> => {
    if (sid.length === SENIOR_SID_LENGTH) {
        const redisKey = `session:senior:${sid}`
        let cookie = await redis.get(redisKey)
        if (!cookie) {
            const newCookie = await seniorSystem.loginAndGetCookie({ sid, password })

            await redis.set(redisKey, newCookie)

            cookie = newCookie

            await seniorSystem.initializeSession(cookie)
        }

        const profileContent = await seniorSystem.getStudentProfile(cookie)
        const parsedProfile = parseProfile(profileContent)

        if (!parsedProfile) throw new Error("Failed to get profile.")

        parsedProfile["sid"] = sid

        return convertToStudentData(parsedProfile)
    } else if (sid.length === JUNIOR_SID_LENGTH) {
        throw new Error("Function not completed.")
    } else {
        throw new Error("Function not completed.")
    }
}