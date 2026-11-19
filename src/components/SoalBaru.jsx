'use client'

import { ImagePlus, Plus, Trash2, X } from "lucide-react"
import OpsiJawaban from "./OpsiJawaban"
import { useRef, useState } from "react"
import toast from "react-hot-toast"
import { kompresGambarSoal } from "@/libs/gambar"

export const MIN_PILIHAN = 2
export const MAKS_PILIHAN = 5

/**
 * Editor satu soal, dikendalikan penuh oleh induk (agar bisa diisi lewat impor JSON).
 * data = { kunci, soal, pilihan: string[], benarIndex: number | null, gambar: string | null }
 */
const SoalBaru = ({ nomorSoal, data, onUbah, onDelete }) => {
  const [memprosesGambar, setMemprosesGambar] = useState(false)
  const fileRef = useRef(null)
  const { kunci, soal, pilihan, benarIndex, gambar } = data

  const pilihGambar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setMemprosesGambar(true)
    try {
      onUbah({ gambar: await kompresGambarSoal(file) })
    } catch (err) {
      toast.error(err.message || "Gambar tidak bisa diproses")
    } finally {
      setMemprosesGambar(false)
    }
  }

  const ubahTeks = (i, nilai) => onUbah({ pilihan: pilihan.map((p, k) => (k === i ? nilai : p)) })

  const tambahPilihan = () => {
    if (pilihan.length >= MAKS_PILIHAN) return
    onUbah({ pilihan: [...pilihan, ""] })
  }

  const hapusPilihan = (i) => {
    if (pilihan.length <= MIN_PILIHAN) return
    onUbah({
      pilihan: pilihan.filter((_, k) => k !== i),
      benarIndex: benarIndex === i ? null : benarIndex !== null && benarIndex > i ? benarIndex - 1 : benarIndex,
    })
  }

  return (
    <fieldset className="my-5 w-full rounded-2xl border-2 border-garis bg-white p-5 transition-colors focus-within:border-tinta">
      <div className="flex items-center justify-between">
        <legend className="float-left font-display text-lg font-bold">Pertanyaan {nomorSoal}</legend>
        <button
          type="button"
          onClick={onDelete}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-salah hover:bg-salah-muda"
        >
          <Trash2 size={16} /> Hapus
        </button>
      </div>

      <div className="clear-both pt-4">
        <label htmlFor={`soal-${kunci}`} className="mb-2 block text-sm font-semibold">Soal</label>
        <input
          id={`soal-${kunci}`}
          value={soal}
          onChange={(e) => onUbah({ soal: e.target.value })}
          type="text"
          autoComplete="off"
          placeholder="Tuliskan pertanyaan di sini"
          className="input"
        />
      </div>

      <div className="mt-5">
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={pilihGambar}
          className="hidden"
        />
        {gambar ? (
          <div className="relative inline-block">
            <img
              src={gambar}
              alt={`Gambar untuk pertanyaan ${nomorSoal}`}
              className="max-h-48 max-w-full rounded-xl border-2 border-tinta object-contain"
            />
            <button
              type="button"
              onClick={() => onUbah({ gambar: null })}
              aria-label="Hapus gambar"
              className="absolute -right-3 -top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-tinta bg-white hover:bg-salah-muda"
            >
              <X size={16} />
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 block cursor-pointer text-sm font-semibold text-biru underline underline-offset-4"
            >
              Ganti gambar
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={memprosesGambar}
            className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-garis px-4 py-3 text-sm font-semibold text-lembut hover:border-tinta hover:text-tinta disabled:opacity-50"
          >
            <ImagePlus size={18} /> {memprosesGambar ? "Memproses gambar..." : "Tambah gambar (opsional)"}
          </button>
        )}
      </div>

      <div className="mt-6">
        <div className="mb-1 text-sm font-semibold">Pilihan jawaban</div>
        <p className="mb-3 text-sm text-lembut">Klik huruf untuk menandai jawaban yang benar.</p>
        <div className="flex flex-col gap-3">
          {pilihan.map((teks, i) => (
            <OpsiJawaban
              key={i}
              nama={`benar-${kunci}`}
              index={i}
              teks={teks}
              benar={benarIndex === i}
              onTeks={(v) => ubahTeks(i, v)}
              onPilihBenar={() => onUbah({ benarIndex: i })}
              onHapus={pilihan.length > MIN_PILIHAN ? () => hapusPilihan(i) : undefined}
            />
          ))}
        </div>
        {pilihan.length < MAKS_PILIHAN && (
          <button
            type="button"
            onClick={tambahPilihan}
            className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold text-biru hover:bg-biru-muda"
          >
            <Plus size={16} /> Tambah pilihan
          </button>
        )}
      </div>
    </fieldset>
  )
}

export default SoalBaru
