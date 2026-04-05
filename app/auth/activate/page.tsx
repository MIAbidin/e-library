import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ActivateClient from './ActivateClient'

interface PageProps {
  searchParams: { token?: string }
}

export default async function ActivatePage({ searchParams }: PageProps) {
  const token = searchParams.token
  if (!token) redirect('/auth/login')

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, name, email, is_active')
    .eq('activation_token', token)
    .maybeSingle()

  // Token tidak ditemukan sama sekali
  if (!user) {
    return <ActivateClient status="invalid" />
  }

  // Token ditemukan tapi sudah kadaluarsa
  const { data: userWithExpiry } = await supabase
    .from('users')
    .select('activation_token_expires')
    .eq('id', user.id)
    .single()

  const isExpired = userWithExpiry?.activation_token_expires
    ? new Date(userWithExpiry.activation_token_expires) < new Date()
    : true

  if (isExpired && !user.is_active) {
    return <ActivateClient status="expired" email={user.email} />
  }

  // Sudah aktif sebelumnya
  if (user.is_active) {
    return <ActivateClient status="already_active" />
  }

  // Valid — proses aktivasi otomatis
  return (
    <ActivateClient
      status="valid"
      token={token}
      userId={user.id}
      name={user.name}
      email={user.email}
    />
  )
}