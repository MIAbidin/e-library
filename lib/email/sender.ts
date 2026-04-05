import nodemailer from 'nodemailer'

interface EmailProps {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailProps) {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // TLS
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Email aktivasi gagal terkirim:', error)
    return { success: false, error }
  }
}
