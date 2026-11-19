import { KATEGORI } from "./kategori"

export const BATAS_SOAL_IMPOR = 100
export const BATAS_KARAKTER_IMPOR = 500_000
export const MAKS_SALAH = 4 // total pilihan maksimal 5 (1 benar + 4 salah)

export const CONTOH_KUIS = {
  judul: "Kuis Matematika Dasar",
  deskripsi: "Latihan penjumlahan dan perkalian",
  kategori: "Matematika",
  waktu: 120,
  tipe: "publik",
  pertanyaan: [
    { soal: "Berapa 1 + 1?", benar: "2", salah: ["1", "3", "4"] },
    { soal: "Berapa 3 x 4?", benar: "12", salah: ["7", "14"] },
  ],
}

export const contohJson = () => JSON.stringify(CONTOH_KUIS, null, 2)

export const promptAI = () =>
  `Buatkan kuis dalam format JSON persis seperti contoh di bawah. Balas HANYA dengan JSON, tanpa penjelasan dan tanpa teks lain.

Topik: [ISI TOPIK]
Jumlah soal: [ISI JUMLAH]

Aturan:
- Setiap soal punya tepat 1 jawaban "benar" dan 1 sampai ${MAKS_SALAH} jawaban "salah" (array).
- "kategori" harus salah satu dari: ${KATEGORI.join(", ")}.
- "tipe" adalah "publik" atau "private". "waktu" dalam detik.
- Semua pilihan jawaban dalam satu soal harus berbeda.

Contoh format:
${contohJson()}`

// Nama kunci dinormalisasi (huruf kecil, tanpa angka/spasi/simbol) agar format longgar tetap terbaca,
// misalnya "Pertanyaan 1", "jawaban_benar", atau "True".
const norm = (k) => String(k).toLowerCase().replace(/[^a-z]/g, "")

const KUNCI = {
  soal: ["soal", "pertanyaan", "question", "teks"],
  benar: ["benar", "jawaban", "jawabanbenar", "correct", "true"],
  salah: ["salah", "pengecoh", "pilihansalah", "opsisalah", "wrong", "false"],
  daftar: ["pertanyaan", "soal", "questions", "daftarsoal"],
  judul: ["judul", "title"],
  deskripsi: ["deskripsi", "description"],
  waktu: ["waktu", "durasi", "time"],
  kategori: ["kategori", "category"],
  tipe: ["tipe", "type", "akses"],
}

const ambil = (obj, daftar) => {
  for (const [k, v] of Object.entries(obj)) {
    if (daftar.includes(norm(k))) return v
  }
  return undefined
}

const keTeks = (v) => {
  if (typeof v === "string") return v.trim()
  if (typeof v === "number" || typeof v === "boolean") return String(v)
  return ""
}

const gagal = (pesan) => ({ ok: false, info: {}, soal: [], peringatan: [], galat: [pesan] })

/**
 * Membaca teks JSON menjadi data kuis.
 * Mengembalikan { ok, info, soal: [{soal, benar, salah[]}], peringatan[], galat[] }.
 * Soal yang cacat dilewati (dicatat di `galat`), soal yang valid tetap diimpor.
 */
export const parseImporKuis = (mentah) => {
  let teks = String(mentah ?? "").replace(/^\uFEFF/, "").trim()
  if (!teks) return gagal("JSON kosong.")
  if (teks.length > BATAS_KARAKTER_IMPOR) return gagal("Data terlalu besar (maksimal sekitar 500 KB).")

  // Terima JSON yang dibungkus ```json ... ``` (umum saat disalin dari AI)
  teks = teks.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

  let data
  try {
    data = JSON.parse(teks)
  } catch (err) {
    return gagal(`JSON tidak valid: ${err.message}`)
  }

  const galat = []
  const peringatan = []

  let daftar
  let infoMentah = {}
  if (Array.isArray(data)) {
    daftar = data
  } else if (data && typeof data === "object") {
    infoMentah = data
    daftar = ambil(data, KUNCI.daftar)
  }
  if (!Array.isArray(daftar)) {
    return gagal('Daftar soal tidak ditemukan. Gunakan field "pertanyaan" yang berisi array.')
  }
  if (daftar.length === 0) return gagal("Daftar soal kosong.")

  if (daftar.length > BATAS_SOAL_IMPOR) {
    peringatan.push(`Hanya ${BATAS_SOAL_IMPOR} soal pertama yang diimpor (dari ${daftar.length}).`)
    daftar = daftar.slice(0, BATAS_SOAL_IMPOR)
  }

  const soal = []
  daftar.forEach((item, i) => {
    const no = i + 1
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      galat.push(`Soal ke-${no}: harus berupa objek.`)
      return
    }

    const teksSoal = keTeks(ambil(item, KUNCI.soal))
    if (!teksSoal) return galat.push(`Soal ke-${no}: teks soal kosong.`)

    const benar = keTeks(ambil(item, KUNCI.benar))
    if (!benar) return galat.push(`Soal ke-${no}: jawaban benar ("benar") kosong.`)

    const mentahSalah = ambil(item, KUNCI.salah)
    const kandidat = Array.isArray(mentahSalah) ? mentahSalah : mentahSalah === undefined ? [] : [mentahSalah]

    const lihat = new Set([benar.toLowerCase()])
    const salah = []
    let duplikat = 0
    for (const k of kandidat) {
      const t = keTeks(k)
      if (!t) continue
      if (lihat.has(t.toLowerCase())) {
        duplikat++
        continue
      }
      lihat.add(t.toLowerCase())
      salah.push(t)
    }

    if (duplikat) peringatan.push(`Soal ke-${no}: ${duplikat} jawaban salah yang sama dengan pilihan lain dibuang.`)
    if (salah.length > MAKS_SALAH) {
      peringatan.push(`Soal ke-${no}: hanya ${MAKS_SALAH} jawaban salah pertama yang dipakai.`)
      salah.length = MAKS_SALAH
    }
    if (salah.length < 1) return galat.push(`Soal ke-${no}: butuh minimal 1 jawaban salah ("salah").`)

    soal.push({ soal: teksSoal.slice(0, 500), benar: benar.slice(0, 200), salah: salah.map((s) => s.slice(0, 200)) })
  })

  // Informasi kuis (opsional)
  const info = {}
  const judul = keTeks(ambil(infoMentah, KUNCI.judul))
  if (judul) info.judul = judul.slice(0, 100)
  const deskripsi = keTeks(ambil(infoMentah, KUNCI.deskripsi))
  if (deskripsi) info.deskripsi = deskripsi.slice(0, 500)

  const waktuMentah = ambil(infoMentah, KUNCI.waktu)
  if (waktuMentah !== undefined) {
    const w = Number(waktuMentah)
    if (Number.isFinite(w) && w > 0) info.waktu = Math.min(86400, Math.round(w))
    else peringatan.push('Field "waktu" harus berupa angka detik lebih dari 0, jadi diabaikan.')
  }

  let tipe = keTeks(ambil(infoMentah, KUNCI.tipe)).toLowerCase()
  let kategori = keTeks(ambil(infoMentah, KUNCI.kategori))

  // Format lama menaruh "publik"/"private" di field kategori
  if (!tipe && ["publik", "private"].includes(kategori.toLowerCase())) {
    tipe = kategori.toLowerCase()
    kategori = ""
  }
  if (tipe) {
    if (["publik", "private"].includes(tipe)) info.tipe = tipe
    else peringatan.push('Field "tipe" harus "publik" atau "private", jadi diabaikan.')
  }
  if (kategori) {
    const cocok = KATEGORI.find((k) => k.toLowerCase() === kategori.toLowerCase())
    if (cocok) info.kategori = cocok
    else peringatan.push(`Kategori "${kategori}" tidak dikenali. Pilih manual (${KATEGORI.join(", ")}).`)
  }

  if (soal.length === 0) {
    return { ok: false, info, soal, peringatan, galat: galat.length ? galat : ["Tidak ada soal yang valid."] }
  }
  return { ok: true, info, soal, peringatan, galat }
}
