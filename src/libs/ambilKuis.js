import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore"
import { app } from "./firebase"

export const ambilKuis = async (id) => {
    const db = getFirestore(app)

    const docSnap = await getDoc(doc(db, 'quis', id))
    return docSnap.exists() ? docSnap.data() : null
}

/** Mengambil semua gambar soal sebagai map { g0: dataUrl, g1: ... } */
export const ambilGambarKuis = async (id) => {
    const db = getFirestore(app)

    try {
        const snap = await getDocs(collection(db, 'quis', id, 'gambar'))
        const peta = {}
        snap.forEach((d) => { peta[d.id] = d.data().data })
        return peta
    } catch (err) {
        console.error("Gagal mengambil gambar soal:", err)
        return {}
    }
}
