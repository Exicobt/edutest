'use client'

import { X } from "lucide-react"

const OpsiJawaban = ({ nama, index = 0, teks, benar, onTeks, onPilihBenar, onHapus }) => {
  const huruf = String.fromCharCode(65 + index)

  return (
    <div className="flex items-center gap-3">
      <label className="flex cursor-pointer items-center" title="Tandai sebagai jawaban benar">
        <input
          type="radio"
          name={nama}
          className="peer sr-only"
          checked={benar}
          onChange={onPilihBenar}
          aria-label={`Jawaban ${huruf} adalah jawaban benar`}
        />
        <span
          className={`gelembung peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-biru ${
            benar ? 'gelembung-terisi !border-benar !bg-benar' : ''
          }`}
        >
          {huruf}
        </span>
      </label>
      <input
        type="text"
        value={teks}
        onChange={(e) => onTeks(e.target.value)}
        autoComplete="off"
        placeholder={`Opsi ${huruf}`}
        aria-label={`Teks jawaban ${huruf}`}
        className="input"
      />
      {onHapus && (
        <button
          type="button"
          onClick={onHapus}
          aria-label={`Hapus opsi ${huruf}`}
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg text-lembut hover:bg-salah-muda hover:text-salah"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}

export default OpsiJawaban
