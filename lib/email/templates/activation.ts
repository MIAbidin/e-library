interface ActivationEmailProps {
  name: string
  email: string
  activationUrl: string
  appName?: string
}

export function activationEmailTemplate({
  name,
  email,
  activationUrl,
  appName = 'E-Library Perusahaan',
}: ActivationEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aktivasi Akun ${appName}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0"
    style="background-color:#f3f4f6;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <div style="font-size:18px;font-weight:700;color:#111827;">
                📚 ${appName}
              </div>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#fff;border-radius:16px;padding:40px;
              box-shadow:0 1px 3px rgba(0,0,0,0.1);">

              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">
                Verifikasi Email Anda 📧
              </h1>
              <p style="margin:0 0 8px;font-size:15px;color:#6b7280;line-height:1.6;">
                Halo <strong>${name}</strong>! Terima kasih sudah mendaftar.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Klik tombol di bawah untuk mengaktifkan akun Anda dan mulai
                mengakses koleksi e-book perusahaan.
              </p>

              <!-- Email info -->
              <div style="background:#eff6ff;border:1px solid #bfdbfe;
                border-radius:10px;padding:14px;margin-bottom:28px;">
                <p style="margin:0;font-size:13px;color:#1e40af;">
                  <strong>Email terdaftar:</strong> ${email}
                </p>
              </div>

              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:28px;">
                <a href="${activationUrl}"
                  style="display:inline-block;background:#2563eb;color:#fff;
                    font-size:15px;font-weight:600;padding:14px 36px;
                    border-radius:10px;text-decoration:none;">
                  ✅ Aktifkan Akun Saya
                </a>
              </div>

              <!-- Warning -->
              <div style="background:#fffbeb;border:1px solid #fde68a;
                border-radius:10px;padding:14px;margin-bottom:24px;">
                <p style="margin:0;font-size:13px;color:#92400e;">
                  ⏰ Link ini berlaku selama <strong>24 jam</strong>.
                  Jika sudah kadaluarsa, daftar ulang di halaman registrasi.
                </p>
              </div>

              <!-- Fallback -->
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.6;">
                Jika tombol tidak bekerja, copy URL ini ke browser:<br>
                <a href="${activationUrl}"
                  style="color:#2563eb;word-break:break-all;font-size:12px;">
                  ${activationUrl}
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:24px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Jika Anda tidak merasa mendaftar, abaikan email ini.<br>
                &copy; ${new Date().getFullYear()} ${appName}
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