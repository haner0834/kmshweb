//
//  SeniorExamScoreParser.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/31.
//

import Foundation
import SwiftSoup

public struct SeniorExamScoreTableParser {

    // Helper struct for parsing Exam Column Info, nested as it's specific to this parser
    struct ExamHeaderInfo {
        let name: String
        let scoreColIndex: Int
        var averageColIndex: Int { scoreColIndex + 1 }
        var rankColIndex: Int { scoreColIndex + 2 }
        var rankCountColIndex: Int { scoreColIndex + 3 }
        let sortOrder: Int
    }

    init() {} // Public initializer
    
    func getSemesterName(htmlContent: String) throws -> String {
        let doc: Document = try SwiftSoup.parse(htmlContent)
        
        // Find the table
        guard let table = try doc.select("table").first() else {
            throw ParsingError.tableNotFound("No <table> found in HTML.")
        }
        
        // Find all <td> elements
        let cells = try table.select("td")
        
        for cell in cells {
            let text = try cell.text().trimmingCharacters(in: .whitespacesAndNewlines)
            if text.contains("學年") && text.contains("學期") {
                return text
            }
        }
        
        throw ParsingError.cellDataMissing("Semester info not found.")
    }
    
//    func parse(htmlContent: String) throws -> [Exam] {
//        let doc: Document = try SwiftSoup.parse(htmlContent)
//        var exams: [Exam] = []
//        var examHeaderInfos: [ExamHeaderInfo] = []
//        
//        guard let mainTable = try doc.select("table").first(where: { table in
//            if let headerRow = try? table.select("tr[bgcolor=ccc6b5]").first(),
//               let firstHeaderCellText = try? headerRow.select("td").first()?.text() {
//                return firstHeaderCellText == "科目"
//            }
//            return false
//        }) else {
//            throw ParsingError.tableNotFound("Main grades table with '科目' header not found.")
//        }
//        
//        guard let headerRow = try mainTable.select("tr[bgcolor=ccc6b5]").first() else {
//            throw ParsingError.headerRowNotFound
//        }
//        
//        // --- Parse Exam Headers (determines number and order of exams) ---
//        let headerCells = try headerRow.select("td")
//        var currentExamSortOrder = 0
//        var colIdx = 5
//        
//        while colIdx < headerCells.count {
//            let examNameCell = headerCells[colIdx]
//            let examName = try examNameCell.text().trimmingCharacters(in: .whitespacesAndNewlines)
//            let replacedExamName = replaceExamNae(examName) ?? examName
//            let examType = getExamType(with: replacedExamName)
//            
//            if colIdx + 3 < headerCells.count && !replacedExamName.isEmpty {
//                let info = ExamHeaderInfo(name: replacedExamName,
//                                          scoreColIndex: colIdx,
//                                          sortOrder: currentExamSortOrder)
//                examHeaderInfos.append(info)
//                let exam = Exam(name: replacedExamName, sortOrder: currentExamSortOrder)
//                exam.type = examType
//                exams.append(exam) // Exams array is now populated in the correct order
//                currentExamSortOrder += 1
//                colIdx += 4
//            } else {
//                break
//            }
//        }
//        
//        // --- Parse Subject Data ---
//        let subjectRows = try mainTable.select("tr[bgcolor=#e1e1e1]")
//        for (subjectRowIndex, subjectRow) in subjectRows.enumerated() {
//            let cells = try subjectRow.select("td")
//            guard cells.count > 4 else { continue }
//            
//            let rawSubjectName = try cleanCellText(from: cells[0])
//            let subjectName = self.cleanSubjectName(rawSubjectName)
//            let replacedSubjectName = self.replaceSubjectName(subjectName)
//            
//            let subjectTypeHtml = try cleanCellText(from: cells[3])
//            let subjectType = SubjectType(htmlString: subjectTypeHtml)
//            
//            for examInfo in examHeaderInfos {
//                guard let exam = exams.first(where: { $0.sortOrder == examInfo.sortOrder }) else { continue }
//                guard examInfo.rankCountColIndex < cells.count else { continue }
//                
//                let scoreStrHtml = try cells[examInfo.scoreColIndex].text()
//                
//                let subjectScoreString = self.cleanCellText(scoreStrHtml)
//                guard subjectScoreString != "–" else { continue }
//                
//                let averageStr = try cells[examInfo.averageColIndex].text()
//                let rankStr = try cells[examInfo.rankColIndex].text()
//                let rankCountStr = try cells[examInfo.rankCountColIndex].text()
//                
//                let subjectClassAverage = self.parseDouble(averageStr)
//                let subjectClassRanking = self.parseInt(rankStr)
//                let subjectRankingCount = self.parseInt(rankCountStr)
//                
//                let subject = Subject(
//                    name: replacedSubjectName,
//                    clasRranking: subjectClassRanking,
//                    rankingCount: subjectRankingCount,
//                    type: subjectType,
//                    credit: 0,
//                    score: subjectScoreString,
//                    isCreditGained: false,
//                    classAverage: subjectClassAverage,
//                    sortOrder: subjectRowIndex
//                )
//                
//                subject.exam = exam
//                exam.subjects.append(subject)
//            }
//        }
//        
//        // --- Parse Exam Summary Data (total scores, averages, rankings) ---
//        let summaryRows = try mainTable.select("tr[bgcolor=#f5f5f5]")
//        for summaryRow in summaryRows {
//            let cells = try summaryRow.select("td")
//            guard cells.count > 1 else { continue } // Must have metric name and at least one value cell
//            
//            let metricNameCell = cells[0]
//            var metricName = try self.cleanCellText(from: metricNameCell)
//            
//            // Clean the metric name for simpler switch cases
//            metricName = metricName.replacingOccurrences(of: "(班百分比)", with: "")
//                .replacingOccurrences(of: "(組百分比)", with: "")
//                .replacingOccurrences(of: "(年百分比)", with: "")
//                .trimmingCharacters(in: .whitespacesAndNewlines)
//            
//            // The data cells for exams start from cells[1] in the summary row
//            for (examIndex, exam) in exams.enumerated() {
//                let valueCellIndex = examIndex + 1 // cells[0] is metric name, cells[1] is for exam[0], etc.
//                guard valueCellIndex < cells.count else { continue } // Ensure cell exists for this exam
//                
//                let valueCell = cells[valueCellIndex]
//                let cellText = try self.cleanCellText(from: valueCell)
//                
//                switch metricName {
//                case "總分":
//                    if !cellText.isEmpty, let doubleValue = Double(cellText) {
//                        exam.totalScore = Int(doubleValue.rounded())
//                    }
//                case "加權總分":
//                    if !cellText.isEmpty, let doubleValue = Double(cellText) {
//                        exam.weightedScore = Int(doubleValue.rounded())
//                    }
//                case "平均":
//                    if !cellText.isEmpty { // Only parse if not empty
//                        exam.averageScore = self.parseDouble(cellText, fallback: 0.0)
//                    }
//                case "加權平均":
//                    if !cellText.isEmpty {
//                        exam.weightedAverageScore = self.parseDouble(cellText, fallback: 0.0)
//                    }
//                case "班名次":
//                    exam.classRanking = try self.parseRanking(from: valueCell)
//                case "組名次":
//                    exam.streamRanking = try self.parseRanking(from: valueCell)
//                case "年名次":
//                    exam.gradeRanking = try self.parseRanking(from: valueCell)
//                default:
//                    break
//                }
//            }
//        }
//        return exams
//    }
    
    /// Parse score table into exam-to-subjects relationship, from certain html form.
    /// - Parameter htmlContent: The html content of the score table to parse.
    /// - Returns: A dictionary representing the relationships between exam and subjects.
    ///
    /// - Note: Returning dictionary instead of creating relationship between `Exam` and `Subject`
    /// because it will cause fatal error in iOS 17.
    func parse(htmlContent: String) throws -> [Exam: [Subject]] {
        let doc: Document = try SwiftSoup.parse(htmlContent)
        var exams: [Exam] = []
        var examHeaderInfos: [ExamHeaderInfo] = []
        var examToSubjects: [Exam: [Subject]] = [:]
        
        guard let mainTable = try doc.select("table").first(where: { table in
            if let headerRow = try? table.select("tr[bgcolor=ccc6b5]").first(),
               let firstHeaderCellText = try? headerRow.select("td").first()?.text() {
                return firstHeaderCellText == "科目"
            }
            return false
        }) else {
            throw ParsingError.tableNotFound("Main grades table with '科目' header not found.")
        }
        
        guard let headerRow = try mainTable.select("tr[bgcolor=ccc6b5]").first() else {
            throw ParsingError.headerRowNotFound
        }
        
        // --- Parse Exam Headers (determines number and order of exams) ---
        let headerCells = try headerRow.select("td")
        var currentExamSortOrder = 0
        var colIdx = 5
        
        while colIdx < headerCells.count {
            let examNameCell = headerCells[colIdx]
            let examName = try examNameCell.text().trimmingCharacters(in: .whitespacesAndNewlines)
            let replacedExamName = replaceExamNae(examName) ?? examName
            let examType = getExamType(with: replacedExamName)
            let examTimeOrder = getExamTimeOrder(with: replacedExamName)
            
            if colIdx + 3 < headerCells.count && !replacedExamName.isEmpty {
                let info = ExamHeaderInfo(name: replacedExamName,
                                          scoreColIndex: colIdx,
                                          sortOrder: currentExamSortOrder)
                examHeaderInfos.append(info)
                let exam = Exam(name: replacedExamName, sortOrder: currentExamSortOrder)
                exam.type = examType
                exam.timeOrder = examTimeOrder
                exams.append(exam) // Exams array is now populated in the correct order
                examToSubjects[exam] = []
                currentExamSortOrder += 1
                colIdx += 4
            } else {
                break
            }
        }
        
        // --- Parse Subject Data ---
        let subjectRows = try mainTable.select("tr[bgcolor=#e1e1e1]")
        for (subjectRowIndex, subjectRow) in subjectRows.enumerated() {
            let cells = try subjectRow.select("td")
            guard cells.count > 4 else { continue }
            
            let rawSubjectName = try cleanCellText(from: cells[0])
            let subjectName = self.cleanSubjectName(rawSubjectName)
            let replacedSubjectName = self.replaceSubjectName(subjectName)
            
            let subjectTypeHtml = try cleanCellText(from: cells[3])
            let subjectType = SubjectType(htmlString: subjectTypeHtml)
            
            for examInfo in examHeaderInfos {
                guard let exam = exams.first(where: { $0.sortOrder == examInfo.sortOrder }) else { continue }
                guard examInfo.rankCountColIndex < cells.count else { continue }
                
                let scoreStrHtml = try cells[examInfo.scoreColIndex].text()
                
                let subjectScoreString = self.cleanCellText(scoreStrHtml)
                guard subjectScoreString != "–" else { continue }
                
                let averageStr = try cells[examInfo.averageColIndex].text()
                let rankStr = try cells[examInfo.rankColIndex].text()
                let rankCountStr = try cells[examInfo.rankCountColIndex].text()
                
                let subjectClassAverage = self.parseDouble(averageStr)
                let subjectClassRanking = self.parseInt(rankStr)
                let subjectRankingCount = self.parseInt(rankCountStr)
                let subjectCredit = self.getSubjectCredit(from: replacedSubjectName)
                
                let subject = Subject(
                    name: replacedSubjectName,
                    clasRranking: subjectClassRanking,
                    rankingCount: subjectRankingCount,
                    type: subjectType,
                    credit: subjectCredit,
                    score: subjectScoreString,
                    isCreditGained: false,
                    classAverage: subjectClassAverage,
                    sortOrder: subjectRowIndex
                )
                
                examToSubjects[exam]?.append(subject)
//                subject.exam = exam
//                exam.subjects.append(subject)
            }
        }
        
        // --- Parse Exam Summary Data (total scores, averages, rankings) ---
        let summaryRows = try mainTable.select("tr[bgcolor=#f5f5f5]")
        for summaryRow in summaryRows {
            let cells = try summaryRow.select("td")
            guard cells.count > 1 else { continue } // Must have metric name and at least one value cell
            
            let metricNameCell = cells[0]
            var metricName = try self.cleanCellText(from: metricNameCell)
            
            // Clean the metric name for simpler switch cases
            metricName = metricName.replacingOccurrences(of: "(班百分比)", with: "")
                .replacingOccurrences(of: "(組百分比)", with: "")
                .replacingOccurrences(of: "(年百分比)", with: "")
                .trimmingCharacters(in: .whitespacesAndNewlines)
            
            // The data cells for exams start from cells[1] in the summary row
            for (examIndex, exam) in exams.enumerated() {
                let valueCellIndex = examIndex + 1 // cells[0] is metric name, cells[1] is for exam[0], etc.
                guard valueCellIndex < cells.count else { continue } // Ensure cell exists for this exam
                
                let valueCell = cells[valueCellIndex]
                let cellText = try self.cleanCellText(from: valueCell)
                
                switch metricName {
                case "總分":
                    if !cellText.isEmpty, let doubleValue = Double(cellText) {
                        exam.totalScore = Int(doubleValue.rounded())
                    }
                case "加權總分":
                    if !cellText.isEmpty, let doubleValue = Double(cellText) {
                        exam.weightedScore = Int(doubleValue.rounded())
                    }
                case "平均":
                    if !cellText.isEmpty { // Only parse if not empty
                        exam.averageScore = self.parseDouble(cellText, fallback: 0.0)
                    }
                case "加權平均":
                    if !cellText.isEmpty {
                        exam.weightedAverageScore = self.parseDouble(cellText, fallback: 0.0)
                    }
                case "班名次":
                    exam.classRanking = try self.parseRanking(from: valueCell)
                case "組名次":
                    exam.streamRanking = try self.parseRanking(from: valueCell)
                case "年名次":
                    exam.gradeRanking = try self.parseRanking(from: valueCell)
                default:
                    break
                }
            }
        }
        return examToSubjects
    }
    
    // MARK: - Private Text Cleaning and Parsing Helpers
    private func cleanCellText(_ text: String) -> String {
        return text.replacingOccurrences(of: "&nbsp;", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func cleanCellText(from element: Element?) throws -> String {
        guard let element = element else { return "" }
        return try element.text()
            .replacingOccurrences(of: "&nbsp;", with: "")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    // TODO: Need official credit resource
    private func getSubjectCredit(from replacedSubjectName: String) -> Int {
        let credit4Names = ["國文", "英文", "數學"]
        if credit4Names.contains(replacedSubjectName) { return 4 }
        
        let credit2Names = ["歷史", "地理", "公民", "化學", "物理", "生物", "地科"]
        if credit2Names.contains(replacedSubjectName) { return 2 }
        
        return 1
    }
    
    private func replaceSubjectName(_ name: String) -> String {
        let namesToReplace = [
            "國語文": "國文",
            "英語文": "英文",
            "地球科學": "地科"
        ]
        
        return namesToReplace[name] ?? name
    }
    
    private func replaceExamNae(_ name: String) -> String? {
        let namesToReplace = [
            "第1次段考": "一段",
            "第2次段考": "二段",
            "第3次段考": "三段",
            "第1次平時考": "一週",
            "第2次平時考": "二週",
            "第3次平時考": "三週",
            "第1次藝能科": "藝能科",
            "第1次多元評量": "多元評量",
            "學期總成績": "學期總成績"
        ]
        
        return namesToReplace[name]
    }
    
    private func getExamTimeOrder(with replacedName: String) -> Int {
        let examNames = ["一週", "一段", "二週", "二段", "三週", "三段", "藝能科", "多元評量", "學期總成績"]
        for (i, examName) in examNames.enumerated() where examName == replacedName {
            return i
        }
        return 0
    }
    
    private func getExamType(with name: String) -> ExamType {
        let mainExamNames = ["一段", "二段", "三段"]
        let weeklyExamNames = ["一平", "二平", "三平"]
        return mainExamNames.contains(name) ? .main: (weeklyExamNames.contains(name) ? .weekly: .other)
    }
    
    private func cleanSubjectName(_ name: String) -> String {
        var cleanedName = name
        if cleanedName.hasPrefix("◎") {
            cleanedName = String(cleanedName.dropFirst("◎".count))
        }
        cleanedName = cleanedName.trimmingCharacters(in: .whitespacesAndNewlines)
        let suffixesToRemove = [
            "Ⅱ", "Ⅲ", "Ⅳ", "Ⅴ", "Ⅰ", "(上)", "(下)", "（上）", "（下）", "(二)", "(三)", "(四)", "(五)"
        ]
        for suffix in suffixesToRemove {
            if cleanedName.hasSuffix(suffix) {
                cleanedName = String(cleanedName.dropLast(suffix.count))
                cleanedName = cleanedName.trimmingCharacters(in: .whitespacesAndNewlines)
            }
        }
        return cleanedName.trimmingCharacters(in: .whitespacesAndNewlines)
    }
    
    private func parseInt(_ text: String, fallback: Int = 0) -> Int {
        let cleanedText = self.cleanCellText(text)
        if cleanedText == "–" || cleanedText.isEmpty {
            return fallback
        }
        // Handle potential decimal in ranking count text if any, though typically integers
        if let doubleVal = Double(cleanedText) {
            return Int(doubleVal.rounded())
        }
        return Int(cleanedText) ?? fallback
    }
    
    private func parseRanking(from cellElement: Element?) throws -> Int? {
        guard let element = cellElement else { return nil }
        // .text() method from SwiftSoup strips HTML tags like <font>
        let textContent = try element.text()
        let cleanedText = self.cleanCellText(textContent)
        
        if cleanedText.isEmpty || cleanedText == "–" {
            return nil
        }
        // Extract the leading integer part (e.g., "36" from "36(78.89)")
        if let firstNumericPart = cleanedText.components(separatedBy: CharacterSet.decimalDigits.inverted).first,
           let intValue = Int(firstNumericPart) {
            return intValue
        }
        return nil
    }
    
    private func parseDouble(_ text: String, fallback: Double = 0.0) -> Double {
        let cleanedText = self.cleanCellText(text)
        if cleanedText == "–" || cleanedText.isEmpty {
            return fallback
        }
        return Double(cleanedText) ?? fallback
    }
}

// MARK: - Custom Error Enum (Optional, for better error handling)
enum ParsingError: Error {
    case tableNotFound(String)
    case headerRowNotFound
    case cellDataMissing(String)
    // Add other specific parsing errors as needed
}
