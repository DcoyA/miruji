import Link from "next/link";
import type { CSSProperties } from "react";

export const metadata = {
  title: "이용약관 | 미루지말자",
};

export default function TermsOfServicePage() {
  return (
    <main style={pageStyle}>
      <div style={containerStyle}>
        <Link href="/" style={backLinkStyle}>
          ← 돌아가기
        </Link>

        <h1 style={titleStyle}>이용약관</h1>
        <p style={effectiveDateStyle}>시행일: 2026년 8월 29일</p>

        <h2 style={sectionTitleStyle}>제1조 (목적)</h2>
        <p style={paragraphStyle}>
          이 약관은 &ldquo;미루지말자&rdquo;(이하 &ldquo;서비스&rdquo;)를 운영하는 개인 개발자(이하
          &ldquo;운영자&rdquo;)가 제공하는 서비스의 이용과 관련하여 운영자와 이용자의 권리, 의무 및
          책임사항을 규정함을 목적으로 합니다.
        </p>

        <h2 style={sectionTitleStyle}>제2조 (서비스의 내용)</h2>
        <p style={paragraphStyle}>
          서비스는 가족·친구 등으로 구성된 그룹(워크스페이스)의 구성원이 함께 미션(할 일)을
          등록하고 수행·인증·승인하며, 수행에 따라 지급되는 포인트와 이를 통해 교환하는 보상을
          관리할 수 있는 클라우드 기반 협업 서비스입니다.
        </p>

        <h2 style={sectionTitleStyle}>제3조 (회원가입 및 계정)</h2>
        <ul style={listStyle}>
          <li>
            이용자는 아이디와 비밀번호를 입력하여 회원가입을 신청할 수 있으며, 비밀번호 분실에
            대비하여 선택적으로 복구용 이메일을 등록할 수 있습니다.
          </li>
          <li>
            만 14세 미만 아동은 법정대리인(보호자)의 동의 없이 독립적으로 계정을 생성할 수 없으며,
            보호자가 발급한 초대 코드 또는 초대 링크를 통해서만 서비스에 참여할 수 있습니다.
          </li>
          <li>이용자는 본인의 계정 정보를 제3자에게 양도, 대여할 수 없습니다.</li>
        </ul>

        <h2 style={sectionTitleStyle}>제4조 (이용자의 의무)</h2>
        <ul style={listStyle}>
          <li>이용자는 관계 법령 및 이 약관의 규정을 준수하여야 합니다.</li>
          <li>
            이용자는 타인의 개인정보를 도용하거나 허위 정보를 등록하는 등 서비스 운영을 방해하는
            행위를 해서는 안 됩니다.
          </li>
          <li>
            이용자는 미션 인증을 위해 제출하는 자료(사진·영상·음성·텍스트 등)가 사실에 부합하도록
            성실히 이용하여야 합니다.
          </li>
        </ul>

        <h2 style={sectionTitleStyle}>제5조 (이용자 콘텐츠)</h2>
        <ul style={listStyle}>
          <li>
            이용자가 서비스에 등록·업로드한 미션 내용, 인증용 사진·영상·음성, 텍스트 등(이하
            &ldquo;이용자 콘텐츠&rdquo;)에 대한 책임은 이를 등록한 이용자에게 있습니다.
          </li>
          <li>
            이용자는 제3자의 저작권·초상권·개인정보 등 권리를 침해하거나 법령 또는 공서양속에
            반하는 콘텐츠를 등록해서는 안 됩니다.
          </li>
          <li>
            운영자는 서비스의 제공·표시·백업을 위해 필요한 범위에서 이용자 콘텐츠를 저장·복제·표시할
            수 있습니다.
          </li>
          <li>
            운영자는 불법·부적절하거나 타인의 권리를 침해하는 것으로 판단되는 콘텐츠를 사전 통지
            없이 삭제하거나 접근을 제한할 수 있습니다. 이러한 콘텐츠를 발견한 이용자는 제13조의
            문의처로 신고할 수 있습니다.
          </li>
        </ul>

        <h2 style={sectionTitleStyle}>제6조 (포인트 및 보상)</h2>
        <ul style={listStyle}>
          <li>
            미션 수행에 따라 지급되는 포인트와 이를 통해 교환하는 보상은 해당 워크스페이스
            내부에서만 의미를 가지는 비화폐성 요소입니다.
          </li>
          <li>
            포인트와 보상은 현금 및 재산적 가치를 갖지 않으며, 환급·양도·상속의 대상이 되지
            않습니다.
          </li>
          <li>
            포인트의 지급·차감, 보상의 등록·승인 등은 워크스페이스 관리자(방장·부방장)의 운영
            방침에 따르며, 오류 또는 부정 이용이 확인된 경우 운영자 또는 관리자는 포인트를 조정할
            수 있습니다.
          </li>
        </ul>

        <h2 style={sectionTitleStyle}>제7조 (유료 서비스)</h2>
        <ul style={listStyle}>
          <li>
            운영자는 향후 추가 기능을 제공하는 유료 플랜을 도입할 수 있으며, 유료 플랜의
            가격·결제·환불·청약철회에 관한 사항은 별도의 안내 및 관련 법령(「전자상거래 등에서의
            소비자보호에 관한 법률」 등)에 따릅니다.
          </li>
          <li>
            앱(App Store, Google Play)을 통해 결제가 이루어지는 경우, 해당 마켓의 결제 및 환불
            정책이 함께 적용됩니다.
          </li>
          <li>
            현재 유료 플랜은 제공되지 않으며, 서비스 내 요금제 안내 화면의 내용은 참고용입니다.
          </li>
        </ul>

        <h2 style={sectionTitleStyle}>제8조 (서비스의 변경 및 중단)</h2>
        <p style={paragraphStyle}>
          운영자는 서비스의 내용을 변경하거나 일부 또는 전부를 중단할 수 있으며, 이 경우 사전에
          서비스 내 공지사항을 통해 고지합니다. 다만 긴급한 사정이 있는 경우 사후에 고지할 수
          있습니다.
        </p>

        <h2 style={sectionTitleStyle}>제9조 (계정의 해지)</h2>
        <p style={paragraphStyle}>
          이용자는 언제든지 서비스 내 설정 메뉴를 통해 회원 탈퇴를 요청할 수 있으며, 탈퇴 시 관련
          개인정보는 개인정보처리방침에 따라 처리됩니다.
        </p>

        <h2 style={sectionTitleStyle}>제10조 (책임의 제한)</h2>
        <p style={paragraphStyle}>
          운영자는 천재지변, 서비스 제공업체(예: 서버 호스팅 업체)의 사정 등 불가항력적인 사유로
          서비스를 제공할 수 없는 경우, 이에 대한 책임이 면제됩니다. 운영자는 이용자가 서비스를
          이용하여 얻은 정보 또는 자료로 인해 발생한 손해에 대해 책임을 지지 않습니다.
        </p>

        <h2 style={sectionTitleStyle}>제11조 (준거법 및 관할)</h2>
        <p style={paragraphStyle}>
          이 약관은 대한민국 법률에 따라 해석되며, 서비스 이용과 관련하여 운영자와 이용자 간에
          분쟁이 발생한 경우 「민사소송법」에 따른 관할법원을 제1심 관할법원으로 합니다.
        </p>

        <h2 style={sectionTitleStyle}>제12조 (약관의 변경)</h2>
        <p style={paragraphStyle}>
          운영자는 필요한 경우 관계 법령을 위반하지 않는 범위에서 이 약관을 변경할 수 있으며,
          변경된 약관은 서비스 내 공지 또는 본 페이지를 통해 공지한 시점부터 효력이 발생합니다.
        </p>

        <h2 style={sectionTitleStyle}>제13조 (문의처)</h2>
        <p style={paragraphStyle}>
          서비스 이용과 관련한 문의 및 신고는 아래 이메일로 연락해 주시기 바랍니다.
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
