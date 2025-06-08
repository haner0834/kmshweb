//
//  UserDefaultKey.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import Foundation

struct UserDefaultKey {
    static let lastLoginAccountModelID = "LAST_LOGIN_ACCOUNT_MODEL_ID"
    
    static let isAutoUpdateScoreOpened = "IS_AUTO_UPDATE_SCORE_OPENED"
    
    static func lastSelectOption<T: Selectable>(of t: T.Type) -> String {
        "LAST_SELECTED_\(String(describing: t).uppercased())"
    }
}
