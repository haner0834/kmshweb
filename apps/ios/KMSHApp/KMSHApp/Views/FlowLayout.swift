//
//  FlowLayout.swift
//  Gremo
//
//  Created by Andy Lin on 2025/1/29.
//

import SwiftUI

struct FlowStack<Content: View>: View {
    var spacing = FlowLayout.Spacing()
    var alignment = FlowLayout.Alignment()
    @ViewBuilder var content: () -> Content
    
    init(alignment: FlowLayout.Alignment = FlowLayout.Alignment(), spacing: FlowLayout.Spacing = FlowLayout.Spacing(), @ViewBuilder content: @escaping () -> Content) {
        self.alignment = alignment
        self.spacing = spacing
        self.content = content
    }
    
    init(hAlignment: TextAlignment = .leading, vAlignment: VerticalAlignment = .center, vSpacing: CGFloat = 10, hSpacing: CGFloat = 10, @ViewBuilder content: @escaping () -> Content) {
        self.alignment = .init(horizontal: hAlignment, vertical: vAlignment)
        self.spacing = .init(horizontal: hSpacing, vertical: vSpacing)
        self.content = content
    }
    
    var body: some View {
        FlowLayout(spacing: spacing, alignment: alignment) {
            content()
        }
    }
}

struct FlowLayout: Layout {
    /// The spacing between each row.
    var spacing = Spacing()
    var alignment = Alignment()
    
    struct Spacing {
        var horizontal: CGFloat = 10
        var vertical: CGFloat = 10
    }
    
    struct Alignment {
        var horizontal: TextAlignment = .center
        var vertical: VerticalAlignment = .center
    }
    
    /// Use `CGRect` to store each viwe's position and width, height.
    
    /// Each row has multiple views, so use an array to store it.
    struct Row {
        /// Each view has its own `CGRect`, represents the view's absolute position.
        var viewRects: [CGRect] = []
        
        /// Because each view's `CGRect` represents absolute position, so the `maxX` of last view
        /// minus `minX` of first view means the width of this row.
        /// Also, the first view must start with `.zero`, so it can be written as the last view's `maxX`.
        var width: CGFloat { viewRects.last?.maxX ?? 0 }
        
        /// Because this is an flow layout, so the heighest one means the height of the row. Or the row
        /// will cut the view.
        var height: CGFloat { viewRects.map(\.height).max() ?? 0 }
        
        func getStartX(in bounds: CGRect, alignment: TextAlignment) -> CGFloat {
            switch alignment {
            case .leading:
                return bounds.minX
            case .center:
                return bounds.minX + (bounds.width - self.width) / 2
            case .trailing:
                return bounds.maxX - width
            }
        }
        
        func getStartY(in bounds: CGRect, viewHeight: CGFloat, alignment: VerticalAlignment) -> CGFloat {
            switch alignment {
            case .top:
                return bounds.minY
            case .center:
                return bounds.minY + (height - viewHeight) / 2
            case .bottom:
                return bounds.minY + height - viewHeight
            default:
                return bounds.minY
            }
        }
    }
    
    private func getRows(subviews: Subviews, totalWidth: CGFloat?) -> [Row] {
        guard let totalWidth, !subviews.isEmpty else { return [] }
        
        var rows = [Row()]
        let proposal = ProposedViewSize(width: totalWidth, height: nil) /// `nil` means I didn't specify the height of it
        
        subviews.indices.forEach { i in
            let subview = subviews[i]
            let size = subview.sizeThatFits(proposal)
            let previousRect = rows.last!.viewRects.last ?? .zero
            let previousView = rows.last!.viewRects.isEmpty ? nil: subviews[i - 1]
            let spacing = previousView?.spacing.distance(to: subview.spacing, along: .horizontal) ?? 0
            
            switch previousRect.maxX + spacing + self.spacing.horizontal + size.width > totalWidth {
            case true:
                // line break
                let startPoint = CGPoint(x: 0,
                                         y: previousRect.minY + rows.last!.height + (i == 0 ? 0: self.spacing.vertical))
                let newRect = CGRect(origin: startPoint, size: size)
                let newRow = Row(viewRects: [newRect])
                rows.append(newRow)
            case false:
                // same line
                let startPoint = CGPoint(
                    x: previousRect.maxX + spacing + (i == 0 ? 0: self.spacing.horizontal),
                    y: previousRect.minY
                )
                let newRect = CGRect(origin: startPoint, size: size)
                rows[rows.count - 1].viewRects.append(newRect)
            }
        }
        
        return rows
    }
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let rows = getRows(subviews: subviews, totalWidth: proposal.width)
        
        return .init(width: rows.map(\.width).max() ?? 0, height: rows.last?.viewRects.map(\.maxY).max() ?? 0)
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        let rows = getRows(subviews: subviews, totalWidth: bounds.width)
        var index = 0
        
        rows.forEach { row in
            let minX = row.getStartX(in: bounds, alignment: alignment.horizontal)
            
            row.viewRects.forEach { rect in
                let subview = subviews[index]
                let minY = row.getStartY(in: bounds, viewHeight: rect.height, alignment: alignment.vertical)
                
                subview.place(at: .init(x: rect.minX + minX,
                                        y: rect.minY + minY),
                              proposal: .init(rect.size))
                
                index += 1
            }
        }
    }
}
