"use client";

import type { CSSProperties } from "react";

type SplashScreenProps = {
  progress: number;
  label: string;
};

export default function SplashScreen({ progress, label }: SplashScreenProps) {
  return (
    <div style={wrapStyle}>
      <div style={logoStyle}>🗓️</div>
      <h1 style={titleStyle}>미루지말자</h1>
      <div style={trackStyle}>
        <div style={{ ...barStyle, width: `${progress}%` }} />
      </div>
      <p style={labelStyle}>{label}</p>
    </div>
  );
}

const wrapStyle: CSSProperties = {
  minHeight: "60vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 20px",
  textAlign: "center",
};

const logoStyle: CSSProperties = { fontSize: 48, marginBottom: 12 };
const titleStyle: CSSProperties = { fontSize: 24, fontWeight: 800, color: "#3f1d24", marginBottom: 24 };
const trackStyle: CSSProperties = {
  width: 180,
  height: 6,
  borderRadius: 999,
  background: "#fde2e7",
  overflow: "hidden",
  marginBottom: 12,
};
const barStyle: CSSProperties = {
  height: "100%",
  borderRadius: 999,
  background: "linear-gradient(135deg, #fb7185, #e11d48)",
  transition: "width 0.4s ease",
};
const labelStyle: CSSProperties = { fontSize: 13, color: "#9f6b75", fontWeight: 700 };
