"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore"
import { BarChart3, Copy, Plus, Users } from "lucide-react"
import { Brain } from "@phosphor-icons/react/dist/ssr"
import toast from "react-hot-toast"
import { app } from "@/libs/firebase"
import { buatRuang } from "@/libs/ruang"
import { useAuth } from "@/components/AuthProvider"
import Auth from "@/components/Auth"
import Button from "@/components/Button"
import Loading from "@/app/loading"

const db = getFirestore(app)

const milidetik = (ts) => ts?.toMillis?.() ?? 0
const formatTanggal = (ts) => {
  const ms = milidetik(ts)
  if (!ms) return "-"
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(ms)
}

const STATUS = {
  lobi: { nama: "Menunggu pemain", gaya: "bg-pensil/50 text-tinta" },
  main: { nama: "Berlangsung", gaya: "bg-biru-muda text-biru-tua" },
  selesai: { nama: "Selesai", gaya: "bg-benar-muda text-benar" },
}

const Statistik = ({ label, nilai }) => (
  <div className="rounded-2xl border-2 border-tinta bg-white p-4">
    <div className="text-sm text-lembut">{label}</div>
    <div className="font-display text-3xl font-extrabold tabular-nums">{nilai}</div>
  </div>
)

export default function RiwayatPage() {
  const { user, nama, loading: loadingAuth } = useAuth()
  const router = useRouter()
  const [kuis, setKuis] = useState([])
  const [ruang, setRuang] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [tab, setTab] = useState("kuis")
  const [membuatId, setMembuatId] = useState(null)

  useEffect(() => {
    if (!user) return
    let batal = false
    ;(async () => {
      try {
        const [qKuis, qRuang] = await Promise.all([
          getDocs(query(collection(db, "quis"), where("pembuat", "==", user.uid))),
          getDocs(query(collection(db, "ruang"), where("hostUid", "==", user.uid))),
        ])
        if (batal) return
        setKuis(qKuis.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => milidetik(b.tanggal) - milidetik(a.tanggal)))
        setRuang(qRuang.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => milidetik(b.dibuat) - milidetik(a.dibuat)))
      } catch (err) {
        console.error(err)
        if (!batal) toast.error("Gagal memuat riwayat")
      } finally {
        if (!batal) setMemuat(false)
      }
    })()
    return () => {
      batal = true
    }
  }, [user])

  if (loadingAuth) return <Loading />

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-extrabold">Masuk untuk melihat riwayat</h1>
        <p className="mt-2 text-lembut">Kuis yang kamu buat dan ruang yang kamu host tersimpan di akunmu.</p>
        <div className="mt-6">
          <Auth />
        </div>
      </div>
    )
  }

  const salin = async (kode) => {
    try {
      await navigator.clipboard.writeText(kode.toUpperCase())
      toast.success("Kode disalin")
    } catch {
      toast.error("Kode gagal disalin")
    }
  }

  const hostBaru = async (k) => {
    setMembuatId(k.id)
    try {
      const kode = await buatRuang({ kuisId: k.id, kuis: k, user, nama })
      router.push(`/ruang/${kode}`)
    } catch (err) {
      console.error(err)
      toast.error(err.message || "Gagal membuat ruang")
      setMembuatId(null)
    }
  }

  const totalPemain = ruang.reduce((a, r) => a + (r.ringkasan?.jumlahPemain ?? 0), 0)
  const tabs = [
    { id: "kuis", label: `Kuis saya (${kuis.length})` },
    { id: "ruang", label: `Ruang yang saya host (${ruang.length})` },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold sm:text-5xl">Riwayat</h1>
          <p className="mt-2 text-lembut">Semua kuis yang kamu buat dan permainan yang pernah kamu host.</p>
        </div>
        <Link href="/buat-kuis">
          <Button variant="success" size="md">
            <Plus size={18} /> Buat kuis baru
          </Button>
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-3">
        <Statistik label="Kuis dibuat" nilai={kuis.length} />
        <Statistik label="Permainan di-host" nilai={ruang.length} />
        <Statistik label="Total pemain" nilai={totalPemain} />
      </div>

      <div role="tablist" className="mt-10 flex flex-wrap gap-2 border-b-2 border-tinta pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === t.id ? "border-tinta bg-tinta text-white" : "border-garis bg-white hover:border-tinta"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {memuat ? (
        <div className="mt-6 space-y-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-black/5" />
          ))}
        </div>
      ) : tab === "kuis" ? (
        kuis.length === 0 ? (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-garis p-10 text-center">
            <p className="font-semibold">Belum ada kuis yang kamu buat.</p>
            <p className="mt-1 text-sm text-lembut">
              Kuis yang dibuat sebelum fitur riwayat ada belum tercatat di sini.
            </p>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {kuis.map((k) => (
              <li key={k.id} className="rounded-2xl border-2 border-tinta bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{k.judul}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-lembut">
                      <span className="rounded-full bg-biru-muda px-3 py-0.5 text-xs font-bold text-biru-tua">{k.kategori}</span>
                      <span className="rounded-full bg-black/5 px-3 py-0.5 text-xs font-bold text-tinta">
                        {k.tipe === "private" ? "Private" : "Publik"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Brain size={14} /> {k.pertanyaan?.length ?? 0} soal
                      </span>
                      <span>{formatTanggal(k.tanggal)}</span>
                    </div>
                  </div>
                  {k.tipe === "private" && k.kode && (
                    <button
                      onClick={() => salin(k.kode)}
                      className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-tinta bg-pensil/30 px-3 py-1.5 font-display font-extrabold uppercase tracking-widest"
                      aria-label={`Salin kode kuis ${k.kode}`}
                    >
                      {k.kode} <Copy size={14} />
                    </button>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link href={`/main-kuis/${k.id}`}>
                    <Button>Buka kuis</Button>
                  </Link>
                  <Button variant="success" onClick={() => hostBaru(k)} disabled={membuatId === k.id}>
                    <Users size={16} /> {membuatId === k.id ? "Membuat ruang..." : "Host multiplayer"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : ruang.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-garis p-10 text-center">
          <p className="font-semibold">Belum ada permainan yang kamu host.</p>
          <p className="mt-1 text-sm text-lembut">Buka salah satu kuismu lalu buat ruang multiplayer.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {ruang.map((r) => {
            const st = STATUS[r.status] ?? STATUS.lobi
            return (
              <li key={r.id} className="rounded-2xl border-2 border-tinta bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{r.judul}</h2>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-lembut">
                      <span className={`rounded-full px-3 py-0.5 text-xs font-bold ${st.gaya}`}>{st.nama}</span>
                      <span>{formatTanggal(r.dibuat)}</span>
                      <span className="font-display font-extrabold uppercase tracking-widest text-tinta">{r.id}</span>
                    </div>
                    {r.ringkasan && (
                      <p className="mt-3 text-sm">
                        {r.ringkasan.jumlahPemain} pemain
                        {r.ringkasan.juara ? `, juara ${r.ringkasan.juara} (${r.ringkasan.skorTertinggi} poin)` : ""}
                      </p>
                    )}
                  </div>
                  <Link href={`/ruang/${r.id}`}>
                    <Button variant={r.status === "selesai" ? "secondary" : "success"}>
                      {r.status === "selesai" ? (
                        <>
                          <BarChart3 size={16} /> Lihat hasil & evaluasi
                        </>
                      ) : (
                        "Lanjutkan"
                      )}
                    </Button>
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
