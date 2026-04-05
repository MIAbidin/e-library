import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, userId, password } = await request.json() // ambil dari body

    if (!token || !userId || !password) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_token, reset_token_expires')
      .eq('id', userId)
      .eq('reset_token', token)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 })
    }
    if (new Date(user.reset_token_expires) < new Date()) {
      return NextResponse.json({ error: 'Token sudah kadaluarsa' }, { status: 400 })
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
    console.error('POST /api/auth/reset-password error:', error)
    return NextResponse.json({ error: 'Gagal reset password' }, { status: 500 })
  }
}
