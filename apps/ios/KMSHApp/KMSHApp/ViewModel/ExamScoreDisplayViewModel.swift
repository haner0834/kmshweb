//
//  ExamScoreDisplay.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/1.
//

import Foundation
import SwiftData
import OSLog

extension ExamScoreDisplay {
    final class ViewModel: ObservableObject {
        let account: Account
        let modelContext: ModelContext
        
        @Published var semester: Semester? = nil
        @Published var currentExam: Exam? = nil
        @Published var status: Status = .fetchingData
        @Published var buttonStatus: ButtonStatus = .normal
        @Published private(set) var displayData: DisplayData = .score
        @Published private(set) var semesters: [Semester] = []
        @Published private(set) var examSortPreference: ExamSortPreference = .default
        
        @Published var isFastAccessOpened: Bool = false
        @Published var isAutoUpdateOpened: Bool = true {
            didSet {
                let userDefault = UserDefaults.standard
                let key = UserDefaultKey.isAutoUpdateScoreOpened
                userDefault.set(isAutoUpdateOpened, forKey: key)
            }
        }
        
        private let log = Logger()
        
        init(account: Account, modelContext: ModelContext) {
            self.account = account
            self.modelContext = modelContext
        }
        
        var sortedExams: [Exam] { semester?.exams.sorted(by: { examSortPreference == .default ? ($0.sortOrder < $1.sortOrder): ($0.timeOrder < $1.timeOrder) }) ?? [] }
        
        func setExamSortPreference(_ preference: ExamSortPreference) {
            examSortPreference = preference
            
            let key = UserDefaultKey.lastSelectOption(of: ExamSortPreference.self)
            preference.store(forKey: key)
        }
        
        func setDisplayData(_ displayData: DisplayData) {
            self.displayData = displayData
            
            let key = UserDefaultKey.lastSelectOption(of: DisplayData.self)
            displayData.store(forKey: key)
        }
        
        func getSelection(of displayData: DisplayData) -> Bool {
            self.displayData == displayData
        }
        
        func sortedSubjects(with type: SubjectType) -> [Subject] {
            currentExam?.subjects.filter { $0.type == type }.sortedByOrder() ?? []
        }
        
        func select(_ exam: Exam) {
            currentExam = exam
        }
        
        func viewAppear() {
            let key = UserDefaultKey.isAutoUpdateScoreOpened
            let userDefault = UserDefaults.standard
            if let isAutoUpdateOpened = userDefault.object(forKey: key) as? Bool {
                self.isAutoUpdateOpened = isAutoUpdateOpened
            }
            
            if let preference = getStoredSelection(for: ExamSortPreference.self) {
                self.examSortPreference = preference
            }
            
            if let displayData = getStoredSelection(for: DisplayData.self) {
                self.displayData = displayData
            }
            
            let descriptor = FetchDescriptor<Semester>()
            let semesters = try? modelContext.fetch(descriptor)
            
            guard let semesters else {
                log.error("Couldn't fetch semesters from SwiftData")
                return
            }
            
            self.semesters = semesters
            
//            if let semester = semesters.sortedByOrder().first(where: { $0.account.id == account.id }) {
            if let semester = account.semesters.sortedByOrder().first {
                log.debug("Semester found(name: \(semester.name))")
                self.semester = semester
                self.currentExam = sortedExams.first
                self.status = .readyToDisplay
            }
        }
        
        func getStoredSelection<T: PersistableEnum & Selectable>(for t: T.Type) -> T? {
            let userDefault = UserDefaults.standard
            
            let key = UserDefaultKey.lastSelectOption(of: t.self)
            let stored = userDefault.string(forKey: key)
            if let stored {
                if let matchedCase = t.match(from: stored) {
                    return matchedCase
                }else {
                    print("no matched item, id: \(stored)")
                }
            }else {
                print("no value from user default")
            }
            
            return nil
        }
        
        func viewTask() {
            if isAutoUpdateOpened || semester == nil {
                updateScoreData()
            }
            
//            semester = .init(name: "??? ??", sortOrder: 0)
//            semester?.exams = [
//                .init(name: "一段"),
//                .init(name: "二段"),
//                .init(name: "三段"),
//                .init(name: "一平"),
//                .init(name: "二平"),
//                .init(name: "三平"),
//                .init(name: "多元評量", type: .weekly),
//                .init(name: "學期總成績", type: .weekly),
//            ]
//            
//            currentExam = semester?.exams.first
//            currentExam?.subjects = [
//                .init(name: "國文", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "英文", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "數學", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "化學", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "物理", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "美術", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "音樂", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "歷史", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "體育", credit: 3, score: "\(Int.random(in: 40...100))"),
//                .init(name: "微積分", type: .otherElective, credit: 3, score: "\(Int.random(in: 40...100))"),
//            ]
//            
//            status = .readyToDisplay
        }
        
        func updateScoreData(autoRetryCount: Int = 0) {
            // if the data has been established,
            // show it first, then
            // TODO: Relace this with the kmshweb.com backend
            if autoRetryCount > 1 { return }
            
            let session = URLSession.shared
            let fetcher = SeniorScoreTableFetcher(session: session)
            let parser = SeniorExamScoreTableParser()
            Task {
                await MainActor.run {
                    buttonStatus = .performing
                }
                
                do {
                    let content = try await fetcher.fetchScoreTable()
                    let examToSubjects = try parser.parse(htmlContent: content)
                    
                    let semesterName = try parser.getSemesterName(htmlContent: content)
                    
                    await MainActor.run {
                        // Check if the semester with this name has been established
                        if let semester = semesters.first(where: { $0.name == semesterName && $0.account.id == account.id }) {
                            self.semester = semester
                            if status != .readyToDisplay {
                                self.currentExam = semester.exams.sortedByOrder().first
                            }
                            
                            // Then, update the data
                            for exam in semester.exams {
                                if let sameExam = examToSubjects.keys.first(where: { $0.name == exam.name }) {
                                    exam.timeOrder = sameExam.timeOrder
                                    
                                    // Check all subject whether the website has updated the data
                                    guard let subjects = examToSubjects[sameExam] else {
                                        log.error("Couldn't get subjects from parsed dictionary wit exam(\(sameExam.name)).")
                                        continue
                                    }
                                    
                                    for subject in subjects {
                                        // Here, `exam` is a created instance, it had inserted into model container,
                                        // has the relationships between subjects, while `subjects` hasn't.
                                        guard let sameSubject = exam.subjects.first(where: { $0.name == subject.name }) else {
                                            print("Couldn't find subject with name \(subject.name) in exam(\(exam.name))")
                                            continue
                                        }
                                        
                                        sameSubject.clasRranking = subject.clasRranking
                                        sameSubject.score = subject.score
                                        sameSubject.classAverage = subject.classAverage
                                        sameSubject.credit = subject.credit
                                    }
                                }else {
                                    print("Error: Couldn't find existing exam with name \(exam.name)")
                                }
                            }
                        }else {
                            log.info("Creating new semester")
                            let semester = Semester(name: semesterName, sortOrder: semesters.count, account: account)
                            modelContext.insert(semester)
                            
                            for (exam, subjects) in examToSubjects {
//                                print("exam(\(exam.name)) start {")
                                modelContext.insert(exam)
//                                print("    exam(\(exam.name)) inserted", terminator: " | ")
                                exam.semester = semester
//                                print("    exam(\(exam.name)) to semester(\(semester.name)) relationship established")
                                for subject in subjects {
                                    modelContext.insert(subject)
//                                    print("    subject(\(subject.name)) inserted", terminator: " | ")
                                    subject.exam = exam
//                                    print("subject(\(subject.name)) to exam(\(exam.name)) relationship established")
                                }
//                                print("} exam(\(exam.name)) completed")
                            }
                            
                            self.semester = semester
                            self.currentExam = semester.exams.sortedByOrder().first
                        }
                        
                        status = .readyToDisplay
                        buttonStatus = .normal
                    }
                }catch {
                    // Retry once, login again
                    do {
                        let loginManager = SeniorSystemLoginManager(session: session)
                        try await loginManager.login(with: .init(id: account.id, password: account.password))
                        updateScoreData(autoRetryCount: autoRetryCount + 1)
                        
                        if autoRetryCount != 0 {
                            await MainActor.run {
                                status = .failedToGetScoreData
                                buttonStatus = .normal
                            }
                        }
                    }catch {
                        print("How the fuck?? [", error, "]")
                    }
                    print(error)
                }
            }
        }
    }
    
    enum ExamSortPreference: Selectable, PersistableEnum {
        case time, `default`
        
        var id: Self { self }
        
        var name: String {
            switch self {
            case .time:
                "時間"
            case .default:
                "預設"
            }
        }
    }
    
    enum DisplayData: Selectable, PersistableEnum {
        case score, ranking, classAverage
        
        var id: Self { self }
        
        var name: String {
            switch self {
            case .score:
                "分數"
            case .ranking:
                "排名"
            case .classAverage:
                "平均"
            }
        }
    }
}
