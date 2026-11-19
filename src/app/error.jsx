'use client'

import { useEffect } from "react"
import Button from "@/components/Button"

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Terjadi error:", error)
  }, [error])

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Ada yang tidak beres</h1>
      <p className="mt-2 text-lembut">
        Halaman gagal dimuat. Coba lagi, dan jika masih gagal, periksa koneksi internetmu.
      </p>
      <Button variant="secondary" size="md" className="mt-6" onClick={() => reset()}>
        Coba lagi
      </Button>
    </div>
  )
}
