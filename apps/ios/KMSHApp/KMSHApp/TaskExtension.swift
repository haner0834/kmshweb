//
//  TaskExtension.swift
//  Memood
//
//  Created by Andy Lin on 2024/12/23.
//

import Foundation

extension Task where Success == Never, Failure == Never {
    static func sleep(seconds: TimeInterval) async throws {
        try await Task.sleep(nanoseconds: UInt64(seconds * 1000000000))
    }
}
