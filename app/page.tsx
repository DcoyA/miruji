export default function Home() {
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
          placeholder="예) 우리집"
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #dbeafe",
            marginBottom: "12px",
          }}
        />

        <textarea
          placeholder="설명 (선택)"
          rows={3}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid #dbeafe",
            marginBottom: "20px",
          }}
        />

        <button
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "12px",
            border: "none",
            background: "#4f46e5",
            color: "white",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          워크스페이스 만들기
        </button>
      </div>
    </main>
  );
}
