'use client'

import dynamic from 'next/dynamic'

const PDFViewer = dynamic(
  () => import('@/components/PDFViewer').then(mod => mod.PDFViewer),
  { ssr: false }
)

interface Props {
  fileUrl: string
  bookId: string
  bookTitle?: string
  initialPage?: number
  totalPages?: number
  isAdmin?: boolean
}

export function PDFViewerWrapper(props: Props) {
  return <PDFViewer {...props} />
}