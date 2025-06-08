//
//  ContentView.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import SwiftUI
import SwiftData
import OSLog

struct ContentView: View {
    @State private var showLoginPage: Bool = false
    @State private var account: Account? = nil
    @State private var path: [Int] = []
    @Query(sort: [SortDescriptor(\Account.sortOrder)]) private var accounts: [Account]
    @Query private var semesters: [Semester]
    @Environment(\.modelContext) private var modelContext
    
    let log = Logger()
    
    var body: some View {
        FullSwipeNavigationStack(path: $path) {
            if let account {
                Home(account: account)
            }else {
                Text("Sorry, you don't have mission to access this page.")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black)
            }
        }
        .fullScreenCover(isPresented: $showLoginPage) {
            LoginPage(isPresented: $showLoginPage, account: $account)
        }
        .onReceive(NotificationCenter.default.publisher(for: .resetCurrentAccount)) { _ in
            withAnimation {
                account = .init()
                showLoginPage = true
            }
        }
        .onReceive(NotificationCenter.default.publisher(for: .changeAccount)) { notification in
            if let userInfo = notification.userInfo,
               let accountID = userInfo[NotificationKey.changeAccountByID] as? String {
                if let foundAccount = accounts.first(where: { $0.id == accountID }) {
                    self.account = foundAccount
                    
                    let key = UserDefaultKey.lastLoginAccountModelID
                    let userDefault = UserDefaults.standard
                    userDefault.set(accountID, forKey: key)
                }else {
                    log.error("No account found with id: \(accountID)")
                }
            }
        }
        .onAppear {
            useLastLoginAccount()
        }
    }
    
    func useLastLoginAccount() {
        let userDefault = UserDefaults.standard
        let key = UserDefaultKey.lastLoginAccountModelID
        
        guard let modelID = userDefault.object(forKey: key) as? String else {
            print("No account ID found")
            account = .init()
            showLoginPage = true
            return
        }
        
        guard let account = accounts.first(where: { String(describing: $0.id) == modelID }) else {
            print("No account found, modelID: \(modelID), accounts(id): \(accounts.map { String(describing: $0.id) })")
            self.account = .init()
            showLoginPage = true
            return
        }
        
        self.account = account
        showLoginPage = false
    }
}

#Preview {
    ContentView()
}
