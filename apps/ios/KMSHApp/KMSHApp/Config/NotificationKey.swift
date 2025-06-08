//
//  NotificationKey.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/8.
//

import Foundation

struct NotificationKey {
    static let changeAccountByID = "change-account-by-id"
}

extension Notification.Name {
    static let resetCurrentAccount = Notification.Name("ResetCurrentAccount")
    
    static let changeAccount = Notification.Name("ChangeAccount")
}
