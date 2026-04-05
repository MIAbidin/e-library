import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'

// ===============================
// PUT — edit metadata buku
// ===============================
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const formData = await request.formData()

    const title = formData.get('title') as string
    const author = formData.get('author') as string
    const description = formData.get('description') as string
    const year = formData.get('year') as string
    const categoryId = formData.get('categoryId') as string
    const coverFile = formData.get('cover') as File | null

    // Validasi
    if (!title?.trim() || !author?.trim()) {
      return NextResponse.json(
        { error: 'Judul dan penulis wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // ===============================
    // Cek buku ada
    // ===============================
    const { data: existing, error: findError } = await supabase
      .from('books')
      .select('id, cover_url')
      .eq('id', id)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Buku tidak ditemukan' },
        { status: 404 }
      )
    }

    // ===============================
    // Upload cover baru (optional)
    // ===============================
    let coverUrl = existing.cover_url

    if (coverFile && coverFile.size > 0) {
      const coverBuffer = await coverFile.arrayBuffer()
      const coverExt = coverFile.name.split('.').pop()
      const coverFileName = `${Date.now()}-cover.${coverExt}`

      const { data: coverUpload, error: coverError } =
        await supabase.storage
          .from('covers')
          .upload(coverFileName, coverBuffer, {
            contentType: coverFile.type,
            upsert: false,
          })

      if (!coverError && coverUpload) {
        const { data: publicUrl } = supabase.storage
          .from('covers')
          .getPublicUrl(coverFileName)

        coverUrl = publicUrl.publicUrl
      }
    }

    // ===============================
    // Update database
    // ===============================
    const { data: updated, error: updateError } = await supabase
      .from('books')
      .update({
        title: title.trim(),
        author: author.trim(),
        description: description?.trim() || null,
        year: year ? parseInt(year) : null,
        category_id: categoryId || null,
        cover_url: coverUrl,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) throw updateError

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PUT /api/admin/books/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal mengupdate buku' },
      { status: 500 }
    )
  }
}

// ===============================
// DELETE — hapus buku + file storage
// ===============================
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createAdminClient()

    // ===============================
    // Ambil data file dulu
    // ===============================
    const { data: book } = await supabase
      .from('books')
      .select('file_url, cover_url')
      .eq('id', id)
      .single()

    // ===============================
    // Hapus dari database
    // ===============================
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)

    if (error) throw error

    // ===============================
    // Hapus file PDF dari storage
    // ===============================
    if (book?.file_url) {
      await supabase.storage.from('books').remove([book.file_url])
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/admin/books/[id] error:', error)
    return NextResponse.json(
      { error: 'Gagal menghapus buku' },
      { status: 500 }
    )
  }
}
