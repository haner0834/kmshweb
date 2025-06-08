//
//  SubjectType.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

enum SubjectType: String, Identifiable, CaseIterable, Codable {
    case nationalMandatory = "部定必修"
    case schoolMandatory = "校訂必修"
    case schoolElective = "選修-多元選修"
    case otherElective = "選修-其他"
    case unknown = "未知"

    init(htmlString: String) {
        for typeCase in SubjectType.allCases {
            if htmlString == typeCase.rawValue {
                self = typeCase
                return
            }
        }
        let trimmedHtmlString = htmlString.trimmingCharacters(in: .whitespacesAndNewlines)
        switch trimmedHtmlString {
            case "部定必修": self = .nationalMandatory
            case "校訂必修": self = .schoolMandatory
            case "選修-多元選修": self = .schoolElective
            case "選修-其他": self = .otherElective
            default: self = .unknown
        }
    }
    
    var id: Self { self }
}
