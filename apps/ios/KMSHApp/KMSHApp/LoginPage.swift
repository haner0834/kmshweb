//
//  LoginPage.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import SwiftUI
import SwiftData
import OSLog

struct LoginView: View {
    @State private var displayType = DisplayType.login
    
    var body: some View {
        GeometryReader { reader in
            
        }
    }
}

struct LoginPage: View {
    @Binding var isPresented: Bool
    @Binding var account: Account?
    
    @Environment(\.modelContext) private var modelContext
    
    @State private var uid: String = ""
    @State private var password: String = ""
    @State private var hidePassword: Bool = true
    @State private var showLoginRule: Bool = false
    @State private var status: Status = .enableToLogin
    
    @Query private var accounts: [Account]
    
    @State private var buttonStatus: ButtonStatus = .normal
    let log = Logger()
    
    var body: some View {
        VStack(alignment: .leading, spacing: 25) {
            Text("歡迎使用港明校務通")
                .font(.title2)
                .bold()
                .frame(maxWidth: .infinity)
                .padding(.bottom)
            
            VStack(alignment: .leading) {
                Text("帳號")
                
                TextField("", text: $uid)
                    .padding(8)
                    .padding(.vertical, 4)
                    .background {
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(lineWidth: 1)
                            .fill(.gray)
                    }
                
                if status != .enableToLogin && status != .noPassword {
                    HintText(status.description)
                }
            }
            
            VStack(alignment: .leading) {
                Text("密碼")
                
                
                VStack {
                    if hidePassword {
                        SecureField("", text: $password)
                    }else {
                        TextField("", text: $password)
                    }
                }
                .frame(height: 25)
                .padding(8)
                .padding(.vertical, 4)
                .background {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(lineWidth: 1)
                        .fill(.gray)
                }
                .overlay(alignment: .trailing) {
                    Button {
                        withAnimation(.easeInOut(duration: 0.2)) {
                            hidePassword.toggle()
                        }
                    } label: {
                        Image(systemName: hidePassword ? "eye": "eye.slash")
                            .padding(.trailing)
                    }
                }
                
                if status != .noID || status != .enableToLogin {
                    HintText(status.description)
                }
            }
            
            VStack {
                Button {
                    withAnimation {
                        login()
                    }
                } label: {
                    Text("登入")
                        .foregroundStyle(.white)
                        .bold()
                        .padding()
                        .frame(maxWidth: .infinity)
                        .background(DynamicButtonBackground(status: buttonStatus))
                        .clipShape(.rect(cornerRadius: 8))
                }
                .padding(.top)
                
                Button("查看規則") {
                    showLoginRule = true
                }
                .frame(maxWidth: .infinity, alignment: .trailing)
                .bold()
                .font(.subheadline)
                .padding(.trailing, 2)
            }
        }
        .customAlert(isPresented: $showLoginRule) {
            AlertContent()
        }
        .onChange(of: uid) { _, newValue in
            validateUID(newValue)
        }
        .onChange(of: password) { _, newValue in
            validatePassword(newValue)
        }
        .padding(50)
    }
    
    func validateUID(_ newID: String) {
        let validID = newID.filter { $0.isLetter || $0.isNumber }
        if validID != uid {
            uid = validID
        }
    }
    
    func validatePassword(_ newPassword: String) {
        let validPassword = newPassword.filter { $0.isLetter || $0.isNumber }
        if validPassword != password {
            password = validPassword
        }
    }
    
    func updateStatus() {
        if uid.isEmpty && password.isEmpty {
            status = .bothEmpty
        }else if uid.isEmpty {
            status = .noID
        }else if password.isEmpty {
            status = .noPassword
        }else {
            status = .enableToLogin
        }
    }
    
    func login() {
        updateStatus()
        guard status == .enableToLogin else { return }
        
        guard let account else { return }
        
        let urlSession = URLSession.shared
        let loginManager = SeniorSystemLoginManager(session: urlSession)
        let fetcher = SeniorStudentInfoManager(session: urlSession)
        Task {
            do {
                buttonStatus = .performing
                try await loginManager.login(with: .init(id: uid, password: password))
                let content = try await fetcher.fetchUserProfile()
                
                // Parse profile
                let parser = ProfileParser()
                guard let accountInfo = parser.parseProfile(htmlString: content) else {
                    print("Failed to fetch user profile")
                    return
                }
                
                updateAccount(with: accountInfo, for: account)
                
                if !accounts.contains(where: { $0.id == account.id }) {
                    account.sortOrder = accounts.count
                    modelContext.insert(account)
                }else if let foundAccount = accounts.first(where: { $0.id == account.id }) {
                    // The account is existing, use existing account
                    self.account = foundAccount
                    updateAccount(with: accountInfo, for: foundAccount)
                }
                
                saveLastLoginAccount()
                
                buttonStatus = .normal
                
                dismiss()
            }catch let error as LoginError {
                buttonStatus = .normal
                if error == .failedToLogin {
                    status = .loginFailed
                }
            }catch {
                buttonStatus = .normal
                print(error)
            }
        }
    }
    
    func saveLastLoginAccount() {
        guard let account else { return }
        
        let key = UserDefaultKey.lastLoginAccountModelID
        let userDefault = UserDefaults.standard
        let id = String(describing: account.id)
        userDefault.set(id, forKey: key)
    }
    
    func updateAccount(with accountInfo: [String: String], for account: Account) {
        account.name = extractChinese(from: accountInfo["姓名"] ?? .error)
        account.id = uid
        account.password = password
        account.status = getEnrollmentStatus(by: accountInfo["是否在學"] ?? .error)
        account.stream = accountInfo["組別"] ?? .error
        account.grade = .getGrade(gradeString: accountInfo["年級"] ?? .error)
        account.classLabel = accountInfo["班級"] ?? .error
        
        let address = Address(
            household: accountInfo["通訊地址"] ?? .error,
            emergency: accountInfo["緊急連絡地址"] ?? .error,
            phoneNumber: accountInfo["戶籍電話"] ?? .error
        )
        
        account.address = address
        account.credential = accountInfo["入學轉入資格"] ?? .error
        
        let guardianContact = Guardian(
            name: accountInfo["監護人"] ?? .error,
            title: accountInfo["監護人稱謂"] ?? .error,
            phoneNumber: accountInfo["護人行動電話"] ?? .error
        )
        account.guardianContact = guardianContact
        
        let father = Guardian(
            name: accountInfo["父親/母親"] ?? .error,
            prefession: accountInfo["父親/母親職業"] ?? .error
        )
        let mother = Guardian(
            name: accountInfo["母親/父親"] ?? .error,
            prefession: accountInfo["母親/父親職業"] ?? .error
        )
        let emergency = Guardian(
            name: accountInfo["緊急聯絡人"] ?? .error,
            title: accountInfo["關係"] ?? .error,
            phoneNumber: accountInfo["緊急連絡人行動電話"] ?? .error
        )
        let contactInfo = ContactInfo(
            father: father,
            mother: mother,
            emergency: emergency
        )
        account.contactInfo = contactInfo
        account.graduationSchool = accountInfo["原畢業學校"] ?? .error
        
        account.birthDate = getDate(from: accountInfo["生日"] ?? .error) ?? .now
        account.enrollmentDate = getDate(from: accountInfo["入學日期"] ?? .error) ?? .now
        account.graduationDate = getDate(from: accountInfo["畢業日期"] ?? .error)
        
        account.gender = getGender(from: accountInfo["性別"] ?? .error)
    }
    
    func extractChinese(from text: String) -> String {
        let pattern = #"[一-龯]+"#  // Covers CJK Unified Ideographs range
        let regex = try? NSRegularExpression(pattern: pattern)
        let range = NSRange(text.startIndex..., in: text)
        let matches = regex?.matches(in: text, range: range) ?? []
        
        let chineseParts = matches.map { match in
            String(text[Range(match.range, in: text)!])
        }
        
        return chineseParts.joined()
    }
    
    func getGender(from genderString: String) -> Gender {
        if genderString == "男" { return .male }
        return .female
    }
    
    func getDate(from rocDateString: String) -> Date? {
        let formatter = DateFormatter()
        formatter.calendar = Calendar(identifier: .gregorian)
        formatter.locale = Locale(identifier: "zh_TW")
        formatter.dateFormat = "yyyy/MM/dd"
        
        // Extract ROC year, month, and day using regular expression
        let pattern = #"(\d{1,3})年(\d{1,2})月(\d{1,2})日"#
        guard let regex = try? NSRegularExpression(pattern: pattern),
              let match = regex.firstMatch(in: rocDateString, range: NSRange(rocDateString.startIndex..., in: rocDateString)),
              match.numberOfRanges == 4 else {
            return nil
        }
        
        let yearRange = Range(match.range(at: 1), in: rocDateString)!
        let monthRange = Range(match.range(at: 2), in: rocDateString)!
        let dayRange = Range(match.range(at: 3), in: rocDateString)!
        
        let rocYear = Int(rocDateString[yearRange])!
        let month = Int(rocDateString[monthRange])!
        let day = Int(rocDateString[dayRange])!
        
        let gregorianYear = rocYear + 1911
        let dateString = "\(gregorianYear)/\(month)/\(day)"
        
        return formatter.date(from: dateString)
    }
    
    func getGrade(from gradeName: String) -> Grade {
        for grade in Grade.allCases {
            if grade.name == gradeName { return grade }
        }
        return .junior1
    }
    
    func getEnrollmentStatus(by string: String) -> EnrollmentStatus {
        if string == "在學中" {
            return .enrolled
        }
        return .withdraw
    }
    
    func dismiss() {
        isPresented = false
    }
    
    @ViewBuilder
    func AlertContent() -> some View {
        AlertBlock(title: "帳號：學號\n密碼：身分證字號") {
            AlertBottomButton(title: "關閉", color:.gray.opacity(0.4)) {
                showLoginRule = false
            }
            .foregroundStyle(.text)
        }
    }
    
    @ViewBuilder
    func HintText(_ text: String) -> some View {
        Text(text)
            .font(.caption)
            .foregroundStyle(.customRed)
    }
    
    enum Status {
        case enableToLogin
        case noID, noPassword, bothEmpty
        case loginFailed
        
        var description: String {
            switch self {
            case .enableToLogin:
                ""
            case .noID:
                "帳號不可為空"
            case .noPassword:
                "密碼不可為空"
            case .bothEmpty:
                "帳號、密碼不可為空"
            case .loginFailed:
                "登入失敗，請檢查帳號、密碼是否正確"
            }
        }
    }
}

struct CheckUserPage: View {
    let account: Account
    var body: some View {
        VStack(alignment: .leading) {
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
                        .font(.title)
                        .bold()
                    
                    Text(account.grade.name + "·" + account.classLabel)
                        .foregroundStyle(.gray)
                }
            }
            .padding()
            
            AccountInfoItemRow(info: .init(title: "學號", systemImageName: "person.text.rectangle.fill", text: account.id))
            
            AccountInfoItemRow(info: .init(title: "性別", systemImageName: "figure.dress.line.vertical.figure", text: account.gender.name))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .overlay(alignment: .bottom) {
            VStack {
                Text("這是你嗎？")
                
                HStack {
                    Button {
                        
                    } label: {
                        Text("不是")
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background {
                                RoundedRectangle(cornerRadius: 50)
                                    .strokeBorder(Color.gray, lineWidth: 3)
                            }
                            .foregroundStyle(.gray)
                    }
                    
                    Button {
                        
                    } label: {
                        Text("是")
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(Color.accentColor)
                            .clipShape(.capsule)
                            .foregroundStyle(.white)
                    }
                }
            }
            .padding()
        }
    }
}

fileprivate enum DisplayType {
    case login, check
}

#Preview {
    CheckUserPage(account: .init(name: "王大明", id: "123456789"))
}
