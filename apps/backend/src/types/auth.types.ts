import { Request } from "express"
import { DeviceType } from "@prisma/client"

export interface StudentPayload {
    id: string
    name: string
    classId: string
}

export interface AuthRequest extends Request {
    student?: StudentPayload
}

export interface Tokens {
    accessToken: string;
    refreshToken: string;
}

export interface DeviceInfo {
    clientSideDeviceId: string
    type: DeviceType
    pushToken?: string // For mobile apps
}

export interface LoginRequestBody {
    id?: string;
    password?: string;
    trustDevice?: boolean;
    deviceInfo?: DeviceInfo;
}

export interface RefreshRequestBody {
    refreshToken?: string;
}