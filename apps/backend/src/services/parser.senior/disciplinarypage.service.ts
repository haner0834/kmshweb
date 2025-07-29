import { DisciplinaryEvent, DisciplinaryLevel } from "@prisma/client"
import * as cheerio from "cheerio"

/**
 * DTO for Student Information
 */
export interface StudentInfoDTO {
    id: string;
    name: string;
}

/**
 * 單一獎懲事件的 DTO (DTO for a single Disciplinary Event)
 * 這個結構可以直接用於 Prisma 的 upsert 操作
 */
export interface DisciplinaryEventDTO {
    studentId: string;
    incidentDate: string; // ISO 8601 string
    approvalDate: string; // ISO 8601 string
    reason: string;
    type: DisciplinaryLevel;
    count: number;
}

/**
 * The complete structure of the final output of parser
 */
export interface ParsedPageDTO {
    student: StudentInfoDTO;
    events: DisciplinaryEventDTO[];
}

/**
 * Extract identity names from HTML, for example, 
 * extract "`name`" from "您現在的身份是：`name`"
 */
export const extractStudentName = (html: string): string | null => {
    const $ = cheerio.load(html);

    // Find the text node containing "您現在的身份是："
    const fontElements = $('font').toArray();

    for (const el of fontElements) {
        const text = $(el).text().replace(/\s/g, '');
        const match = text.match(/您現在的身份是：?(.+)/);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Extract the student ID from HTML, for example, 
 * extract "`1234`" from "學號：`12345`"
 */
export const extractStudentId = (html: string): string | null => {
    const $ = cheerio.load(html);

    // Find the text nodes containing "學號："
    const fontElements = $('font').toArray();

    for (const el of fontElements) {
        const text = $(el).text().replace(/\s/g, '');
        const match = text.match(/學號：(\d+)/);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Parses a date string from the Republic of China (Minguo) calendar format
 * (e.g., "114年02月13日") into an ISO 8601 string.
 * @param rocDateStr The date string in ROC format.
 * @returns An ISO 8601 formatted date string.
 */
function parseRocDate(rocDateStr: string): string {
    const match = rocDateStr.match(/(\d+)年(\d+)月(\d+)日/);
    if (!match) {
        throw new Error(`Invalid date format: ${rocDateStr}`);
    }
    const year = parseInt(match[1], 10) + 1911;
    const month = parseInt(match[2], 10) - 1; // Date month is 0-indexed in JS
    const day = parseInt(match[3], 10);

    // Set to UTC to avoid timezone inconsistencies
    return new Date(Date.UTC(year, month, day)).toISOString();
}

/**
 * Parse the HTML of the student rewards and punishments page to extract student information and all rewards and punishments events
 * @param html The complete HTML page content
 * @returns An object containing student information and reward and punishment event arrays
 */
export function parseStudentDisciplinaryPage(html: string): ParsedPageDTO {
    const $ = cheerio.load(html);

    // --- 步驟 1: 解析學生資訊 ---
    const studentNameMatch = extractStudentName(html);
    const studentIdMatch = extractStudentId(html);

    if (!studentNameMatch || !studentIdMatch) {
        throw new Error("Could not find student name or ID in the HTML. The page structure might have changed.");
    }

    const studentInfo: StudentInfoDTO = {
        name: studentNameMatch[1].trim(),
        id: studentIdMatch[1].trim(),
    };

    const disciplinaryEvents: DisciplinaryEventDTO[] = [];

    // --- 步驟 2: 解析獎勵明細 ---
    const rewardMappings = [
        { type: DisciplinaryLevel.majorMerit, index: 4 },   // 大功
        { type: DisciplinaryLevel.minorMerit, index: 5 },   // 小功
        { type: DisciplinaryLevel.commendation, index: 6 }, // 嘉獎
    ];

    const rewardTable = $('font:contains("學期獎勵明細：")').closest('tr').next('table');
    rewardTable.find('tr').slice(1).each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 7 || cells.attr('colspan')) return; // 忽略表頭和"無紀錄"行

        const approvalDateStr = $(cells[0]).text().trim();
        const incidentDateStr = $(cells[1]).text().trim();
        const reason = $(cells[2]).text().trim();

        rewardMappings.forEach(({ type, index }) => {
            const count = parseInt($(cells[index]).text().trim(), 10) || 0;
            if (count > 0) {
                disciplinaryEvents.push({
                    studentId: studentInfo.id,
                    approvalDate: parseRocDate(approvalDateStr),
                    incidentDate: parseRocDate(incidentDateStr),
                    reason,
                    type,
                    count,
                });
            }
        });
    });

    // --- 步驟 3: 解析懲罰明細 ---
    const punishmentMappings = [
        { type: DisciplinaryLevel.majorDemerit, index: 4 }, // 大過
        { type: DisciplinaryLevel.minorDemerit, index: 5 }, // 小過
        { type: DisciplinaryLevel.warning, index: 6 },      // 警告
    ];

    const punishmentTable = $('font:contains("學期懲罰明細：")').closest('tr').next('table');
    punishmentTable.find('tr').slice(1).each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 7 || cells.attr('colspan')) return; // 忽略表頭和"無紀錄"行

        const approvalDateStr = $(cells[0]).text().trim();
        const incidentDateStr = $(cells[1]).text().trim();
        const reason = $(cells[2]).text().trim();

        punishmentMappings.forEach(({ type, index }) => {
            const count = parseInt($(cells[index]).text().trim(), 10) || 0;
            if (count > 0) {
                disciplinaryEvents.push({
                    studentId: studentInfo.id,
                    approvalDate: parseRocDate(approvalDateStr),
                    incidentDate: parseRocDate(incidentDateStr),
                    reason,
                    type,
                    count,
                });
            }
        });
    });

    // --- 步驟 4: 返回完整結果 ---
    return {
        student: studentInfo,
        events: disciplinaryEvents,
    };
}