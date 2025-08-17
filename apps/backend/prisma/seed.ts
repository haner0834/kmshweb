import { PrismaClient } from "@prisma/client";
import { Feature } from "@prisma/client";

export const prisma = new PrismaClient();

const features: Omit<Feature, "id" | "ratings" | "reports">[] = [
    {
        title: "學習歷程",
        code: "LEARNING_PORTFOLIO",
        description:
            "將會整合上傳、壓縮等繁瑣的操作為一體，並結合AI生成心得，省下您寶貴的時間。",
        isUpcoming: true,
    },
    {
        title: "課表",
        code: "CLASS_SCHEDULE",
        description:
            "隨時隨地查詢你的課表，不限時間段。支持依老師或班級篩選，讓你省下抄課表的時間",
        isUpcoming: true,
    },
    {
        title: "車表",
        code: "BUS_SCHEDULE",
        description:
            "全面整合站點、路線、Google Map與時間資訊，讓你輕鬆掌握最新校車動態。無論上下學還是臨時改站想查詢，都能享受真正便捷的線上化車表體驗，而不是艱難的查找那張破表。",
        isUpcoming: true,
    },
    {
        title: "行事曆",
        code: "CALENDAR",
        description:
            "不只是查詢、標記與通知，還有一項尚未公開的神秘功能，將讓你的行事曆徹底顛覆想像。",
        isUpcoming: true,
    },
    {
        title: "通知中心",
        code: "NOTIFICATION",
        description:
            "整合系統消息、活動提醒、重要公告，確保您不會錯過任何一條重要資訊。",
        isUpcoming: false,
    },
    {
        title: "帳號系統",
        code: "AUTH",
        description:
            "安全可靠的登入與註冊機制，保護您的資料隱私並支援多種登入方式。",
        isUpcoming: false,
    },
    {
        title: "成績查詢",
        code: "EXAM_SCORE",
        description:
            "即時查詢各科成績，並提供成績走勢圖、平均分數等數據分析功能。",
        isUpcoming: false,
    },
    {
        title: "獎懲紀錄",
        code: "DISCIPLINARY",
        description:
            "方便地查詢並追蹤個人獎懲紀錄，幫助您更好地管理校園行為與表現。",
        isUpcoming: false,
    },
    {
        title: "個人檔案",
        code: "PROFILE",
        description:
            "集中管理您的個人資訊，包括基本資料與校園相關身份資料。",
        isUpcoming: false,
    },
];

async function main() {
    for (const f of features) {
        await prisma.feature.upsert({
            where: { code: f.code },
            update: {},
            create: f,
        });
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
