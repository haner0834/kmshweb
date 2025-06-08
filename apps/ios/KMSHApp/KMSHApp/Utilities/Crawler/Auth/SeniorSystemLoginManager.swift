//
//  SeniorSystemLoginManager.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation
import OSLog

struct SeniorSystemLoginManager: LoginManager {
    var session: URLSession
    
    private let log = Logger()
    
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
    
    func login(with credentials: SeniorLoginData) async throws {
        guard let loginUrl = URL(string: URLCollection.Senior.login) else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: loginUrl)
        request.timeoutInterval = 10
        request.httpMethod = .post
        
        let payload = [
            "txtid": credentials.id,
            "txtpwd": credentials.password,
            "check": "confirm"
        ].toCookie()
        
        request.httpBody = payload.data(using: .utf8)
        
        let (data, response) = try await session.data(for: request)
        
        if let htmlString = String(data: data, encoding: .utf8) {
            // Check if success
            let isSucceeded = htmlString.contains("此網頁使用框架,但是您的瀏覽器並不支援.")
            guard isSucceeded else { throw LoginError.failedToLogin }
        }else {
            print("Failed to decode response data as UTF-8 string")
            throw LoginError.failedToDecodeWithUTF8
        }
        
        // All student data are refer to this(f_left.asp)
        try await fetchNecessaryData()
    }
}

enum LoginError: Error {
    case failedToLogin, failedToDecodeWithUTF8
}

struct SeniorLoginData: LoginData, Codable {
    var id: String
    var password: String
}
