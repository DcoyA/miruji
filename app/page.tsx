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

type Task = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  due_date: string | null;
  assigned_member_id: string | null;
  verification_type: string;
  verification_required: boolean;
  reward_points: number;
};

export default function Home() {
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceDescription, setWorkspaceDescription] = useState("");
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  const [memberName, setMemberName] = useState("");
  const [memberRole, setMemberRole] = useState<"manager" | "member">("member");
  const [members, setMembers] = useState<Member[]>([]);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskAssignedMemberId, setTaskAssignedMemberId] = useState("");
  const [taskType, setTaskType] = useState("habit");
  const [verificationType, setVerificationType] = useState("none");
  const [rewardPoints, setRewardPoints] = useState(1);
  const [tasks, setTasks] = useState<Task[]>([]);

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
      setMessage(`워크스페이스 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setWorkspace(data);
    setWorkspaceName("");
    setWorkspaceDescription("");
    setMessage(`워크스페이스 생성 완료: ${data.name}`);
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

  async function createTask() {
    if (!workspace) {
      setMessage("먼저 워크스페이스를 만들어주세요.");
      return;
    }

    if (!taskTitle.trim()) {
      setMessage("미션 제목을 입력해주세요.");
      return;
    }

    if (!taskAssignedMemberId) {
      setMessage("미션을 받을 참여자를 선택해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("tasks")
      .insert({
        workspace_id: workspace.id,
        title: taskTitle.trim(),
        description: taskDescription.trim() || null,
        task_type: taskType,
        status: "todo",
        due_date: new Date().toISOString().slice(0, 10),
        assigned_member_id: taskAssignedMemberId,
        verification_type: verificationType,
        verification_required: verificationType !== "none",
        reward_points: rewardPoints,
        rollover_enabled: true,
      })
      .select()
      .single();

    if (error) {
      setMessage(`미션 생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setTasks((prev) => [data, ...prev]);
    setTaskTitle("");
    setTaskDescription("");
    setVerificationType("none");
    setRewardPoints(1);
    setMessage(`미션 생성 완료: ${data.title}`);
    setLoading(false);
  }

  function memberNameById(id: string | null) {
    if (!id) return "미지정";
    return members.find((member) => member.id === id)?.display_name || "미지정";
  }

  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        {!workspace ? (
          <>
            <h1 style={titleStyle}>워크스페이스 생성</h1>
            <p style={subTextStyle}>가족 또는 그룹 공간을 만들어보세요</p>

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
              style={{ ...inputStyle, resize: "vertical" }}
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
            <div style={workspaceBoxStyle}>
              <div style={labelStyle}>현재 워크스페이스</div>
              <div style={{ fontSize: 22, fontWeight: 800 }}>
                {workspace.name}
              </div>
              {workspace.description && (
                <div style={{ marginTop: 4, color: "#64748b", fontSize: 14 }}>
                  {workspace.description}
                </div>
              )}
            </div>

            <section style={sectionStyle}>
              <h2 style={sectionTitleStyle}>1. 참여자 추가</h2>
              <p style={subTextStyle}>실명 대신 앱에서 부를 이름만 입력하세요</p>

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
                <div style={listStyle}>
                  {members.map((member) => (
                    <div key={member.id} style={memberCardStyle}>
                      <span style={{ fontWeight: 700 }}>
                        {member.display_name}
                      </span>
                      <span style={badgeStyle(member.role)}>
                        {member.role === "manager" ? "보호자" : "참여자"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {members.length > 0 && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>2. 미션 만들기</h2>
                <p style={subTextStyle}>
                  참여자에게 오늘 할 미션을 부여하세요
                </p>

                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="예) 피아노 100번 치기"
                  style={inputStyle}
                />

                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="설명 (선택)"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical" }}
                />

                <select
                  value={taskAssignedMemberId}
                  onChange={(e) => setTaskAssignedMemberId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">미션 받을 참여자 선택</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.display_name}
                    </option>
                  ))}
                </select>

                <select
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="habit">습관</option>
                  <option value="study">학습</option>
                  <option value="chore">집안일</option>
                  <option value="health">건강</option>
                  <option value="promise">약속</option>
                  <option value="custom">기타</option>
                </select>

                <select
                  value={verificationType}
                  onChange={(e) => setVerificationType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="none">인증 없음</option>
                  <option value="text">텍스트 인증</option>
                  <option value="photo">사진 인증</option>
                  <option value="video">영상 인증</option>
                  <option value="audio">음성 인증</option>
                </select>

                <input
                  type="number"
                  min={0}
                  value={rewardPoints}
                  onChange={(e) => setRewardPoints(Number(e.target.value))}
                  placeholder="스티커 개수"
                  style={inputStyle}
                />

                <button
                  onClick={createTask}
                  disabled={loading}
                  style={primaryButtonStyle(loading)}
                >
                  {loading ? "생성 중..." : "미션 만들기"}
                </button>
              </section>
            )}

            {tasks.length > 0 && (
              <section style={sectionStyle}>
                <h2 style={sectionTitleStyle}>3. 오늘의 미션</h2>

                <div style={listStyle}>
                  {tasks.map((task) => (
                    <div key={task.id} style={taskCardStyle}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>
                          {task.title}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            color: "#64748b",
                            fontSize: 13,
                          }}
                        >
                          대상: {memberNameById(task.assigned_member_id)}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            color: "#64748b",
                            fontSize: 13,
                          }}
                        >
                          인증: {verificationLabel(task.verification_type)} ·
                          스티커 {task.reward_points}개
                        </div>
                      </div>

                      <span style={taskStatusBadgeStyle}>{task.status}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {message && (
          <div style={messageBoxStyle(message)}>
            {message}
          </div>
        )}
      </div>
    </main>
  );
}

function verificationLabel(type: string) {
  if (type === "text") return "텍스트";
  if (type === "photo") return "사진";
  if (type === "video") return "영상";
  if (type === "audio") return "음성";
  if (type === "location") return "위치";
  return "없음";
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
};

const containerStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "500px",
  background: "#fff",
  borderRadius: "24px",
  padding: "24px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
};

const titleStyle: React.CSSProperties = {
  marginBottom: "8px",
  fontSize: "28px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "0 0 8px",
  fontSize: "22px",
};

const subTextStyle: React.CSSProperties = {
  color: "#64748b",
  marginBottom: "20px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px",
  borderRadius: "12px",
  border: "1px solid #dbeafe",
  marginBottom: "12px",
  outline: "none",
};

const workspaceBoxStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "#eef2ff",
  marginBottom: "22px",
};

const labelStyle: React.CSSProperties = {
  color: "#4f46e5",
  fontSize: "13px",
  fontWeight: 700,
  marginBottom: "4px",
};

const sectionStyle: React.CSSProperties = {
  paddingTop: "22px",
  marginTop: "22px",
  borderTop: "1px solid #e2e8f0",
};

const listStyle: React.CSSProperties = {
  marginTop: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const memberCardStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "14px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

function badgeStyle(role: string): React.CSSProperties {
  return {
    fontSize: "12px",
    padding: "4px 8px",
    borderRadius: "999px",
    background: role === "manager" ? "#dbeafe" : "#dcfce7",
    color: role === "manager" ? "#1d4ed8" : "#15803d",
  };
}

const taskCardStyle: React.CSSProperties = {
  padding: "14px",
  borderRadius: "16px",
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  display: "flex",
  justifyContent: "space-between",
  gap: "12px",
};

const taskStatusBadgeStyle: React.CSSProperties = {
  height: "fit-content",
  fontSize: "12px",
  padding: "4px 8px",
  borderRadius: "999px",
  background: "#fef3c7",
  color: "#92400e",
  fontWeight: 700,
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

function messageBoxStyle(message: string): React.CSSProperties {
  const ok = message.includes("완료") || message.includes("생성");

  return {
    marginTop: "16px",
    padding: "12px",
    borderRadius: "12px",
    background: ok ? "#ecfdf5" : "#fef2f2",
    color: ok ? "#047857" : "#b91c1c",
    fontSize: "14px",
    lineHeight: 1.5,
  };
}
