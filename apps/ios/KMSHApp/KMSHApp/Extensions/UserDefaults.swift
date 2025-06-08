//
//  UserDefaults.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/8.
//

import Foundation
import OSLog

fileprivate let log = Logger(subsystem: "KMSHApp", category: "UserDefaults-Extension")

extension UserDefaults {
    func setObjects<T: Encodable>(_ value: T, forKey key: String) {
        do {
            try setCustomObject(value, forKey: key)
        } catch let error as UserDefaultError {
            log.error("UserDefault: \(error.message)")
        } catch {
            log.error("UserDefault: Connot set object.")
        }
    }
    
    func customObject<T: Decodable>(_ type: T.Type, forKey key: String) -> T? {
        do {
            let result = try getCustomObject(type, forKey: key)
            return result
        } catch let error as UserDefaultError {
            log.error("UserDefault: \(error.message)")
        } catch {
            log.error("UserDefault unknow error: \(error.localizedDescription)")
        }
        return nil
    }
    
    private func setCustomObject<T: Encodable>(_ value: T, forKey key: String) throws {
        let encoder = JSONEncoder()
        guard let data = try? encoder.encode(value) else { throw UserDefaultError.encodeFailed }
        set(data, forKey: key)
    }
    
    private func getCustomObject<T: Decodable>(_ type: T.Type, forKey key: String) throws -> T {
        let decoder = JSONDecoder()
        
        guard let object = object(forKey: key) else { throw UserDefaultError.noValue(key: key) }
        guard let data = object as? Data else { throw UserDefaultError.matchingFailed }
        guard let decodedData = try? decoder.decode(type, from: data) else { throw UserDefaultError.encodeFailed }
        
        return decodedData
    }
    
    enum UserDefaultError: Error {
        case noValue(key: String), encodeFailed, decodeFailed, matchingFailed, colorMatchingFailed
        
        var message: String {
            switch self {
            case .noValue(let key):
                return "There's no value in given key: \(key)"
            case .encodeFailed:
                return "Failed to encode data"
            case .decodeFailed:
                return "Failed to decode data"
            case .matchingFailed:
                return "Failed to match data"
            case .colorMatchingFailed:
                return "Failed to match color to savable data"
            }
        }
    }
}
