import type { CSSProperties } from "react";

type AppHeaderProps = {
  title: string;
  loading: boolean;
  onSignOut: () => void;
};

export default function AppHeader({
  title,
  loading,
  onSignOut,
}: AppHeaderProps) {
  return (
    <header style={topBarStyle}>
      <div>
        <div style={eyebrowStyle}>미루지말자</div>
        <h1 style={headerTitleStyle}>{title}</h1>
      </div>

      <button onClick={onSignOut} disabled={loading} style={logoutButtonStyle}>
        로그아웃
      </button>
    </header>
  );
}

const topBarStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  marginBottom: 22,
};

const eyebrowStyle: CSSProperties = {
  color: "#e11d48",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.02em",
};

const headerTitleStyle: CSSProperties = {
  margin: "2px 0 0",
  fontSize: 32,
  fontWeight: 800,
  letterSpacing: "-0.03em",
  color: "#3f1d24",
};

const logoutButtonStyle: CSSProperties = {
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  borderRadius: 14,
  padding: "10px 12px",
  fontWeight: 800,
  cursor: "pointer",
};
