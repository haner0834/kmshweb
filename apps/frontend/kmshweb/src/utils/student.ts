import type { Gender, Grade, EnrollmentStatus, Stream } from "../types/student";

export const getGenderText = (gender: Gender): string => {
    switch (gender) {
        case "female":
            return "女";
        case "male":
            return "男";
        default:
            return "wtf";
    }
};

export const getGradeText = (grade: Grade): string => {
    switch (grade) {
        case "junior1":
            return "國一";
        case "junior2":
            return "國二";
        case "junior3":
            return "國三";
        case "senior1":
            return "高一";
        case "senior2":
            return "高二";
        case "senior3":
            return "高三";
        default:
            return "wtf";
    }
};

export const getEnrollmentStatusText = (status: EnrollmentStatus): string => {
    switch (status) {
        case "enrolled":
            return "就學中";
        case "graduated":
            return "已畢業";
        case "suspended":
            return "休學";
        case "withdraw":
            return "退學";
    }
};

export const getStreamText = (stream: Stream): string => {
    switch (stream) {
        case "all":
            return "不分組";
        case "science":
            return "自然組";
        case "social":
            return "社會組";
        case "other":
            return "虫合組";
    }
};