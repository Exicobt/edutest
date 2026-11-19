import { Clock, Target } from "lucide-react"
import GambarSoal from "./GambarSoal"
import { opsiSoal } from "@/libs/ruang"

const tingkat = (persen) =>
  persen >= 80
    ? { nama: "Mudah", gaya: "bg-benar-muda text-benar" }
    : persen >= 50
      ? { nama: "Sedang", gaya: "bg-pensil/50 text-tinta" }
      : { nama: "Sulit", gaya: "bg-salah-muda text-salah" }

const detikDari = (ms) => (ms == null ? "-" : `${(ms / 1000).toFixed(1)} dtk`)

/**
 * Evaluasi per soal di akhir permainan.
 * Mode host (tanpa uid): statistik seluruh pemain + saran.
 * Mode pemain (dengan uid): statistik yang sama + jawaban pemain itu sendiri.
 */
const EvaluasiSoal = ({ kode, kuis, pemain, gambar = {}, uid }) => {
  const total = pemain.length
  const sayaPemain = uid ? pemain.find((p) => p.id === uid) : null

  const data = kuis.pertanyaan.map((soal, i) => {
    const menjawab = pemain.map((p) => p.jawaban?.[i]).filter(Boolean)
    const benar = menjawab.filter((j) => j.benar).length
    const persen = total ? Math.round((benar / total) * 100) : 0
    const waktu = menjawab.map((j) => j.ms).filter(Number.isFinite)
    const rataMs = waktu.length ? waktu.reduce((a, b) => a + b, 0) / waktu.length : null
    const opsi = opsiSoal(kode, i, soal).map((o) => ({
      ...o,
      jumlah: menjawab.filter((j) => j.pilih === o.text).length,
    }))
    const pengecoh = opsi.filter((o) => !o.benar).sort((a, b) => b.jumlah - a.jumlah)[0]
    return {
      i,
      soal,
      benar,
      persen,
      rataMs,
      opsi,
      kosong: total - menjawab.length,
      pengecoh,
      saya: sayaPemain?.jawaban?.[i],
    }
  })

  if (total === 0) {
    return <p className="text-lembut">Belum ada pemain, jadi belum ada data untuk dievaluasi.</p>
  }

  const rataBenar = Math.round(data.reduce((a, d) => a + d.persen, 0) / data.length)
  const tersulit = [...data].sort((a, b) => a.persen - b.persen)[0]
  const termudah = [...data].sort((a, b) => b.persen - a.persen)[0]
  const sayaBenar = sayaPemain ? data.filter((d) => d.saya?.benar).length : 0

  return (
    <section aria-labelledby="judul-evaluasi">
      <h2 id="judul-evaluasi" className="border-b-2 border-tinta pb-3 text-2xl font-bold sm:text-3xl">
        Evaluasi soal
      </h2>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {sayaPemain ? (
          <div className="rounded-2xl border-2 border-tinta bg-pensil/40 p-4">
            <div className="text-sm text-lembut">Jawabanmu yang benar</div>
            <div className="font-display text-3xl font-extrabold">
              {sayaBenar} <span className="text-lg text-lembut">/ {data.length}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-tinta bg-white p-4">
            <div className="text-sm text-lembut">Rata-rata jawaban benar</div>
            <div className="font-display text-3xl font-extrabold">{rataBenar}%</div>
          </div>
        )}
        <div className="rounded-2xl border-2 border-garis bg-white p-4">
          <div className="text-sm text-lembut">Soal tersulit</div>
          <div className="font-display text-3xl font-extrabold">
            No. {tersulit.i + 1} <span className="text-lg text-salah">{tersulit.persen}%</span>
          </div>
        </div>
        <div className="rounded-2xl border-2 border-garis bg-white p-4">
          <div className="text-sm text-lembut">Soal termudah</div>
          <div className="font-display text-3xl font-extrabold">
            No. {termudah.i + 1} <span className="text-lg text-benar">{termudah.persen}%</span>
          </div>
        </div>
      </div>

      <ol className="mt-6 space-y-5">
        {data.map((d) => {
          const t = tingkat(d.persen)
          const gambarSoal = d.soal.gambar && gambar[d.soal.gambar]
          const perluDibahas = !uid && (d.persen < 50 || (d.pengecoh && d.pengecoh.jumlah > d.benar))
          return (
            <li key={d.i} className="rounded-2xl border-2 border-tinta bg-white p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="gelembung gelembung-terisi">{d.i + 1}</span>
                <h3 className="min-w-0 flex-1 pt-1 text-lg font-bold leading-snug">{d.soal.soal}</h3>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${t.gaya}`}>{t.nama}</span>
              </div>

              {gambarSoal && <GambarSoal src={gambarSoal} className="mt-4 !max-h-40" />}

              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-lembut">
                <span className="flex items-center gap-1.5">
                  <Target size={14} /> {d.benar} dari {total} pemain benar ({d.persen}%)
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14} /> rata-rata menjawab {detikDari(d.rataMs)}
                </span>
                {d.kosong > 0 && <span>{d.kosong} tidak menjawab</span>}
              </div>

              <ul className="mt-4 space-y-2">
                {d.opsi.map((o, k) => {
                  const lebar = total ? Math.round((o.jumlah / total) * 100) : 0
                  const dipilihSaya = d.saya?.pilih === o.text
                  return (
                    <li key={k} className="relative overflow-hidden rounded-xl border-2 border-garis">
                      <div
                        className={`absolute inset-y-0 left-0 ${o.benar ? "bg-benar-muda" : "bg-salah-muda"}`}
                        style={{ width: `${lebar}%` }}
                        aria-hidden
                      />
                      <div className="relative flex items-center gap-3 px-3 py-2 text-sm">
                        <span className={`gelembung !h-7 !w-7 !text-xs ${o.benar ? "!border-benar !text-benar" : ""}`}>
                          {String.fromCharCode(65 + k)}
                        </span>
                        <span className="min-w-0 flex-1 truncate">
                          {o.text}
                          {dipilihSaya && <span className="ml-2 font-bold">(pilihanmu)</span>}
                        </span>
                        <span className="font-semibold tabular-nums">{o.jumlah} orang</span>
                      </div>
                    </li>
                  )
                })}
              </ul>

              {uid && (
                <p className={`mt-4 text-sm font-semibold ${d.saya?.benar ? "text-benar" : "text-salah"}`}>
                  {!d.saya
                    ? "Kamu tidak menjawab soal ini."
                    : d.saya.benar
                      ? `Benar, +${d.saya.poin} poin dalam ${detikDari(d.saya.ms)}.`
                      : "Jawabanmu kurang tepat."}
                </p>
              )}

              {perluDibahas && (
                <p className="mt-4 rounded-xl bg-pensil/40 px-3 py-2 text-sm">
                  Layak dibahas ulang.
                  {d.pengecoh && d.pengecoh.jumlah > d.benar
                    ? ` Pilihan "${d.pengecoh.text}" lebih banyak dipilih daripada jawaban benar, mungkin soal atau pilihannya membingungkan.`
                    : " Kurang dari separuh pemain menjawab benar."}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}

export default EvaluasiSoal
