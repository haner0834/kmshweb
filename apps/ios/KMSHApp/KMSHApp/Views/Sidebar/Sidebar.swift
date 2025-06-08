//
//  ContentView.swift
//  Memood
//
//  Created by Andy Lin on 2024/8/7.
//

import SwiftUI

fileprivate struct Sidebar<Content: View, OriginView: View>: View {
    @Binding var isPresented: Bool
    @ViewBuilder var content: () -> Content
    @ViewBuilder var originView: () -> OriginView
    @State private var isShowSidebar: Bool = false
    
    var windowSize: CGSize
    
    init(isPresented: Binding<Bool>,
         size: CGSize,
         @ViewBuilder content: @escaping () -> Content,
         @ViewBuilder originView: @escaping () -> OriginView) {
        _isPresented = isPresented
        self.content = content
        self.originView = originView
        self.windowSize = size
    }
    
    @State private var dragOffset: CGFloat = .zero
    
    var body: some View {
        ZStack(alignment: .leading) {
            originView()
            
            let sidebarWidth = windowSize.width * 0.7
            let offset = min(dragOffset, 0)
            
            if isPresented {
                let opacity = getBackgroundOpacity(sidebarWidth: sidebarWidth)
                Color.primary.opacity(opacity)
                    .transition(.opacity)
                    .onTapGesture {
                        isPresented = false
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .ignoresSafeArea(.container)
                    .zIndex(999)
            }
            
            content()
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
                .frame(width: sidebarWidth)
                .background(Color.whiteBlack)
                .transition(.move(edge: .leading))
                .offset(x: isPresented ? offset: -sidebarWidth)
                .onChange(of: isPresented) { _, _ in
                    dragOffset = .zero
                }
                .dragGesture(dragGesture) { gesture in
                    let state = gesture.state
                    let hOffset = gesture.translation(in: gesture.view).x
                    if state == .began || state == .changed {
                        // on change
                        dragOffset = hOffset
                    }else {
                        // on end
                        handleGestureEnd(gesture: gesture)
                    }
                }
                .zIndex(1000)
        }
        .animation(.default, value: isPresented)
    }
    
    var dragGesture: _EndedGesture<_ChangedGesture<DragGesture>> {
        DragGesture(minimumDistance: 1)
            .onChanged { value in
                dragOffset = value.translation.width
            }
            .onEnded { value in
                dragGestureEnd(dragValue: value)
            }
    }
    
    func handleGestureEnd(gesture: UIPanGestureRecognizer) {
        let hOffset = gesture.translation(in: gesture.view).x
        let hVelocity = gesture.velocity(in: gesture.view).x
        let sidebarWidth = windowSize.width * 0.7
        let threshold = sidebarWidth * 0.8
        
        if -hVelocity > 150 || -hOffset > threshold {
            withAnimation(.default) {
                isShowSidebar = false
            }
            Task {
                try await Task.sleep(seconds: 0.55)
                isPresented = false
                
                try await Task.sleep(seconds: 0.05)
                dragOffset = .zero
            }
        }else {
            withAnimation {
                dragOffset = .zero
            }
        }
    }
    
    func dragGestureEnd(dragValue: DragGesture.Value) {
        let hOffset = dragValue.translation.width
        let hVelocity = dragValue.velocity.width
        let sidebarWidth = windowSize.width * 0.7
        let threshold = sidebarWidth * 0.8
        
        if -hVelocity > 150 || -hOffset > threshold {
            withAnimation(.default) {
                isShowSidebar = false
            }
            Task {
                try await Task.sleep(seconds: 0.55)
                isPresented = false
                
                try await Task.sleep(seconds: 0.05)
                dragOffset = .zero
            }
        }else {
            withAnimation {
                dragOffset = .zero
            }
        }
    }
    
    func getBackgroundOpacity(sidebarWidth: CGFloat) -> CGFloat {
        let offset = min(dragOffset, 0)
        // because the offset to use are always less than 0
        // so use plus instead of minus
        let ratio = (sidebarWidth + offset) / sidebarWidth
        let opacity = 0.3 * ratio + 0.1
        return opacity
    }
}

struct SidebarView<ContentView: View>: ViewModifier {
    @Binding var isPresented: Bool
    @ViewBuilder var contentView: () -> ContentView
    
    init(isPresented: Binding<Bool>, @ViewBuilder content: @escaping () -> ContentView) {
        _isPresented = isPresented
        self.contentView = content
    }
    
    func body(content: Content) -> some View {
        GeometryReader { reader in
            Sidebar(isPresented: $isPresented, size: reader.size) {
                contentView()
            } originView: {
                content
                    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .center)
            }
        }
    }
}

fileprivate extension View {
    // Handling iOS 18 and iOS 17 gesture supportence
    @ViewBuilder
    func dragGesture<G: Gesture>(
        _ gesture: G,
        handle: @escaping (UIPanGestureRecognizer) -> Void
    ) -> some View {
        if #available(iOS 18, *) {
            self.gesture(ClickCompatibleDragGesture(handle: handle))
        }else {
            self.gesture(gesture)
        }
    }
}

extension View {
    @ViewBuilder
    func sidebar<SidebarContent: View>(
        isPresented: Binding<Bool>,
        @ViewBuilder content: @escaping () -> SidebarContent) -> some View {
            modifier(SidebarView(isPresented: isPresented, content: content))
        }
}

fileprivate struct SidebarExample: View {
    @State private var showSidebar = false
    
    var body: some View {
        VStack {
            Button("Show sidebar") {
                showSidebar.toggle()
            }
        }
        .sidebar(isPresented: $showSidebar) {
            Text("Text")
            Button("Hide sidebar") {
                showSidebar.toggle()
            }
        }
    }
}

#Preview {
    SidebarExample()
}

