//
//  ScoreTableParser.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation
import SwiftSoup

struct ProfileParser {
    // Function to parse student data from an HTML string
    func parseProfile(htmlString: String) -> [String: String]? {
        var studentInfo: [String: String] = [:]
        var dataFoundInSummary = false
        var dataFoundInMainTable = false

        // Helper function to clean text extracted from an Element
        // It handles <br> tags by converting them to spaces, and trims whitespace.
        func cleanTextFromElement(_ element: Element) throws -> String {
            var htmlContent = try element.html()
            
            // Replace <br>, <br/>, <br /> tags with a space for better text concatenation
            htmlContent = htmlContent.replacingOccurrences(of: "<br>", with: " ", options: .caseInsensitive)
            htmlContent = htmlContent.replacingOccurrences(of: "<br/>", with: " ", options: .caseInsensitive)
            htmlContent = htmlContent.replacingOccurrences(of: "<br />", with: " ", options: .caseInsensitive)
            
            // Parse this modified HTML snippet to easily get its text content
            let tempDoc = try SwiftSoup.parseBodyFragment(htmlContent)
            let text = try tempDoc.text()
            
            // Trim leading/trailing whitespaces and newlines.
            return text.trimmingCharacters(in: .whitespacesAndNewlines)
        }

        do {
            let doc = try SwiftSoup.parse(htmlString)

            // --- Section to extract from the summary table ---
            // This table typically contains identity, academic term, and grade/class.
            // We select a table that has a <td> with bgcolor="#4682b4" (characteristic of the summary header).
            // We also filter to ensure it's not the main data table (which has bgcolor="#cee7ff").
            if let summaryTable = try doc.select("table:has(tr > td[bgcolor=\"#4682b4\"])")
                                          .filter({ (table: Element) -> Bool in
                                              return (try? table.attr("bgcolor")) != "#cee7ff"
                                          }).first {
                let summaryRows = try summaryTable.select("tr")
                
                // "一一三學年 第二學期" (Academic Term) and "高一平" (Grade/Class) are in the second row (index 1).
                if summaryRows.count > 1 {
                    let secondRowCells = try summaryRows.get(1).select("td")
                    
                    // Extract Academic Term (e.g., "一一三學年 第二學期")
                    if secondRowCells.count > 0 {
                        let academicTerm = try cleanTextFromElement(secondRowCells.get(0))
                        if !academicTerm.isEmpty {
                            studentInfo["學期資訊"] = academicTerm
                            dataFoundInSummary = true
                        }
                    }
                    
                    // Extract Grade/Class (e.g., "高一平")
                    // The commented-out <td> in HTML is skipped by .select("td"), so index 1 is correct.
                    if secondRowCells.count > 1 {
                        let gradeClass = try cleanTextFromElement(secondRowCells.get(1))
                        if !gradeClass.isEmpty {
                            print(gradeClass)
                            studentInfo["年級"] = String(gradeClass.prefix(2))
                            studentInfo["班級"] = String(gradeClass[gradeClass.index(gradeClass.startIndex, offsetBy: 2)])
                            dataFoundInSummary = true // Mark true if either piece of summary data is found
                        }
                    }
                }
            } else {
                print("Warning: Summary table for academic term and grade/class not found. Skipping these fields.")
            }

            // --- Section to extract from the main data table ---
            // This table has bgcolor="#cee7ff"
            if let mainTable = try doc.select("table[bgcolor=\"#cee7ff\"]").first() {
                let rows: Elements = try mainTable.select("tr")

                if !rows.isEmpty() {
                    for (index, row) in rows.enumerated() {
                        let cells: Elements = try row.select("td")

                        if cells.isEmpty { continue }

                        if index == 0 { // First row: Name and Photo
                            if cells.count >= 4 {
                                let key1 = try cleanTextFromElement(cells.get(0)); let value1 = try cleanTextFromElement(cells.get(1))
                                if !key1.isEmpty { studentInfo[key1] = value1; dataFoundInMainTable = true }

                                let key2 = try cleanTextFromElement(cells.get(2)); let value2 = try cleanTextFromElement(cells.get(3))
                                if !key2.isEmpty { studentInfo[key2] = value2; dataFoundInMainTable = true }
                            }
                        } else { // Subsequent rows
                            if cells.count == 2 {
                                let key = try cleanTextFromElement(cells.get(0)); let value = try cleanTextFromElement(cells.get(1))
                                if !key.isEmpty { studentInfo[key] = value; dataFoundInMainTable = true }
                            } else if cells.count == 4 {
                                let key1 = try cleanTextFromElement(cells.get(0)); let value1 = try cleanTextFromElement(cells.get(1))
                                if !key1.isEmpty { studentInfo[key1] = value1; dataFoundInMainTable = true }

                                let key2 = try cleanTextFromElement(cells.get(2)); let value2 = try cleanTextFromElement(cells.get(3))
                                if !key2.isEmpty { studentInfo[key2] = value2; dataFoundInMainTable = true }
                            }
                        }
                    }
                } else {
                     print("Warning: Main data table (table[bgcolor=\"#cee7ff\"]) was found but contained no rows.")
                }
            } else {
                print("Warning: Main student data table (table[bgcolor=\"#cee7ff\"]) not found.")
            }
            
            // Return data if any was found, otherwise nil
            if !dataFoundInSummary && !dataFoundInMainTable {
                print("Error: No data could be extracted from any relevant table.")
                return nil
            }
            
            // If studentInfo is still empty here, it means data flags were true but nothing was added.
            // This case should ideally be covered by individual isEmpty checks when adding to dictionary.
            // However, as a final check:
            if studentInfo.isEmpty {
                 print("Error: Data extraction flags were set, but the resulting dictionary is empty. Review parsing logic.")
                 return nil
            }

            return studentInfo

        } catch Exception.Error(_, let message) {
            print("SwiftSoup HTML parsing error: \(message)")
            return nil
        } catch {
            print("An unexpected error occurred during parsing: \(error)")
            return nil
        }
    }
}
