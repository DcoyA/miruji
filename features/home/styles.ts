import type { CSSProperties } from "react";

export const titleStyle: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 30,
  letterSpacing: "-0.04em",
  fontWeight: 800,
  color: "#3f1d24",
};

export const subTextStyle: CSSProperties = { color: "#9f6b75", lineHeight: 1.6, marginBottom: 20 };

export const accountBoxStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#ffffff",
  borderRadius: 20,
  padding: "14px 16px",
  marginBottom: 20,
  boxShadow: "0 4px 16px rgba(190, 24, 93, 0.08)",
};

export const avatarStyle: CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: "50%",
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: 800,
  fontSize: 18,
  flexShrink: 0,
};

export const accountInfoStyle: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 4,
};

export const accountNameStyle: CSSProperties = {
  fontSize: 15,
  color: "#3f1d24",
};

export const roleBadgeStyle: CSSProperties = {
  display: "inline-flex",
  alignSelf: "flex-start",
  padding: "3px 10px",
  borderRadius: 999,
  background: "#ffe4e6",
  color: "#be123c",
  fontSize: 11,
  fontWeight: 800,
};

export const devLinkStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: 12,
  fontWeight: 700,
  textDecoration: "none",
};

// 이전에는 message.includes("")로 체크해서 항상 true가 되던 버그가 있었습니다.
// 실제 성공 키워드를 기준으로 색을 판단하도록 고쳤습니다.
const OK_KEYWORDS = ["완료", "성공", "보냈습니다", "접수", "처리되었습니다", "저장했습니다"];

export const messageBoxStyle = (message: string): CSSProperties => {
  const ok = OK_KEYWORDS.some((keyword) => message.includes(keyword));
  return {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    background: ok ? "#ecfdf5" : "#fef2f2",
    color: ok ? "#047857" : "#b91c1c",
    fontSize: 14,
    lineHeight: 1.5,
  };
};

export const summaryModalBackdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(63,29,36,0.45)",
  zIndex: 50,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

export const summaryModalPanelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  minHeight: "50vh",
  maxHeight: "80dvh",
  background: "#fff",
  borderRadius: "24px 24px 0 0",
  display: "flex",
  flexDirection: "column",
  paddingTop: "env(safe-area-inset-top)",
};

export const summaryModalHeaderStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "16px 18px 12px",
  borderBottom: "1px solid #f6e8e6",
};

export const summaryModalTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 20,
  letterSpacing: "-0.03em",
  color: "#3f1d24",
};

export const summaryModalCloseButtonStyle: CSSProperties = {
  border: "1px solid #f1d9dd",
  background: "#fff",
  color: "#9f6b75",
  borderRadius: 999,
  padding: "6px 14px",
  fontWeight: 800,
  fontSize: 13,
  cursor: "pointer",
};

export const summaryModalBodyStyle: CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: "14px 18px 28px",
};
