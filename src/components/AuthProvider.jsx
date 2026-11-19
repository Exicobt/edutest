'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc, getFirestore } from "firebase/firestore"
import { app, auth } from "@/libs/firebase"

const db = getFirestore(app)

const AuthContext = createContext({
  user: null,
  profil: null,
  nama: "",
  foto: null,
  punyaFotoUnggahan: false,
  loading: true,
  perbaruiProfil: () => {},
})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (!u) {
        setProfil(null)
        setLoading(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, "users", u.uid))
        setProfil(snap.exists() ? snap.data() : {})
      } catch (err) {
        console.error("Gagal mengambil data profil:", err)
        setProfil({})
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  // Menggabungkan perubahan ke state lokal; nilai undefined menghapus field
  const perbaruiProfil = useCallback((data) => {
    setProfil((prev) => {
      const next = { ...(prev || {}), ...data }
      Object.keys(next).forEach((k) => next[k] === undefined && delete next[k])
      return next
    })
  }, [])

  const value = useMemo(() => {
    const nama = profil?.username || user?.displayName || ""
    const foto = profil?.fotoProfil || user?.photoURL || null
    return {
      user,
      profil,
      nama,
      foto,
      punyaFotoUnggahan: Boolean(profil?.fotoProfil),
      loading,
      perbaruiProfil,
    }
  }, [user, profil, loading, perbaruiProfil])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
