import * as cheerio from "cheerio";

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
                        console.log(gradeClass);
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