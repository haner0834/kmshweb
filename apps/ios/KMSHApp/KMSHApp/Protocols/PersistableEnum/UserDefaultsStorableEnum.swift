//
//  UserDefaultsStorableEnum.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/8.
//

import Foundation

protocol UserDefaultsStorableEnum: IdentifiableEnum {
    func store(to userDefaults: UserDefaults, forKey key: String)
}

extension UserDefaultsStorableEnum {
    func store(to userDefaults: UserDefaults = .standard, forKey key: String) {
        print("Store \(self.persistentID), key: \(key)")
        userDefaults.set(self.persistentID, forKey: key)
    }
}
