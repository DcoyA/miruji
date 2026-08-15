"use client";

import type { CSSProperties } from "react";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
};

export default function Avatar({ src, name, size = 44 }: AvatarProps) {
  const wrapperStyle: CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: size * 0.4,
    flexShrink: 0,
    overflow: "hidden",
    background: "linear-gradient(135deg, #fb7185, #e11d48)",
    color: "#ffffff",
  };

  if (src) {
    return (
      <div style={wrapperStyle}>
        <img
          src={src}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    );
  }

  return <div style={wrapperStyle}>{name?.charAt(0)?.toUpperCase() || "?"}</div>;
}
