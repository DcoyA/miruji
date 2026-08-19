"use client";

import type { CSSProperties } from "react";
import type { TaskTemplate } from "@/types/app";
import { repeatSummary } from "@/lib/labels";

type TemplateManagerPanelProps = {
  templates: TaskTemplate[];
  loading: boolean;
  isManager: boolean;
  onToggleTemplateActive: (template: TaskTemplate) => void;
  onDeleteTemplate: (template: TaskTemplate) => void;
  onRolloverNow: () => void;
};

export default function TemplateManagerPanel({
  templates,
  loading,
  isManager,
  onToggleTemplateActive,
  onDeleteTemplate,
  onRolloverNow,
}: TemplateManagerPanelProps) {
  if (!isManager) return null;

  return (
    <section style={sectionStyle}>
      <div style={headerRowStyle}>
        <h2 style={titleStyle}>반복 할 일 관리</h2>
        <button type="button" onClick={onRolloverNow} disabled={loading} style={rolloverButtonStyle}>
          지난 할 일 정리하기
        </button>
      </div>

      {templates.length === 0 ? (
        <p style={hintStyle}>등록된 반복 할 일이 없습니다.</p>
      ) : (
        <div style={listStyle}>
          {templates.map((template) => (
            <div key={template.id} style={cardStyle}>
              <div>
                <div style={templateTitleStyle}>{template.title}</div>
                <div style={subTextStyle}>
                  {repeatSummary(template.repeat_type, template.repeat_weekdays)} · 스티커{" "}
                  {template.reward_points}개
                </div>
              </div>
              <div style={actionRowStyle}>
                <button
                  onClick={() => onToggleTemplateActive(template)}
                  disabled={loading}
                  style={template.is_active ? pauseButtonStyle : resumeButtonStyle}
                >
                  {template.is_active ? "일시중지" : "재개"}
                </button>
                <button onClick={() => onDeleteTemplate(template)} disabled={loading} style={deleteButtonStyle}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const sectionStyle: CSSProperties = { marginBottom: 20 };

const headerRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 8,
  marginBottom: 10,
  flexWrap: "wrap",
};

const titleStyle: CSSProperties = { margin: 0, fontSize: 16, fontWeight: 900, color: "#2b2140" };
const rolloverButtonStyle: CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #E7E3FB",
  background: "#fff",
  color: "#6C63FF",
  fontWeight: 800,
  fontSize: 12,
  cursor: "pointer",
  whiteSpace: "nowrap",
};
const hintStyle: CSSProperties = { fontSize: 13, color: "#8b83b0" };
const cardStyle: CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "#ffffff",
  boxShadow: "0 3px 12px rgba(108, 99, 255, 0.06)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};
const templateTitleStyle: CSSProperties = { fontWeight: 900, fontSize: 14, color: "#2b2140" };
const subTextStyle: CSSProperties = { marginTop: 4, color: "#8b83b0", fontSize: 12 };

const listStyle: CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

const actionRowStyle: CSSProperties = { display: "flex", gap: 6 };

const pauseButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#f59e0b",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const resumeButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#15803d",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};

const deleteButtonStyle: CSSProperties = {
  border: "none",
  borderRadius: 12,
  background: "#b91c1c",
  color: "#fff",
  padding: "8px 12px",
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer",
};
