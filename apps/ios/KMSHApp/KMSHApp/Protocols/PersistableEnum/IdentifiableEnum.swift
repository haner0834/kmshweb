//
//  IdentifiableEnum.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/8.
//

import Foundation

protocol IdentifiableEnum: CaseIterable where AllCases: RandomAccessCollection {
    var persistentID: String { get }
    static func match(from id: String) -> Self?
}

extension IdentifiableEnum {
    var persistentID: String {
        String(describing: Self.self) + "/" + String(describing: self)
    }
    
    static func match(from id: String) -> Self? {
        Self.allCases.first { $0.persistentID == id }
    }
}
