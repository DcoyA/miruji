import type { CSSProperties } from "react";

type SummaryStripProps = {
  monthTaskCount: number;
  pendingCount: number;
  approvedCount: number;
};

export default function SummaryStrip({
  monthTaskCount,
  pendingCount,
  approvedCount,
}: SummaryStripProps) {
  return (
    <section style={summaryGridStyle}>
      <div style={summaryCardStyle}>
        <div style={summaryNumberStyle}>{monthTaskCount}</div>
        <div style={summaryLabelStyle}>이번 달 할 일</div>
      </div>

      <div style={summaryCardStyle}>
        <div style={summaryNumberStyle}>{pendingCount}</div>
        <div style={summaryLabelStyle}>승인 대기</div>
      </div>

      <div style={summaryCardStyle}>
        <div style={summaryNumberStyle}>{approvedCount}</div>
        <div style={summaryLabelStyle}>승인 완료</div>
      </div>
    </section>
  );
}

const summaryGridStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 8,
  marginBottom: 14,
};

const summaryCardStyle: CSSProperties = {
  padding: 12,
  borderRadius: 16,
  background: "#fff5f6",
  border: "1px solid #fbcfe8",
  textAlign: "center",
};

const summaryNumberStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#e11d48",
};

const summaryLabelStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: "#9f6b75",
  fontWeight: 800,
};
