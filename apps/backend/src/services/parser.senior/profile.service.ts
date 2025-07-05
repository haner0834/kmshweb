import * as cheerio from "cheerio";
import { StudentData } from "../../types/student.types";
import { EnrollmentStatus, Gender, Grade, Stream } from "@prisma/client";

/**
 * Extracts the Chinese part from a string by matching Unicode characters
 * in the CJK Unified Ideographs range.
 * @param fullName The string containing the full name, e.g., "王小明 David Wang".
 * @returns The Chinese part of the name (e.g., "王小明"), or an empty string if no Chinese characters are found.
 */
const extractChineseName = (fullName: string): string => {
    if (!fullName) {
        return '';
    }

    // The regex /[\u4e00-\u9fa5]+/ matches one or more consecutive Chinese characters.
    const chineseNameMatch = fullName.match(/[\u4e00-\u9fa5]+/);

    // Return the first match found, or an empty string if there's no match.
    return chineseNameMatch ? chineseNameMatch[0] : '';
}

/**
 * Parses the HTML content of a student profile page to extract information.
 * @param htmlString The HTML content as a string.
 * @returns A promise that resolves to a dictionary of student information or null if parsing fails or no data is found.
 */
export const parseProfile = (htmlString: string): Record<string, string> | null => {
    const studentInfo: Record<string, string> = {};
    let dataFoundInSummary = false;
    let dataFoundInMainTable = false;

    try {
        const $ = cheerio.load(htmlString);

        /**
         * Helper function to clean text extracted from a Cheerio element.
         * It handles <br> tags by converting them to spaces and trims whitespace.
         * @param element The Cheerio element to clean.
         * @returns The cleaned text content of the element.
         */
        const cleanTextFromElement = (element: cheerio.Element): string => {
            const htmlContent = $(element).html() || '';
            const textWithSpaces = htmlContent.replace(/<br\s*\/?>/gi, ' ');
            return cheerio.load(textWithSpaces).root().text().trim();
        };

        // --- Section to extract from the summary table ---
        const summaryTable = $('table:has(tr > td[bgcolor="#4682b4"])')
            .filter((i, table) => $(table).attr('bgcolor') !== '#cee7ff')
            .first();

        if (summaryTable.length) {
            const summaryRows = summaryTable.find('tr');

            if (summaryRows.length > 1) {
                const secondRowCells = $(summaryRows[1]).find('td');

                if (secondRowCells.length > 0) {
                    const academicTerm = cleanTextFromElement(secondRowCells[0]);
                    if (academicTerm) {
                        studentInfo['學期資訊'] = academicTerm;
                        dataFoundInSummary = true;
                    }
                }

                if (secondRowCells.length > 1) {
                    const gradeClass = cleanTextFromElement(secondRowCells[1]);
                    if (gradeClass) {
                        studentInfo['年級'] = gradeClass.substring(0, 2);
                        studentInfo['班級'] = gradeClass.substring(2, 3);
                        dataFoundInSummary = true;
                    }
                }
            }
        } else {
            console.warn("Warning: Summary table for academic term and grade/class not found. Skipping these fields.");
        }

        // --- Section to extract from the main data table ---
        const mainTable = $('table[bgcolor="#cee7ff"]').first();

        if (mainTable.length) {
            const rows = mainTable.find('tr');

            if (rows.length > 0) {
                rows.each((index, row) => {
                    const cells = $(row).find('td');
                    if (cells.length === 0) return;

                    if (index === 0) { // First row: Name and Photo
                        if (cells.length >= 4) {
                            const key1 = cleanTextFromElement(cells[0]);
                            const value1 = cleanTextFromElement(cells[1]);
                            if (key1) { studentInfo[key1] = value1; dataFoundInMainTable = true; }

                            const key2 = cleanTextFromElement(cells[2]);
                            const value2 = cleanTextFromElement(cells[3]);
                            if (key2) { studentInfo[key2] = value2; dataFoundInMainTable = true; }
                        }
                    } else { // Subsequent rows
                        if (cells.length === 2) {
                            const key = cleanTextFromElement(cells[0]);
                            const value = cleanTextFromElement(cells[1]);
                            if (key) { studentInfo[key] = value; dataFoundInMainTable = true; }
                        } else if (cells.length === 4) {
                            const key1 = cleanTextFromElement(cells[0]);
                            const value1 = cleanTextFromElement(cells[1]);
                            if (key1) { studentInfo[key1] = value1; dataFoundInMainTable = true; }

                            const key2 = cleanTextFromElement(cells[2]);
                            const value2 = cleanTextFromElement(cells[3]);
                            if (key2) { studentInfo[key2] = value2; dataFoundInMainTable = true; }
                        }
                    }
                });
            } else {
                console.warn("Warning: Main data table (table[bgcolor=\"#cee7ff\"]) was found but contained no rows.");
            }
        } else {
            console.warn("Warning: Main student data table (table[bgcolor=\"#cee7ff\"]) not found.");
        }

        if (!dataFoundInSummary && !dataFoundInMainTable) {
            console.error("Error: No data could be extracted from any relevant table.");
            return null;
        }

        if (Object.keys(studentInfo).length === 0) {
            console.error("Error: Data extraction flags were set, but the resulting dictionary is empty. Review parsing logic.");
            return null;
        }

        // Replacing the name with only Chinese part
        if (studentInfo["姓名"]) {
            // Get the original full name, e.g., "王小明 David Wang"
            const fullName = studentInfo["姓名"];

            // Replace it with only the Chinese part
            studentInfo["姓名"] = extractChineseName(fullName);
        }

        return studentInfo;

    } catch (error) {
        console.error("An unexpected error occurred during parsing:", error);
        return null;
    }
};

const getClassGrade = (name: string): Grade => {
    if (name === "國一") return "junior1"
    if (name === "國二") return "junior2"
    if (name === "國三") return "junior3"

    if (name === "高一") return "senior1"
    if (name === "高二") return "senior2"
    if (name === "高三") return "senior3"

    return "junior1"
}

const getStream = (name: string): Stream => {
    if (name === "全不分組") return "all"
    // TODO: Check if the old sys are really using this
    if (name === "自然組") return "science"
    if (name === "社會組") return "social"
    return "other"
}

const getClassNumber = (className: string): number => {
    if (className === "忠") return 1
    if (className === "孝") return 2
    if (className === "愛") return 3
    if (className === "真") return 4
    if (className === "善") return 5
    if (className === "仁") return 6
    if (className === "義") return 7
    if (className === "禮") return 8
    if (className === "和") return 9
    if (className === "平") return 10
    if (className === "智") return 11
    if (className === "信") return 12
    return -1
}

const getGender = (str: string): Gender => {
    if (str === "男" || str === "男生") return "male"
    return "female"
}

const convertToDate = (rocDateStr: string): Date | null => {
    // Extract numbers
    const match = rocDateStr.match(/(\d+)年(\d+)月(\d+)日/)

    if (match) {
        const rocYear = parseInt(match[1], 10)
        const month = parseInt(match[2], 10)
        const day = parseInt(match[3], 10)

        const gregorianYear = rocYear + 1911
        const date = new Date(gregorianYear, month - 1, day) // Month is 0-based in JS

        return date
    } else {
        console.error("Invalid date format")
    }
    return null
}

const getEnrollmentStatus = (str: string): EnrollmentStatus => {
    if (str === "在學中") return "enrolled"
    // TODO: Check the right relationship
    if (str === "已畢業") return "graduated"
    if (str === "休學") return "suspended"
    return "withdraw"
}

export const convertToStudentData = (parsed: Record<string, string>): StudentData => {
    return {
        sid: parsed["sid"],
        name: parsed["姓名"],
        enrollmentStatus: getEnrollmentStatus(parsed["是否在學"]),
        credential: parsed["入學轉入資格"],
        birthDate: convertToDate(parsed["生日"]) ?? new Date(),
        graduationSchool: parsed["原畢業學校"],
        enrollmentDate: convertToDate(parsed["入學日期"]) ?? new Date(),
        gender: getGender(parsed["性別"]),
        stream: getStream(parsed["組別"]),
        grade: getClassGrade(parsed["年級"]),
        classLabel: parsed["班級"],
        classNumber: getClassNumber(parsed["班級"])
    }
}