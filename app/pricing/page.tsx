"use client";

import { useState } from "react";
import Link from "next/link";

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const priceKrw = billingCycle === "monthly" ? "2,900원 / 월" : "29,000원 / 년 (약 17% 할인)";
  const priceUsd = billingCycle === "monthly" ? "$1.99 / month" : "$19.99 / year (save ~16%)";

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "40px 20px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>요금제 안내</h1>
      <p style={{ color: "#666", marginBottom: 24 }}>
        지금은 무료 플랜으로 모든 핵심 기능을 이용할 수 있습니다. 프리미엄 플랜은 현재 준비 중이며,
        아래 내용은 예정된 구성으로 변경될 수 있습니다.
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <button onClick={() => setBillingCycle("monthly")}>월간</button>
        <button onClick={() => setBillingCycle("yearly")}>연간</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 20 }}>
          <h2>무료</h2>
          <p>0원</p>
          <ul>
            <li>그룹 1개</li>
            <li>그룹당 최대 3명 (본인 포함)</li>
            <li>자료 보관 30일</li>
          </ul>
        </div>
        <div style={{ border: "2px solid #333", borderRadius: 12, padding: 20 }}>
          <h2>
            프리미엄{" "}
            <span style={{ fontSize: 12, fontWeight: 600, color: "#999" }}>(준비 중)</span>
          </h2>
          <p>{priceKrw}</p>
          <p style={{ color: "#999", fontSize: 13 }}>{priceUsd}</p>
          <p style={{ color: "#999", fontSize: 12, marginTop: 4 }}>
            예정 가격이며 출시 시 변경될 수 있습니다.
          </p>
          <ul>
            <li>그룹 최대 10개</li>
            <li>그룹당 최대 100명</li>
            <li>자료 보관 무제한</li>
          </ul>
          <button
            type="button"
            disabled
            style={{
              marginTop: 16,
              padding: "10px 20px",
              background: "#e5e5e5",
              color: "#999",
              borderRadius: 8,
              cursor: "not-allowed",
            }}
          >
            준비 중
          </button>
        </div>
      </div>

      <Link href="/" style={{ display: "inline-block", marginTop: 24, color: "#666" }}>
        ← 돌아가기
      </Link>
    </div>
  );
}
