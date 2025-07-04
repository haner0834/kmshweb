import redis from "../config/redis"
import { StudentLevel } from "../types/student.types"

export const getLoginCookie = async (sid: string, studentLevel: StudentLevel): Promise<string | null> => {
    const key = `session:${studentLevel}:${sid}`
    return await redis.get(key)
}

export const setLoginCookie = async (cookie: string, sid: string, studentLevel: StudentLevel) => {
    const key = `session:${studentLevel}:${sid}`
    await redis.set(key, cookie)
}