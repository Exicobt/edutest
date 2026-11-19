import { deleteField, doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore"
import { app } from "./firebase"

const db = getFirestore(app)

export const UKURAN_FOTO = 256
export const BATAS_FILE_MB = 8
const TIPE_DIDUKUNG = ["image/jpeg", "image/png", "image/webp", "image/gif"]

/**
 * Memvalidasi file, memotong ke persegi (center-crop), mengecilkan ke 256x256
 * lalu mengembalikan data URL JPEG (sekitar 15-40 KB).
 */
export const kompresFoto = async (file) => {
  if (!file) throw new Error("Pilih file foto terlebih dahulu.")
  if (!TIPE_DIDUKUNG.includes(file.type)) {
    throw new Error("Format harus JPG, PNG, WEBP, atau GIF.")
  }
  if (file.size > BATAS_FILE_MB * 1024 * 1024) {
    throw new Error(`Ukuran file maksimal ${BATAS_FILE_MB} MB.`)
  }

  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error("File gambar tidak bisa dibaca."))
      el.src = url
    })

    const sisi = Math.min(img.naturalWidth, img.naturalHeight)
    const sx = (img.naturalWidth - sisi) / 2
    const sy = (img.naturalHeight - sisi) / 2

    const canvas = document.createElement("canvas")
    canvas.width = UKURAN_FOTO
    canvas.height = UKURAN_FOTO
    const ctx = canvas.getContext("2d")
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, UKURAN_FOTO, UKURAN_FOTO)
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(img, sx, sy, sisi, sisi, 0, 0, UKURAN_FOTO, UKURAN_FOTO)

    return canvas.toDataURL("image/jpeg", 0.85)
  } finally {
    URL.revokeObjectURL(url)
  }
}

export const simpanFotoProfil = async (uid, dataUrl) => {
  await setDoc(
    doc(db, "users", uid),
    { fotoProfil: dataUrl, diperbarui: serverTimestamp() },
    { merge: true }
  )
}

export const hapusFotoProfil = async (uid) => {
  await setDoc(
    doc(db, "users", uid),
    { fotoProfil: deleteField(), diperbarui: serverTimestamp() },
    { merge: true }
  )
}

export const simpanUsername = async (uid, username) => {
  await setDoc(
    doc(db, "users", uid),
    { username, diperbarui: serverTimestamp() },
    { merge: true }
  )
}
