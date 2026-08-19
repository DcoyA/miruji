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
  background: "linear-gradient(160deg, #EDEBFF 0%, #F6F5FF 55%, #FFFFFF 100%)",
  padding: 16,
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const phoneStyle: CSSProperties = {
  width: "100%",
  maxWidth: 480,
  minHeight: "calc(100vh - 32px)",
  background: "#FFFFFF",
  borderRadius: 28,
  padding: "22px 22px 104px",
  boxShadow: "0 20px 60px rgba(108, 99, 255, 0.14)",
  position: "relative",
};
