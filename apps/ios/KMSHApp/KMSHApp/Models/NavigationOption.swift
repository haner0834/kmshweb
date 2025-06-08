//
//  NavigationOption.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import SwiftUI

struct NavigationOption: Identifiable, Hashable {
    let id = UUID()
    var name: String
    var systemImageName: String
    var color: Color = .accentColor
    var hasUpdated: Bool = false
    
    var destinationType: NavigationOptionDestination {
        switch name {
        case "考試成績": return .examScore
        case "學習歷程": return .learningHistory
        case "社團": return .clubs
        case "獎懲": return .rewards
        case "課表": return .classSchedule
        case "車表": return .busSchedule
        default: fatalError("Unrecognized option: \(name)")
        }
    }
}

enum NavigationOptionDestination: Hashable {
    case examScore, learningHistory, clubs, rewards, classSchedule, busSchedule
}
