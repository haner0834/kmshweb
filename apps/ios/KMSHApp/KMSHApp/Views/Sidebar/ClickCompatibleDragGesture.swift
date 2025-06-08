//
//  ClickCompatibleDragGesture.swift
//  Memood
//
//  Created by Andy Lin on 2024/11/7.
//

import SwiftUI

struct ClickCompatibleDragGesture: UIGestureRecognizerRepresentable {
    var handle: (UIPanGestureRecognizer) -> Void
    
    func makeUIGestureRecognizer(context: Context) -> UIPanGestureRecognizer {
        let gesture = UIPanGestureRecognizer()
        return gesture
    }
    
    func updateUIGestureRecognizer(_ recognizer: UIPanGestureRecognizer, context: Context) {
        
    }
    
    func handleUIGestureRecognizerAction(_ recognizer: UIPanGestureRecognizer, context: Context) {
        handle(recognizer)
    }
}
