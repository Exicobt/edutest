"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Clock, Tag, Brain } from "@phosphor-icons/react/dist/ssr"
import { ArrowLeft, ChevronRight, Users } from "lucide-react"
import Link from "next/link"
import Button from "@/components/Button"
import { ambilKuis } from "@/libs/ambilKuis"
import { formatDurasi } from "@/libs/format"
import toast from "react-hot-toast"
import Loading from "@/app/loading"
import Auth from "@/components/Auth"
import { useAuth } from "@/components/AuthProvider"
import { buatRuang } from "@/libs/ruang"

const Info = ({ ikon, label, nilai }) => (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-garis p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-biru-muda text-biru-tua">
            {ikon}
        </div>
        <div>
            <div className="text-sm text-lembut">{label}</div>
            <div className="font-bold">{nilai}</div>
        </div>
    </div>
)

const Page = () => {
    const params = useParams()
    const { id } = params
    const [kuis, setKuis] = useState(null)
    const [loading, setLoading] = useState(true)
    const [membuatRuang, setMembuatRuang] = useState(false)
    const router = useRouter()
    const { user, nama } = useAuth()

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return

            try {
                const data = await ambilKuis(id)
                if (data) setKuis(data)
            } catch (err) {
                toast.error("Gagal memuat kuis")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    if (loading) return <Loading />

    if (!kuis) {
        return (
            <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
                <h1 className="text-2xl font-bold">Kuis tidak ditemukan</h1>
                <p className="mt-2 text-lembut">Kuis ini mungkin sudah dihapus atau tautannya salah.</p>
                <Link href="/" className="mt-6">
                    <Button variant="secondary" size="md">Kembali ke beranda</Button>
                </Link>
            </div>
        )
    }

    // Kuis lama tanpa field "pembuat" boleh di-host siapa saja yang sudah masuk
    const bolehHost = user && (!kuis.pembuat || kuis.pembuat === user.uid)

    const buatRuangBaru = async () => {
        setMembuatRuang(true)
        try {
            const kode = await buatRuang({ kuisId: id, kuis, user, nama })
            router.push(`/ruang/${kode}`)
        } catch (err) {
            console.error(err)
            toast.error(err.message || "Gagal membuat ruang")
            setMembuatRuang(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
            <Link href="/" className="inline-block">
                <Button variant="ghost"><ArrowLeft size={16} /> Kembali</Button>
            </Link>

            <div className="mt-4 rounded-3xl border-2 border-tinta bg-white p-6 sm:p-10">
                <h1 className="text-3xl font-extrabold sm:text-4xl">{kuis.judul}</h1>
                <p className="mt-3 max-w-xl text-lg text-lembut">{kuis.deskripsi}</p>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <Info ikon={<Tag size={22} />} label="Kategori" nilai={kuis.kategori} />
                    <Info ikon={<Brain size={22} />} label="Pertanyaan" nilai={`${kuis.pertanyaan?.length ?? 0} soal`} />
                    <Info ikon={<Clock size={22} />} label="Waktu" nilai={formatDurasi(kuis.waktu)} />
                </div>

                <div className="mt-10 grid gap-3 sm:grid-cols-2">
                    <Button
                        onClick={() => router.push(`/main-kuis/${id}/mulai-kuis`)}
                        variant="secondary"
                        size="lg"
                    >
                        Main sendiri <ChevronRight size={20} />
                    </Button>

                    {bolehHost && (
                        <Button onClick={buatRuangBaru} variant="success" size="lg" disabled={membuatRuang}>
                            <Users size={20} /> {membuatRuang ? "Membuat ruang..." : "Buat ruang multiplayer"}
                        </Button>
                    )}
                </div>

                {!user && (
                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-lembut">
                        Masuk untuk membuat ruang multiplayer. <Auth />
                    </div>
                )}
                {user && !bolehHost && (
                    <p className="mt-5 text-sm text-lembut">
                        Ruang multiplayer hanya bisa dibuat oleh pembuat kuis{kuis.pembuatNama ? ` (${kuis.pembuatNama})` : ""}.
                        Minta kode ruang dari host untuk bergabung.
                    </p>
                )}
                <p className="mt-4 text-sm text-lembut">
                    Mode main sendiri: waktu berjalan begitu kuis dimulai. Di multiplayer, pembuat kuis menjadi host dan tidak ikut bermain.
                </p>
            </div>
        </div>
    )
}

export default Page
