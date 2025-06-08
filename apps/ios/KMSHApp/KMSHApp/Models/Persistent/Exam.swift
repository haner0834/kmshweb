//
//  Exam.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import SwiftData

@Model
class Exam: Orderable, @unchecked Sendable, CustomStringConvertible {
    var name: String
    var sortOrder: Int = 0
    /// A flag used to be identify when sorting by exam time
    var timeOrder: Int = 0
    var subjects: [Subject] = []
    @Relationship(inverse: \Semester.exams)
    var semester: Semester? = nil
    var type: ExamType = ExamType.main

    // New fields for Exam summary data
    var totalScore: Int = 0
    var weightedScore: Int = 0
    var averageScore: Double = 0.0
    var weightedAverageScore: Double = 0.0
    var classRanking: Int? = nil
    var streamRanking: Int? = nil
    var gradeRanking: Int? = nil

    init(name: String, type: ExamType = .main, sortOrder: Int = 0) {
        self.name = name
        self.type = type
        self.sortOrder = sortOrder
    }
    
    var description: String {
        "Exam(name: \(name), sortOrder: \(sortOrder), subjects: \(subjects.map { "\($0)" }), semester: \(String(describing: semester)), type: \(type)"
    }
}

enum ExamType: Codable {
    case main, weekly, other
}

