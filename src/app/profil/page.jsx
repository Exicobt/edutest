"use client"

import { useRef, useState } from "react"
import { Camera, ImageUp, Trash2, Check, X } from "lucide-react"
import toast from "react-hot-toast"
import Swal from "sweetalert2"
import Button from "@/components/Button"
import Avatar from "@/components/Avatar"
import Auth from "@/components/Auth"
import Loading from "@/app/loading"
import { useAuth } from "@/components/AuthProvider"
import {
  BATAS_FILE_MB,
  hapusFotoProfil,
  kompresFoto,
  simpanFotoProfil,
  simpanUsername,
} from "@/libs/profil"

export default function ProfilPage() {
  const { user, nama, foto, punyaFotoUnggahan, loading, perbaruiProfil } = useAuth()

  const fileRef = useRef(null)
  const [pratinjau, setPratinjau] = useState(null)
  const [menyimpanFoto, setMenyimpanFoto] = useState(false)
  const [diseret, setDiseret] = useState(false)

  const [username, setUsername] = useState(null)
  const [menyimpanNama, setMenyimpanNama] = useState(false)

  if (loading) return <Loading />

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-extrabold">Masuk untuk mengatur profil</h1>
        <p className="mt-2 text-lembut">Foto dan nama panggilanmu tersimpan di akun Google yang kamu pakai.</p>
        <div className="mt-6">
          <Auth />
        </div>
      </div>
    )
  }

  const bacaFile = async (file) => {
    try {
      setPratinjau(await kompresFoto(file))
    } catch (err) {
      toast.error(err.message || "Foto tidak bisa diproses")
    }
  }

  const saatPilihFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (file) bacaFile(file)
  }

  const saatDrop = (e) => {
    e.preventDefault()
    setDiseret(false)
    const file = e.dataTransfer.files?.[0]
    if (file) bacaFile(file)
  }

  const simpanFoto = async () => {
    if (!pratinjau) return
    setMenyimpanFoto(true)
    try {
      await simpanFotoProfil(user.uid, pratinjau)
      perbaruiProfil({ fotoProfil: pratinjau })
      setPratinjau(null)
      toast.success("Foto profil diperbarui")
    } catch (err) {
      console.error(err)
      toast.error("Foto gagal disimpan. Coba lagi.")
    } finally {
      setMenyimpanFoto(false)
    }
  }

  const hapusFoto = async () => {
    const hasil = await Swal.fire({
      title: "Hapus foto unggahan?",
      text: user.photoURL
        ? "Fotomu akan kembali memakai foto dari akun Google."
        : "Profilmu akan menampilkan inisial namamu.",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#e5484d",
      cancelButtonColor: "#5b6478",
    })
    if (!hasil.isConfirmed) return

    try {
      await hapusFotoProfil(user.uid)
      perbaruiProfil({ fotoProfil: undefined })
      toast.success("Foto unggahan dihapus")
    } catch (err) {
      console.error(err)
      toast.error("Foto gagal dihapus. Coba lagi.")
    }
  }

  const namaTerisi = username ?? nama
  const namaBersih = namaTerisi.trim()
  const namaBerubah = namaBersih !== nama && namaBersih.length > 0

  const simpanNama = async (e) => {
    e.preventDefault()
    if (namaBersih.length < 2 || namaBersih.length > 24) {
      toast.error("Nama panggilan harus 2 sampai 24 karakter")
      return
    }
    setMenyimpanNama(true)
    try {
      await simpanUsername(user.uid, namaBersih)
      perbaruiProfil({ username: namaBersih })
      setUsername(null)
      toast.success("Nama panggilan diperbarui")
    } catch (err) {
      console.error(err)
      toast.error("Nama gagal disimpan. Coba lagi.")
    } finally {
      setMenyimpanNama(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-12 sm:px-6 sm:pt-16">
      <h1 className="text-4xl font-extrabold sm:text-5xl">Profil saya</h1>
      <p className="mt-2 text-lembut">Atur foto dan nama yang tampil di EduTest.</p>

      <section
        aria-labelledby="judul-foto"
        className="mt-10 rounded-3xl border-2 border-tinta bg-white p-6 sm:p-8"
      >
        <h2 id="judul-foto" className="text-xl font-bold">Foto profil</h2>

        <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <div className="relative shrink-0">
            <Avatar
              src={pratinjau || foto}
              nama={nama}
              ukuran={160}
              className="border-4 border-tinta"
            />
            {pratinjau && (
              <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-tinta bg-pensil px-3 py-0.5 text-xs font-bold">
                Pratinjau
              </span>
            )}
          </div>

          <div className="w-full flex-1">
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDiseret(true)
              }}
              onDragLeave={() => setDiseret(false)}
              onDrop={saatDrop}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), fileRef.current?.click())}
              role="button"
              tabIndex={0}
              aria-label="Pilih atau seret foto untuk diunggah"
              className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                diseret ? "border-biru bg-biru-muda" : "border-garis hover:border-tinta hover:bg-kertas"
              }`}
            >
              <ImageUp size={28} className="text-biru" />
              <div className="font-semibold">Seret foto ke sini, atau klik untuk memilih</div>
              <div className="text-sm text-lembut">
                JPG, PNG, WEBP, atau GIF, maksimal {BATAS_FILE_MB} MB. Foto dipotong persegi otomatis.
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={saatPilihFile}
                className="hidden"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {pratinjau ? (
                <>
                  <Button variant="secondary" onClick={simpanFoto} disabled={menyimpanFoto}>
                    <Check size={16} /> {menyimpanFoto ? "Menyimpan..." : "Simpan foto"}
                  </Button>
                  <Button variant="ghost" onClick={() => setPratinjau(null)} disabled={menyimpanFoto}>
                    <X size={16} /> Batal
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={() => fileRef.current?.click()}>
                    <Camera size={16} /> {punyaFotoUnggahan ? "Ganti foto" : "Unggah foto"}
                  </Button>
                  {punyaFotoUnggahan && (
                    <Button variant="danger" onClick={hapusFoto}>
                      <Trash2 size={16} /> Hapus foto unggahan
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="judul-nama"
        className="mt-6 rounded-3xl border-2 border-tinta bg-white p-6 sm:p-8"
      >
        <h2 id="judul-nama" className="text-xl font-bold">Nama panggilan</h2>

        <form onSubmit={simpanNama} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="username" className="sr-only">Nama panggilan</label>
          <input
            id="username"
            value={namaTerisi}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={24}
            autoComplete="off"
            className="input sm:max-w-xs"
          />
          <Button type="submit" variant="secondary" disabled={!namaBerubah || menyimpanNama}>
            {menyimpanNama ? "Menyimpan..." : "Simpan nama"}
          </Button>
        </form>

        <dl className="mt-6 text-sm">
          <dt className="text-lembut">Email akun</dt>
          <dd className="font-semibold">{user.email}</dd>
        </dl>
      </section>
    </div>
  )
}
