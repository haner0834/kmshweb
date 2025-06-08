//
//  LearningHistoryPage.swift
//  KMSHApp
//
//  Created by Andy Lin on 2025/6/8.
//

import SwiftUI

struct LearningHistoryPage: View {
    @Environment(\.dismiss) private var dismiss
    
    fileprivate let linkInfo: [LinkInfo] = [
        .init(urlString: "https://epf-mlife.k12ea.gov.tw/Portal.do", title: "學習歷程上傳", subtitle: "全國學生學習歷程檔案系統", isPrimary: true),
        .init(urlString: "https://sdl.ntl.edu.tw/sdl/", title: "國立臺灣圖書館「高級中等學校自主學習資源網」"),
        .init(urlString: "http://ocw.aca.ntu.edu.tw/ntu-ocw/", title: "臺大開放式課程"),
        .init(urlString: "https://zh-tw.coursera.org/taiwan", title: "NTU MOOC x Coursera"),
        .init(urlString: "http://ocw.nthu.edu.tw/ocw/index.php", title: "清大開放式課程"),
        .init(urlString: "https://zh.khanacademy.org/", title: "可汗學院"),
        .init(urlString: "https://www.tocec.org.tw/web/index.jsp", title: "臺灣開放式課程暨教育聯盟 (TOCEC)"),
        .init(urlString: "https://www.ewant.org/?redirect=0", title: "國立陽明交通大學ewant育網平台"),
        .init(urlString: "https://reurl.cc/GXzlZv", title: "長榮大學「智慧大數據」系列課程"),
        .init(urlString: "https://recruit.nchu.edu.tw/present/Friendship/friendship08-02.aspx", title: "中興大學"),
        .init(urlString: "https://selfstudy.cc/courses/", title: "【新興科技】線上教學中心")
    ]
    
    var body: some View {
        VStack {
            Header()
            
            ScrollView {
                ForEach(linkInfo) { info in
                    CustomLink(info: info)
                    
                    if info == linkInfo.first {
                        Text("其他資源")
                            .bold()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(.horizontal)
                    }
                }
            }
        }
        .navigationBarBackButtonHidden()
        .fullSwipePop()
    }
    
    @ViewBuilder
    fileprivate func CustomLink(info: LinkInfo) -> some View {
        if let url = info.url {
            Link(destination: url) {
                HStack(spacing: 0) {
                    Color.accent.opacity(info.isPrimary ? 1: 0.6)
                        .frame(width: 30)
                    VStack(alignment: .leading) {
                        Text(info.title)
                            .font(.title3)
                            .bold()
                            .multilineTextAlignment(.leading)
                        
                        if let subtitle = info.subtitle {
                            Text(subtitle)
                                .foregroundStyle(.gray)
                                .padding(.vertical, 8)
                        }else {
                            Text(info.urlString)
                                .foregroundStyle(.gray)
                                .padding(.vertical, 8)
                                .lineLimit(1)
                        }
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    
                    Image(systemName: "chevron.right")
                        .font(.title2)
                        .padding(.trailing)
                }
                .frame(maxWidth: .infinity)
                .background(Color.gray.opacity(0.12))
                .clipShape(.rect(cornerRadius: 12))
                .padding()
                .foregroundStyle(.text)
            }
        }else {
            Text("Bad URL(\(info.urlString)")
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
                    Text("學習歷程")
                }
                
                Spacer()
            }
            .contentShape(.rect)
            .onTapGesture {
                dismiss()
            }
        }
        .padding([.top, .horizontal])
    }
}

fileprivate struct LinkInfo: Identifiable, Equatable {
    let id = UUID()
    var urlString: String
    var title: String
    var subtitle: String? = nil
    var isPrimary: Bool = false
    
    var url: URL? {
        URL(string: urlString)
    }
}

#Preview {
    LearningHistoryPage()
}
