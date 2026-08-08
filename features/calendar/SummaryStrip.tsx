import type { CSSProperties } from "react";
import type { Workspace } from "@/types/app";

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
  currentWorkspaceId: string;
  onSelect: (id: string) => void;
};

export default function WorkspaceSwitcher({
  workspaces,
  currentWorkspaceId,
  onSelect,
}: WorkspaceSwitcherProps) {
  return (
    <section style={workspaceSwitcherStyle}>
      <label style={smallLabelStyle}>모임</label>

      <select
        value={currentWorkspaceId}
        onChange={(event) => onSelect(event.target.value)}
        style={selectStyle}
      >
        {workspaces.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </section>
  );
}

const workspaceSwitcherStyle: CSSProperties = {
  marginBottom: 24,
};

const smallLabelStyle: CSSProperties = {
  display: "block",
  color: "#be123c",
  fontSize: 12,
  fontWeight: 800,
  marginBottom: 6,
};

const selectStyle: CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 14,
  border: "none",
  background: "#fff",
  fontWeight: 700,
  boxShadow: "0 2px 10px rgba(190, 24, 93, 0.08)",
};
