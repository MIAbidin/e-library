import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sender'
import { resetPasswordEmailTemplate } from '@/lib/email/templates/reset-password'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// POST — reset password (admin trigger / user confirm)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id
    const body = await request.json()

    // ── MODE 1: Admin trigger reset password ──
    if (body.adminTrigger === true) {
      const session = await getServerSession(authOptions)
      if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      const supabase = createAdminClient()

      const { data: user } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', userId)
        .single()

      if (!user) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 404 }
        )
      }

      const resetToken = crypto.randomBytes(32).toString('hex')
      const tokenExpires = new Date(Date.now() + 60 * 60 * 1000)

      await supabase
        .from('users')
        .update({
          reset_token: resetToken,
          reset_token_expires: tokenExpires.toISOString(),
        })
        .eq('id', userId)

      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${resetToken}&userId=${userId}`

      const emailResult = await sendEmail({
        to: user.email,
        subject: 'Reset Password E-Library Perusahaan',
        html: resetPasswordEmailTemplate({
          name: user.name,
          resetUrl,
        }),
      })

      return NextResponse.json({
        success: true,
        emailSent: emailResult.success,
        resetUrl:
          process.env.NODE_ENV === 'development' ? resetUrl : undefined,
      })
    }

    // ── MODE 2: User konfirmasi reset password ──
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Data tidak lengkap' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token, reset_token_expires')
      .eq('id', userId)
      .eq('reset_token', token)
      .single()

    if (!user) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 400 }
      )
    }

    if (new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json(
        { error: 'Token sudah kadaluarsa' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
      })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(
      'POST /api/admin/users/[id]/reset-password error:',
      error
    )
    return NextResponse.json(
      { error: 'Gagal reset password' },
      { status: 500 }
    )
  }
}