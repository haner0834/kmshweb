import { Request, Response, NextFunction } from 'express';
import type { ApiSuccess, ApiError } from '../types/api.types';

declare module 'express-serve-static-core' {
    interface Response {
        success: <T>(data: T, meta?: any) => Response;
        fail: (code: string, message: string, statusCode?: number) => Response;
        internalServerError: (message: string) => Response;
    }
}

export const responseExtender = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    res.success = <T>(data: T, meta?: any) => {
        const body: ApiSuccess<T> = {
            success: true,
            data,
            meta,
            error: null,
        };
        return res.status(200).json(body);
    };

    res.fail = (code: string, message: string, statusCode = 400) => {
        const body: ApiError = {
            success: false,
            data: null,
            error: { code, message },
        };
        return res.status(statusCode).json(body);
    };

    res.internalServerError = (message: string) => {
        const body: ApiError = {
            success: false,
            data: null,
            error: { code: "INTERNAL_SERVER_ERROR", message },
        };
        return res.status(500).json(body);
    }

    next();
};