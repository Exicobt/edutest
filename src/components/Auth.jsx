"use client"

import { GoogleLogo } from "@phosphor-icons/react/dist/ssr"
import { handleLogin } from "@/libs/auth"

const Auth = () => (
  <button
    onClick={handleLogin}
    className="cap cursor-pointer inline-flex items-center gap-2 rounded-full border-2 border-tinta bg-white px-4 py-1.5 text-sm font-semibold text-tinta"
  >
    <GoogleLogo size={18} weight="bold" /> Masuk
  </button>
)

export default Auth
