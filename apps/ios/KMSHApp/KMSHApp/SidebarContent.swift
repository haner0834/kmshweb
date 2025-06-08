//
//  SidebarContent.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import SwiftUI

struct SidebarContent: View {
    let account: Account
    
    var body: some View {
        VStack(alignment: .leading, spacing: 32) {
            HStack {
                Image(systemName: "person.fill")
                    .foregroundStyle(.white)
                    .font(.title)
                    .frame(width: 50, height: 50)
                    .background(Color.gray)
                    .clipShape(.circle)
                
                VStack(alignment: .leading) {
                    Text(account.name)
                        .bold()
                    
                    Text(account.grade.name + " · " + account.id)
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                }
            }
            
            NavigationLinkRaw("成績查詢", systemName: "list.clipboard")
            
            NavigationLinkRaw("課表查詢", systemName: "list.bullet.rectangle.portrait")
            
            NavigationLinkRaw("車表查詢", systemName: "bus")
            
            NavigationLinkRaw("學習歷程", systemName: "doc.badge.arrow.up")
            
            Spacer()
            
            HStack {
                Button("登出", role: .destructive) {
                    
                }
                .frame(maxWidth: .infinity)
                
                Button("切換帳號") {
                    
                }
                .frame(maxWidth: .infinity)
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    @ViewBuilder
    func NavigationLinkRaw(_ text: String, systemName: String) -> some View {
        HStack {
            Image(systemName: systemName)
                .font(.title2)
                .frame(width: 28)
            
            Text(text)
                .font(.title3)
        }
//        .fontWeight(.medium)
        .padding(.leading)
    }
}

#Preview {
    SidebarContent(account: .init(name: "王大明", id: "123456", grade: .senior1))
}
