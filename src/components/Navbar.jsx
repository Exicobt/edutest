import Link from "next/link"
import Profile from "./Profile"
import Logo from "./Logo"

const Navbar = () => (
  <header className="sticky top-0 z-50 border-b-2 border-tinta bg-kertas/90 backdrop-blur">
    <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
      <Link href="/" aria-label="EduTest, ke beranda">
        <Logo />
      </Link>
      <div className="flex items-center gap-2 sm:gap-4">
        <Link
          href="/riwayat"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-lembut hover:bg-black/5 hover:text-tinta"
        >
          Riwayat
        </Link>
        <Link
          href="/buat-kuis"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-lembut hover:bg-black/5 hover:text-tinta"
        >
          Buat kuis
        </Link>
        <Profile />
      </div>
    </nav>
  </header>
)

export default Navbar
