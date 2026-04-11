import { createAdminClient } from '@/lib/supabase/server'

export interface AccessCheckResult {
  canRead: boolean
  reason: 'public' | 'admin' | 'user_match' | 'dept_match' | 'no_access' | 'login_required'
}

/**
 * Cek apakah seseorang boleh membaca buku tertentu.
 *
 * Aturan:
 *  1. Buku access_type = 'public'    → semua boleh (termasuk tamu)
 *  2. Buku access_type = 'restricted' & tidak login → wajib login dulu
 *  3. Buku access_type = 'restricted' & admin       → selalu boleh
 *  4. Buku access_type = 'restricted' & karyawan    → cek book_access:
 *       - Ada baris dengan user_id = userId          → boleh
 *       - Ada baris dengan department = userDept     → boleh
 *       - Tidak ada sama sekali                      → tolak
 */
export async function checkBookAccess(
  bookId: string,
  userId: string | null,        // null = tamu
  userRole: string | null,      // null = tamu
  userDepartment: string | null // null = tamu / tidak punya dept
): Promise<AccessCheckResult> {
  const supabase = createAdminClient()

  // Ambil access_type buku
  const { data: book } = await supabase
    .from('books')
    .select('access_type')
    .eq('id', bookId)
    .single()

  if (!book) return { canRead: false, reason: 'no_access' }

  // Buku publik → semua boleh
  if (book.access_type === 'public') {
    return { canRead: true, reason: 'public' }
  }

  // Restricted — wajib login
  if (!userId) {
    return { canRead: false, reason: 'login_required' }
  }

  // Admin selalu boleh
  if (userRole === 'admin') {
    return { canRead: true, reason: 'admin' }
  }

  // Cek book_access untuk karyawan
  const orFilters: string[] = [`user_id.eq.${userId}`]
  if (userDepartment) {
    orFilters.push(`department.eq.${userDepartment}`)
  }

  const { data: accessRows } = await supabase
    .from('book_access')
    .select('id, department, user_id')
    .eq('book_id', bookId)
    .or(orFilters.join(','))
    .limit(1)

  if (!accessRows || accessRows.length === 0) {
    return { canRead: false, reason: 'no_access' }
  }

  const row = accessRows[0]
  if (row.user_id === userId) return { canRead: true, reason: 'user_match' }
  return { canRead: true, reason: 'dept_match' }
}