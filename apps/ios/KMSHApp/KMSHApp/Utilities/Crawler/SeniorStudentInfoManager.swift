//
//  SeniorStudentInfoManager.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

struct SeniorStudentInfoManager {
    var session: URLSession
    
    func fetchUserProfile() async throws -> String {
        let fnc = FNCManager(session: session)
        return try await fnc.perform(with: .userProfile)
    }
}
