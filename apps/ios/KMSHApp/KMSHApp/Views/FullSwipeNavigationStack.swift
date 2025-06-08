//
//  FullSwipeNavigationStack.swift
//  Gremo
//
//  Created by Andy Lin on 2025/4/26.
//

import SwiftUI

struct FullSwipeNavigationStack<Content: View, Path: Hashable>: View {
    @Binding var path: [Path]
    @ViewBuilder var content: () -> Content
    
    @State private var customGesture: UIPanGestureRecognizer = {
        let gesture = UIPanGestureRecognizer()
        gesture.name = UUID().uuidString
        gesture.isEnabled = false
        return gesture
    }()
    
    var body: some View {
        NavigationStack(path: $path) {
            content()
                .background {
                    AttatchGestureView(gesture: $customGesture)
                }
        }
        .environment(\.popGestureID, customGesture.name)
        .onReceive(NotificationCenter.default.publisher(for: .init(customGesture.name ?? ""))) { info in
            guard let userInfo = info.userInfo, let status = userInfo["status"] as? Bool else { return }
            
            customGesture.isEnabled = status
        }
    }
}

fileprivate struct PopNotificationID: EnvironmentKey {
    nonisolated(unsafe) static var defaultValue: String?
}

fileprivate extension EnvironmentValues {
    var popGestureID: String? {
        get {
            self[PopNotificationID.self]
        }
        set {
            self[PopNotificationID.self] = newValue
        }
    }
}

extension View {
    @ViewBuilder
    func fullSwipePop(isEnabled: Bool = true) -> some View {
        modifier(FullSwipeViewModifier(isEnabled: isEnabled))
    }
}

fileprivate struct FullSwipeViewModifier: ViewModifier {
    let isEnabled: Bool
    
    @Environment(\.popGestureID) private var gestureID
    
    func body(content: Content) -> some View {
        content
            .onChange(of: isEnabled, initial: true) { oldValue, newValue in
                guard let gestureID else { return }
                
                NotificationCenter.default.post(name: .init(gestureID), object: nil, userInfo: [
                    "status": newValue
                ])
            }
            .onDisappear {
                guard let gestureID else { return }
                
                NotificationCenter.default.post(name: .init(gestureID), object: nil, userInfo: [
                    "status": false
                ])
            }
    }
}

fileprivate struct AttatchGestureView: UIViewRepresentable {
    @Binding var gesture: UIPanGestureRecognizer
    
    func makeUIView(context: Context) -> UIView {
        return UIView()
    }
    
    func updateUIView(_ uiView: UIView, context: Context) {
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
            // Finding parent controller
            if let parentViewController = uiView.parentViewController,
               let navigationController = parentViewController.navigationController {
                // Checking if the gesture is already added
                guard let _ = navigationController.view.gestureRecognizers?.first(where: { $0.name != gesture.name }) else { return }
                
                navigationController.addFullSwipeGesture(gesture)
            }
        }
    }
}

fileprivate extension UINavigationController {
    func addFullSwipeGesture(_ gesture: UIPanGestureRecognizer) {
        guard let gestureSelector = interactivePopGestureRecognizer?.value(forKey: "targets") else { return }
        
        gesture.setValue(gestureSelector, forKey: "targets")
        view.addGestureRecognizer(gesture)
    }
}

fileprivate extension UIView {
    var parentViewController: UIViewController? {
        sequence(first: self) {
            $0.next
        }
        .first {
            $0 is UIViewController
        } as? UIViewController
    }
}

#if DEBUG

struct FullSwipeNavigationStackPreview: View {
    @State private var path = [Int]()
    var body: some View {
        FullSwipeNavigationStack(path: $path) {
            List {
                NavigationLink("??") {
                    List {
                        Text(":D")
                            .fullSwipePop()
                    }
                }
            }
        }
    }
}

#Preview {
    FullSwipeNavigationStackPreview()
}
#endif
