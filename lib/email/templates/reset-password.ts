interface ResetPasswordEmailProps {
  name: string
  resetUrl: string
  appName?: string
}

export function resetPasswordEmailTemplate({
  name,
  resetUrl,
  appName = 'E-Library Perusahaan',
}: ResetPasswordEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <span style="font-size:18px;font-weight:700;color:#111827;">📚 ${appName}</span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#ffffff;border-radius:16px;padding:40px;
              box-shadow:0 1px 3px rgba(0,0,0,0.1);">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
                Reset Password 🔑
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Halo <strong>${name}</strong>, Administrator telah meminta reset password untuk akun Anda.
                Klik tombol di bawah untuk membuat password baru.
              </p>

              <!-- CTA -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${resetUrl}"
                  style="display:inline-block;background-color:#2563eb;color:#ffffff;
                    font-size:15px;font-weight:600;padding:14px 32px;border-radius:10px;
                    text-decoration:none;">
                  Buat Password Baru
                </a>
              </div>

              <!-- Warning -->
              <div style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:10px;
                padding:14px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                  ⚠️ Link ini berlaku selama <strong>1 jam</strong>.
                  Jika Anda tidak meminta reset password, abaikan email ini.
                </p>
              </div>

              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                Fallback URL:<br>
                <span style="color:#2563eb;word-break:break-all;">${resetUrl}</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                &copy; ${new Date().getFullYear()} ${appName}. Confidential.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}