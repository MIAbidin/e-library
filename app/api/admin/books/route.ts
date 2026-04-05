import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { createAdminClient } from '@/lib/supabase/server'
import { getPDFPageCount } from '@/lib/pdf-utils'
import { createAndSendNotification } from '@/lib/notifications'

// GET — daftar buku untuk admin (semua, tanpa pagination limit)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') ?? ''
    const categoryId = searchParams.get('category') ?? ''
    const page = parseInt(searchParams.get('page') ?? '1')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const offset = (page - 1) * limit

    const supabase = createAdminClient()
    let query = supabase
      .from('books')
      .select('*, category:categories(id, name)', { count: 'exact' })

    if (search.trim()) {
      query = query.or(`title.ilike.%${search}%,author.ilike.%${search}%`)
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({
      books: data ?? [],
      total: count ?? 0,
      page,
      limit,
      totalPages: Math.ceil((count ?? 0) / limit),
    })
  } catch (error) {
    console.error('GET /api/admin/books error:', error)
    return NextResponse.json({ error: 'Gagal mengambil data buku' }, { status: 500 })
  }
}

// POST — upload buku baru
export async function POST(request: NextRequest) {
  try {
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
    const pdfFile = formData.get('pdf') as File | null
    const coverFile = formData.get('cover') as File | null

    // Validasi wajib
    if (!title?.trim() || !author?.trim() || !pdfFile) {
      return NextResponse.json(
        { error: 'Judul, penulis, dan file PDF wajib diisi' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Upload PDF ke Supabase Storage
    const pdfBuffer = await pdfFile.arrayBuffer()
    const pdfFileName = `${Date.now()}-${pdfFile.name.replace(/\s+/g, '-')}`

    const { data: pdfUpload, error: pdfError } = await supabase.storage
      .from('books')
      .upload(pdfFileName, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      })

    if (pdfError) throw new Error(`Gagal upload PDF: ${pdfError.message}`)

    // Hitung jumlah halaman
    const totalPages = await getPDFPageCount(pdfBuffer)

    // Upload cover jika ada
    let coverUrl: string | null = null
    if (coverFile && coverFile.size > 0) {
      const coverBuffer = await coverFile.arrayBuffer()
      const coverExt = coverFile.name.split('.').pop()
      const coverFileName = `${Date.now()}-cover.${coverExt}`

      const { data: coverUpload, error: coverError } = await supabase.storage
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

    // Insert ke database
    const { data: book, error: dbError } = await supabase
      .from('books')
      .insert({
        title: title.trim(),
        author: author.trim(),
        description: description?.trim() || null,
        year: year ? parseInt(year) : null,
        category_id: categoryId || null,
        file_url: pdfUpload.path,
        cover_url: coverUrl,
        total_pages: totalPages,
        created_by: session.user.id,
      })
      .select()
      .single()

    if (dbError) throw dbError

    // Kirim notifikasi new_book ke semua user (fire-and-forget)
    createAndSendNotification({
      type: 'new_book',
      title: `Buku Baru: ${book.title}`,
      body: `${book.author} telah menambahkan buku baru ke koleksi E-Library.`,
      bookId: book.id,
      createdBy: session.user.id,
    }).catch((err) => {
      // Jangan gagalkan upload jika notifikasi error
      console.error('Gagal kirim notifikasi buku baru:', err)
    })

    return NextResponse.json(book, { status: 201 })
  } catch (error) {
    console.error('POST /api/admin/books error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal upload buku' },
      { status: 500 }
    )
  }
}