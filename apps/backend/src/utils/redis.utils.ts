import redis from "../config/redis"
import { getStudentLevel, StudentLevel } from "../types/student.types"

export const getLoginCookie = async (sid: string): Promise<string | null> => {
    const studentLevel = getStudentLevel(sid.length)
    const key = `session:${studentLevel}:${sid}`
    return await redis.get(key)
}

export const setLoginCookie = async (cookie: string, sid: string) => {
    const studentLevel = getStudentLevel(sid.length)
    const key = `session:${studentLevel}:${sid}`
    // TODO: Replace the expiration time with real data
    await redis.set(key, cookie, "EX", 5 * 60)
}