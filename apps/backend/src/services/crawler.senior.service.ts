import axios, { AxiosInstance } from 'axios';
import { URLCollection } from '../config/urls';
import { SeniorLoginData } from '../types/crawler.senior.types';
import { FncType, FncTypeKey } from '../types/crawler.senior.types';

export class SeniorLoginError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'LoginError';
    }
}

export class FncError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FNCError';
    }
}

/**
 * A function that handles extracting and formatting cookies from axios responses
 * @param setCookieHeader - The array from response.headers['set-cookie']
 * @returns A merged cookie string that can be used directly in subsequent requests, or null
 */
const formatCookieString = (setCookieHeader: string[] | undefined): string | null => {
    if (!setCookieHeader) {
        return null
    }
    return setCookieHeader
        .map(cookie => cookie.split(';')[0])
        .join('; ')
};

const checkIfLoginSuccessed = (html: string): boolean => {
    return html.includes("此網頁使用框架,但是您的瀏覽器並不支援.")
}

/**
 * Login senior system and get cookie
 * @param credentials Senior student data to login
 * @returns Cookie string after successful login
 */
export const loginAndGetCookie = async (credentials: SeniorLoginData): Promise<string> => {
    const payload = new URLSearchParams({
        txtid: credentials.sid,
        txtpwd: credentials.password,
        check: "confirm"
    })

    try {
        // Note: Here I use native axios because every request is independent
        const response = await axios.post<string>(URLCollection.Senior.login, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            // Prevent axios from automatically handling redirects to catch set-cookie
            maxRedirects: 0,
            validateStatus: status => status >= 200 && status < 400,
        })

        // A successful ASP login is usually a 302 redirect with a set-cookie.
        // but sometimes it may be 200, directly displaying the frame page
        if (response.status !== 200 && response.status !== 302) {
            throw new SeniorLoginError(`Login failed with status: ${response.status}`)
        }

        const rawCookie = response.headers['set-cookie']
        const cookieString = formatCookieString(rawCookie)

        if (!cookieString || !cookieString.includes('ASPSESSIONID')) {
            // If the cookie is not obtained, check if the html is a login failure page
            const htmlString = response.data
            if (checkIfLoginSuccessed(htmlString)) {
                throw new SeniorLoginError('Login succeeded, but no session cookie was returned.')
            }
            throw new SeniorLoginError('Login failed: Invalid credentials.')
        }

        return cookieString
    } catch (error) {
        if (error instanceof SeniorLoginError) throw error

        throw new SeniorLoginError(`Login request failed: ${(error as Error).message}`)
    }
}

/**
 * Access the necessary page to "initialize" the session, 
 * otherwise the cookie won't work
 * @param cookieString cookie from `loginAndGetCookie`
 */
export async function initializeSession(cookieString: string): Promise<void> {
    try {
        await axios.get(URLCollection.Senior.f_left, {
            headers: {
                'Cookie': cookieString
            }
        });
    } catch (error) {
        // This request often not affecting anything, but it can still be logged
        console.warn(`Warning: Initializing session by fetching f_left.asp failed. Proceeding anyway. Error: ${(error as Error).message}`);
    }
}

/**
 * Perform FNC request with session
 * @param type The function type to perform
 * @param cookieString The cookie string obtained from `loginAndGetCookie` or read from Redis
 * @returns Response HTML content
 */
export const performFncRequest = async (type: FncTypeKey, cookieString: string): Promise<string> => {
    const payload = new URLSearchParams({
        fncid: FncType[type].id,
        std_id: "",
        local_ip: "",
        contant: ""
    })

    try {
        const response = await axios.post<string>(URLCollection.Senior.fnc, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Cookie': cookieString,
                'Referer': URLCollection.Senior.f_left
            }
        })

        return response.data;

    } catch (error) {
        throw new FncError(`FNC request for ${type} failed: ${(error as Error).message}`)
    }
}

export const getStudentProfile = async (cookieString: string): Promise<string> => {
    const html = await performFncRequest("userProfile", cookieString)
    // Simple check
    if (!html || !html.includes("姓名")) {
        throw new FncError("Failed to get student profile: content mismatch. The cookie might be expired.")
    }
    return html;
}

export const getScoreTable = async (cookieString: string): Promise<string> => {
    const html = await performFncRequest("scoreTable", cookieString)
    return html
}