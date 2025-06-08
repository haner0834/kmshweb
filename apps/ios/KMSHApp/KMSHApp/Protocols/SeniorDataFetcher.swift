//
//  DataFetcher.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

protocol SeniorDataFetcher {
    var session: URLSession { get }
    
    func fetchNecessaryData() async throws
}

extension SeniorDataFetcher {
    private func fetchNecessaryData() async throws {
        // Check if the url is accessable
        guard let url = URL(string: URLCollection.Senior.f_left) else {
            throw URLError(.badURL)
        }
        
        let request = URLRequest(url: url)
        
        let (_, response) = try await session.data(for: request)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
    }
}
