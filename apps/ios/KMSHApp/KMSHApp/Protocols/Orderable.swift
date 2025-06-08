//
//  Orderable.swift
//  Gremo
//
//  Created by Andy Lin on 2025/3/1.
//

import Foundation

protocol Orderable {
    associatedtype T: Comparable
    var sortOrder: T { get }
}

extension Collection where Element: Orderable {
    func sortedByOrder(reversed: Bool = false) -> [Element] {
        sorted { reversed ? $0.sortOrder > $1.sortOrder: $0.sortOrder < $1.sortOrder }
    }
}
