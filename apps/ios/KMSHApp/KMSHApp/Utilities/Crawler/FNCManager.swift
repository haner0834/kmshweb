//
//  FNCManager.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

struct FNCManager {
    var session: URLSession
    
    func perform(with type: FNCType) async throws -> String {
        guard let url = URL(string: URLCollection.Senior.fnc) else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = .post
        
        let payload = [
            "fncid": type.id,
            "std_id": "",
            "local_ip": "",
            "contant": ""
        ]
            .toCookie()
        
        request.httpBody = payload.data(using: .utf8)
        
        let (data, response) = try await session.data(for: request)
        
        guard (response as? HTTPURLResponse)?.statusCode == 200 else {
            throw URLError(.badServerResponse)
        }
        
        guard let content = String(data: data, encoding: .utf8) else {
            throw NSError(domain: "decode_error", code: -1)
        }
        
        return content
    }
    
    enum FNCError: Error {
        case codeNotSupported
    }
}

enum FNCType {
    case scoreTable, userProfile
    
    var id: String {
        switch self {
        case .scoreTable:
            return "010090"
        case .userProfile:
            return "010210"
        }
    }
}
