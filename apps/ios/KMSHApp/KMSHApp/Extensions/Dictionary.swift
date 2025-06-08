//
//  Dictionary.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

extension Dictionary where Key == String, Value == String {
    func toCookie() -> String {
        map {
            "\($0.key)=\($0.value)"
        }
        .joined(separator: "&")
    }
}
