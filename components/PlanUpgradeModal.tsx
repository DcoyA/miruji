"use client";

import type { CSSProperties } from "react";

type PlanUpgradeModalProps = {
  isOpen: boolean;
  reasonText?: string;
  onClose: () => void;
};

export default function PlanUpgradeModal({ isOpen, reasonText, onClose }: PlanUpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>플랜 안내</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        {reasonText && <p style={reasonTextStyle}>{reasonText}</p>}

        <div style={planGridStyle}>
          <div style={planCardStyle}>
            <div style={planBadgeStyle}>현재 이용 중</div>
            <h3 style={planNameStyle}>무료 플랜</h3>
            <div style={planPriceStyle}>0원</div>
            <ul style={planListStyle}>
              <li>모임 1개</li>
              <li>참여자 최대 3명</li>
              <li>최근 30일 기록 보관</li>
            </ul>
          </div>

          <div style={{ ...planCardStyle, ...planCardPremiumStyle }}>
            <div style={{ ...planBadgeStyle, ...planBadgePremiumStyle }}>커밍쑨</div>
            <h3 style={planNameStyle}>유료 플랜</h3>
            <div style={planPriceStyle}>준비 중</div>
            <ul style={planListStyle}>
              <li>모임 여러 개 생성</li>
              <li>참여자 인원 확장</li>
              <li>전체 기록 무제한 보관</li>
            </ul>
          </div>
        </div>

        <button type="button" disabled style={subscribeButtonStyle}>
          구독하기 (커밍쑨)
        </button>

        <button type="button" onClick={onClose} style={laterButtonStyle}>
          나중에 하기
        </button>
      </div>
    </div>
  );
}

const backdropStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  zIndex: 100,
};

const panelStyle: CSSProperties = {
  width: "100%",
  maxWidth: 380,
  maxHeight: "88vh",
  overflowY: "auto",
  background: "#fffaf9",
  borderRadius: 22,
  padding: 20,
  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
};

const headerStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 6,
};

const titleStyle: CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  color: "#3f1d24",
  margin: 0,
};

const closeButtonStyle: CSSProperties = {
  border: "none",
  background: "transparent",
  fontSize: 16,
  color: "#9f6b75",
  cursor: "pointer",
};

const reasonTextStyle: CSSProperties = {
  marginTop: 4,
  marginBottom: 16,
  fontSize: 13,
  color: "#db2777",
  lineHeight: 1.5,
  background: "#fce7f3",
  padding: "10px 12px",
  borderRadius: 12,
};

const planGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 10,
  marginBottom: 18,
};

const planCardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 2px 10px rgba(219,39,119,0.08)",
};

const planCardPremiumStyle: CSSProperties = {
  border: "1px solid #fbcfe8",
  background: "linear-gradient(160deg, #fff7f5, #fce7f3)",
};

const planBadgeStyle: CSSProperties = {
  display: "inline-block",
  padding: "3px 8px",
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 800,
  color: "#9f6b75",
  background: "#f3e8e8",
  marginBottom: 8,
};

const planBadgePremiumStyle: CSSProperties = {
  color: "#be185d",
  background: "#fbcfe8",
};

const planNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: "#3f1d24",
  margin: "0 0 4px",
};

const planPriceStyle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#db2777",
  marginBottom: 10,
};

const planListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 16,
  fontSize: 12,
  color: "#5c3a41",
  lineHeight: 1.7,
};

const subscribeButtonStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "none",
  background: "#d8b4bc",
  color: "#fff",
  fontWeight: 800,
  cursor: "not-allowed",
};

const laterButtonStyle: CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  background: "none",
  border: "none",
  color: "#9f6b75",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  marginTop: 12,
  padding: 0,
};
