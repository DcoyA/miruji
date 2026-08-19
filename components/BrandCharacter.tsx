import type { CSSProperties } from "react";

type BrandCharacterProps = {
  size?: number;
};

export default function BrandCharacter({ size = 40 }: BrandCharacterProps) {
  const wrapperStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    background: "#6C63FF",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    boxShadow: "0 4px 10px rgba(108,99,255,0.35)",
  };

  return (
    <div style={wrapperStyle}>
      <svg viewBox="0 0 100 100" width={size * 0.62} height={size * 0.62}>
        <path
          d="M10,50 C10,20 30,5 50,5 C70,5 90,20 90,50 L90,68 Q80,58 70,68 Q60,78 50,68 Q40,58 30,68 Q20,78 10,68 Z"
          fill="#F3F1FF"
        />
        <circle cx="36" cy="46" r="3.6" fill="#2E2E3A" />
        <circle cx="64" cy="46" r="3.6" fill="#2E2E3A" />
        <circle cx="32" cy="38" r="1.5" fill="#2E2E3A" />
        <circle cx="68" cy="38" r="1.5" fill="#2E2E3A" />
        <path
          d="M40,58 Q50,66 60,58"
          stroke="#2E2E3A"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
