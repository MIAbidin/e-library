import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email/sender'
import { activationEmailTemplate } from '@/lib/email/templates/activation'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { name, email, department, password } = await request.json()

    // Validasi input
    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Nama, email, dan password wajib diisi' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password minimal 8 karakter' },
        { status: 400 }
      )
    }

    // Validasi format email sederhana
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Format email tidak valid' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Cek email sudah terdaftar
    const { data: existing } = await supabase
      .from('users')
      .select('id, is_active')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      if (existing.is_active) {
        return NextResponse.json(
          { error: 'Email sudah terdaftar. Silakan login.' },
          { status: 409 }
        )
      } else {
        // Akun sudah ada tapi belum aktif — kirim ulang email aktivasi
        const activationToken = crypto.randomBytes(32).toString('hex')
        const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000)

        await supabase
          .from('users')
          .update({
            activation_token: activationToken,
            activation_token_expires: tokenExpires.toISOString(),
          })
          .eq('id', existing.id)

        const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activate?token=${activationToken}`
        await sendEmail({
          to: email,
          subject: 'Aktivasi Akun E-Library Perusahaan',
          html: activationEmailTemplate({ name, email, activationUrl }),
        })

        return NextResponse.json({
          success: true,
          message: 'Email aktivasi dikirim ulang',
        })
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Generate activation token
    const activationToken = crypto.randomBytes(32).toString('hex')
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 jam

    // Insert user baru — is_active: false sampai verifikasi email
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password_hash: passwordHash,
        role: 'karyawan', // Default selalu karyawan
        department: department?.trim() || null,
        is_active: false,
        activation_token: activationToken,
        activation_token_expires: tokenExpires.toISOString(),
      })
      .select('id, name, email')
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'Email sudah terdaftar.' },
          { status: 409 }
        )
      }
      throw insertError
    }

    // Kirim email aktivasi
    const activationUrl = `${process.env.NEXTAUTH_URL}/auth/activate?token=${activationToken}`

    const emailResult = await sendEmail({
      to: email,
      subject: 'Aktivasi Akun E-Library Perusahaan',
      html: activationEmailTemplate({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        activationUrl,
      }),
    })

    if (!emailResult.success) {
      console.warn('Email aktivasi gagal terkirim:', emailResult.error)
    }

    return NextResponse.json(
      {
        success: true,
        userId: newUser.id,
        emailSent: emailResult.success,
        // Tampilkan URL hanya di development
        activationUrl: process.env.NODE_ENV === 'development' ? activationUrl : undefined,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('POST /api/auth/register error:', error)
    return NextResponse.json(
      { error: 'Gagal mendaftar. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}