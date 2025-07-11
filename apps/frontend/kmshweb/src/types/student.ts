export type Grade =
  | "junior1"
  | "junior2"
  | "junior3"
  | "senior1"
  | "senior2"
  | "senior3";

export interface Student {
  id: string;
  name: string;
  grade: Grade;
  birthDate: Date;
  enrollmentDate: Date;
  status: string;
  credential: string;
}

export type NotificationType = "update" | "warning" | "other";

export type NotificationIcon = "score" | "auth" | "bus" | "disciplinary";

export interface Notification {
  title: string;
  type: NotificationType;
  icon: NotificationIcon;
}
