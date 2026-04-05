import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await context.params
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Ambil user berdasarkan id dan reset_token
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
    console.error('POST /api/admin/users/[id]/reset-password error:', error)
    return NextResponse.json({ error: 'Gagal reset password' }, { status: 500 })
  }
}
