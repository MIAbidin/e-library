import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { SessionUser } from '@/types'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 jam (sesuai SKS)
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log("LOGIN MASUK:", credentials)

        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email dan password harus diisi')
        }

        const supabase = createAdminClient()

        // Cari user berdasarkan email
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', credentials.email.toLowerCase())
          .single()

        console.log("USER:", user)
        console.log("ERROR:", error)

        if (error || !user) {
          throw new Error('Email atau password salah')
        }

        // Cek apakah akun aktif
        if (!user.is_active) {
          throw new Error('ACCOUNT_INACTIVE')
        }

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password_hash
        )

        console.log("PASSWORD VALID:", isPasswordValid)

        if (!isPasswordValid) {
          throw new Error('Email atau password salah')
        }

        // Update last_login_at
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id)

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          avatar_url: user.avatar_url,
          is_active: user.is_active,
        } as SessionUser & { id: string; name: string; email: string }
      }

    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as SessionUser & { id: string }
        token.id = u.id
        token.role = u.role
        token.department = u.department
        token.avatar_url = u.avatar_url
        token.is_active = u.is_active
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.department = token.department as string | null
        session.user.avatar_url = token.avatar_url as string | null
        session.user.is_active = token.is_active as boolean
      }
      return session
    },
  },
}