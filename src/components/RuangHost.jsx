'use client'

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Copy, Play, SkipForward, UserX, Crown, Users } from "lucide-react"
import { Clock } from "@phosphor-icons/react/dist/ssr"
import toast from "react-hot-toast"
import Button from "./Button"
import Papan from "./Papan"
import Avatar from "./Avatar"
import GambarSoal from "./GambarSoal"
import Podium from "./Podium"
import EvaluasiSoal from "./EvaluasiSoal"
import SuasanaKompetisi from "./SuasanaKompetisi"
import { hitungIntensitas, labelTingkat } from "@/libs/intensitas"
import { suara } from "@/libs/suara"
import {
  DETIK_DEFAULT,
  akhiriPermainan,
  mulaiPermainan,
  opsiSoal,
  simpanRingkasan,
  soalBerikutnya,
  tampilkanHasil,
  tendangPemain,
} from "@/libs/ruang"
import { useHitungMundur } from "@/libs/useHitungMundur"

const LencanaHost = () => (
  <div className="inline-flex items-center gap-2 rounded-full border-2 border-tinta bg-biru-muda px-3 py-1 text-sm font-semibold text-biru-tua">
    <Crown size={14} /> Kamu host. Host mengatur permainan dan tidak ikut menjawab.
  </div>
)

const Lobi = ({ kode, room, pemain }) => {
  const [detik, setDetik] = useState(room.detik ?? DETIK_DEFAULT)
  const [memulai, setMemulai] = useState(false)

  const tautan = typeof window !== "undefined" ? `${window.location.origin}/ruang/${kode}` : ""

  const jumlahSebelum = useRef(pemain.length)
  useEffect(() => {
    if (pemain.length > jumlahSebelum.current) suara.pop()
    jumlahSebelum.current = pemain.length
  }, [pemain.length])

  const salin = async (teks, pesan) => {
    try {
      await navigator.clipboard.writeText(teks)
      toast.success(pesan)
    } catch {
      toast.error("Gagal menyalin")
    }
  }

  const mulai = async () => {
    const d = Number(detik)
    if (!Number.isFinite(d) || d < 5 || d > 120) {
      toast.error("Waktu per soal harus 5 sampai 120 detik")
      return
    }
    if (pemain.length === 0) {
      toast.error("Belum ada pemain yang bergabung")
      return
    }
    setMemulai(true)
    try {
      await mulaiPermainan(kode, Math.round(d))
    } catch (err) {
      console.error(err)
      toast.error("Gagal memulai permainan")
      setMemulai(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <LencanaHost />
      <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl">{room.judul}</h1>

      <section
        aria-labelledby="kode-ruang"
        className="mt-6 rounded-3xl border-2 border-tinta bg-white p-6 text-center sm:p-8"
      >
        <h2 id="kode-ruang" className="text-sm font-semibold text-lembut">Kode ruang</h2>
        <div className="mt-2 font-display text-6xl font-extrabold uppercase tracking-[0.2em] sm:text-7xl">{kode}</div>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button onClick={() => salin(kode.toUpperCase(), "Kode disalin")}>
            <Copy size={16} /> Salin kode
          </Button>
          <Button onClick={() => salin(tautan, "Tautan disalin")}>
            <Copy size={16} /> Salin tautan
          </Button>
        </div>
      </section>

      <section aria-labelledby="daftar-pemain" className="mt-8">
        <div className="flex items-center justify-between border-b-2 border-tinta pb-3">
          <h2 id="daftar-pemain" className="flex items-center gap-2 text-xl font-bold">
            <Users size={20} /> Pemain ({pemain.length})
          </h2>
        </div>

        {pemain.length === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-garis p-8 text-center">
            <p className="font-semibold">Menunggu pemain</p>
            <p className="mt-1 text-sm text-lembut">Bagikan kode atau tautan di atas supaya pemain bisa masuk.</p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {pemain.map((p) => (
              <li key={p.id} className="flex items-center gap-3 rounded-2xl border-2 border-garis bg-white px-3 py-2.5">
                <Avatar src={p.foto} nama={p.nama} ukuran={36} />
                <span className="min-w-0 flex-1 truncate font-semibold">{p.nama}</span>
                <button
                  onClick={() => tendangPemain(kode, p.id).catch(() => toast.error("Gagal mengeluarkan pemain"))}
                  aria-label={`Keluarkan ${p.nama}`}
                  className="cursor-pointer rounded-lg p-2 text-salah hover:bg-salah-muda"
                >
                  <UserX size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 flex flex-col gap-4 rounded-3xl border-2 border-tinta bg-white p-6 sm:flex-row sm:items-end sm:justify-between sm:p-8">
        <div>
          <label htmlFor="detik" className="mb-2 block font-semibold">Waktu per soal</label>
          <div className="flex items-center gap-3">
            <input
              id="detik"
              type="number"
              min={5}
              max={120}
              value={detik}
              onChange={(e) => setDetik(e.target.value)}
              className="input !w-28"
            />
            <span className="text-lembut">detik</span>
          </div>
          <p className="mt-2 text-sm text-lembut">{room.total} soal. Jawaban lebih cepat mendapat poin lebih besar.</p>
        </div>
        <Button variant="secondary" size="lg" onClick={mulai} disabled={memulai || pemain.length === 0}>
          <Play size={18} /> {memulai ? "Memulai..." : "Mulai permainan"}
        </Button>
      </section>
    </div>
  )
}

const Main = ({ kode, room, pemain, kuis, gambar }) => {
  const soal = kuis.pertanyaan[room.indeks]
  const opsi = opsiSoal(kode, room.indeks, soal)
  const adaGambar = soal.gambar && gambar[soal.gambar]
  const aktif = room.fase === "soal"
  const { sisa } = useHitungMundur(`${kode}-${room.indeks}`, room.detik, aktif)

  const terakhir = room.indeks + 1 >= room.total
  const t = hitungIntensitas(room.indeks, room.total)
  const tingkat = labelTingkat(t, terakhir)
  const detikTampil = Math.ceil(sisa)
  const genting = aktif && sisa > 0 && sisa <= 3 && t >= 0.34

  const sudahJawab = pemain.filter((p) => p.jawaban?.[room.indeks]).length
  const semuaJawab = pemain.length > 0 && sudahJawab === pemain.length
  const habis = sisa <= 0

  useEffect(() => {
    if (aktif && (habis || semuaJawab)) {
      tampilkanHasil(kode, room.indeks).catch((err) => console.error(err))
    }
  }, [aktif, habis, semuaJawab, kode, room.indeks])

  // Suara: soal baru + detak jantung selama soal, makin cepat di soal akhir
  useEffect(() => {
    if (!aktif) return
    if (room.indeks === 0) suara.mulai()
    else if (terakhir) suara.final()
    else suara.soal(t)
    suara.mulaiDenyut(t)
    return () => suara.hentikanDenyut()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, room.indeks])

  useEffect(() => {
    if (aktif && sisa > 0 && detikTampil <= 5) suara.tik(detikTampil, t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detikTampil])

  useEffect(() => {
    if (!aktif) suara.ting()
  }, [aktif, room.indeks])

  // Pengumuman layar penuh di soal pertama, soal final, dan saat tingkat naik
  const tingkatSebelum = room.indeks > 0 ? labelTingkat(hitungIntensitas(room.indeks - 1, room.total), false).nama : null
  const pengumuman =
    room.indeks === 0
      ? { teks: "Mulai!", sub: `${room.total} soal` }
      : terakhir
        ? { teks: "Soal final", sub: "Poin ganda x2" }
        : tingkat.nama !== tingkatSebelum
          ? { teks: `${tingkat.nama}!` }
          : null

  const jumlahPilih = (teks) => pemain.filter((p) => p.jawaban?.[room.indeks]?.pilih === teks).length
  const belumJawab = pemain.filter((p) => !p.jawaban?.[room.indeks]).length

  return (
    <SuasanaKompetisi
      intensitas={t}
      genting={genting}
      umumkan={aktif && pengumuman ? { kunci: room.indeks, ...pengumuman } : null}
    >
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LencanaHost />
          <div className="flex items-center gap-3">
            <span className={`rounded-full border-2 border-tinta px-3 py-1 text-sm font-extrabold uppercase ${tingkat.warna}`}>
              {tingkat.nama}
            </span>
            {aktif && (
              <div
                role="timer"
                className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-1.5 font-mono text-xl font-bold ${
                  sisa <= 5 ? "denyut border-salah bg-salah text-white" : "border-tinta bg-white"
                }`}
              >
                <Clock size={18} weight="bold" /> {detikTampil}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="whitespace-nowrap text-sm font-semibold">
            Soal {room.indeks + 1} / {room.total}
          </span>
          <div className="flex flex-1 gap-1" aria-hidden>
            {Array.from({ length: room.total }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full ${i <= room.indeks ? "aksen-bar" : "bg-black/10"}`}
              />
            ))}
          </div>
        </div>

        <div className="arena-kartu mt-5 rounded-3xl border-2 border-tinta bg-white p-6 sm:p-10">
          <h1 className="arena-judul leading-tight">{soal.soal}</h1>
          {adaGambar && <GambarSoal src={gambar[soal.gambar]} className="mt-6" />}

          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {opsi.map((o, i) => {
              const tampilHasil = !aktif
              const gaya = tampilHasil
                ? o.benar
                  ? "border-benar bg-benar-muda"
                  : "border-garis bg-white opacity-60"
                : "border-garis bg-white"
              return (
                <li key={i} className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 ${gaya}`}>
                  <span className={`gelembung ${tampilHasil && o.benar ? "gelembung-terisi !border-benar !bg-benar" : ""}`}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1 text-lg">{o.text}</span>
                  {tampilHasil && (
                    <span className="text-sm font-semibold text-lembut">{jumlahPilih(o.text)} orang</span>
                  )}
                </li>
              )
            })}
          </ul>

          {aktif ? (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold">
                {sudahJawab} dari {pemain.length} pemain sudah menjawab
              </p>
              <Button onClick={() => tampilkanHasil(kode, room.indeks)}>
                <SkipForward size={16} /> Tampilkan jawaban
              </Button>
            </div>
          ) : (
            <p className="mt-6 text-sm text-lembut">
              {belumJawab > 0 ? `${belumJawab} pemain tidak menjawab.` : "Semua pemain menjawab."}
            </p>
          )}
        </div>

        {!aktif && (
          <section aria-labelledby="papan-sementara" className="mt-8">
            <h2 id="papan-sementara" className="mb-3 text-xl font-bold">Papan skor</h2>
            <Papan
              pemain={pemain}
              batas={5}
              indeksSoal={room.indeks}
              tampilPoin={(p) => p.jawaban?.[room.indeks]?.poin ?? 0}
            />
            <div className="mt-6 flex justify-end">
              <Button variant="secondary" size="lg" onClick={() => soalBerikutnya(kode, room.indeks)}>
                {terakhir ? "Lihat hasil akhir" : "Soal berikutnya"} <SkipForward size={18} />
              </Button>
            </div>
          </section>
        )}

        {aktif && (
          <div className="mt-6 text-center">
            <button
              onClick={() => akhiriPermainan(kode)}
              className="cursor-pointer text-sm font-semibold text-salah underline underline-offset-4"
            >
              Akhiri permainan sekarang
            </button>
          </div>
        )}
      </div>
    </SuasanaKompetisi>
  )
}

const Selesai = ({ kode, room, pemain, kuis, gambar }) => {
  const sudahSimpan = useRef(false)

  useEffect(() => {
    suara.fanfare()
  }, [])

  // Simpan ringkasan sekali supaya muncul di riwayat host
  useEffect(() => {
    if (room.ringkasan || sudahSimpan.current || pemain.length === 0) return
    sudahSimpan.current = true
    const urut = [...pemain].sort((a, b) => (b.skor ?? 0) - (a.skor ?? 0))
    simpanRingkasan(kode, {
      jumlahPemain: pemain.length,
      juara: urut[0]?.nama ?? null,
      skorTertinggi: urut[0]?.skor ?? 0,
    }).catch((err) => console.error(err))
  }, [kode, room.ringkasan, pemain])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <LencanaHost />
      <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Permainan selesai</h1>
      <p className="mt-2 text-lembut">{room.judul}</p>

      <div className="mt-10">
        <Podium pemain={pemain} />
      </div>

      <section aria-labelledby="klasemen" className="mt-12">
        <h2 id="klasemen" className="mb-3 border-b-2 border-tinta pb-3 text-2xl font-bold">Klasemen akhir</h2>
        <Papan pemain={pemain} />
      </section>

      <div className="mt-12">
        {kuis ? (
          <EvaluasiSoal kode={kode} kuis={kuis} pemain={pemain} gambar={gambar} />
        ) : (
          <p className="text-lembut">Memuat evaluasi soal...</p>
        )}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/riwayat">
          <Button variant="secondary" size="md">Lihat riwayat</Button>
        </Link>
        <Link href="/">
          <Button size="md">Kembali ke beranda</Button>
        </Link>
      </div>
    </div>
  )
}

const RuangHost = ({ kode, room, pemain, kuis, gambar }) => {
  if (room.status === "lobi") return <Lobi kode={kode} room={room} pemain={pemain} />
  if (room.status === "selesai") return <Selesai kode={kode} room={room} pemain={pemain} kuis={kuis} gambar={gambar} />
  if (!kuis) return null
  return <Main kode={kode} room={room} pemain={pemain} kuis={kuis} gambar={gambar} />
}

export default RuangHost
