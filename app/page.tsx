"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Home() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function createWorkspace() {
    if (!name.trim()) {
      setMessage("워크스페이스 이름을 입력해주세요.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase
      .from("workspaces")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      setMessage(`생성 실패: ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage(`생성 완료: ${data.name}`);
    setName("");
    setDescription("");
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
          maxWidth: "420px",
          background: "#fff",
          borderRadius: "24px",
          padding: "24px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
        }}
      >
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 우리집"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #dbeafe",
            marginBottom: "12px",
            outline: "none",
          }}
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="설명 (선택)"
          rows={3}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #dbeafe",
            marginBottom: "20px",
            outline: "none",
            resize: "vertical",
          }}
        />

        <button
          onClick={createWorkspace}
          disabled={loading}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: loading ? "#94a3b8" : "#4f46e5",
            color: "white",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "생성 중..." : "워크스페이스 만들기"}
        </button>

        {message && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              borderRadius: "12px",
              background: message.startsWith("생성 완료")
                ? "#ecfdf5"
                : "#fef2f2",
              color: message.startsWith("생성 완료")
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
