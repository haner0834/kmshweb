//
//  ProfilePage.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/31.
//

import SwiftUI
import SwiftData

struct ProfilePage: View {
    @Bindable var account: Account
    
    @State private var infoItemSections: [AccountInfoItemSection] = []
    @State private var showAccountsSheet: Bool = false
    
    @Query private var accounts: [Account]
    
    var body: some View {
        ScrollView {
            HStack {
                Image(systemName: "person.fill")
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 32, height: 32)
                    .frame(width: 65, height: 65)
                    .background(Color.gray)
                    .clipShape(.circle)
                    .foregroundStyle(.whiteBlack)
                
                VStack(alignment: .leading) {
                    Text(account.name)
                        .font(.title3)
                        .bold()
                    
                    Text("\(account.grade.name) · \(account.classLabel)")
                        .foregroundStyle(.gray)
                        .font(.callout)
                }
                .padding(.leading)
                
                Spacer()
            }
            .padding()
            
            VStack(spacing: 16) {
                ForEach(infoItemSections) { section in
                    CustomSection(title: section.title) {
                        ForEach(section.items) { item in
                            AccountInfoItemRow(info: item)
                        }
                    }
                }
            }
            .background(Color.gray.opacity(0.4))
        }
        .onAppear {
            updateInfo(using: account)
        }
        .sheet(isPresented: $showAccountsSheet) {
            AccountsSheet()
        }
        .overlay(alignment: .bottom) {
            BottomBar()
        }
        .onChange(of: account) { _, newValue in
            updateInfo(using: newValue)
        }
        .fullSwipePop()
    }
    
    func updateInfo(using account: Account) {
        infoItemSections.removeAll()
        
        let basicInfoSection = AccountInfoItemSection(
            title: "基本資料",
            items: [
                .init(title: "性別", systemImageName: "figure.dress.line.vertical.figure", text: account.gender.name),
                .init(title: "學號", systemImageName: "person.text.rectangle", text: account.id),
                .init(title: "入學日期", systemImageName: "calendar.badge.checkmark", text: account.enrollmentDate.formatted(.dateTime.year().month().day())),
                .init(title: "就學狀態", systemImageName: "graduationcap.fill", text: account.status.name)
            ]
        )
        
        infoItemSections.append(basicInfoSection)
    }
    
    @ViewBuilder
    func AccountsSheet() -> some View {
        VStack {
            DragIndicator()
                .padding(.top, 8)
            
            Text("帳號")
                .bold()
                .padding(8)
            
            Divider()
            
            AccountsListing()
        }
        .presentationDetents([.fraction(Double(accounts.count + 1) * 0.11 + 0.1)])
        .presentationCornerRadius(30)
        .presentationDragIndicator(.hidden)
    }
    
    @ViewBuilder
    func AccountsListing() -> some View {
        ScrollView {
            ForEach(accounts) { account in
                AccountRow(account: account)
                    .onTapGesture {
                        let notification = NotificationCenter.default
                        notification.post(name: .changeAccount, object: nil, userInfo: [NotificationKey.changeAccountByID: account.id])
                        
                        showAccountsSheet = false
                    }
            }
            
            AddAccountRow()
                .onTapGesture {
                    showAccountsSheet = false
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) {
                        let notification = NotificationCenter.default
                        notification.post(name: .resetCurrentAccount, object: nil)
                    }
                }
        }
    }
    
    @ViewBuilder
    func AddAccountRow() -> some View {
        HStack {
            Image(systemName: "plus")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .foregroundStyle(.text)
                .frame(width: 16, height: 16)
            
                .frame(width: 45, height: 45)
                .background(Color.gray.opacity(0.2))
                .clipShape(.circle)
            
            Text("新增帳號")
                    .bold()
                
            Spacer()
        }
        .contentShape(.rect)
        .padding()
    }
    
    @ViewBuilder
    func AccountRow(account: Account) -> some View {
        HStack {
            Image(systemName: "person.fill")
                .resizable()
                .aspectRatio(contentMode: .fit)
                .foregroundStyle(.whiteBlack)
                .frame(width: 25, height: 25)
            
                .frame(width: 45, height: 45)
                .background(Color.gray)
                .clipShape(.circle)
            
            VStack(alignment: .leading) {
                Text(account.name)
                    .bold()
                
                Text(account.id)
                    .foregroundStyle(.gray)
                    .font(.caption)
            }
            
            Spacer()
            
            if account.id == self.account.id {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundStyle(.accent)
                    .font(.title2)
            }
        }
        .contentShape(.rect)
        .padding()
    }
    
    @ViewBuilder
    func BottomBar() -> some View {
        HStack {
            Button {
                showAccountsSheet = true
            } label: {
                Text("切換帳號")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .foregroundStyle(.text)
            }
            
            Button {
                let notification = NotificationCenter.default
                notification.post(name: .resetCurrentAccount, object: nil)
            } label: {
                Text("登出")
                    .frame(maxWidth: .infinity)
                    .foregroundStyle(.red)
                    .padding()
            }
        }
    }
}

struct CustomSection<Content: View>: View {
    let title: String
    @ViewBuilder var content: () -> Content
    
    var body: some View {
        VStack(spacing: 0) {
            Text(title)
                .font(.title3)
                .bold()
                .padding([.leading, .top])
                .frame(maxWidth: .infinity, alignment: .leading)
            
            content()
        }
        .background(Color.whiteBlack)
    }
}

fileprivate struct HouseholdRegistrationListing: View {
    let address: Address
    
    var body: some View {
        ScrollView {
            AccountInfoItemRow(info: .init(title: "戶籍地址", systemImageName: "house.fill", text: address.household))
                .padding(.top)
            
            AccountInfoItemRow(info: .init(title: "緊急聯絡地址", systemImageName: "house.fill", text: address.emergency))
            
            AccountInfoItemRow(info: .init(title: "住家電話", systemImageName: "phone.fill", text: address.phoneNumber))
        }
    }
}

fileprivate struct GuardianContactListing: View {
    let guardian: Guardian
    let contacts: ContactInfo
    
    var body: some View {
        ScrollView {
            AccountInfoItemRow(info: .init(title: "監護人", systemImageName: "person.badge.shield.checkmark.fill", text: guardian.name))
                .padding(.top)
            
            AccountInfoItemRow(info: .init(title: "父", systemImageName: "figure.2.and.child.holdinghands", text: contacts.father.name))
            
            AccountInfoItemRow(info: .init(title: "母", systemImageName: "figure.2.and.child.holdinghands", text: contacts.mother.name))
        }
    }
}

struct AccountInfoItemRow: View {
    let info: AccountInfoItem
    
    var body: some View {
        Group {
            if info.isNavigation {
                NavigationLink(value: info.destination) {
                    Row()
                }
            }else {
                Row()
            }
        }
    }
    
    @ViewBuilder
    func Row() -> some View {
        HStack {
            Image(systemName: info.systemImageName)
                .font(.title3)
                .fontWeight(.medium)
                .frame(width: 30)
            
            Text(info.title)
                .fontWeight(.medium)
                .padding(.leading, 12)
            
            Spacer()
            
            Text((info.text.isEmpty && !info.isNavigation) ? "無資料": info.text)
                .font(.callout)
                .frame(maxWidth: 200, alignment: .trailing)
                .lineLimit(1)
            
            if info.isNavigation {
                Image(systemName: "chevron.right")
            }
        }
        .opacity(0.8)
        .padding()
    }
}

fileprivate struct AccountInfoItemSection: Identifiable {
    let id = UUID()
    var title: String
    var items: [AccountInfoItem]
}

enum NavigationDestinationType {
    case householdRegistrations, guardianContacts
}

struct AccountInfoItem: Identifiable {
    let id = UUID()
    var title: String
    var systemImageName: String
    var text: String
    var isNavigation: Bool = false
    var destination: NavigationDestinationType? = nil
}

#Preview {
    NavigationStack {
        ProfilePage(account: .init(name: "王大明", id: "123456", classLabel: "？"))
    }
}
