'use client'

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { LogOut, ChevronDown, UserRound } from "lucide-react"
import Swal from "sweetalert2"
import { auth } from "@/libs/firebase"
import { useAuth } from "./AuthProvider"
import Avatar from "./Avatar"
import Auth from "./Auth"

const Profile = () => {
  const { user, nama, foto, loading } = useAuth()
  const [terbuka, setTerbuka] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!terbuka) return
    const tutupSaatKlikLuar = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setTerbuka(false)
    }
    const tutupSaatEsc = (e) => e.key === "Escape" && setTerbuka(false)
    document.addEventListener("mousedown", tutupSaatKlikLuar)
    document.addEventListener("keydown", tutupSaatEsc)
    return () => {
      document.removeEventListener("mousedown", tutupSaatKlikLuar)
      document.removeEventListener("keydown", tutupSaatEsc)
    }
  }, [terbuka])

  const keluar = () => {
    setTerbuka(false)
    Swal.fire({
      title: "Keluar dari EduTest?",
      text: "Kamu bisa masuk lagi kapan saja dengan akun Google.",
      showCancelButton: true,
      confirmButtonText: "Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#e5484d",
      cancelButtonColor: "#5b6478",
    }).then((hasil) => {
      if (hasil.isConfirmed) auth.signOut()
    })
  }

  if (loading) return <div className="h-9 w-24 rounded-full bg-black/5 animate-pulse" aria-hidden />
  if (!user) return <Auth />

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setTerbuka((t) => !t)}
        aria-haspopup="menu"
        aria-expanded={terbuka}
        className="flex items-center gap-2 rounded-full border-2 border-transparent py-1 pl-1 pr-2 hover:border-garis cursor-pointer transition-colors"
      >
        <Avatar src={foto} nama={nama} ukuran={36} />
        <span className="hidden max-w-32 truncate text-sm font-semibold sm:block">{nama}</span>
        <ChevronDown
          size={16}
          className={`text-lembut transition-transform duration-200 ${terbuka ? "rotate-180" : ""}`}
        />
      </button>

      {terbuka && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-2xl border-2 border-tinta bg-white shadow-[0_4px_0_0_var(--tinta)]"
        >
          <div className="border-b border-garis px-4 py-3">
            <div className="truncate text-sm font-bold">{nama}</div>
            <div className="truncate text-xs text-lembut">{user.email}</div>
          </div>
          <Link
            href="/profil"
            role="menuitem"
            onClick={() => setTerbuka(false)}
            className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-biru-muda"
          >
            <UserRound size={16} /> Profil saya
          </Link>
          <button
            role="menuitem"
            onClick={keluar}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-salah hover:bg-salah-muda cursor-pointer"
          >
            <LogOut size={16} /> Keluar
          </button>
        </div>
      )}
    </div>
  )
}

export default Profile
