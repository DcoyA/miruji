import type { ActiveTab, Member } from "@/types/app";

export function tabTitle(tab: ActiveTab) {
  if (tab === "missions") return "미션";
  if (tab === "rewards") return "보상";
  if (tab === "settings") return "설정";
  return "캘린더";
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
  return status;
}

export function memberNameById(members: Member[], id: string | null) {
  if (!id) return "미지정";
  return members.find((member) => member.id === id)?.display_name || "미지정";
}
