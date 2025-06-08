//
//  KMSHAppApp.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import SwiftUI
import SwiftData

@main
struct KMSHAppApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .modelContainer(for: [Account.self, Exam.self, Semester.self, Subject.self])
        }
    }
}
