import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const FROM_EMAIL = process.env.SMTP_FROM || 'no-reply@sogae.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const APP_NAME = process.env.APP_NAME || 'Sogae';

/**
 * 이메일 전송 함수
 */
export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    const transporter = nodemailer.createTransporter(SMTP_CONFIG);

    await transporter.sendMail({
      from: `"${APP_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
}

/**
 * 이메일 인증 메일 발송
 */
export async function sendVerificationEmail(
  to: string,
  token: string,
  userName: string
): Promise<void> {
  const verificationUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>이메일 인증</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">${APP_NAME} 이메일 인증</h2>
          <p>안녕하세요, <strong>${userName}</strong>님!</p>
          <p>${APP_NAME}에 가입해 주셔서 감사합니다.</p>
          <p>아래 버튼을 클릭하여 이메일 인증을 완료해 주세요:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}"
               style="display: inline-block; padding: 12px 30px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              이메일 인증하기
            </a>
          </div>
          <p style="font-size: 0.9em; color: #666;">
            또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:<br>
            <a href="${verificationUrl}">${verificationUrl}</a>
          </p>
          <p style="font-size: 0.9em; color: #666;">
            이 링크는 24시간 동안 유효합니다.
          </p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 0.8em; color: #999;">
            본인이 요청하지 않은 메일이라면 무시하셔도 됩니다.
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail(to, `[${APP_NAME}] 이메일 인증을 완료해 주세요`, html);
}

/**
 * 상호 매칭 연락처 공개 메일 발송
 */
export async function sendContactRevealEmail(
  userEmail: string,
  userName: string,
  matchEmail: string,
  matchName: string,
  matchDate: string
): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>상호 매칭 연락처 공개</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">[${APP_NAME}] 상호 매칭된 상대의 연락처가 공개되었습니다</h2>
          <p>안녕하세요, <strong>${userName}</strong>님!</p>
          <p><strong>${matchDate}</strong>에 서로 선택한 상대와의 연락처가 공개되었습니다.</p>

          <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #4F46E5;">매칭된 상대 정보</h3>
            <p><strong>이름:</strong> ${matchName}</p>
            <p><strong>이메일:</strong> <a href="mailto:${matchEmail}">${matchEmail}</a></p>
          </div>

          <p>서로 예의를 지키며 대화를 시작해 보세요. 😊</p>
          <p>멋진 인연이 되기를 응원합니다!</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 0.8em; color: #999;">
            ${APP_NAME}을 이용해 주셔서 감사합니다.
          </p>
        </div>
      </body>
    </html>
  `;

  await sendEmail(
    userEmail,
    `[${APP_NAME}] 상호 매칭된 상대의 연락처가 공개되었습니다`,
    html
  );
}
