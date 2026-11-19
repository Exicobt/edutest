import { ArrowDown, ArrowUp } from "lucide-react"
import Avatar from "./Avatar"
import { urutkanPemain } from "@/libs/ruang"

// indeksSoal: bila diisi, tampilkan perubahan peringkat dibanding sebelum soal itu
const Papan = ({ pemain, uid, batas, tampilPoin, daftarSaja = false, indeksSoal }) => {
  const urut = daftarSaja ? [...pemain] : urutkanPemain(pemain)

  const peringkatSebelum = {}
  if (indeksSoal !== undefined && !daftarSaja) {
    urutkanPemain(
      pemain.map((p) => ({ ...p, skor: (p.skor ?? 0) - (p.jawaban?.[indeksSoal]?.poin ?? 0) }))
    ).forEach((p, i) => (peringkatSebelum[p.id] = i))
  }
  const daftar = batas ? urut.slice(0, batas) : urut

  if (daftar.length === 0) {
    return <p className="text-lembut">Belum ada pemain.</p>
  }

  return (
    <ol className="space-y-2">
      {daftar.map((p, i) => {
        const saya = p.id === uid
        const poinSoal = tampilPoin?.(p)
        const delta = indeksSoal !== undefined && !daftarSaja ? peringkatSebelum[p.id] - i : 0
        return (
          <li
            key={p.id}
            style={{ animationDelay: `${i * 60}ms` }}
            className={`masuk-kiri flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 ${
              saya ? "border-tinta bg-pensil/40" : "border-garis bg-white"
            }`}
          >
            {!daftarSaja && (
              <span
                className={`gelembung !h-8 !w-8 !text-sm ${i === 0 ? "gelembung-terisi !border-pensil !bg-pensil !text-tinta" : ""}`}
                aria-label={`Peringkat ${i + 1}`}
              >
                {i + 1}
              </span>
            )}
            <Avatar src={p.foto} nama={p.nama} ukuran={36} />
            <span className="min-w-0 flex-1 truncate font-semibold">
              {p.nama}
              {saya && <span className="ml-2 text-sm font-normal text-lembut">(kamu)</span>}
            </span>
            {delta !== 0 && (
              <span
                className={`flex items-center text-xs font-bold ${delta > 0 ? "text-benar" : "text-salah"}`}
                aria-label={delta > 0 ? `Naik ${delta} peringkat` : `Turun ${-delta} peringkat`}
              >
                {delta > 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {Math.abs(delta)}
              </span>
            )}
            {poinSoal !== undefined && poinSoal !== null && (
              <span className={`text-sm font-semibold ${poinSoal > 0 ? "text-benar" : "text-lembut"}`}>
                +{poinSoal}
              </span>
            )}
            {!daftarSaja && (
              <span className="font-display text-lg font-extrabold tabular-nums">{p.skor ?? 0}</span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default Papan
