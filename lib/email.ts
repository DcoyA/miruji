// 관리자(방장님)에게 알림 메일을 보내는 유틸리티입니다.
// 별도 이메일 서비스 없이, Gmail 계정 자체의 SMTP를 통해 스스로에게 메일을 보냅니다.
import nodemailer from "nodemailer";

type SendAdminEmailParams = {
  subject: string;
  text: string;
};

export async function sendAdminEmail({ subject, text }: SendAdminEmailParams) {
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

  if (!gmailUser || !gmailAppPassword) {
    console.error("GMAIL_USER 또는 GMAIL_APP_PASSWORD 환경변수가 설정되지 않았습니다.");
    return { ok: false };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: `미루지 알림 <${gmailUser}>`,
      to: gmailUser,
      subject,
      text,
    });
    return { ok: true };
  } catch (error) {
    console.error("이메일 발송 실패:", error);
    return { ok: false };
  }
}
