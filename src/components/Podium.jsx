import Avatar from "./Avatar"
import { urutkanPemain } from "@/libs/ruang"

const kolom = [
  // urutan tampil: peringkat 2, 1, 3
  { idx: 1, tinggi: "h-28", warna: "bg-garis", delay: "0.5s" },
  { idx: 0, tinggi: "h-40", warna: "bg-pensil", delay: "0.9s" },
  { idx: 2, tinggi: "h-20", warna: "bg-[#e9b88a]", delay: "0.1s" },
]

const Podium = ({ pemain }) => {
  const urut = urutkanPemain(pemain)
  if (urut.length === 0) return null

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-5" role="list" aria-label="Tiga besar">
      {kolom.map(({ idx, tinggi, warna, delay }) => {
        const p = urut[idx]
        if (!p) return <div key={idx} className="w-24 sm:w-32" aria-hidden />
        return (
          <div key={idx} role="listitem" className="flex w-24 flex-col items-center sm:w-32">
            <Avatar src={p.foto} nama={p.nama} ukuran={idx === 0 ? 72 : 56} className="border-2 border-tinta" />
            <div className="mt-2 w-full truncate text-center text-sm font-bold">{p.nama}</div>
            <div className="font-display text-lg font-extrabold tabular-nums">{p.skor ?? 0}</div>
            <div
              style={{ animationDelay: delay }}
              className={`podium-naik mt-2 flex w-full items-start justify-center rounded-t-2xl border-2 border-b-0 border-tinta pt-2 ${tinggi} ${warna}`}
            >
              <span className="font-display text-4xl font-extrabold">{idx + 1}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default Podium
