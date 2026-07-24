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
  background: "#e2f3f1",
  padding: 16,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const phoneStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  minHeight: "calc(100vh - 32px)",
  background: "#fff",
  borderRadius: 28,
  padding: 22,
  boxShadow: "0 20px 60px rgba(15,23,42,0.12)",
};
