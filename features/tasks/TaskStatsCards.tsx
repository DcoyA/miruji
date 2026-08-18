"use client";

import type { CSSProperties } from "react";

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
        <div style={numberStyle}>
          {todayDoneCount}/{todayTotalCount}
        </div>
        <div style={labelStyle}>오늘의 할 일</div>
      </button>

      <button type="button" onClick={onClickUnfinished} style={cardStyle}>
        <div style={numberStyle}>{monthUnfinishedCount}</div>
        <div style={labelStyle}>이번 달 미완료</div>
      </button>
    </section>
  );
}

const gridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: 10,
  marginBottom: 16,
};

const cardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 16,
  background: "#fff",
  boxShadow: "0 3px 12px rgba(190, 24, 93, 0.08)",
  textAlign: "center",
  border: "none",
  cursor: "pointer",
};

const numberStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#e11d48",
};

const labelStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: "#9f6b75",
  fontWeight: 800,
};
