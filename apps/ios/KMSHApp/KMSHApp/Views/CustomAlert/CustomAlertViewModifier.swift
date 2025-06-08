//
//  CustomAlertViewModifier.swift
//  Gremo
//
//  Created by Andy Lin on 2025/3/19.
//

import SwiftUI

struct CustomAlertViewModifier<AlertContent: View, Item: Equatable>: ViewModifier {
    @Binding var item: Item?
    private var animation: Animation?
    @ViewBuilder var alertContent: (Item) -> AlertContent
    
    @State private var isShowAlert: Bool = false
    @State private var animatedValue: Bool = false
    
    init(item: Binding<Item?>,
         animation: Animation? = .spring(response: 0.35, dampingFraction: 1, blendDuration: 0),
         alertContent: @escaping (Item) -> AlertContent) {
        _item = item
        self.animation = animation
        self.alertContent = alertContent
    }
    
    func body(content: Content) -> some View {
        content
            .fullScreenCover(isPresented: $isShowAlert) {
                ZStack {
                    if animatedValue {
                        Color.black.opacity(0.2)
                            .transition(.opacity)
                        
                        if let item {
                            alertContent(item)
                                .transition(
                                    .asymmetric(
                                        insertion: .scale(scale: 1.1).combined(with: .opacity),
                                        removal: .opacity
                                    )
                                )
                        }
                    }
                }
                .ignoresSafeArea(.container)
                .presentationBackground(.clear)
                .task {
                    withAnimation(animation) {
                        animatedValue = true
                    }
                }
            }
            .onChange(of: item) { oldValue, newValue in
                var transaction = Transaction()
                transaction.disablesAnimations = true
                if newValue != nil {
                    withTransaction(transaction) {
                        isShowAlert = true
                    }
                }else {
                    withAnimation(animation) {
                        animatedValue = false
                    } completion: {
                        withTransaction(transaction) {
                            isShowAlert = false
                        }
                    }
                }
            }
    }
    
    struct BindedValue: @unchecked Sendable {
        var type: BindedValueType
        @Binding var isPresented: Bool
        @Binding var item: Item?
        
        init(isPresented: Binding<Bool>) {
            type = .bool
            _isPresented = isPresented
            _item = .constant(nil)
        }
        
        init(item: Binding<Item?>) {
            type = .anyEquatable
            _isPresented = .constant(false)
            _item = item
        }
        
        var isAvailable: Bool {
            type == .bool ? isPresented: item != nil
        }
    }
    
    enum BindedValueType {
        case bool, anyEquatable
    }
}

extension CustomAlertViewModifier where Item == Bool {
    init(isPresented: Binding<Bool>,
         animation: Animation? = .spring(response: 0.35, dampingFraction: 1, blendDuration: 0),
         alertContent: @escaping () -> AlertContent) {
        _item = .init(get: {
            return isPresented.wrappedValue ? isPresented.wrappedValue: nil
        }, set: { newValue in
            isPresented.wrappedValue = newValue == nil
        })
        self.animation = animation
        self.alertContent = { _ in alertContent() }
    }
}

extension View {
    @ViewBuilder
    func customAlert<AlertContent: View>(isPresented: Binding<Bool>, @ViewBuilder alertContent: @escaping () -> AlertContent) -> some View {
        modifier(CustomAlertViewModifier(isPresented: isPresented, alertContent: alertContent))
    }
    
    @ViewBuilder
    func customAlert<AlertContent: View, Item: Equatable>(
        item: Binding<Item?>,
        @ViewBuilder alertContent: @escaping (Item) -> AlertContent
    ) -> some View {
        modifier(CustomAlertViewModifier(item: item, alertContent: alertContent))
    }
}
