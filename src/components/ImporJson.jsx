'use client'

import { useRef, useState } from "react"
import { ClipboardPaste, Copy, Download, FileJson, Sparkles } from "lucide-react"
import toast from "react-hot-toast"
import Button from "./Button"
import { BATAS_SOAL_IMPOR, MAKS_SALAH, contohJson, parseImporKuis, promptAI } from "@/libs/impor"
import { KATEGORI } from "@/libs/kategori"

const BATAS_TAMPIL = 6

const Daftar = ({ judul, item, gaya }) => {
  if (!item.length) return null
  return (
    <div className={`mt-3 rounded-xl border-2 px-4 py-3 text-sm ${gaya}`}>
      <div className="font-bold">{judul}</div>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">
        {item.slice(0, BATAS_TAMPIL).map((t, i) => (
          <li key={i}>{t}</li>
        ))}
      </ul>
      {item.length > BATAS_TAMPIL && <div className="mt-1">dan {item.length - BATAS_TAMPIL} lainnya.</div>}
    </div>
  )
}

/** Panel impor soal dari JSON. `onImpor(hasil)` mengembalikan true bila hasil diterapkan. */
const ImporJson = ({ onImpor }) => {
  const fileRef = useRef(null)
  const [tempel, setTempel] = useState(false)
  const [teks, setTeks] = useState("")
  const [hasil, setHasil] = useState(null)
  const [diseret, setDiseret] = useState(false)
  const [sibuk, setSibuk] = useState(false)

  const proses = async (mentah) => {
    setSibuk(true)
    try {
      const h = parseImporKuis(mentah)
      setHasil(h)
      if (!h.ok) return
      const diterapkan = await onImpor(h)
      if (diterapkan) {
        setTeks("")
        setTempel(false)
      }
    } finally {
      setSibuk(false)
    }
  }

  const bacaFile = async (file) => {
    if (!file) return
    if (file.size > 1024 * 1024) {
      toast.error("File terlalu besar. Maksimal 1 MB.")
      return
    }
    try {
      await proses(await file.text())
    } catch {
      toast.error("File tidak bisa dibaca.")
    }
  }

  const unduhContoh = () => {
    const url = URL.createObjectURL(new Blob([contohJson()], { type: "application/json" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "contoh-kuis.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const salinPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptAI())
      toast.success("Prompt disalin. Tempel ke AI favoritmu, lalu isi topik dan jumlah soal.")
    } catch {
      toast.error("Gagal menyalin prompt")
    }
  }

  return (
    <section
      aria-labelledby="judul-impor"
      onDragOver={(e) => {
        e.preventDefault()
        setDiseret(true)
      }}
      onDragLeave={() => setDiseret(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDiseret(false)
        bacaFile(e.dataTransfer.files?.[0])
      }}
      className={`mt-10 rounded-3xl border-2 border-dashed p-6 transition-colors sm:p-8 ${
        diseret ? "border-biru bg-biru-muda" : "border-tinta bg-white"
      }`}
    >
      <h2 id="judul-impor" className="flex items-center gap-2 text-xl font-bold">
        <FileJson size={22} /> Impor soal dari JSON
      </h2>
      <p className="mt-1 text-lembut">
        Punya banyak soal? Unggah file JSON atau tempel isinya, dan semua soal terisi otomatis. Kamu masih bisa
        mengeceknya sebelum menyimpan. Seret file ke kotak ini juga bisa.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json,text/plain"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ""
          bacaFile(f)
        }}
      />

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={sibuk}>
          <FileJson size={16} /> Pilih file JSON
        </Button>
        <Button onClick={() => setTempel((t) => !t)} disabled={sibuk}>
          <ClipboardPaste size={16} /> {tempel ? "Tutup kotak tempel" : "Tempel JSON"}
        </Button>
        <Button variant="ghost" onClick={unduhContoh}>
          <Download size={16} /> Unduh contoh
        </Button>
        <Button variant="ghost" onClick={salinPrompt}>
          <Sparkles size={16} /> Salin prompt untuk AI
        </Button>
      </div>

      {tempel && (
        <div className="mt-4">
          <label htmlFor="tempel-json" className="sr-only">Tempel JSON di sini</label>
          <textarea
            id="tempel-json"
            value={teks}
            onChange={(e) => setTeks(e.target.value)}
            rows={8}
            spellCheck={false}
            placeholder={'{\n  "pertanyaan": [\n    { "soal": "...", "benar": "...", "salah": ["...", "..."] }\n  ]\n}'}
            className="input font-mono text-sm"
          />
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() => proses(teks)}
            disabled={sibuk || !teks.trim()}
          >
            Impor soal
          </Button>
        </div>
      )}

      <div role="status" aria-live="polite">
        {hasil && <Daftar judul="Impor gagal atau sebagian dilewati" item={hasil.galat} gaya="border-salah bg-salah-muda" />}
        {hasil && <Daftar judul="Perlu diperhatikan" item={hasil.peringatan} gaya="border-garis bg-pensil/30" />}
      </div>

      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold text-biru underline underline-offset-4">
          Lihat format JSON
        </summary>
        <pre className="mt-3 overflow-x-auto rounded-xl bg-tinta p-4 text-sm leading-relaxed text-white">
          <code>{contohJson()}</code>
        </pre>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-lembut">
          <li>
            Hanya <code className="font-mono text-tinta">pertanyaan</code> yang wajib. Isi tiap soal:{" "}
            <code className="font-mono text-tinta">soal</code>, <code className="font-mono text-tinta">benar</code> (satu jawaban),
            dan <code className="font-mono text-tinta">salah</code> (1 sampai {MAKS_SALAH} jawaban).
          </li>
          <li>
            <code className="font-mono text-tinta">judul</code>, <code className="font-mono text-tinta">deskripsi</code>,{" "}
            <code className="font-mono text-tinta">waktu</code> (detik), <code className="font-mono text-tinta">tipe</code> (publik
            atau private) bersifat opsional.
          </li>
          <li>
            <code className="font-mono text-tinta">kategori</code> harus salah satu dari: {KATEGORI.join(", ")}.
          </li>
          <li>Maksimal {BATAS_SOAL_IMPOR} soal per impor. Gambar ditambahkan manual setelah impor.</li>
          <li>Format lama dengan kunci seperti &quot;Pertanyaan 1&quot;, &quot;True&quot;, dan &quot;False&quot; juga dikenali.</li>
        </ul>
      </details>
    </section>
  )
}

export default ImporJson
