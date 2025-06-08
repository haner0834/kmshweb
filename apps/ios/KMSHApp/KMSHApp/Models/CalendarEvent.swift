//
//  Event.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import SwiftUI

struct CalendarEvent: Identifiable {
    let id = UUID()
    
    var name: String
    var type: CalendarEventType = .normal
    // The accuracy of these dates are only supported to day range
    var startDate: Date = .now
    var endDate: Date = .now
}
