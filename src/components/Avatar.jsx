'use client'

import { useEffect, useState } from "react"

const WARNA = ["#2b3fd6", "#1e9e6a", "#c2410c", "#7c3aed", "#0e7490", "#be123c"]

const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

const Avatar = ({ src, nama = "", ukuran = 36, className = "" }) => {
  const [gagal, setGagal] = useState(false)

  useEffect(() => setGagal(false), [src])

  const gaya = { width: ukuran, height: ukuran }

  if (src && !gagal) {
    return (
      <img
        src={src}
        alt={nama ? `Foto profil ${nama}` : "Foto profil"}
        referrerPolicy="no-referrer"
        onError={() => setGagal(true)}
        style={gaya}
        className={`rounded-full object-cover bg-biru-muda ${className}`}
      />
    )
  }

  const inisial = (nama.trim()[0] || "?").toUpperCase()
  return (
    <span
      role="img"
      aria-label={nama ? `Inisial ${nama}` : "Tanpa foto profil"}
      style={{ ...gaya, background: WARNA[hash(nama) % WARNA.length], fontSize: ukuran * 0.42 }}
      className={`inline-flex items-center justify-center rounded-full font-display font-bold text-white select-none ${className}`}
    >
      {inisial}
    </span>
  )
}

export default Avatar
