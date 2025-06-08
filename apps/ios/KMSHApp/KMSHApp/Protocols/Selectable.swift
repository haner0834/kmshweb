//
//  Selectable.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/8.
//

import Foundation

protocol Selectable: CaseIterable, Identifiable where AllCases: RandomAccessCollection {
    var name: String { get }
}
