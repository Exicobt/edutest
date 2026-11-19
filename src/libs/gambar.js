const TIPE_DIDUKUNG = ["image/jpeg", "image/png", "image/webp", "image/gif"]
const BATAS_ASLI_MB = 8
const BATAS_HASIL_CHAR = 200_000 // sekitar 150 KB, aman di bawah batas 1 MB dokumen Firestore

const muatGambar = (src) =>
  new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error("File gambar tidak bisa dibaca."))
    el.src = src
  })

/**
 * Mengecilkan gambar soal (rasio asli dipertahankan) menjadi data URL JPEG.
 * Kualitas dan ukuran diturunkan bertahap sampai hasilnya cukup kecil.
 */
export const kompresGambarSoal = async (file) => {
  if (!file) throw new Error("Pilih file gambar terlebih dahulu.")
  if (!TIPE_DIDUKUNG.includes(file.type)) throw new Error("Format harus JPG, PNG, WEBP, atau GIF.")
  if (file.size > BATAS_ASLI_MB * 1024 * 1024) throw new Error(`Ukuran file maksimal ${BATAS_ASLI_MB} MB.`)

  const url = URL.createObjectURL(file)
  try {
    const img = await muatGambar(url)
    let sisiMaks = 900
    let kualitas = 0.78
    let hasil = ""

    for (let percobaan = 0; percobaan < 8; percobaan++) {
      const skala = Math.min(1, sisiMaks / Math.max(img.naturalWidth, img.naturalHeight))
      const canvas = document.createElement("canvas")
      canvas.width = Math.max(1, Math.round(img.naturalWidth * skala))
      canvas.height = Math.max(1, Math.round(img.naturalHeight * skala))
      const ctx = canvas.getContext("2d")
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.imageSmoothingQuality = "high"
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      hasil = canvas.toDataURL("image/jpeg", kualitas)

      if (hasil.length <= BATAS_HASIL_CHAR) return hasil
      if (kualitas > 0.5) kualitas -= 0.1
      else sisiMaks = Math.round(sisiMaks * 0.8)
    }
    throw new Error("Gambar terlalu besar untuk disimpan. Coba gambar lain.")
  } finally {
    URL.revokeObjectURL(url)
  }
}

/** Membuat thumbnail persegi kecil dari data URL (untuk daftar pemain). */
export const kecilkanFoto = async (src, sisi = 64) => {
  if (!src || !src.startsWith("data:")) return src || null
  try {
    const img = await muatGambar(src)
    const canvas = document.createElement("canvas")
    canvas.width = sisi
    canvas.height = sisi
    const s = Math.min(img.naturalWidth, img.naturalHeight)
    canvas
      .getContext("2d")
      .drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, sisi, sisi)
    return canvas.toDataURL("image/jpeg", 0.8)
  } catch {
    return null
  }
}
