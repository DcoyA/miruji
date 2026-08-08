import type { CSSProperties, ReactNode } from "react";

type ShellProps = {
  children: ReactNode;
};

export default function Shell({ children }: ShellProps) {
  return (
    <main style={pageStyle}>
      <div style={phoneStyle}>{children}</div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(160deg, #ffe4e6 0%, #fff7f5 60%, #fdf2f0 100%)",
  padding: 16,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const phoneStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  minHeight: "calc(100vh - 32px)",
  background: "#fffaf9",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 20px 60px rgba(190, 24, 93, 0.10)",
};

