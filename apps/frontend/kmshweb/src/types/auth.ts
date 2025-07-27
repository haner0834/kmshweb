export interface StudentPayload {
  id: string;
  name: string;
  classId: string;
}

export interface AuthRequest extends Request {
  student?: StudentPayload;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export type DeviceType = "ios" | "android" | "web";

export interface DeviceInfo {
  clientSideDeviceId: string;
  type: DeviceType;
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
