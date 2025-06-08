//
//  SeniorScoreSystemLogin.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

protocol LoginManager {
    var session: URLSession { get }
    
    associatedtype Credentials: LoginData
    
    func login(with credentials: Credentials) async throws
}

protocol LoginData {
    var id: String { get }
    var password: String { get }
}
