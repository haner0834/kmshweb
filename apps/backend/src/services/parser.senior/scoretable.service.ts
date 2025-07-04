import { Exam, Subject, ExamType, SubjectType, SemesterTerm } from "@prisma/client";
import * as cheerio from "cheerio";

// Helper interface for tracking column indices for each exam header.
interface ExamHeaderInfo {
    name: string;
    scoreColIndex: number;
    averageColIndex: number;
    rankColIndex: number;
    rankCountColIndex: number;
    sortOrder: number;
}

// Custom Error for parsing failures
class ParsingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ParsingError';
    }
}


// MARK: - Private Text Cleaning and Parsing Helpers

const cleanCellText = (text: string | null | undefined): string => {
    if (!text) return "";
    return text.replace(/&nbsp;/g, '').trim();
};

const parseIntSafe = (text: string, fallback: number | null = null): number | null => {
    const cleaned = cleanCellText(text);
    if (cleaned === '–' || cleaned === '') return fallback;
    const num = Number.parseInt(cleaned, 10);
    return Number.isNaN(num) ? fallback : num;
};

const parseDoubleSafe = (text: string, fallback: number | null = null): number | null => {
    const cleaned = cleanCellText(text);
    if (cleaned === '–' || cleaned === '') return fallback;
    const num = Number.parseFloat(cleaned);
    return Number.isNaN(num) ? fallback : num;
};

const parseRanking = (cellText: string | null | undefined): number | null => {
    const cleaned = cleanCellText(cellText);
    if (!cleaned || cleaned === '–') return null;
    // Extracts the leading integer (e.g., "36" from "36(78.89)")
    const match = cleaned.match(/^\d+/);
    return match ? Number.parseInt(match[0], 10) : null;
};

const replaceExamName = (name: string): string => {
    const namesToReplace: Record<string, string> = {
        "第1次段考": "一段",
        "第2次段考": "二段",
        "第3次段考": "三段",
        "第1次平時考": "一週",
        "第2次平時考": "二週",
        "第3次平時考": "三週",
        "第1次藝能科": "藝能科",
        "第1次多元評量": "多元評量",
        "學期總成績": "學期總成績"
    };
    return namesToReplace[name] ?? name;
};

const getExamType = (replacedName: string): ExamType => {
    if (["一段", "二段", "三段"].includes(replacedName)) return 'main';
    if (["一週", "二週", "三週"].includes(replacedName)) return 'weekly';
    return 'other';
};

const getExamTimeOrder = (replacedName: string): number => {
    const order = ["一週", "一段", "二週", "二段", "三週", "三段", "藝能科", "多元評量", "學期總成績"];
    const index = order.indexOf(replacedName);
    return index === -1 ? 0 : index;
};

const cleanSubjectName = (name: string): string => {
    let cleanedName = name.startsWith("◎") ? name.substring(1) : name;

    // Remove various suffixes in a single regex
    const suffixRegex = /Ⅱ|Ⅲ|Ⅳ|Ⅴ|Ⅰ|\(上\)|\(下\)|（上）|（下\)|\(二\)|\(三\)|\(四\)|\(五\)$/;
    cleanedName = cleanedName.replace(suffixRegex, '').trim();

    return cleanedName;
};

const replaceSubjectName = (name: string): string => {
    const namesToReplace: Record<string, string> = {
        "國語文": "國文",
        "英語文": "英文",
        "地球科學": "地科"
    };
    return namesToReplace[name] ?? name;
};

// TODO: Need official credit resource
const getSubjectCredit = (replacedSubjectName: string): number => {
    if (["國文", "英文", "數學"].includes(replacedSubjectName)) return 4;
    if (["歷史", "地理", "公民", "化學", "物理", "生物", "地科"].includes(replacedSubjectName)) return 2;
    return 1;
};

const getSubjectType = (htmlString: string): SubjectType => {
    const trimmedHtmlString = htmlString.trim()
    if (trimmedHtmlString === "部定必修") return "nationalMandatory"
    if (trimmedHtmlString === "校訂必修") return "schollMandatory"
    if (trimmedHtmlString === "選修-多元選修") return "schoolElective"
    if (trimmedHtmlString === "選修-其他") return "otherElective"
    return "unknown"
}


// MARK: - Public Parser Functions

/**
 * Extracts the semester name (e.g., "113學年度第1學期") from the HTML.
 * @param htmlContent The HTML content of the score page.
 * @returns The semester name string.
 */
export const getSemesterName = (htmlContent: string): string => {
    const $ = cheerio.load(htmlContent);

    // Find a cell that contains both characters to identify the semester info
    const semesterCell = $('td:contains("學年"):contains("學期")').first();

    if (!semesterCell.length) {
        throw new ParsingError("Semester info ('學年'/'學期') not found in any <td>.");
    }

    return semesterCell.text().trim();
};

export const extractRocYear = (semesterName: string): number => {
    // 113學年度第1學期 -> first 3 charters
    const rocYear = Number(semesterName.slice(0, 3))
    return rocYear
}

export const extractSemesterTerm = (semesterName: string): SemesterTerm => {
    if (semesterName.includes("第一學期")) return "first"
    if (semesterName.includes("第二學期")) return "second"
    throw new Error("Unknown semester term")
}

/**
 * Parses the main score table from HTML into a map of exams to their subjects.
 * @param htmlContent The HTML content of the score page.
 * @returns A Map where keys are `Exam` objects and values are arrays of `Subject` objects.
 */
export const parseScoresTable = (htmlContent: string): Map<Exam, Subject[]> => {
    const $ = cheerio.load(htmlContent);

    // 1. Find the main table by checking for the header "科目"
    const mainTable = $('table').filter((_, table) => {
        return $(table).find('tr[bgcolor=ccc6b5] > td:first-child').text().trim() === '科目';
    }).first();

    if (!mainTable.length) {
        throw new ParsingError("Main grades table with '科目' header not found.");
    }

    const headerRow = mainTable.find('tr[bgcolor=ccc6b5]').first();
    if (!headerRow.length) {
        throw new ParsingError("Header row 'tr[bgcolor=ccc6b5]' not found.");
    }

    // 2. Parse Exam Headers to understand the table structure
    const headerCells = headerRow.find('td').toArray();
    const examHeaderInfos: ExamHeaderInfo[] = [];
    let currentExamSortOrder = 0;

    for (let colIdx = 5; colIdx < headerCells.length; colIdx += 4) {
        const examName = cleanCellText($(headerCells[colIdx]).text());
        if (examName && colIdx + 3 < headerCells.length) {
            examHeaderInfos.push({
                name: replaceExamName(examName),
                scoreColIndex: colIdx,
                averageColIndex: colIdx + 1,
                rankColIndex: colIdx + 2,
                rankCountColIndex: colIdx + 3,
                sortOrder: currentExamSortOrder++,
            });
        }
    }

    const exams: Exam[] = examHeaderInfos.map(info => ({
        id: '', // Placeholder, should be set appropriately elsewhere
        semesterId: '', // Placeholder, should be set appropriately elsewhere
        name: info.name,
        defaultOrder: info.sortOrder,
        timeOrder: getExamTimeOrder(info.name),
        type: getExamType(info.name),
        totalScore: null,
        totalWeightedScore: null,
        averageScore: null,
        weightedAverageScore: null,
        classRanking: null,
        streamRanking: null,
        gradeRanking: null
    }))

    // 3. Initialize the final data structure
    const examToSubjectsMap = new Map<Exam, Subject[]>(exams.map(exam => [exam, []]));

    // 4. Parse Subject Data from each subject row
    mainTable.find('tr[bgcolor=#e1e1e1]').each((subjectRowIndex, subjectRow) => {
        const cells = $(subjectRow).find('td').toArray();
        if (cells.length <= 4) return;

        const rawSubjectName = cleanCellText($(cells[0]).text());
        const cleanedName = cleanSubjectName(rawSubjectName);
        const finalSubjectName = replaceSubjectName(cleanedName);
        const subjectType = getSubjectType($(cells[3]).text());

        examHeaderInfos.forEach(examInfo => {
            const exam = exams.find(e => e.defaultOrder === examInfo.sortOrder);
            if (!exam || examInfo.rankCountColIndex >= cells.length) return;

            const subjectScoreString = cleanCellText($(cells[examInfo.scoreColIndex]).text());
            if (subjectScoreString === '–') return; // Skip if no score

            const subject: Subject = {
                id: '', // Placeholder, should be set appropriately elsewhere
                examId: exam?.id ?? '', // Placeholder, should be set appropriately elsewhere
                name: finalSubjectName,
                type: subjectType,
                credit: getSubjectCredit(finalSubjectName),
                score: subjectScoreString,
                classAverage: parseDoubleSafe($(cells[examInfo.averageColIndex]).text()),
                classRanking: parseIntSafe($(cells[examInfo.rankColIndex]).text()),
                rankingCount: parseIntSafe($(cells[examInfo.rankCountColIndex]).text()),
                isCreditGained: false, // Defaulted
                sortOrder: subjectRowIndex,
            };

            examToSubjectsMap.get(exam)?.push(subject);
        });
    });

    // 5. Parse Exam Summary Data and update exam objects
    mainTable.find('tr[bgcolor=#f5f5f5]').each((_, summaryRow) => {
        const cells = $(summaryRow).find('td').toArray();
        if (cells.length < 2) return;

        const metricName = cleanCellText($(cells[0]).text())
            .replace(/\(.*\)/g, '') // Remove any text in parentheses
            .trim();

        exams.forEach((exam, examIndex) => {
            const valueCellIndex = examIndex + 1;
            if (valueCellIndex >= cells.length) return;

            const cellText = cleanCellText($(cells[valueCellIndex]).text());

            switch (metricName) {
                case "總分":
                    exam.totalScore = parseIntSafe(cellText);
                    break;
                case "加權總分":
                    exam.totalWeightedScore = parseIntSafe(cellText);
                    break;
                case "平均":
                    exam.averageScore = parseDoubleSafe(cellText);
                    break;
                case "加權平均":
                    exam.weightedAverageScore = parseDoubleSafe(cellText);
                    break;
                case "班名次":
                    exam.classRanking = parseRanking(cellText);
                    break;
                case "組名次":
                    exam.streamRanking = parseRanking(cellText);
                    break;
                case "年名次":
                    exam.gradeRanking = parseRanking(cellText);
                    break;
            }
        });
    });

    return examToSubjectsMap;
};