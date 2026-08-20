import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata = {
  title: "개인정보처리방침 | 미루지말자",
};

export default function PrivacyPolicyPage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link href="/" style={backLinkStyle}>
          ← 돌아가기
        </Link>

        <h1 style={titleStyle}>개인정보처리방침</h1>
        <p style={effectiveDateStyle}>시행일: 2026년 8월 7일</p>

        <p style={paragraphStyle}>
          &ldquo;미루지말자&rdquo;(이하 &ldquo;서비스&rdquo;)를 운영하는 개인 개발자(이하 &ldquo;운영자&rdquo;)는
          「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 처리하기 위해
          다음과 같이 개인정보처리방침을 수립·공개합니다.
        </p>

        <h2 style={sectionTitleStyle}>1. 수집하는 개인정보 항목</h2>
        <p style={paragraphStyle}>
          서비스는 회원가입 및 이용 과정에서 아래의 정보를 수집합니다.
        </p>
        <ul style={listStyle}>
          <li>필수 항목: 이메일 주소, 비밀번호(암호화 저장)</li>
          <li>
            서비스 이용 중 생성·입력되는 정보: 미션(할 일) 내용, 다이어리 기록, 워크스페이스
            및 구성원 정보(별칭, 역할)
          </li>
          <li>자동 수집 정보: 접속 로그, 서비스 이용 기록(오류 로그 등)</li>
        </ul>

        <h2 style={sectionTitleStyle}>2. 개인정보의 수집 및 이용 목적</h2>
        <ul style={listStyle}>
          <li>회원 식별 및 로그인, 계정 관리</li>
          <li>미션(할 일) 등록·수행·인증·보상 등 서비스 핵심 기능 제공</li>
          <li>워크스페이스(가족 단위) 구성원 간 협업 기능 제공</li>
          <li>부정 이용 방지, 서비스 개선 및 오류 분석</li>
        </ul>

        <h2 style={sectionTitleStyle}>3. 개인정보의 보유 및 이용 기간</h2>
        <p style={paragraphStyle}>
          이용자의 개인정보는 회원 탈퇴 시 지체 없이 파기합니다. 다만 관계 법령에 따라
          보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
        </p>

        <h2 style={sectionTitleStyle}>4. 개인정보의 제3자 제공 및 처리 위탁</h2>
        <p style={paragraphStyle}>
          서비스는 안정적인 서버 운영과 데이터 저장을 위해 아래와 같이 개인정보 처리를
          위탁하고 있습니다.
        </p>
        <ul style={listStyle}>
          <li>
            수탁업체: Supabase, Inc. / 위탁업무 내용: 데이터베이스 저장, 인증(로그인) 처리,
            서버 인프라 운영
          </li>
        </ul>
        <p style={paragraphStyle}>
          운영자는 법령에 근거하거나 이용자의 별도 동의가 있는 경우를 제외하고, 개인정보를
          외부에 제공하지 않습니다.
        </p>

        <h2 style={sectionTitleStyle}>5. 만 14세 미만 아동의 개인정보 처리</h2>
        <p style={paragraphStyle}>
          서비스는 보호자(매니저) 계정을 중심으로 자녀(참여자)가 참여하는 구조로 운영됩니다.
          만 14세 미만 아동이 별도의 계정으로 서비스를 이용하고자 하는 경우, 법정대리인(보호자)의
          동의가 필요합니다. 보호자가 발급한 초대 코드 또는 초대 링크를 통해 자녀가 참여하는
          경우, 이는 법정대리인의 동의 하에 이루어진 것으로 봅니다. 운영자는 만 14세 미만
          아동으로부터 법정대리인의 동의 없이 개인정보를 수집하지 않으며, 관련 사실이 확인되는
          경우 지체 없이 해당 정보를 파기합니다.
        </p>

        <h2 style={sectionTitleStyle}>7. 이용자의 권리와 행사 방법</h2>
        <p style={paragraphStyle}>
          이용자는 언제든지 자신의 개인정보를 조회·수정하거나 삭제를 요청할 수 있으며,
          회원 탈퇴를 통해 개인정보 처리 정지를 요구할 수 있습니다. 관련 요청은 아래 문의처를
          통해 접수할 수 있습니다.
        </p>

        <h2 style={sectionTitleStyle}>8. 개인정보의 안전성 확보 조치</h2>
        <p style={paragraphStyle}>
          비밀번호는 암호화하여 저장하며, 데이터베이스 접근 권한을 최소화하는 등 개인정보가
          분실·도난·유출·위조·변조되지 않도록 필요한 기술적·관리적 조치를 취하고 있습니다.
        </p>

        <h2 style={sectionTitleStyle}>9. 개인정보처리방침의 변경</h2>
        <p style={paragraphStyle}>
          이 개인정보처리방침은 법령 및 서비스 내용의 변경에 따라 수정될 수 있으며, 변경 시
          서비스 내 공지사항 또는 본 페이지를 통해 고지합니다.
        </p>

        <h2 style={sectionTitleStyle}>10. 문의처</h2>
        <p style={paragraphStyle}>
          개인정보 처리에 관한 문의사항은 아래 이메일로 연락해 주시기 바랍니다.
        </p>
        <p style={paragraphStyle}>이메일: iamborghini5757@gmail.com</p>
      </div>
    </main>
  );
}

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  background: "#f8fafc",
  padding: "24px 16px 64px",
};

const containerStyle: CSSProperties = {
  maxWidth: 640,
  margin: "0 auto",
  background: "#fff",
  borderRadius: 20,
  padding: "28px 24px",
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.06)",
};

const backLinkStyle: CSSProperties = {
  display: "inline-block",
  marginBottom: 16,
  fontSize: 14,
  color: "#4338ca",
  fontWeight: 700,
  textDecoration: "none",
};

const titleStyle: CSSProperties = {
  fontSize: 22,
  fontWeight: 800,
  color: "#0f172a",
  marginBottom: 4,
};

const effectiveDateStyle: CSSProperties = {
  fontSize: 13,
  color: "#94a3b8",
  marginBottom: 20,
};

const sectionTitleStyle: CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  color: "#0f172a",
  marginTop: 24,
  marginBottom: 8,
};

const paragraphStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: "#334155",
  marginBottom: 8,
};

const listStyle: CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: "#334155",
  paddingLeft: 20,
  marginBottom: 8,
};
