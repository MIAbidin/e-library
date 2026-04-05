import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    'node_modules/pdfjs-dist/build/pdf.worker.min.mjs'
  )
  const file = await readFile(filePath)
  return new NextResponse(file, {
    headers: {
      'Content-Type': 'application/javascript',
    },
  })
}