"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

type BillingCycle = "monthly" | "yearly";

type PlanUpgradeModalProps = {
  isOpen: boolean;
  reasonText?: string;
  onClose: () => void;
};

// ⚠️ 실제 가격이 정해지면 이 두 숫자만 바꿔주세요.
const MONTHLY_PRICE = 2900;
const YEARLY_PRICE = 29000;
const YEARLY_MONTHLY_EQUIVALENT = Math.round(YEARLY_PRICE / 12);
const DISCOUNT_PERCENT = Math.round((1 - YEARLY_MONTHLY_EQUIVALENT / MONTHLY_PRICE) * 100);

function formatWon(value: number) {
  return `${value.toLocaleString("ko-KR")}원`;
}

export default function PlanUpgradeModal({ isOpen, reasonText, onClose }: PlanUpgradeModalProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");

  if (!isOpen) return null;

  return (
    <div style={backdropStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(event) => event.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>플랜 안내</h2>
          <button type="button" onClick={onClose} style={closeButtonStyle}>✕</button>
        </div>

        {reasonText && <p style={reasonTextStyle}>{reasonText}</p>}

        <div style={billingToggleStyle}>
          <button
            type="button"
            onClick={() => setBillingCycle("monthly")}
            style={billingCycle === "monthly" ? billingButtonActiveStyle : billingButtonStyle}
          >
            월간 결제
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle("yearly")}
            style={billingCycle === "yearly" ? billingButtonActiveStyle : billingButtonStyle}
          >
            연간 결제 <span style={discountBadgeStyle}>{DISCOUNT_PERCENT}% 할인</span>
          </button>
        </div>

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
            <div style={{ ...planBadgeStyle, ...planBadgePremiumStyle }}>✨ 추천</div>
            <h3 style={planNameStyle}>프리미엄</h3>
            <div style={planPriceStyle}>
              {billingCycle === "monthly" ? (
                <>{formatWon(MONTHLY_PRICE)} / 월</>
              ) : (
                <>
                  {formatWon(YEARLY_MONTHLY_EQUIVALENT)} / 월
                  <span style={priceSubTextStyle}> (연 {formatWon(YEARLY_PRICE)})</span>
                </>
              )}
            </div>
            <ul style={planListStyle}>
              <li>🚀 모임 최대 10개 생성</li>
              <li>👨‍👩‍👧‍👦 참여자 최대 100명</li>
              <li>📚 전체 기록 영구 보관</li>
              <li>🎨 프로필 꾸미기 확장 (예정)</li>
            </ul>
          </div>
        </div>

        <button type="button" disabled style={subscribeButtonStyle}>
          구독하기 · 출시 예정
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

const billingToggleStyle: CSSProperties = {
  display: "flex",
  gap: 6,
  background: "#f3e8e8",
  borderRadius: 999,
  padding: 4,
  marginBottom: 16,
};

const billingButtonStyle: CSSProperties = {
  flex: 1,
  border: "none",
  background: "transparent",
  borderRadius: 999,
  padding: "8px 6px",
  fontSize: 12,
  fontWeight: 800,
  color: "#9f6b75",
  cursor: "pointer",
  whiteSpace: "nowrap",
};

const billingButtonActiveStyle: CSSProperties = {
  ...billingButtonStyle,
  background: "#ffffff",
  color: "#db2777",
  boxShadow: "0 2px 8px rgba(219,39,119,0.15)",
};

const discountBadgeStyle: CSSProperties = {
  marginLeft: 4,
  fontSize: 10,
  fontWeight: 900,
  color: "#fff",
  background: "#e11d48",
  padding: "1px 6px",
  borderRadius: 999,
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
  border: "1.5px solid #f472b6",
  background: "linear-gradient(160deg, #fff0f6, #fce7f3)",
  boxShadow: "0 6px 18px rgba(219,39,119,0.20)",
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
  color: "#fff",
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
};

const planNameStyle: CSSProperties = {
  fontSize: 15,
  fontWeight: 900,
  color: "#3f1d24",
  margin: "0 0 4px",
};

const planPriceStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 800,
  color: "#db2777",
  marginBottom: 10,
  lineHeight: 1.4,
};

const priceSubTextStyle: CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  color: "#9f6b75",
};

const planListStyle: CSSProperties = {
  margin: 0,
  paddingLeft: 16,
  fontSize: 12,
  color: "#5c3a41",
  lineHeight: 1.8,
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
