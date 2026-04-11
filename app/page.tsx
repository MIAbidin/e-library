import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'

// Root → selalu ke /home (home bisa diakses siapa saja, login atau tidak)
export default async function RootPage() {
  const session = await getServerSession(authOptions)

  // Admin shortcut: langsung ke /admin
  if (session?.user?.role === 'admin') {
    redirect('/admin')
  }

  redirect('/home')
}