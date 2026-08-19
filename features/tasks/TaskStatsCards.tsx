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
        <div style={textColStyle}>
          <div style={numberStyle}>
            {todayDoneCount}/{todayTotalCount}
          </div>
          <div style={labelStyle}>오늘의 할 일</div>
        </div>
      </button>

      <button type="button" onClick={onClickUnfinished} style={cardStyle}>
        <StatIcon src="/icons/month-unfinished.png" fallback="🗓️" />
        <div style={textColStyle}>
          <div style={numberStyle}>{monthUnfinishedCount}</div>
          <div style={labelStyle}>이번 달 미완료</div>
        </div>
      </button>
    </section>
  );
}

function StatIcon({ src, fallback }: { src: string; fallback: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span style={fallbackIconStyle}>{fallback}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={22} height={22} style={iconImgStyle} onError={() => setFailed(true)} />
  );
}

const gridStyle: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 14 };

const cardStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "10px 12px",
  borderRadius: 16,
  background: "#FBFAFF",
  boxShadow: "0 3px 10px rgba(108, 99, 255, 0.10)",
  textAlign: "left",
  border: "none",
  cursor: "pointer",
};

const textColStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 1, minWidth: 0 };

const iconImgStyle: CSSProperties = { flexShrink: 0 };

const fallbackIconStyle: CSSProperties = { fontSize: 20, flexShrink: 0 };

const numberStyle: CSSProperties = { fontSize: 16, fontWeight: 900, color: "#6C63FF", lineHeight: 1.1 };

const labelStyle: CSSProperties = { fontSize: 11, color: "#8b83b0", fontWeight: 800, lineHeight: 1.1 };
