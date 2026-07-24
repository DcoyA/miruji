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
        <div style={summaryLabelStyle}>이번 달 미션</div>
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
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  textAlign: "center",
};

const summaryNumberStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
  color: "#4f46e5",
};

const summaryLabelStyle: CSSProperties = {
  marginTop: 4,
  fontSize: 11,
  color: "#64748b",
  fontWeight: 800,
};
