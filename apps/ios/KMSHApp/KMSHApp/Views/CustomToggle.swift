//
//  CustomToggle.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/4.
//

import SwiftUI

struct CustomToggle: View {
    @Binding var isOn: Bool
    var body: some View {
        VStack {
            Circle()
                .fill(.whiteBlack)
                .padding(4)
        }
        .frame(width: 50, height: 32, alignment: isOn ? .trailing: .leading)
        .background(isOn ? Color.text: Color.gray.opacity(0.4))
        .clipShape(.capsule)
        .onTapGesture {
            withAnimation(.spring(response: 0.3, dampingFraction: 1, blendDuration: 0)) {
                isOn.toggle()
            }
        }
    }
}
