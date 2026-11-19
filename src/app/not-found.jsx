import Link from "next/link"
import Button from "@/components/Button"

const NotFound = () => (
  <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
    <div className="font-display text-7xl font-extrabold">404</div>
    <h1 className="mt-2 text-2xl font-bold">Halaman tidak ditemukan</h1>
    <p className="mt-2 text-lembut">
      Alamatnya mungkin salah ketik, atau kuis ini sudah dihapus.
    </p>
    <Link href="/" className="mt-6">
      <Button variant="secondary" size="md">Kembali ke beranda</Button>
    </Link>
  </div>
)

export default NotFound
