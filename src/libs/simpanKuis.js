import { collection, doc, getFirestore, writeBatch } from 'firebase/firestore'
import { app } from './firebase'

const db = getFirestore(app)

/**
 * Menyimpan kuis beserta gambar soal dalam satu batch (semua berhasil atau tidak sama sekali).
 * Gambar disimpan di subkoleksi quis/{id}/gambar agar dokumen kuis tetap kecil.
 * Mengembalikan id kuis.
 */
export const simpanKuis = async ({ informasi, soal, pembuat }) => {
  const kuisRef = doc(collection(db, 'quis'))
  const batch = writeBatch(db)

  const pertanyaan = soal.map((s, i) => ({
    soal: s.soal,
    benar: s.benar,
    salah: s.salah,
    ...(s.gambar ? { gambar: `g${i}` } : {}),
  }))

  batch.set(kuisRef, {
    judul: informasi.judul,
    deskripsi: informasi.deskripsi,
    tanggal: new Date(),
    kategori: informasi.kategori,
    waktu: informasi.waktu,
    tipe: informasi.tipe,
    kode: informasi.kode,
    pembuat: pembuat.uid,
    pembuatNama: pembuat.nama,
    pertanyaan,
  })

  soal.forEach((s, i) => {
    if (s.gambar) batch.set(doc(db, 'quis', kuisRef.id, 'gambar', `g${i}`), { data: s.gambar })
  })

  await batch.commit()
  return kuisRef.id
}
