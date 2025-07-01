export const FncType = {
    scoreTable: { id: '010090' },
    userProfile: { id: '010210' }
} as const

export type FncTypeKey = keyof typeof FncType

export interface SeniorLoginData {
    sid: string;
    password: string;
}