//
//  Account.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import Foundation
import SwiftData

@Model
class Account: Orderable {
    var name: String
    @Attribute(.unique) var id: String
    var password: String
    var grade: Grade
    var classLabel: String
    var stream: String
    var gender: Gender
    var birthDate: Date
    var enrollmentDate: Date
    var graduationDate: Date?
    var graduationSchool: String
    var status: EnrollmentStatus
    var credential: String
    var address: Address
    var phoneNumber: String
    var guardianContact: Guardian
    var contactInfo: ContactInfo
    var sortOrder: Int = 0
    
    @Relationship(deleteRule: .cascade, inverse: \Semester.account)
    var semesters: [Semester] = []
    
    init(
        name: String = "",
        id: String = "",
        passwrod: String = "",
        grade: Grade = .junior1,
        classLabel: String = "",
        stream: String = "",
        gender: Gender = .female,
        birthDate: Date = .now,
        enrollmentDate: Date = .now,
        graduationDate: Date? = nil,
        graduationSchool: String = "",
        status: EnrollmentStatus = .enrolled,
        credential: String = "",
        address: Address = .init(),
        phoneNumber: String = "",
        guardianContect: Guardian = .init(),
        contactInfo: ContactInfo = .init()
    ) {
        self.name = name
        self.id = id
        self.password = passwrod
        self.grade = grade
        self.classLabel = classLabel
        self.stream = stream
        self.gender = gender
        self.birthDate = birthDate
        self.enrollmentDate = enrollmentDate
        self.graduationDate = graduationDate
        self.graduationSchool = graduationSchool
        self.status = status
        self.credential = credential
        self.address = address
        self.phoneNumber = phoneNumber
        self.guardianContact = guardianContect
        self.contactInfo = contactInfo
    }
    
    var classNumber: Int? {
        // TODO: Complete this map
        let names = ["忠", "2", "3", "4", "5", "6", "7", "禮", "9", "平", "智", "信"]
        
        for (i, name) in names.enumerated() {
            if name == classLabel {
                return i
            }
        }
        
        return nil
    }
}

struct Address: Codable {
    var household: String = ""
    var emergency: String = ""
    var phoneNumber: String = ""
}

struct ContactInfo: Codable {
    var father: Guardian = .init()
    var mother: Guardian = .init()
    var emergency: Guardian = .init()
}

struct Guardian: Codable {
    var name: String = ""
    var title: String = ""
    var phoneNumber: String = ""
    var prefession: String = ""
}

enum EnrollmentStatus: String, Codable {
    case enrolled, suspended, graduated, withdraw
    
    var name: String {
        switch self {
        case .enrolled:
            "就學中"
        case .suspended:
            "休學"
        case .graduated:
            "已畢業"
        case .withdraw:
            "退學"
        }
    }
}

enum Gender: String, Codable {
    case male, female
    var name: String {
        switch self {
        case .male:
            "男"
        case .female:
            "女"
        }
    }
}
