"use client";

import type { CSSProperties } from "react";
import { useState } from "react";

type TaskStatsCardsProps = {
  todayDoneCount: number;
  todayTotalCount: number;
  monthUnfinishedCount: number;
  onClickToday: () => void;
  onClickUnfinished: () => void;
};

export default function TaskStatsCards({
  todayDoneCount,
  todayTotalCount,
  monthUnfinishedCount,
  onClickToday,
  onClickUnfinished,
}: TaskStatsCardsProps) {
  return (
    <section style={gridStyle}>
      <button type="button" onClick={onClickToday} style={cardStyle}>
        <StatIcon src="/icons/today-task.png" fallback="✅" />
        <div style={numberStyle}>
          {todayDoneCount}/{todayTotalCount}
        </div>
        <div style={labelStyle}>오늘의 할 일</div>
      </button>

      <button type="button" onClick={onClickUnfinished} style={cardStyle}>
        <StatIcon src="/icons/month-unfinished.png" fallback="🗓️" />
        <div style={numberStyle}>{monthUnfinishedCount}</div>
        <div style={labelStyle}>이번 달 미완료</div>
      </button>
    </section>
  );
}

function StatIcon({ src, fallback }: { src: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={fallbackIconStyle}>{fallback}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={28} height={28} style={iconImgStyle} onError={() => setFailed(true)} />
  );
}

const gridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 16 };

const cardStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: 16,
  borderRadius: 18,
  background: "#FBFAFF",
  boxShadow: "0 3px 12px rgba(108, 99, 255, 0.10)",
  textAlign: "center",
  border: "none",
  cursor: "pointer",
};

const iconImgStyle: CSSProperties = { marginBottom: 6 };

const fallbackIconStyle: CSSProperties = { fontSize: 24, marginBottom: 6 };

const numberStyle: CSSProperties = { fontSize: 20, fontWeight: 900, color: "#6C63FF" };

const labelStyle: CSSProperties = { marginTop: 4, fontSize: 11, color: "#8b83b0", fontWeight: 800 };
