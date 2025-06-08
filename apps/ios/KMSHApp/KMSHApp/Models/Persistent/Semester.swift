//
//  Semester.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import SwiftData

@Model
class Semester: Orderable, @unchecked Sendable, CustomStringConvertible {
    var name: String
    var sortOrder: Int = 0
    var exams: [Exam] = []
    var account: Account
    
    init(name: String, sortOrder: Int, account: Account) {
        self.name = name
        self.sortOrder = sortOrder
        self.account = account
    }
    
    var description: String {
        "Semester(name: \(name), sortOrder: \(sortOrder), exams: \(exams.map { String(describing: $0) }))"
    }
}
