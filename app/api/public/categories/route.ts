import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('categories')
      .select('id, name')
      .order('name')

    if (error) throw error

    return NextResponse.json(data ?? [])
  } catch (error) {
    console.error('GET /api/public/categories error:', error)
    return NextResponse.json({ error: 'Gagal mengambil kategori' }, { status: 500 })
  }
}