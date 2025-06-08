//
//  Grade.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import Foundation

enum Grade: Codable, CaseIterable {
    case junior1, junior2, junior3, senior1, senior2, senior3
    
    var name: String {
        switch self {
        case .junior1:
            return "國一"
        case .junior2:
            return "國二"
        case .junior3:
            return "國三"
        case .senior1:
            return "高一"
        case .senior2:
            return "高二"
        case .senior3:
            return "高三"
        }
    }
    
    static func getGrade(gradeString: String) -> Grade {
        for grade in Grade.allCases {
            if grade.name == gradeString {
                return grade
            }
        }
        return .junior1
    }
}
