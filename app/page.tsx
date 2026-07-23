export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 24,
          padding: 28,
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
          border: "1px solid #e2e8f0",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: "#4f46e5",
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            marginBottom: 20,
          }}
        >
          ✓
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: 32,
            lineHeight: 1.2,
            letterSpacing: "-0.04em",
          }}
        >
          미루지말자
        </h1>

        <p
          style={{
            marginTop: 12,
            marginBottom: 0,
            color: "#475569",
            fontSize: 16,
            lineHeight: 1.6,
          }}
        >
          부모와 자녀가 함께 쓰는
          <br />
          미션형 클라우드 다이어리
        </p>

        <div
          style={{
            marginTop: 28,
            padding: 16,
            borderRadius: 16,
            background: "#f1f5f9",
            color: "#334155",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          <strong>현재 단계</strong>
          <br />
          Next.js 기본 프로젝트 연결 테스트 중
        </div>
      </section>
    </main>
  )
}
