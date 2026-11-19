import { useEffect, useRef, useState } from "react"

/**
 * Hitung mundur lokal. `kunci` berubah => timer mulai ulang dari `detik`.
 * Selama render pertama setelah kunci berubah, nilai yang dikembalikan sudah `detik`
 * (bukan sisa timer sebelumnya), sehingga tidak memicu "waktu habis" palsu.
 */
export function useHitungMundur(kunci, detik, aktif = true) {
  const [state, setState] = useState({ kunci, sisa: detik })
  const mulaiRef = useRef(Date.now())

  useEffect(() => {
    mulaiRef.current = Date.now()
    setState({ kunci, sisa: detik })
    if (!aktif) return

    const timer = setInterval(() => {
      const sisa = Math.max(0, detik - (Date.now() - mulaiRef.current) / 1000)
      setState({ kunci, sisa })
      if (sisa <= 0) clearInterval(timer)
    }, 200)

    return () => clearInterval(timer)
  }, [kunci, detik, aktif])

  const sisa = state.kunci === kunci ? state.sisa : detik
  return { sisa, mulaiRef }
}
