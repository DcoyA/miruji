export const metadata = {
  title: "이용약관 | 미루지말자",
};

export default function TermsPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 20px 80px",
        lineHeight: 1.7,
        color: "#1e293b",
      }}
    >
      <h1 style={{ fontSize: 26, fontWeight: 900, marginBottom: 8 }}>이용약관</h1>
      <p style={{ color: "#64748b", marginBottom: 32, fontSize: 14 }}>
        시행일: 2026년 8월 7일
      </p>

      <h2 style={sectionTitleStyle}>제1조 (목적)</h2>
      <p>
        이 약관은 &lsquo;미루지말자&rsquo;(이하 &lsquo;서비스&rsquo;)가 제공하는 미션형
        클라우드 다이어리 서비스의 이용과 관련하여 서비스와 이용자 간의 권리,
        의무 및 책임사항을 규정하는 것을 목적으로 합니다.
      </p>

      <h2 style={sectionTitleStyle}>제2조 (정의)</h2>
      <ul style={listStyle}>
        <li>&lsquo;이용자&rsquo;란 서비스에 회원가입 절차를 거쳐 계정을 생성한 자를 말합니다.</li>
        <li>
          &lsquo;워크스페이스&rsquo;란 가족, 학급, 팀 등 함께 미션과 보상을 관리하는
          단위를 말합니다.
        </li>
        <li>
          &lsquo;참여자&rsquo;란 워크스페이스 내에서 미션을 부여받는 대상을 말하며,
          별도 계정 없이 관리자가 등록한 &lsquo;가상 참여자&rsquo;를 포함합니다.
        </li>
        <li>
          &lsquo;관리자&rsquo;란 워크스페이스를 생성하거나 소유자(owner)·매니저(manager)
          권한을 가진 이용자를 말합니다.
        </li>
      </ul>

      <h2 style={sectionTitleStyle}>제3조 (약관의 효력 및 변경)</h2>
      <p>
        이 약관은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써
        효력이 발생합니다. 서비스는 필요한 경우 관계 법령을 위반하지 않는
        범위에서 약관을 변경할 수 있으며, 변경된 약관은 공지 후 적용됩니다.
      </p>

      <h2 style={sectionTitleStyle}>제4조 (회원가입 및 계정 관리)</h2>
      <p>
        이용자는 이메일과 비밀번호를 입력하여 회원가입을 신청할 수 있으며,
        서비스는 이를 승인함으로써 이용계약이 성립합니다. 이용자는 본인의
        계정 정보를 제3자가 이용하지 않도록 관리할 책임이 있으며, 계정 정보
        유출로 인한 불이익은 이용자 본인이 책임을 부담할 수 있습니다.
      </p>

      <h2 style={sectionTitleStyle}>제5조 (만 14세 미만 아동의 이용)</h2>
      <p>
        만 14세 미만 아동은 법정대리인(부모 등)의 관리 하에 워크스페이스의
        &lsquo;참여자&rsquo;로 등록되어 서비스를 이용하는 것을 원칙으로 합니다.
        법정대리인은 아동을 대신하여 참여자 정보를 등록·관리·삭제할 권한과
        책임을 가지며, 아동이 별도의 계정으로 직접 가입하는 경우 법정대리인의
        동의를 전제로 합니다.
      </p>

      <h2 style={sectionTitleStyle}>제6조 (서비스의 내용)</h2>
      <p>서비스는 다음과 같은 기능을 제공합니다.</p>
      <ul style={listStyle}>
        <li>워크스페이스 생성 및 참여자 관리</li>
        <li>미션(할 일) 등록, 제출, 인증, 승인·반려</li>
        <li>반복 미션 및 마감 관리</li>
        <li>리워드(스티커/포인트) 적립 및 교환</li>
      </ul>

      <h2 style={sectionTitleStyle}>제7조 (이용자의 의무)</h2>
      <p>
        이용자는 다음 행위를 하여서는 안 됩니다.
      </p>
      <ul style={listStyle}>
        <li>타인의 개인정보를 도용하거나 허위 정보를 등록하는 행위</li>
        <li>서비스의 정상적인 운영을 방해하는 행위</li>
        <li>법령 또는 공공질서, 미풍양속에 반하는 내용을 게시하는 행위</li>
      </ul>

      <h2 style={sectionTitleStyle}>제8조 (리워드의 성격)</h2>
      <p>
        서비스 내 스티커/포인트 등 리워드는 워크스페이스 내부에서만 사용되는
        가상의 보상 수단으로, 현금으로 환전하거나 외부에서 거래될 수 없습니다.
        리워드의 지급 및 사용 기준은 각 워크스페이지 관리자가 자율적으로
        정합니다.
      </p>

      <h2 style={sectionTitleStyle}>제9조 (서비스 이용의 제한 및 중지)</h2>
      <p>
        서비스는 이용자가 이 약관을 위반하거나 서비스의 정상적인 운영을
        방해하는 경우, 사전 통지 후 서비스 이용을 제한하거나 계정을 정지할
        수 있습니다.
      </p>

      <h2 style={sectionTitleStyle}>제10조 (면책조항)</h2>
      <p>
        서비스는 이용자가 등록한 미션 내용, 인증 자료, 리워드 지급 기준 등
        이용자 간 합의에 따른 사항에 대해 개입하지 않으며, 이로 인해 발생한
        분쟁에 대한 책임을 지지 않습니다.
      </p>

      <h2 style={sectionTitleStyle}>제11조 (문의처)</h2>
      <p>
        서비스 이용 및 약관에 관한 문의는 아래 이메일로 접수됩니다.
      </p>
      <p style={{ fontWeight: 800 }}>이메일: iamborghini5757@gmail.com</p>
    </main>
  );
}

const sectionTitleStyle = {
  fontSize: 18,
  fontWeight: 800,
  marginTop: 32,
  marginBottom: 10,
};

const listStyle = {
  paddingLeft: 20,
  marginBottom: 16,
};
