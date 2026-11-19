'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Flame, LogOut } from "lucide-react"
import { CheckCircle, Clock, Trophy, XCircle } from "@phosphor-icons/react/dist/ssr"
import toast from "react-hot-toast"
import Button from "./Button"
import Papan from "./Papan"
import GambarSoal from "./GambarSoal"
import Podium from "./Podium"
import EvaluasiSoal from "./EvaluasiSoal"
import SuasanaKompetisi from "./SuasanaKompetisi"
import { hitungIntensitas, labelTingkat } from "@/libs/intensitas"
import { suara } from "@/libs/suara"
import { hitungPoinLengkap, hitungStreak, keluarRuang, kirimJawaban, opsiSoal, urutkanPemain } from "@/libs/ruang"
import { useHitungMundur } from "@/libs/useHitungMundur"

const Lobi = ({ kode, room, pemain, uid }) => (
  <div className="mx-auto max-w-2xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
    <p className="font-semibold text-lembut">Kamu sudah masuk ke ruang</p>
    <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">{room.judul}</h1>
    <p className="mt-2 text-lembut">
      Host: {room.hostNama}. Permainan dimulai saat host menekan tombol mulai.
    </p>

    <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border-2 border-tinta bg-white px-5 py-3">
      <span className="text-sm text-lembut">Kode</span>
      <span className="font-display text-2xl font-extrabold uppercase tracking-[0.2em]">{kode}</span>
    </div>

    <h2 className="mt-8 border-b-2 border-tinta pb-3 text-xl font-bold">Pemain ({pemain.length})</h2>
    <div className="mt-4">
      <Papan pemain={pemain} uid={uid} daftarSaja />
    </div>

    <Button
      className="mt-8"
      onClick={() => keluarRuang(kode, uid).catch(() => toast.error("Gagal keluar dari ruang"))}
    >
      <LogOut size={16} /> Keluar dari ruang
    </Button>
  </div>
)

const Main = ({ kode, room, pemain, saya, kuis, gambar, uid }) => {
  const soal = kuis.pertanyaan[room.indeks]
  const opsi = opsiSoal(kode, room.indeks, soal)
  const jawabanSaya = saya.jawaban?.[room.indeks]
  const aktif = room.fase === "soal"
  const { sisa, mulaiRef } = useHitungMundur(`${kode}-${room.indeks}`, room.detik, aktif)
  const [mengirim, setMengirim] = useState(false)

  const terakhir = room.indeks + 1 >= room.total
  const t = hitungIntensitas(room.indeks, room.total)
  const tingkat = labelTingkat(t, terakhir)
  const detikTampil = Math.ceil(sisa)
  const habis = aktif && sisa <= 0
  const genting = aktif && !jawabanSaya && sisa > 0 && sisa <= 3 && t >= 0.34
  const bisaMenjawab = aktif && !jawabanSaya && !habis && !mengirim

  const streakKini = hitungStreak(saya.jawaban, aktif ? room.indeks : room.indeks + 1)

  // Suara: soal baru + detak jantung selama soal berlangsung
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
    if (aktif && !jawabanSaya && sisa > 0 && detikTampil <= 5) suara.tik(detikTampil, t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detikTampil])

  // Berhenti berdetak saat sudah menjawab; hasil dibunyikan saat fase hasil
  useEffect(() => {
    if (jawabanSaya) suara.hentikanDenyut()
  }, [jawabanSaya])

  useEffect(() => {
    if (aktif) return
    if (jawabanSaya?.benar) suara.benar(streakKini)
    else suara.salah()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif, room.indeks])

  const pilih = async (o) => {
    if (!bisaMenjawab) return
    suara.klik()
    setMengirim(true)
    const ms = Date.now() - mulaiRef.current
    const { poin, bonus } = hitungPoinLengkap({
      sisaDetik: room.detik - ms / 1000,
      totalDetik: room.detik,
      benar: o.benar,
      streakSebelum: hitungStreak(saya.jawaban, room.indeks),
      final: terakhir,
    })
    try {
      await kirimJawaban({ kode, uid, indeks: room.indeks, pilih: o.text, benar: o.benar, poin, bonus, ms })
    } catch (err) {
      toast.error(err.message || "Jawaban gagal dikirim")
    } finally {
      setMengirim(false)
    }
  }

  const tingkatSebelum = room.indeks > 0 ? labelTingkat(hitungIntensitas(room.indeks - 1, room.total), false).nama : null
  const pengumuman =
    room.indeks === 0
      ? { teks: "Mulai!", sub: `${room.total} soal` }
      : terakhir
        ? { teks: "Soal final", sub: "Poin ganda x2" }
        : tingkat.nama !== tingkatSebelum
          ? { teks: `${tingkat.nama}!` }
          : null

  const urut = urutkanPemain(pemain)
  const peringkat = urut.findIndex((p) => p.id === uid) + 1

  return (
    <SuasanaKompetisi
      intensitas={t}
      genting={genting}
      umumkan={aktif && pengumuman ? { kunci: room.indeks, ...pengumuman } : null}
    >
      <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {aktif ? (
            <div
              role="timer"
              className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-mono text-xl font-bold ${
                sisa <= 5 ? "denyut border-salah bg-salah text-white" : "border-tinta bg-white"
              }`}
            >
              <Clock size={20} weight="bold" /> {detikTampil}
            </div>
          ) : (
            <div className="text-sm font-semibold">Hasil soal {room.indeks + 1}</div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {terakhir && (
              <span className="denyut rounded-full border-2 border-tinta bg-salah px-3 py-1 text-sm font-extrabold uppercase text-white">
                Poin x2
              </span>
            )}
            {streakKini >= 2 && (
              <span className="flex items-center gap-1 rounded-full border-2 border-tinta bg-pensil px-3 py-1 text-sm font-extrabold">
                <Flame size={16} /> Streak x{streakKini}
              </span>
            )}
            <div className="inline-flex items-center gap-2 rounded-full border-2 border-tinta bg-pensil px-4 py-2 font-mono text-lg font-bold">
              <Trophy size={20} weight="fill" /> {saya.skor ?? 0}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className={`rounded-full border-2 border-tinta px-3 py-0.5 text-xs font-extrabold uppercase ${tingkat.warna}`}>
            {tingkat.nama}
          </span>
          <div className="flex flex-1 gap-1" aria-hidden>
            {Array.from({ length: room.total }).map((_, i) => (
              <div key={i} className={`h-2.5 flex-1 rounded-full ${i <= room.indeks ? "aksen-bar" : "bg-black/10"}`} />
            ))}
          </div>
          <span className="whitespace-nowrap text-sm font-semibold">
            {room.indeks + 1}/{room.total}
          </span>
        </div>

        <div className="arena-kartu mt-5 rounded-3xl border-2 border-tinta bg-white p-6 sm:p-10">
          <h1 className="arena-judul leading-tight">{soal.soal}</h1>
          {soal.gambar && gambar[soal.gambar] && <GambarSoal src={gambar[soal.gambar]} className="mt-6" />}

          <div className="mt-8 space-y-3">
            {opsi.map((o, i) => {
              const dipilih = jawabanSaya?.pilih === o.text
              const tampilHasil = !aktif
              let gaya = "border-garis bg-white"
              let gayaBulat = ""

              if (tampilHasil) {
                if (o.benar) {
                  gaya = "border-benar bg-benar-muda"
                  gayaBulat = "gelembung-terisi !border-benar !bg-benar"
                } else if (dipilih) {
                  gaya = "border-salah bg-salah-muda"
                  gayaBulat = "gelembung-terisi !border-salah !bg-salah"
                } else {
                  gaya = "border-garis bg-white opacity-50"
                }
              } else if (dipilih) {
                gaya = "border-tinta bg-biru-muda"
                gayaBulat = "gelembung-terisi"
              } else if (!bisaMenjawab) {
                gaya = "border-garis bg-white opacity-60"
              } else {
                gaya = "border-garis bg-white hover:-translate-y-0.5 hover:border-tinta hover:bg-kertas hover:shadow-[0_3px_0_0_var(--tinta)]"
              }

              return (
                <button
                  key={i}
                  onClick={() => pilih(o)}
                  disabled={!bisaMenjawab}
                  className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-all ${gaya} ${
                    bisaMenjawab ? "cursor-pointer" : "cursor-default"
                  } ${tampilHasil && dipilih && !o.benar ? "getar-sekali" : ""}`}
                >
                  <span className={`gelembung ${gayaBulat}`}>{String.fromCharCode(65 + i)}</span>
                  <span className="flex-1 text-lg">{o.text}</span>
                  {tampilHasil && o.benar && <CheckCircle size={26} weight="fill" className="text-benar" aria-label="Jawaban benar" />}
                  {tampilHasil && dipilih && !o.benar && <XCircle size={26} weight="fill" className="text-salah" aria-label="Jawaban salah" />}
                </button>
              )
            })}
          </div>

          <div role="status" className="mt-6 text-sm font-semibold">
            {aktif && jawabanSaya && <span className="text-lembut">Jawabanmu terkirim. Menunggu pemain lain...</span>}
            {aktif && !jawabanSaya && habis && <span className="text-salah">Waktu habis, kamu belum menjawab.</span>}
            {!aktif && jawabanSaya?.benar && (
              <span className="text-benar">
                Benar! +{jawabanSaya.poin} poin
                {jawabanSaya.bonus > 0 ? ` (termasuk bonus streak +${jawabanSaya.bonus})` : ""}
              </span>
            )}
            {!aktif && jawabanSaya && !jawabanSaya.benar && <span className="text-salah">Kurang tepat. Jawaban yang benar ditandai hijau.</span>}
            {!aktif && !jawabanSaya && <span className="text-lembut">Kamu tidak menjawab soal ini.</span>}
          </div>
        </div>

        {!aktif && (
          <section aria-labelledby="papan" className="mt-8">
            <div className="mb-3 flex items-end justify-between">
              <h2 id="papan" className="text-xl font-bold">Papan skor</h2>
              <span className="text-sm font-semibold">Kamu peringkat {peringkat}</span>
            </div>
            <Papan
              pemain={pemain}
              uid={uid}
              batas={5}
              indeksSoal={room.indeks}
              tampilPoin={(p) => p.jawaban?.[room.indeks]?.poin ?? 0}
            />
            <p className="mt-4 text-center text-sm text-lembut">Menunggu host melanjutkan...</p>
          </section>
        )}
      </div>
    </SuasanaKompetisi>
  )
}

const Selesai = ({ kode, room, pemain, kuis, gambar, uid }) => {
  const urut = urutkanPemain(pemain)
  const peringkat = urut.findIndex((p) => p.id === uid) + 1

  useEffect(() => {
    suara.fanfare()
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <p className="font-semibold text-lembut">{room.judul}</p>
      <h1 className="mt-1 text-4xl font-extrabold sm:text-5xl">
        {peringkat > 0 ? `Kamu peringkat ${peringkat}` : "Permainan selesai"}
      </h1>

      <div className="mt-10">
        <Podium pemain={pemain} />
      </div>

      <section aria-labelledby="klasemen" className="mt-12">
        <h2 id="klasemen" className="mb-3 border-b-2 border-tinta pb-3 text-2xl font-bold">Klasemen akhir</h2>
        <Papan pemain={pemain} uid={uid} />
      </section>

      <div className="mt-12">
        {kuis ? (
          <EvaluasiSoal kode={kode} kuis={kuis} pemain={pemain} gambar={gambar} uid={uid} />
        ) : (
          <p className="text-lembut">Memuat evaluasi soal...</p>
        )}
      </div>

      <div className="mt-10">
        <Link href="/">
          <Button variant="secondary" size="md">Kembali ke beranda</Button>
        </Link>
      </div>
    </div>
  )
}

const RuangPemain = ({ kode, room, pemain, saya, kuis, gambar, uid }) => {
  if (room.status === "lobi") return <Lobi kode={kode} room={room} pemain={pemain} uid={uid} />
  if (room.status === "selesai") return <Selesai kode={kode} room={room} pemain={pemain} kuis={kuis} gambar={gambar} uid={uid} />
  if (!kuis) return null
  return <Main kode={kode} room={room} pemain={pemain} saya={saya} kuis={kuis} gambar={gambar} uid={uid} />
}

export default RuangPemain
