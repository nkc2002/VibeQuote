/**
 * Email Service using Nodemailer
 *
 * Uses smtp.ethereal.email for testing
 */

import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

/**
 * Get or create email transporter
 */
const getTransporter = async (): Promise<nodemailer.Transporter> => {
  if (transporter) {
    return transporter;
  }

  // Use environment variables if set
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Create test account with Ethereal
  const testAccount = await nodemailer.createTestAccount();

  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("[Email] Using Ethereal test account:", testAccount.user);
  return transporter;
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  userName: string
): Promise<{ success: boolean; previewUrl?: string }> => {
  try {
    const transport = await getTransporter();
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/#/reset-password?token=${resetToken}`;

    const info = await transport.sendMail({
      from: '"VibeQuote" <noreply@vibequote.app>',
      to: email,
      subject: "Đặt lại mật khẩu - VibeQuote",
      text: `
Xin chào ${userName},

Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản VibeQuote.

Nhấp vào liên kết sau để đặt lại mật khẩu:
${resetUrl}

Liên kết này sẽ hết hạn sau 1 giờ.

Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.

Trân trọng,
Đội ngũ VibeQuote
      `,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 28px; }
    .content { background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; }
    .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .footer { text-align: center; color: #64748b; font-size: 14px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VibeQuote</h1>
    </div>
    <div class="content">
      <h2>Xin chào ${userName},</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản VibeQuote.</p>
      <p>Nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
      <p style="text-align: center;">
        <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
      </p>
      <p><strong>Liên kết này sẽ hết hạn sau 1 giờ.</strong></p>
      <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} VibeQuote. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
      `,
    });

    // Get preview URL for Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log("[Email] Preview URL:", previewUrl);
    }

    return { success: true, previewUrl: previewUrl || undefined };
  } catch (error) {
    console.error("[Email] Error sending email:", error);
    return { success: false };
  }
};
