"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { collection, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore"
import { Plus } from "lucide-react"
import { Brain, Clock } from "@phosphor-icons/react/dist/ssr"
import toast from "react-hot-toast"
import Button from "@/components/Button"
import { app } from "@/libs/firebase"
import { formatDurasi } from "@/libs/format"

const PANJANG_KODE = 6

export default function Home() {
  const [kuis, setKuis] = useState([])
  const [loading, setLoading] = useState(true)
  const [kode, setKode] = useState("")
  const [fokus, setFokus] = useState(false)
  const [mencari, setMencari] = useState(false)
  const inputRef = useRef(null)
  const router = useRouter()

  const handleIdKuis = async () => {
    if (kode.length < PANJANG_KODE) {
      toast.error(`Kode kuis terdiri dari ${PANJANG_KODE} karakter`)
      inputRef.current?.focus()
      return
    }

    setMencari(true)
    try {
      const db = getFirestore(app)
      const kodeKecil = kode.toLowerCase()

      // Kode ruang multiplayer didahulukan, lalu kode kuis private
      const ruang = await getDoc(doc(db, "ruang", kodeKecil))
      if (ruang.exists() && ruang.data().status !== "selesai") {
        router.push(`/ruang/${kodeKecil}`)
        return
      }

      const q = query(collection(db, "quis"), where("kode", "==", kodeKecil))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        toast.error("Tidak ada ruang atau kuis dengan kode itu")
        return
      }

      router.push(`/main-kuis/${snapshot.docs[0].id}`)
    } catch (err) {
      console.error("Error finding quiz:", err)
      toast.error("Gagal mencari kuis. Coba lagi.")
    } finally {
      setMencari(false)
    }
  }

  useEffect(() => {
    const fetchKuis = async () => {
      try {
        const db = getFirestore(app)
        const q = query(collection(db, "quis"), where("tipe", "==", "publik"))
        const snapshot = await getDocs(q)
        setKuis(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })))
      } catch (err) {
        console.error("Error fetching quizzes:", err)
        toast.error("Gagal memuat daftar kuis")
      } finally {
        setLoading(false)
      }
    }

    fetchKuis()
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-12 sm:px-6 sm:pt-20">
      <section aria-labelledby="judul-hero" className="max-w-2xl">
        <h1 id="judul-hero" className="text-4xl font-extrabold leading-[1.05] sm:text-6xl">
          Punya kode? Masukkan di sini.
        </h1>
        <p className="mt-4 max-w-md text-lg text-lembut">
          Gabung ruang multiplayer atau kuis dari gurumu, atau pilih salah satu kuis publik di bawah.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleIdKuis()
          }}
          className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <div
            className="relative flex gap-2 sm:gap-3"
            onClick={() => inputRef.current?.focus()}
          >
            {Array.from({ length: PANJANG_KODE }).map((_, i) => {
              const aktif = fokus && (i === kode.length || (i === PANJANG_KODE - 1 && kode.length === PANJANG_KODE))
              return (
                <div
                  key={`${i}-${kode[i] ?? ""}`}
                  aria-hidden
                  className={`flex h-14 w-11 items-center justify-center rounded-xl border-2 bg-white font-display text-2xl font-extrabold uppercase sm:h-16 sm:w-14 sm:text-3xl ${
                    aktif ? "border-biru ring-4 ring-biru-muda" : "border-tinta"
                  } ${kode[i] ? "hero-gelembung" : ""}`}
                >
                  {kode[i] ?? ""}
                </div>
              )
            })}
            <input
              ref={inputRef}
              value={kode}
              onChange={(e) =>
                setKode(e.target.value.replace(/[^a-zA-Z0-9]/g, "").slice(0, PANJANG_KODE))
              }
              onFocus={() => setFokus(true)}
              onBlur={() => setFokus(false)}
              aria-label="Kode ruang atau kuis, 6 karakter"
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>

          <Button type="submit" variant="secondary" size="lg" disabled={mencari}>
            {mencari ? "Mencari..." : "Gabung"}
          </Button>
        </form>

        <p className="mt-6 text-sm text-lembut">
          Ingin membuat kuis sendiri?{" "}
          <Link href="/buat-kuis" className="font-semibold text-biru underline underline-offset-4">
            Buat kuis baru
          </Link>
        </p>
      </section>

      <section aria-labelledby="judul-publik" className="mt-20">
        <div className="flex items-end justify-between border-b-2 border-tinta pb-3">
          <h2 id="judul-publik" className="text-2xl font-bold sm:text-3xl">
            Kuis publik
          </h2>
          {!loading && (
            <span className="text-sm text-lembut">{kuis.length} kuis tersedia</span>
          )}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-black/5" />
            ))}
          </div>
        ) : kuis.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-garis p-10 text-center">
            <p className="font-semibold">Belum ada kuis publik.</p>
            <p className="mt-1 text-sm text-lembut">Jadilah yang pertama membuat satu.</p>
            <Link href="/buat-kuis" className="mt-4 inline-block">
              <Button variant="success">
                <Plus size={16} /> Buat kuis
              </Button>
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            {kuis.map((quiz) => (
              <li key={quiz.id}>
                <Link
                  href={`/main-kuis/${quiz.id}`}
                  className="group block h-full rounded-2xl border-2 border-tinta bg-white p-5 transition-transform hover:-translate-y-0.5 hover:shadow-[0_4px_0_0_var(--tinta)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="line-clamp-2 text-lg font-bold leading-snug">{quiz.judul}</h3>
                    <span className="shrink-0 rounded-full bg-biru-muda px-3 py-1 text-xs font-bold text-biru-tua">
                      {quiz.kategori}
                    </span>
                  </div>
                  <div className="mt-5 flex gap-5 text-sm text-lembut">
                    <span className="flex items-center gap-1.5">
                      <Brain size={16} /> {quiz.pertanyaan?.length ?? 0} pertanyaan
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={16} /> {formatDurasi(quiz.waktu)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
