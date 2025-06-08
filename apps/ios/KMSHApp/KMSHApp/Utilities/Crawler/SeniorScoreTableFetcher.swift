//
//  SeniorScoreTableFetcher.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

struct SeniorScoreTableFetcher {
    var session: URLSession
    
    func fetchScoreTable() async throws -> String {
        let fnc = FNCManager(session: session)
        let content = try await fnc.perform(with: .scoreTable)
        if !content.contains("學期") {
            throw FetchError.fetchFailed
        }
        return content
    }
}

enum FetchError: Error {
    case fetchFailed
}
