// Utility untuk ekstrak metadata PDF
// Dipanggil di server saat admin upload buku

export async function getPDFPageCount(fileBuffer: ArrayBuffer): Promise<number> {
  try {
    // Baca PDF header untuk cari jumlah halaman
    const uint8 = new Uint8Array(fileBuffer)
    const text = new TextDecoder('latin1').decode(uint8)

    // Cari /Count di dalam PDF (jumlah halaman)
    const matches = [...text.matchAll(/\/Count\s+(\d+)/g)]
    if (matches.length > 0) {
      const counts = matches.map((m) => parseInt(m[1]))
      return Math.max(...counts)
    }
    return 0
  } catch {
    return 0
  }
}