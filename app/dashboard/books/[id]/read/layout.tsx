import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { redirect } from 'next/navigation'

export default async function ReadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  // Kembalikan children langsung, tanpa <html> dan <body>
  return <>{children}</>
}