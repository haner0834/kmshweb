//
//  Home.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/5/29.
//

import SwiftUI
import SwiftData

struct Home: View {
    @Bindable var account: Account
    
    private let columns = Array(repeating: GridItem(.flexible(), spacing: 18), count: 2)
    @State private var selectedOption: NavigationOption? = nil
    
    @State private var showAlert = false
    
    @Environment(\.modelContext) private var modelContext
    
    let availableDestinations: [NavigationOptionDestination] = [.examScore, .learningHistory]
    
    var body: some View {
        VStack {
            Header()
            
            ScrollView {
                LazyVGrid(columns: columns, spacing: 18) {
                    ForEach(navigationOptions) { option in
                        NavigationOptionCell(option)
                    }
                }
                .padding()
                
                VStack {
                    HStack {
                        Text("行事曆")
                            .font(.title3)
                            .bold()
                        
                        Image(systemName: "chevron.right")
                            .bold()
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    
                    VStack {
                        ForEach(Array(events.prefix(3))) { event in
                            CalendarEventCell(event)
                        }
                    }
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(Color.gray.opacity(0.1))
                    .overlay {
                        LockSign()
                            .onTapGesture {
                                showAlert = true
                            }
                    }
                    .clipShape(.rect(cornerRadius: 12))
                }
                .padding()
            }
            .navigationDestination(item: $selectedOption) { option in
                switch option.destinationType {
                case .examScore:
                    ExamScoreDisplay(account: account, modelContext: modelContext)
                case .learningHistory:
                    LearningHistoryPage()
                case .clubs:
                    Text("Clubs")
                case .rewards:
                    Text("Rewards")
                case .classSchedule:
                    Text("Class Schedule")
                case .busSchedule:
                    Text("Bus Schedule")
                }
            }
            .customAlert(isPresented: $showAlert) {
                AlertBlock(title: "此功能尚未開放") {
                    AlertBottomButton(title: "關閉", color: .gray.opacity(0.2)) {
                        showAlert = false
                    }
                    .foregroundStyle(.text)
                }
            }
        }
    }
    
    func formatDate(_ date: Date) -> String {
        return date.formatted(.dateTime.month().day())
    }
    
    @ViewBuilder
    func CalendarEventCell(_ event: CalendarEvent) -> some View {
        HStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(event.type.color.opacity(0.7))
                .frame(width: 6)
            
            Text(event.name)
            
            Spacer()
            
            Text(formatDate(event.startDate))
                .font(.subheadline)
                .foregroundStyle(.gray)
        }
    }
    
    @ViewBuilder
    func LockSign() -> some View {
        Image(systemName: "lock.fill")
            .resizable()
            .aspectRatio(contentMode: .fit)
            .frame(width: 30, height: 30)
        
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Color.primary.opacity(0.3))
    }
    
    @ViewBuilder
    func NavigationOptionCell(_ option: NavigationOption) -> some View {
        let isAvailable = availableDestinations.contains(where: { $0 == option.destinationType })
        HStack {
            Image(systemName: option.systemImageName)
                .font(.title2)
                .foregroundStyle(option.color.opacity(0.7))
            
            Text(option.name)
                .bold()
        }
        .frame(maxWidth: .infinity)
        .frame(height: 100)
        .background(Color.gray.opacity(0.1))
        .overlay {
            if !isAvailable {
                LockSign()
            }
        }
        .clipShape(.rect(cornerRadius: 16))
        .onTapGesture {
            if isAvailable {
                selectedOption = option
            }else {
                showAlert = true
            }
        }
        .overlay(alignment: .topTrailing) {
            if option.hasUpdated {
                Circle()
                    .fill(.red)
                    .frame(width: 16, height: 16)
                    .offset(x: 4, y: -4)
            }
        }
    }
    
    @ViewBuilder
    func Header() -> some View {
        HStack {
            Spacer()
            
            NavigationLink {
                ProfilePage(account: account)
            } label: {
                Image(systemName: "person.fill")
                    .font(.title2)
                    .foregroundStyle(.whiteBlack)
                    .frame(width: 40, height: 40)
                    .background(Color.gray)
                    .clipShape(.circle)
            }
        }
        .padding()
        .overlay {
            Text("港明校務通")
                .bold()
        }
    }
}

let events: [CalendarEvent] = [
    .init(name: "端午連假", type: .dayOff),
    .init(name: "週六上課"),
    .init(name: "畢業", type: .important),
    .init(name: "虫合"),
    .init(name: "運動會", type: .important),
]

let navigationOptions: [NavigationOption] = [
    .init(name: "考試成績", systemImageName: "list.clipboard.fill", color: .orange.opacity(0.8  )),
    .init(name: "學習歷程", systemImageName: "doc.badge.arrow.up.fill", color: .blue.opacity(0.8)),
    .init(name: "社團", systemImageName: "person.3.fill", color: .cyan),
    .init(name: "獎懲", systemImageName: "medal.fill", color: .black),
    .init(name: "課表", systemImageName: "list.bullet.rectangle.portrait.fill", color: .mint),
    .init(name: "車表", systemImageName: "bus", color: .indigo),
]

#Preview {
    ContentView()
}
