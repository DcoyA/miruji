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
        <p style={effectiveDateStyle}>시행일: 2026년 8월 29일</p>

        <p style={paragraphStyle}>
          &ldquo;미루지말자&rdquo;(이하 &ldquo;서비스&rdquo;)를 운영하는 개인 개발자(이하 &ldquo;운영자&rdquo;)는
          「개인정보 보호법」 등 관련 법령을 준수하며, 이용자의 개인정보를 안전하게 처리하기 위해
          다음과 같이 개인정보처리방침을 수립·공개합니다. 서비스는 가족·친구 등으로 구성된 그룹이 함께
          할 일(미션)을 등록·수행·인증하고, 수행에 따른 포인트와 보상을 관리하는 협업 도구입니다.
        </p>

        <h2 style={sectionTitleStyle}>1. 수집하는 개인정보 항목</h2>
        <p style={paragraphStyle}>서비스는 회원가입 및 이용 과정에서 아래의 정보를 수집합니다.</p>
        <ul style={listStyle}>
          <li>필수 항목: 아이디(이용자가 직접 정하는 로그인용 아이디), 비밀번호(암호화하여 저장)</li>
          <li>
            선택 항목: 복구용 이메일 주소(비밀번호 분실 시 본인 확인 및 안내 용도), 프로필 사진
          </li>
          <li>
            서비스 이용 중 생성·입력되는 정보: 미션(할 일) 내용 및 수행·승인 기록, 미션 인증 자료
            (텍스트, 사진, 영상, 음성 파일), 워크스페이스(그룹) 및 구성원 정보(별칭, 역할),
            포인트 적립·사용 내역 및 보상 항목
          </li>
          <li>푸시 알림에 동의한 경우: 브라우저 또는 기기가 발급한 푸시 구독 정보(토큰)</li>
          <li>자동 수집 정보: 접속 로그, 서비스 이용 기록 및 오류 로그</li>
        </ul>
        <p style={paragraphStyle}>
          로그인 처리를 위해 이용자의 아이디는 내부적으로 &ldquo;아이디@users.miruji.app&rdquo; 형태의
          식별자로 변환되어 인증 시스템에 저장됩니다. 이는 실제 이메일 주소가 아니며, 해당 주소로
          메일이 발송되지 않습니다.
        </p>

        <h2 style={sectionTitleStyle}>2. 개인정보의 수집 및 이용 목적</h2>
        <ul style={listStyle}>
          <li>회원 식별 및 로그인, 계정 관리</li>
          <li>미션 등록·수행·인증·승인 및 포인트/보상 관리 등 서비스 핵심 기능 제공</li>
          <li>워크스페이스 구성원 간 협업 기능 제공</li>
          <li>이용자가 동의한 경우 푸시 알림 발송</li>
          <li>비밀번호 재설정 요청 접수 및 본인 안내</li>
          <li>부정 이용 방지, 서비스 개선 및 오류 분석</li>
        </ul>

        <h2 style={sectionTitleStyle}>3. 개인정보의 보유 및 이용 기간</h2>
        <p style={paragraphStyle}>
          회원 탈퇴 시 아이디, 비밀번호, 복구용 이메일, 프로필 사진 등 계정 정보는 지체 없이
          파기합니다. 다만 이용자가 공동 워크스페이스에 남긴 미션·인증 자료·포인트 내역 등은 다른
          구성원의 서비스 이용을 위해, 개인을 식별할 수 없도록 계정 연결이 해제된 상태로 유지될 수
          있습니다. 관계 법령에 따라 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관합니다.
        </p>

        <h2 style={sectionTitleStyle}>4. 개인정보의 제3자 제공 및 처리 위탁</h2>
        <p style={paragraphStyle}>
          서비스는 안정적인 운영을 위해 아래와 같이 개인정보 처리를 위탁하고 있습니다.
        </p>
        <ul style={listStyle}>
          <li>
            Supabase, Inc. — 데이터베이스 저장, 인증(로그인) 처리, 파일(사진·영상·음성) 저장,
            서버 인프라 운영. 데이터는 해외 리전의 서버에 저장·처리될 수 있습니다.
          </li>
          <li>
            Google LLC — 이용자가 비밀번호 재설정을 요청할 때 입력한 연락처 이메일과 요청 내용을
            운영자에게 전달하기 위한 메일 발송(Gmail).
          </li>
        </ul>
        <p style={paragraphStyle}>
          운영자는 법령에 근거하거나 이용자의 별도 동의가 있는 경우를 제외하고, 개인정보를 외부에
          제공하지 않습니다.
        </p>

        <h2 style={sectionTitleStyle}>5. 업로드 파일 및 미디어의 처리</h2>
        <p style={paragraphStyle}>
          프로필 사진, 미션 인증을 위한 사진·영상·음성 파일은 서비스 저장소에 업로드되며, 같은
          워크스페이스에 속한 구성원이 열람할 수 있습니다. 이용자는 앱 내에서 자신이 업로드한
          파일이 포함된 미션 또는 프로필 사진을 삭제·교체할 수 있습니다.
        </p>

        <h2 style={sectionTitleStyle}>6. 만 14세 미만 아동의 개인정보 처리</h2>
        <p style={paragraphStyle}>
          서비스는 보호자(관리자) 계정을 중심으로 자녀(참여자)가 참여하는 구조로 운영될 수
          있습니다. 만 14세 미만 아동이 별도의 계정으로 서비스를 이용하고자 하는 경우,
          법정대리인(보호자)의 동의가 필요합니다. 보호자가 발급한 초대 코드 또는 초대 링크를 통해
          자녀가 참여하는 경우, 이는 법정대리인의 동의 하에 이루어진 것으로 봅니다. 운영자는 만
          14세 미만 아동으로부터 법정대리인의 동의 없이 개인정보를 수집하지 않으며, 관련 사실이
          확인되는 경우 지체 없이 해당 정보를 파기합니다.
        </p>

        <h2 style={sectionTitleStyle}>7. 이용자의 권리와 행사 방법</h2>
        <p style={paragraphStyle}>
          이용자는 언제든지 자신의 개인정보를 조회·수정하거나 삭제를 요청할 수 있으며, 회원 탈퇴를
          통해 개인정보 처리 정지를 요구할 수 있습니다. 대부분의 항목은 앱 내 설정 화면에서 직접
          변경·삭제할 수 있으며, 그 밖의 요청은 아래 문의처를 통해 접수할 수 있습니다.
        </p>

        <h2 style={sectionTitleStyle}>8. 푸시 알림</h2>
        <p style={paragraphStyle}>
          푸시 알림은 이용자가 명시적으로 동의한 경우에만 발송됩니다. 이용자는 브라우저·기기의 알림
          설정 또는 앱 내 알림 설정에서 언제든지 알림 수신을 해제할 수 있으며, 해제 시 관련 구독
          정보는 더 이상 사용되지 않습니다.
        </p>

        <h2 style={sectionTitleStyle}>9. 개인정보의 안전성 확보 조치</h2>
        <p style={paragraphStyle}>
          비밀번호는 암호화하여 저장하며, 데이터베이스 접근 권한을 최소화하고 행 수준 보안(RLS)
          정책을 적용하는 등 개인정보가 분실·도난·유출·위조·변조되지 않도록 필요한 기술적·관리적
          조치를 취하고 있습니다.
        </p>

        <h2 style={sectionTitleStyle}>10. 개인정보처리방침의 변경</h2>
        <p style={paragraphStyle}>
          이 개인정보처리방침은 법령 및 서비스 내용의 변경에 따라 수정될 수 있으며, 변경 시 서비스
          내 공지사항 또는 본 페이지를 통해 고지합니다.
        </p>

        <h2 style={sectionTitleStyle}>11. 문의처</h2>
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
