//
//  CustomAlertComponents.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/31.
//

import SwiftUI

enum Arrangement {
    case virtical, horizontal
}

struct AlertBlock<Content: View>: View {
    let title: String
    let alignment: Arrangement
    @ViewBuilder var content: () -> Content
    
    init(title: String, alignment: Arrangement = .virtical, @ViewBuilder content: @escaping () -> Content) {
        self.title = title
        self.alignment = alignment
        self.content = content
    }
    
    var body: some View {
        VStack(spacing: 16) {
            Text(title)
                .bold()
                .multilineTextAlignment(.center)
            
            content()
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.alertBackground)
        .clipShape(.rect(cornerRadius: 16))
        .padding(50)
    }
}

struct AlertBottomButton: View {
    let title: String
    var color: Color = .accentColor
    let action: () -> Void
    
    var body: some View {
        Button {
            action()
        } label: {
            Text(title)
                .font(.body)
                .padding(.vertical)
                .frame(maxWidth: .infinity)
                .background(color)
                .clipShape(.rect(cornerRadius: 12))
        }
    }
}
