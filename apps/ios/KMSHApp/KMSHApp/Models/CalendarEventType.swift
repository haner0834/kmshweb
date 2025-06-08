//
//  CalendarEventType.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import SwiftUI

enum CalendarEventType: Codable {
    case normal, important, dayOff
    
    var color: Color {
        switch self {
        case .normal:
            return .accent
        case .important:
            return .red
        case .dayOff:
            return .cyan
        }
    }
}
