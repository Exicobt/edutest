import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  increment,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore"
import { app } from "./firebase"
import { kecilkanFoto } from "./gambar"

const db = getFirestore(app)

export const DETIK_DEFAULT = 20
export const PANJANG_KODE_RUANG = 6

const ruangRef = (kode) => doc(db, "ruang", kode)
const pemainRef = (kode, uid) => doc(db, "ruang", kode, "pemain", uid)

const acakKode = () => {
  const karakter = "abcdefghjkmnpqrstuvwxyz23456789" // tanpa karakter yang mirip (i, l, o, 0, 1)
  let kode = ""
  for (let i = 0; i < PANJANG_KODE_RUANG; i++) kode += karakter[Math.floor(Math.random() * karakter.length)]
  return kode
}

/** Membuat ruang baru; id dokumen = kode ruang. */
export const buatRuang = async ({ kuisId, kuis, user, nama }) => {
  for (let i = 0; i < 6; i++) {
    const kode = acakKode()
    const snap = await getDoc(ruangRef(kode))
    if (snap.exists()) continue

    await setDoc(ruangRef(kode), {
      kuisId,
      judul: kuis.judul,
      hostUid: user.uid,
      hostNama: nama,
      status: "lobi",
      indeks: 0,
      fase: "soal",
      detik: DETIK_DEFAULT,
      total: kuis.pertanyaan?.length ?? 0,
      dibuat: serverTimestamp(),
    })
    return kode
  }
  throw new Error("Gagal membuat kode ruang. Coba lagi.")
}

/** Pemain bergabung ke ruang (hanya saat lobi). */
export const gabungRuang = async ({ kode, user, nama, foto }) => {
  const kecil = await kecilkanFoto(foto, 64)
  await setDoc(pemainRef(kode, user.uid), {
    nama,
    foto: kecil || null,
    skor: 0,
    jawaban: {},
    bergabung: serverTimestamp(),
  })
}

export const keluarRuang = (kode, uid) => deleteDoc(pemainRef(kode, uid))
export const tendangPemain = (kode, uid) => deleteDoc(pemainRef(kode, uid))

export const mulaiPermainan = (kode, detik) =>
  updateDoc(ruangRef(kode), {
    status: "main",
    indeks: 0,
    fase: "soal",
    detik,
    mulaiAt: serverTimestamp(),
  })

/** Beralih ke fase hasil, hanya jika ruang masih di soal & fase yang sama (aman dari panggilan ganda). */
export const tampilkanHasil = (kode, indeks) =>
  runTransaction(db, async (tx) => {
    const snap = await tx.get(ruangRef(kode))
    const r = snap.data()
    if (!r || r.status !== "main" || r.indeks !== indeks || r.fase !== "soal") return
    tx.update(ruangRef(kode), { fase: "hasil" })
  })

export const soalBerikutnya = (kode, indeks) =>
  runTransaction(db, async (tx) => {
    const snap = await tx.get(ruangRef(kode))
    const r = snap.data()
    if (!r || r.status !== "main" || r.indeks !== indeks || r.fase !== "hasil") return

    if (indeks + 1 >= r.total) {
      tx.update(ruangRef(kode), { status: "selesai" })
    } else {
      tx.update(ruangRef(kode), { indeks: indeks + 1, fase: "soal", mulaiAt: serverTimestamp() })
    }
  })

export const akhiriPermainan = (kode) => updateDoc(ruangRef(kode), { status: "selesai" })

/** Mengirim jawaban sekali per soal; ditolak bila soal sudah berganti. */
export const kirimJawaban = ({ kode, uid, indeks, pilih, benar, poin, bonus = 0, ms = null }) =>
  runTransaction(db, async (tx) => {
    const [r, p] = await Promise.all([tx.get(ruangRef(kode)), tx.get(pemainRef(kode, uid))])
    const ruang = r.data()
    const pemain = p.data()

    if (!ruang || ruang.status !== "main" || ruang.indeks !== indeks || ruang.fase !== "soal") {
      throw new Error("Waktu untuk soal ini sudah habis.")
    }
    if (!pemain) throw new Error("Kamu belum bergabung di ruang ini.")
    if (pemain.jawaban?.[indeks]) return

    tx.update(pemainRef(kode, uid), {
      [`jawaban.${indeks}`]: { pilih, benar, poin, bonus, ms },
      skor: increment(poin),
    })
  })

export const hitungPoin = (sisaDetik, totalDetik) =>
  Math.round(500 + 500 * Math.max(0, Math.min(1, sisaDetik / totalDetik)))

/** Jumlah jawaban benar berturut-turut tepat sebelum `indeks`. */
export const hitungStreak = (jawaban = {}, indeks) => {
  let n = 0
  for (let i = indeks - 1; i >= 0 && jawaban?.[i]?.benar; i--) n++
  return n
}

export const BONUS_STREAK = 50
export const BATAS_STREAK = 5

/** Poin akhir: kecepatan (500-1000), dikali 2 di soal final, ditambah bonus streak. */
export const hitungPoinLengkap = ({ sisaDetik, totalDetik, benar, streakSebelum, final }) => {
  if (!benar) return { poin: 0, bonus: 0 }
  const dasar = hitungPoin(sisaDetik, totalDetik) * (final ? 2 : 1)
  const bonus = Math.min(streakSebelum, BATAS_STREAK) * BONUS_STREAK
  return { poin: dasar + bonus, bonus }
}

/** Ringkasan disimpan sekali di dokumen ruang agar muncul di riwayat host. */
export const simpanRingkasan = (kode, ringkasan) => updateDoc(ruangRef(kode), { ringkasan })

/** Urutan opsi yang sama untuk semua orang di ruang yang sama (acak berbasis seed). */
const hashString = (s) => {
  let h = 1779033703 ^ s.length
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

const mulberry32 = (a) => () => {
  a |= 0
  a = (a + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

export const opsiSoal = (kode, indeks, soal) => {
  const opsi = [{ text: soal.benar, benar: true }, ...soal.salah.map((s) => ({ text: s, benar: false }))]
  const rand = mulberry32(hashString(`${kode}-${indeks}`))
  for (let i = opsi.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[opsi[i], opsi[j]] = [opsi[j], opsi[i]]
  }
  return opsi
}

export const urutkanPemain = (pemain) =>
  [...pemain].sort((a, b) => (b.skor ?? 0) - (a.skor ?? 0) || String(a.nama).localeCompare(String(b.nama)))
