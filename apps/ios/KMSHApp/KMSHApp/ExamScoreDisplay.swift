//
//  ExamScoreViewer.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/30.
//

import SwiftUI
import SwiftData

struct ExamScoreDisplay: View {
    let account: Account
    
    @Environment(\.modelContext) private var modelConext
    @Environment(\.dismiss) private var dismiss
    
    @StateObject private var viewModel: ViewModel
    
    @Query(sort: [SortDescriptor(\Semester.sortOrder)]) private var semesters: [Semester]
    @State private var showConfigSheet: Bool = false
    @State private var progressValue: Double = 0.0
    
    @Namespace private var animation
    
    init(account: Account, modelContext: ModelContext) {
        self.account = account
        _viewModel = StateObject(wrappedValue: ViewModel(account: account, modelContext: modelContext))
    }
    
    var body: some View {
        VStack(spacing: 0) {
            Header()
            
            switch viewModel.status {
            case .readyToDisplay:
                if let semester = viewModel.semester,
                   let currentExam = viewModel.currentExam {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 0) {
                            ForEach(viewModel.sortedExams) { exam in
                                ExamPicker(exam)
                            }
                        }
                    }
                    .animation(.default, value: viewModel.examSortPreference)
                    .padding(.top)
                    
                    if !currentExam.subjects.isEmpty {
                        ScrollView {
                            VStack(spacing: 0) {
                                SubjectsListing()
                                    .padding([.horizontal, .top])
                            }
                        }
                    }else {
                        Text("此次考試尚無資料")
                            .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            case .failedToGetScoreData:
                VStack {
                    Text("資料獲取失敗\n請檢查您的網路連線是否有效")
                        .fontWeight(.medium)
                        .multilineTextAlignment(.center)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .overlay(alignment: .bottom) {
                    Button {
                        viewModel.updateScoreData()
                    } label: {
                        Text("重試")
                            .fontWeight(.bold)
                            .padding(12)
                            .frame(maxWidth: .infinity)
                            .background(DynamicButtonBackground(status: viewModel.buttonStatus))
                            .clipShape(.rect(cornerRadius: 12))
                            .padding()
                            .foregroundStyle(.whiteBlack)
                    }
                    .shadow(radius: 3)
                }
            case .fetchingData:
                VStack(spacing: 20) {
                    TimelineView(.periodic(from: .now, by: 0.35)) { timeline in
                        let value = getSituationValue(from: timeline.date)
                        HStack {
                            ForEach(0..<3, id: \.self) { i in
                                Rectangle()
                                    .offset(y: value == i ? -10: 0)
                                    .frame(width: 12, height: 12)
                                    .opacity(0.7)
                            }
                        }
                        .animation(.default, value: value)
                    }
                    
                    Text("首次載入資料需要一些時間 :D")
                        .opacity(0.7)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
        .task { viewModel.viewTask() }
        .onAppear { viewModel.viewAppear() }
        .sheet(isPresented: $showConfigSheet) {
            ConfigSheet()
        }
        .animation(.default, value: viewModel.status)
        .navigationBarBackButtonHidden()
        .fullSwipePop()
    }
    
    func parseSemesterName(from semesterName: String) -> [String] {
        semesterName.split(separator: " ").map { String($0) }
    }
    
    func getSituationValue(from date: Date) -> Int {
        let interval = date.timeIntervalSinceReferenceDate
        let tick = Int(interval / 0.35)
        return tick % 5
    }
    
    @ViewBuilder
    func ConfigSheet() -> some View {
        VStack {
            DragIndicator()
                .padding(.top, 8)
            
            Text("設置")
                .bold()
                .padding(8)
            
            Divider()
            
            ScrollView {
                HStack {
                    Image(systemName: "bolt.fill")
                        .frame(width: 30)
                        .fontWeight(.medium)
                    
                    Text("快速訪問")
                    
                    Spacer()
                    
//                    CustomToggle(isOn: $viewModel.isFastAccessOpened)
                    CustomToggle(isOn: .constant(false))
                }
                .opacity(0.5)
                .padding([.top, .horizontal])
                
                HStack {
                    Image(systemName: "checkmark.icloud.fill")
                        .frame(width: 30)
                        .fontWeight(.medium)
                    
                    Text("自動更新資料")
                    
                    Spacer()
                    
                    CustomToggle(isOn: $viewModel.isAutoUpdateOpened)
                }
                .padding([.top, .horizontal])
                
                OptionSelector(
                    for: DisplayData.self,
                    title: "顯示資料",
                    systemName: "slider.horizontal.3",
                    label: viewModel.displayData.name,
                    isSelected: { $0 == viewModel.displayData },
                    onSelect: viewModel.setDisplayData
                )
                
                OptionSelector(
                    for: ExamSortPreference.self,
                    title: "考試排序",
                    systemName: "arrow.up.and.down.text.horizontal",
                    label: viewModel.examSortPreference.name,
                    isSelected: { viewModel.examSortPreference == $0 },
                    onSelect: viewModel.setExamSortPreference
                )
            }
        }
        .presentationDragIndicator(.hidden)
        .presentationDetents([.fraction(0.4), .medium])
        .presentationCornerRadius(30)
    }
    
    @ViewBuilder
    func OptionSelector<T: Selectable>(for _: T.Type, title: String, systemName: String, label: String, isSelected: @escaping (T) -> Bool, onSelect: @escaping (T) -> Void) -> some View {
        HStack {
            Image(systemName: systemName)
                .frame(width: 30)
                .fontWeight(.medium)
            
            Text(title)
            
            Spacer()
            
            Menu {
                ForEach(T.allCases) { t in
                    Button {
                        onSelect(t)
                    } label: {
                        if isSelected(t) {
                            Label(t.name, systemImage: "checkmark")
                        }else {
                            Text(t.name)
                        }
                    }
                }
            } label: {
                HStack {
                    Image(systemName: "chevron.down")
                    
                    Text(label)
                }
                .foregroundStyle(.text)
            }
        }
        .padding([.top, .horizontal])
    }
    
    @ViewBuilder
    func CustomDivider() -> some View {
        Color.gray.opacity(0.3).frame(height: 12)
    }
    
    @ViewBuilder
    func SubjectsListing() -> some View {
        ForEach(SubjectType.allCases) { type in
            let subjects = viewModel.sortedSubjects(with: type)
            if !subjects.isEmpty {
                VStack {
                    HStack {
                        Circle()
                            .fill(.accent)
                            .frame(width: 12, height: 12)
                        
                        Text(type.rawValue)
                            .fontWeight(.medium)
                        
                        Spacer()
                    }
                    .padding(.leading)
                    
                    ForEach(subjects) { subject in
                        SubjectRow(subject)
                            .padding(.horizontal)
                            .padding(.bottom, 4)
                    }
                }
                .padding(.vertical)
                .background(Color.gray.opacity(0.1))
                .clipShape(.rect(cornerRadius: 16))
            }
        }
    }
    
    @ViewBuilder
    func ExamPicker(_ exam: Exam) -> some View {
        let isSelected = viewModel.currentExam == exam
        VStack {
            Text(exam.name)
                .padding(.horizontal)
                .foregroundStyle(isSelected ? .accent: .text)
            
            if viewModel.currentExam == exam {
                Rectangle()
                    .fill(Color.accent)
                    .frame(height: 4)
                    .matchedGeometryEffect(id: "EXAM_INDICATOR", in: animation)
            }else {
                Color.clear.frame(height: 4)
            }
        }
        .containerShape(.rect)
        .onTapGesture {
            withAnimation {
                viewModel.select(exam)
            }
        }
    }
    
    @ViewBuilder
    func CircularProgress() -> some View {
        Circle()
            .trim(from: 0, to: progressValue)
            .stroke(
                Color.accent,
                style: .init(
                    lineWidth: 3.5,
                    lineCap: .round
                )
            )
            .rotationEffect(.degrees(-90))
            .frame(width: 18, height: 18)
            .padding(.horizontal)
            .onAppear {
                withAnimation(.easeOut(duration: 4.5)) {
                    progressValue = 1
                } completion: {
                    progressValue = 0
                }
            }
    }
    
    @ViewBuilder
    func Header() -> some View {
        HStack {
            HStack {
                Image(systemName: "chevron.left")
                    .foregroundStyle(.accent)
                    .font(.title2)
                    .fontWeight(.medium)
                
                VStack(alignment: .leading) {
                    let semesterName = viewModel.semester?.name ?? ""
                    if let title = parseSemesterName(from: semesterName).first,
                       let subTitle = parseSemesterName(from: semesterName).last,
                       title != subTitle {
                        Text(title)
                        
                        Text(subTitle)
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }else {
                        Text("尚無資料")
                    }
                }
            }
            .contentShape(.rect)
            .onTapGesture {
                dismiss()
            }
            
            Spacer()
            
            if viewModel.buttonStatus == .performing {
                CircularProgress()
            }
            
            Button {
                showConfigSheet = true
            } label: {
                Image(.menu)
                    .resizable()
                    .aspectRatio(contentMode: .fit)
                    .frame(width: 20, height: 20)
            }
        }
        .padding([.top, .horizontal])
    }
    
    @ViewBuilder
    func MenuButton(_ exam: Exam) -> some View {
        Button(exam.name) {
            withAnimation {
                viewModel.select(exam)
            }
        }
    }
    
    @ViewBuilder
    func SubjectRow(_ subject: Subject, isLast: Bool = false) -> some View {
        HStack {
            HStack {
//                let showIndicator = viewModel.isPassIndicatorDisplayed
//                
//                if showIndicator, let score = subject.getScore() {
//                    let color: Color = score > 60 ? .customGreen: .customRed
//                    Capsule()
//                        .fill(color.opacity(0.85))
//                        .frame(width: 6)
//                }
                
                Text(subject.name)
            }
            
            Spacer()
            
            let showScore = viewModel.getSelection(of: .score)
            if showScore {
                Text(subject.score)
                    .padding(.leading, 8)
                
                Text("×\(subject.credit)")
                    .font(.subheadline)
                    .foregroundStyle(.gray)
            }
            
            let showRanking = viewModel.getSelection(of: .ranking)
            if showRanking {
                HStack(alignment: .bottom) {
                    Text("\(subject.clasRranking)")
                    
                    Text("/ \(subject.rankingCount)")
                        .font(.subheadline)
                        .foregroundStyle(.gray)
                }
            }
            
            let showAverage = viewModel.getSelection(of: .classAverage)
            if showAverage {
                Text(String(format: "%.2f", subject.classAverage))
                    .padding(.leading)
            }
        }
        .padding([.horizontal])
        .padding(.top, 8)
        .contentShape(.rect)
        .animation(.default, value: viewModel.displayData)
    }
    
    enum Status {
        case readyToDisplay, failedToGetScoreData, fetchingData
    }
}

struct DragIndicator: View {
    var body: some View {
        Capsule()
            .fill(.gray)
            .frame(width: 50, height: 3)
    }
}

#Preview {
    ExamScoreDisplay(account: .init(id: "123456", passwrod: "Z123456789"), modelContext: .init(try! .init(for: Semester.self)))
}
