import type { ActiveTab, Member } from "@/types/app";

export function tabTitle(tab: ActiveTab) {
  if (tab === "members") return "참여자";
  if (tab === "rewards") return "보상";
  return "할 일";
}

export function roleLabel(role: string) {
  if (role === "owner") return "방장";
  if (role === "manager") return "부방장";
  return "참여자";
}

export function verificationLabel(type: string) {
  if (type === "text") return "텍스트";
  if (type === "photo") return "사진";
  if (type === "video") return "영상";
  if (type === "audio") return "음성";
  return "없음";
}

export function statusLabel(status: string) {
  if (status === "todo") return "대기";
  if (status === "submitted") return "제출됨";
  if (status === "approved") return "승인됨";
  if (status === "rejected") return "반려됨";
  if (status === "rolled_over") return "이어짐";
  if (status === "missed") return "놓침";
  return status;
}

export function memberNameById(members: Member[], id: string | null) {
  if (!id) return "미지정";
  return members.find((member) => member.id === id)?.display_name || "미지정";
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export function weekdayLabel(day: number) {
  return WEEKDAY_LABELS[day] || "?";
}

export function repeatSummary(repeatType: string, repeatWeekdays: number[]) {
  if (repeatType === "daily") return "매일 반복";
  if (repeatType === "weekly") {
    if (repeatWeekdays.length === 0) return "요일 미선택";
    const sorted = [...repeatWeekdays].sort((a, b) => a - b);
    return `매주 ${sorted.map(weekdayLabel).join(", ")}요일`;
  }
  return "반복 없음";
}
