import { Request } from "express"

export interface StudentPayload {
    id: string
    name: string
    classId: string
}

export interface AuthRequest extends Request {
    student?: StudentPayload
}