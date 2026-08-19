import type { ReactNode } from "react";

type ShellProps = {
  children: ReactNode;
};

export default function Shell({ children }: ShellProps) {
  return (
    <main className="app-shell-outer">
      <div className="app-shell-frame">{children}</div>
    </main>
  );
}
