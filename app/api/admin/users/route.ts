import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sender'
import crypto from 'crypto'

// GET — daftar semua user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const role = searchParams.get('role') ?? ''
    const department = searchParams.get('department') ?? ''
    const isActive = searchParams.get('is_active') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()

    let query = supabase
      .from('users')
      .select(
        'id, name, email, role, department, avatar_url, is_active, last_login_at, created_at',
        { count: 'exact' }
      )

    if (search.trim()) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }
    if (role) query = query.eq('role', role)
    if (department) query = query.eq('department', department)
    if (isActive === 'true') query = query.eq('is_active', true)
    if (isActive === 'false') query = query.eq('is_active', false)

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      users: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/users error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data user' }, { status: 500 })
  }
}

// POST — tambah user baru + kirim email undangan
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { name, email, department, role } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Nama dan email wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Cek email sudah ada
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar di sistem' },
        { status: 409 }
      )
    }

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam

    // Insert user dengan status pending (is_active: false)
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: 'PENDING_ACTIVATION',
        role: role ?? 'karyawan',
        department: department?.trim() || null,
        is_active: false,
        activation_token: activationToken,
        activation_token_expires: tokenExpires.toISOString(),
      })
      .select('id, name, email, role, department, is_active, created_at')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
      }
      throw insertError
    }

    // Kirim email undangan — ganti template dengan HTML sederhana
    const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activate?token=${activationToken}`

    const emailResult = await sendEmail({
      to: email,
      subject: `Undangan Akun E-Library Perusahaan`,
      html: `<p>Halo ${name.trim()},</p>
             <p>Silakan aktifkan akun Anda dengan mengklik tautan berikut:</p>
             <p><a href="${activationUrl}">${activationUrl}</a></p>
             <p>Token ini berlaku 24 jam.</p>`
    })

    if (!emailResult.success) {
      console.warn('Email gagal dikirim, tapi user sudah dibuat:', emailResult.error)
    }

    return NextResponse.json(
      {
        ...newUser,
        emailSent: emailResult.success,
        activationUrl: process.env.NODE_ENV === 'development' ? activationUrl : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/admin/users error:', error)
    return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 })
  }
}
