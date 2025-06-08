//
//  ProfileInfoKey.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/7.
//

import Foundation

enum ProfileInfoKey: String, CaseIterable {
    case name = "姓名"
    
    case enrollmentStatusString = "是否在學"
    
    case stream = "組別"
    
    case gradeString = "年級"
    
    case classLabel = "班級"
    
    case houseHoldAddress = "通訊地址"
    
    static func match(with string: String) -> Self {
        for key in Self.allCases where key.rawValue == string {
            return key
        }
        return .name
    }
}
