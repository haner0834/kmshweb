//
//  View.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/1.
//

import SwiftUI

extension View {
    @ViewBuilder
    func `if`<Content: View>(_ condition: Bool, @ViewBuilder content: @escaping (Self) -> Content) -> some View {
        if condition {
            content(self)
        }else {
            self
        }
    }
}
