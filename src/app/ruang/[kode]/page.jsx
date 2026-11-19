"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { collection, doc, getFirestore, onSnapshot } from "firebase/firestore"
import toast from "react-hot-toast"
import { app } from "@/libs/firebase"
import { ambilGambarKuis, ambilKuis } from "@/libs/ambilKuis"
import { gabungRuang } from "@/libs/ruang"
import { useAuth } from "@/components/AuthProvider"
import Auth from "@/components/Auth"
import Button from "@/components/Button"
import Loading from "@/app/loading"
import RuangHost from "@/components/RuangHost"
import RuangPemain from "@/components/RuangPemain"

const db = getFirestore(app)

const Pesan = ({ judul, isi, children }) => (
  <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
    <h1 className="text-2xl font-extrabold sm:text-3xl">{judul}</h1>
    <p className="mt-2 text-lembut">{isi}</p>
    <div className="mt-6">{children}</div>
  </div>
)

const Beranda = ({ label = "Kembali ke beranda" }) => (
  <Link href="/">
    <Button variant="secondary" size="md">{label}</Button>
  </Link>
)

export default function RuangPage() {
  const { kode: kodeParam } = useParams()
  const kode = String(kodeParam || "").toLowerCase()
  const { user, nama, foto, loading: loadingAuth } = useAuth()

  const [room, setRoom] = useState(undefined) // undefined = memuat, null = tidak ada
  const [pemain, setPemain] = useState([])
  const [kuis, setKuis] = useState(null)
  const [gambar, setGambar] = useState({})
  const [bergabung, setBergabung] = useState(false)

  useEffect(() => {
    if (!kode || !user) return

    const offRoom = onSnapshot(
      doc(db, "ruang", kode),
      (snap) => setRoom(snap.exists() ? snap.data() : null),
      (err) => {
        console.error(err)
        toast.error("Gagal terhubung ke ruang")
        setRoom(null)
      }
    )
    const offPemain = onSnapshot(
      collection(db, "ruang", kode, "pemain"),
      (snap) => setPemain(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
      (err) => console.error(err)
    )

    return () => {
      offRoom()
      offPemain()
    }
  }, [kode, user])

  const kuisId = room?.kuisId
  useEffect(() => {
    if (!kuisId) return
    let batal = false
    ;(async () => {
      try {
        const [k, g] = await Promise.all([ambilKuis(kuisId), ambilGambarKuis(kuisId)])
        if (!batal) {
          setKuis(k)
          setGambar(g)
        }
      } catch (err) {
        console.error(err)
        if (!batal) toast.error("Gagal memuat soal")
      }
    })()
    return () => {
      batal = true
    }
  }, [kuisId])

  if (loadingAuth) return <Loading />

  if (!user) {
    return (
      <Pesan judul="Masuk untuk bergabung" isi="Kamu perlu masuk dengan akun Google agar namamu tampil di papan skor.">
        <Auth />
      </Pesan>
    )
  }

  if (room === undefined) return <Loading />

  if (room === null) {
    return (
      <Pesan judul="Ruang tidak ditemukan" isi={`Kode "${kode.toUpperCase()}" tidak cocok dengan ruang mana pun. Periksa kembali kodenya.`}>
        <Beranda />
      </Pesan>
    )
  }

  const jadiHost = room.hostUid === user.uid
  const saya = pemain.find((p) => p.id === user.uid)

  if (jadiHost) {
    return <RuangHost kode={kode} room={room} pemain={pemain} kuis={kuis} gambar={gambar} />
  }

  // Pembuat kuis tidak boleh bermain di ruang kuisnya sendiri
  if (kuis && kuis.pembuat === user.uid) {
    return (
      <Pesan judul="Kamu pembuat kuis ini" isi="Pembuat kuis bertindak sebagai host dan tidak bisa ikut bermain di ruang multiplayer.">
        <Beranda />
      </Pesan>
    )
  }

  if (!saya) {
    if (room.status !== "lobi") {
      return (
        <Pesan judul="Permainan sudah dimulai" isi="Ruang ini tidak menerima pemain baru lagi. Minta host membuat ruang baru.">
          <Beranda />
        </Pesan>
      )
    }

    if (!kuis) return <Loading />

    const gabung = async () => {
      setBergabung(true)
      try {
        await gabungRuang({ kode, user, nama, foto })
      } catch (err) {
        console.error(err)
        toast.error("Gagal bergabung. Coba lagi.")
      } finally {
        setBergabung(false)
      }
    }

    return (
      <Pesan judul={room.judul} isi={`Host: ${room.hostNama}. Kamu akan bergabung dengan nama "${nama}".`}>
        <Button variant="secondary" size="lg" onClick={gabung} disabled={bergabung}>
          {bergabung ? "Bergabung..." : "Gabung ruang"}
        </Button>
        <p className="mt-4 text-sm text-lembut">
          Ingin ganti nama? Ubah di{" "}
          <Link href="/profil" className="font-semibold text-biru underline underline-offset-4">halaman profil</Link>.
        </p>
      </Pesan>
    )
  }

  return <RuangPemain kode={kode} room={room} pemain={pemain} saya={saya} kuis={kuis} gambar={gambar} uid={user.uid} />
}
