import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sender'
import { activationEmailTemplate } from '@/lib/email/templates/activation'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) {
      return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email, is_active')
      .eq('email', email.toLowerCase().trim())
      .single()

    // Selalu return success meski user tidak ada (security: jangan bocorkan info)
    if (!user || user.is_active) {
      return NextResponse.json({ success: true })
    }

    // Generate token baru
    const activationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await supabase
      .from('users')
      .update({
        activation_token: activationToken,
        activation_token_expires: tokenExpires.toISOString(),
      })
      .eq('id', user.id)

    const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activate?token=${activationToken}`

    await sendEmail({
      to: user.email,
      subject: 'Aktivasi Akun E-Library Perusahaan',
      html: activationEmailTemplate({
        name: user.name,
        email: user.email,
        activationUrl,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/auth/resend-activation error:', error)
    return NextResponse.json({ error: 'Gagal mengirim ulang' }, { status: 500 })
  }
}