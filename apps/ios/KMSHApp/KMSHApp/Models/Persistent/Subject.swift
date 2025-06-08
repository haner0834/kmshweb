//
//  Subject.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import SwiftData

@Model
class Subject: Orderable, @unchecked Sendable, CustomStringConvertible {
    var name: String
    var clasRranking: Int
    var rankingCount: Int
    var type: SubjectType
    var credit: Int
    var score: String
    var isCreditGained: Bool
    var classAverage: Double
    var sortOrder: Int = 0
    @Relationship(inverse: \Exam.subjects)
    var exam: Exam? = nil
    
    // Transient variables
    @Attribute(.ephemeral)
    var isPassIndicatorDisplayed: Bool = false
    
    init(name: String = "", clasRranking: Int = 0, rankingCount: Int = 0, type: SubjectType = .nationalMandatory, credit: Int = 0, score: String = "", isCreditGained: Bool = false, classAverage: Double = 0, sortOrder: Int = 0) {
        self.name = name
        self.clasRranking = clasRranking
        self.rankingCount = rankingCount
        self.type = type
        self.credit = credit
        self.score = score
        self.isCreditGained = isCreditGained
        self.classAverage = classAverage
        self.sortOrder = sortOrder
    }
    
    var description: String {
        "Subject(name: \(name))"
    }
    
    func getScore() -> Int? {
        Int(score)
    }
}
