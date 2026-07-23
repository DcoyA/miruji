"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Workspace = {
  id: string;
  name: string;
  description: string | null;
};

type Member = {
  id: string;
  display_name: string;
  role: "owner" | "manager" | "member";
  is_virtual: boolean;
};

export default function Home() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState<"manager" | "member">("member");
  const [members, setMembers] = useState<Member[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createWorkspace() {
    if (!workspaceName.trim()) {
      setMessage("워크스페이스 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setMessage(`워크스페이스 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setWorkspace(data);
    setMessage(`워크스페이스 생성 완료: ${data.name}`);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setLoading(false);
  }

  async function addMember() {
    if (!workspace) {
      setMessage("먼저 워크스페이스를 만들어주세요.");
      return;
    }

    if (!memberName.trim()) {
      setMessage("참여자 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: workspace.id,
        display_name: memberName.trim(),
        role: memberRole,
        status: "active",
        is_virtual: true,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setMessage(`참여자 추가 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMembers((prev) => [...prev, data]);
    setMemberName("");
    setMemberRole("member");
    setMessage(`참여자 추가 완료: ${data.display_name}`);
    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        padding: "24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "#fff",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
        {!workspace ? (
          <>
            <h1
              style={{
                marginBottom: "8px",
                fontSize: "28px",
              }}
            >
              워크스페이스 생성
            </h1>

            <p
              style={{
                color: "#64748b",
                marginBottom: "24px",
              }}
            >
              가족 또는 그룹 공간을 만들어보세요
            </p>

            <input
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="예) 우리집"
              style={inputStyle}
            />

            <textarea
              value={workspaceDescription}
              onChange={(e) => setWorkspaceDescription(e.target.value)}
              placeholder="설명 (선택)"
              rows={3}
              style={{
                ...inputStyle,
                resize: "vertical",
              }}
            />

            <button
              onClick={createWorkspace}
              disabled={loading}
              style={primaryButtonStyle(loading)}
            >
              {loading ? "생성 중..." : "워크스페이스 만들기"}
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                padding: "14px",
                borderRadius: "16px",
                background: "#eef2ff",
                marginBottom: "22px",
              }}
            >
              <div
                style={{
                  color: "#4f46e5",
                  fontSize: "13px",
                  fontWeight: 700,
                  marginBottom: "4px",
                }}
              >
                현재 워크스페이스
              </div>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                }}
              >
                {workspace.name}
              </div>
              {workspace.description && (
                <div
                  style={{
                    marginTop: "4px",
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  {workspace.description}
                </div>
              )}
            </div>

            <h1
              style={{
                marginBottom: "8px",
                fontSize: "26px",
              }}
            >
              참여자 추가
            </h1>

            <p
              style={{
                color: "#64748b",
                marginBottom: "20px",
              }}
            >
              실명 대신 앱에서 부를 이름만 입력하세요
            </p>

            <input
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="예) 엄마, 첫째, 토끼"
              style={inputStyle}
            />

            <select
              value={memberRole}
              onChange={(e) =>
                setMemberRole(e.target.value as "manager" | "member")
              }
              style={inputStyle}
            >
              <option value="manager">보호자/관리자</option>
              <option value="member">참여자/자녀</option>
            </select>

            <button
              onClick={addMember}
              disabled={loading}
              style={primaryButtonStyle(loading)}
            >
              {loading ? "추가 중..." : "참여자 추가"}
            </button>

            {members.length > 0 && (
              <div
                style={{
                  marginTop: "24px",
                }}
              >
                <h2
                  style={{
                    fontSize: "18px",
                    marginBottom: "12px",
                  }}
                >
                  참여자 목록
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {members.map((member) => (
                    <div
                      key={member.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: "14px",
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                        }}
                      >
                        {member.display_name}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "4px 8px",
                          borderRadius: "999px",
                          background:
                            member.role === "manager" ? "#dbeafe" : "#dcfce7",
                          color:
                            member.role === "manager" ? "#1d4ed8" : "#15803d",
                        }}
                      >
                        {member.role === "manager" ? "보호자" : "참여자"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {message && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "12px",
              background:
                message.includes("완료") || message.includes("생성")
                  ? "#ecfdf5"
                  : "#fef2f2",
              color:
                message.includes("완료") || message.includes("생성")
                  ? "#047857"
                  : "#b91c1c",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #dbeafe",
  marginBottom: "12px",
  outline: "none",
};

function primaryButtonStyle(loading: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "14px",
    borderRadius: "12px",
    border: "none",
    background: loading ? "#94a3b8" : "#4f46e5",
    color: "white",
    fontWeight: "bold",
    cursor: loading ? "not-allowed" : "pointer",
  };
}
