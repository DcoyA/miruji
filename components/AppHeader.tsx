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
  marginBottom: 16,
};

const eyebrowStyle: CSSProperties = {
  color: "#4f46e5",
  fontSize: 13,
  fontWeight: 800,
};

const headerTitleStyle: CSSProperties = {
  margin: 0,
  fontSize: 30,
  letterSpacing: "-0.04em",
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
