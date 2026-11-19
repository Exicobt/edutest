'use client'

import { useEffect } from "react"
import { Volume2, VolumeX } from "lucide-react"
import { aturBisu, suara, useBisu } from "@/libs/suara"

const TombolSuara = () => {
  const bisu = useBisu()

  // Browser baru mengizinkan suara setelah ada interaksi pengguna
  useEffect(() => {
    const buka = () => suara.bukaKunci()
    window.addEventListener("pointerdown", buka, { once: true })
    window.addEventListener("keydown", buka, { once: true })
    return () => {
      window.removeEventListener("pointerdown", buka)
      window.removeEventListener("keydown", buka)
    }
  }, [])

  return (
    <button
      onClick={() => {
        aturBisu(!bisu)
        if (bisu) suara.klik()
      }}
      aria-pressed={bisu}
      aria-label={bisu ? "Nyalakan suara" : "Matikan suara"}
      title={bisu ? "Nyalakan suara" : "Matikan suara"}
      className="cap fixed bottom-4 right-4 z-[90] flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border-2 border-tinta bg-white"
    >
      {bisu ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  )
}

export default TombolSuara
