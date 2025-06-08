//
//  DynamicButtonBackground.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/1.
//

import SwiftUI

struct DynamicButtonBackground: View {
    let status: ButtonStatus
    var duration: Double = 0.85
    
    var body: some View {
        switch status {
        case .performing:
            TimelineView(.animation(minimumInterval: duration)) { context in
                let value = getSituationValue(from: context.date, duration: duration, times: 2)
                
                Color.accentColor
                    .overlay {
                        LinearGradient(colors: [.clear, .whiteBlack.opacity(0.5), .clear], startPoint: .leading, endPoint: .trailing)
                            .frame(width: 250)
                            .offset(x: Int(value) % 2 == 0 ? 300: -300)
                            .animation(.default, value: value)
                    }
            }
        case .disabled:
            Color.accentColor.opacity(0.3)
        case .normal:
            Color.accentColor
        }
    }
    
    func getSituationValue(from date: Date, duration: Double, times: Int) -> Int {
        let interval = date.timeIntervalSinceReferenceDate
        let tick = Int(interval / duration)
        return tick % times
    }
    
    private func secondsValue(for date: Date) -> Double {
        let seconds = Calendar.current.component(.second, from: date)
        return Double(seconds)
    }
}

enum ButtonStatus {
    case performing, disabled, normal
}

#Preview {
    DynamicButtonBackground(status: .normal)
}
