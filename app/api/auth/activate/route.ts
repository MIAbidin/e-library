import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { token, userId } = await request.json()

    if (!token || !userId) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Verifikasi token
    const { data: user } = await supabase
      .from('users')
      .select('id, activation_token, activation_token_expires, is_active')
      .eq('id', userId)
      .eq('activation_token', token)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 400 })
    }

    if (user.is_active) {
      return NextResponse.json({ success: true, alreadyActive: true })
    }

    if (new Date(user.activation_token_expires) < new Date()) {
      return NextResponse.json({ error: 'Token sudah kadaluarsa' }, { status: 400 })
    }

    // Aktifkan akun
    const { error } = await supabase
      .from('users')
      .update({
        is_active: true,
        activation_token: null,
        activation_token_expires: null,
        last_login_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/auth/activate error:', error)
    return NextResponse.json({ error: 'Gagal aktivasi akun' }, { status: 500 })
  }
}