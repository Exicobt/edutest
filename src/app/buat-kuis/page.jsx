"use client";

import Button from "@/components/Button";
import Select from "@/components/Select";
import SoalBaru from "@/components/SoalBaru";
import ImporJson from "@/components/ImporJson";
import { ArrowLeft, Plus, Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { simpanKuis } from "@/libs/simpanKuis";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { useAuth } from "@/components/AuthProvider";
import Auth from "@/components/Auth";
import Loading from "@/app/loading";

// "kunci" membuat tiap soal punya identitas stabil, sehingga menghapus soal di tengah
// tidak menggeser isi soal lain. Field ini tidak ikut disimpan.
let nomorKunci = 0;
const buatSoal = (isi = {}) => ({
  kunci: ++nomorKunci,
  soal: "",
  pilihan: ["", "", ""],
  benarIndex: null,
  gambar: null,
  ...isi,
});

const soalKosong = (p) => !p.soal.trim() && !p.gambar && p.pilihan.every((x) => !x.trim());

const generateKode = () => {
  const karakter = "abcdefghijklmnopqrstuvwxyz0123456789";
  let kode = "";
  for (let i = 0; i < 6; i++) {
    kode += karakter[Math.floor(Math.random() * karakter.length)];
  }
  return kode;
};

const OpsiTipe = ({ nilai, tipe, onPilih, judul, deskripsi }) => (
  <label
    className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors ${
      tipe === nilai ? "border-tinta bg-biru-muda" : "border-garis bg-white hover:border-[#b9c1d1]"
    }`}
  >
    <input
      type="radio"
      name="tipe"
      value={nilai}
      checked={tipe === nilai}
      onChange={() => onPilih(nilai)}
      className="peer sr-only"
    />
    <span
      className={`gelembung mt-0.5 !h-6 !w-6 peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-biru ${
        tipe === nilai ? "gelembung-terisi" : ""
      }`}
    />
    <span>
      <span className="block font-bold">{judul}</span>
      <span className="block text-sm text-lembut">{deskripsi}</span>
    </span>
  </label>
);

const Page = () => {
  const router = useRouter();
  const { user, nama, loading: loadingAuth } = useAuth();
  const [pertanyaan, setPertanyaan] = useState(() => [buatSoal(), buatSoal(), buatSoal()]);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [kategori, setKategori] = useState("");
  const [waktu, setWaktu] = useState(0);
  const [tipe, setTipe] = useState("publik");
  const [kodeSoal, setKodeSoal] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  const ubahSoal = (kunci, perubahan) =>
    setPertanyaan((prev) => prev.map((p) => (p.kunci === kunci ? { ...p, ...perubahan } : p)));

  const tambahPertanyaan = () => setPertanyaan((prev) => [...prev, buatSoal()]);

  const aturTipe = (value) => {
    setTipe(value);
    setKodeSoal(value === "private" ? (kodeSoal || generateKode()) : "");
  };

  const hapusSoal = (index) => {
    if (pertanyaan.length < 4) {
      toast.error("Kuis minimal memiliki 3 pertanyaan");
      return;
    }
    setPertanyaan(pertanyaan.filter((_, i) => i !== index));
  };

  const salinKode = async () => {
    try {
      await navigator.clipboard.writeText(kodeSoal);
      toast.success("Kode disalin");
    } catch {
      toast.error("Kode gagal disalin");
    }
  };

  /** Menerapkan hasil impor JSON ke form. Mengembalikan true bila diterapkan. */
  const terapkanImpor = async (hasil) => {
    const adaIsi = pertanyaan.some((p) => !soalKosong(p));
    let mode = "ganti";

    if (adaIsi) {
      const jawab = await Swal.fire({
        title: "Sudah ada soal di form",
        text: `Ada ${hasil.soal.length} soal dari JSON. Tambahkan ke soal yang ada, atau ganti semuanya?`,
        showDenyButton: true,
        showCancelButton: true,
        confirmButtonText: "Tambahkan",
        denyButtonText: "Ganti semua",
        cancelButtonText: "Batal",
        confirmButtonColor: "#2b3fd6",
        denyButtonColor: "#e5484d",
        cancelButtonColor: "#5b6478",
      });
      if (jawab.isDismissed) return false;
      mode = jawab.isConfirmed ? "tambah" : "ganti";
    }

    const baru = hasil.soal.map((s) => buatSoal({ soal: s.soal, pilihan: [s.benar, ...s.salah], benarIndex: 0 }));
    setPertanyaan((prev) => {
      const hasilAkhir = mode === "ganti" ? baru : [...prev.filter((p) => !soalKosong(p)), ...baru];
      // Selalu sediakan minimal 3 kotak soal
      while (hasilAkhir.length < 3) hasilAkhir.push(buatSoal());
      return hasilAkhir;
    });

    // Informasi kuis: saat "ganti" semuanya ditimpa, saat "tambah" hanya mengisi kolom yang masih kosong
    const timpa = mode === "ganti";
    const { info } = hasil;
    if (info.judul && (timpa || !judul.trim())) setJudul(info.judul);
    if (info.deskripsi && (timpa || !deskripsi.trim())) setDeskripsi(info.deskripsi);
    if (info.kategori && (timpa || !kategori)) setKategori(info.kategori);
    if (info.waktu && (timpa || !waktu)) setWaktu(info.waktu);
    if (info.tipe && (timpa || tipe === "publik")) aturTipe(info.tipe);

    toast.success(`${hasil.soal.length} soal berhasil diimpor`);
    setTimeout(() => document.getElementById("daftar-soal")?.scrollIntoView({ behavior: "smooth" }), 100);
    return true;
  };

  const handleBuatSoal = async () => {
    try {
      if (judul.trim() == "" || deskripsi.trim() == "" || kategori == "" || waktu == 0) {
        toast.error("Mohon isi semua data!");
        return;
      }

      if (pertanyaan.length < 3) {
        toast.error("Kuis minimal memiliki 3 pertanyaan");
        return;
      }

      const soal = [];
      for (let i = 0; i < pertanyaan.length; i++) {
        const p = pertanyaan[i];
        const teks = p.pilihan.map((x) => x.trim());

        if (!p.soal.trim()) return toast.error(`Pertanyaan ${i + 1}: teks soal masih kosong`);
        if (teks.some((x) => !x)) return toast.error(`Pertanyaan ${i + 1}: semua pilihan jawaban harus diisi`);
        if (new Set(teks.map((x) => x.toLowerCase())).size !== teks.length) {
          return toast.error(`Pertanyaan ${i + 1}: ada pilihan jawaban yang sama`);
        }
        if (p.benarIndex === null) return toast.error(`Pertanyaan ${i + 1}: tandai jawaban yang benar`);

        soal.push({
          soal: p.soal.trim(),
          benar: teks[p.benarIndex],
          salah: teks.filter((_, k) => k !== p.benarIndex),
          gambar: p.gambar,
        });
      }

      setMenyimpan(true);

      let finalKode = tipe === "private" ? kodeSoal || generateKode() : "";
      if (tipe === "private" && !kodeSoal) setKodeSoal(finalKode);

      const kuisId = await simpanKuis({
        pembuat: { uid: user.uid, nama },
        informasi: {
          judul: judul.trim(),
          deskripsi: deskripsi.trim(),
          waktu,
          kategori,
          tipe,
          kode: finalKode,
        },
        soal,
      });

      toast.success("Kuis berhasil disimpan");
      router.push(`/main-kuis/${kuisId}`);
    } catch (err) {
      toast.error(err?.message || "Terjadi kesalahan");
    } finally {
      setMenyimpan(false);
    }
  };

  if (loadingAuth) return <Loading />;

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
        <h1 className="text-3xl font-extrabold">Masuk untuk membuat kuis</h1>
        <p className="mt-2 text-lembut">
          Kuis yang kamu buat terhubung ke akunmu, sehingga hanya kamu yang bisa menjadi host multiplayer.
        </p>
        <div className="mt-6">
          <Auth />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
      <Link href="/" className="inline-block">
        <Button variant="ghost">
          <ArrowLeft size={16} /> Kembali
        </Button>
      </Link>

      <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">Buat kuis baru</h1>
      <p className="mt-2 text-lembut">
        Tulis soal satu per satu, atau impor sekaligus dari JSON. Minimal 3 pertanyaan.
      </p>

      <ImporJson onImpor={terapkanImpor} />

      <form onSubmit={(e) => e.preventDefault()} className="mt-10 space-y-10">
        <section aria-labelledby="info-dasar" className="rounded-3xl border-2 border-tinta bg-white p-6 sm:p-8">
          <h2 id="info-dasar" className="text-xl font-bold">Informasi dasar</h2>

          <div className="mt-6 space-y-6">
            <div>
              <label htmlFor="judul" className="mb-2 block font-semibold">Judul kuis</label>
              <input
                id="judul"
                value={judul}
                onChange={(e) => setJudul(e.target.value)}
                type="text"
                autoComplete="off"
                maxLength={100}
                placeholder="Contoh: Perkalian dasar kelas 4"
                className="input"
              />
            </div>

            <div>
              <label htmlFor="deskripsi" className="mb-2 block font-semibold">Deskripsi</label>
              <textarea
                id="deskripsi"
                value={deskripsi}
                onChange={(e) => setDeskripsi(e.target.value)}
                placeholder="Jelaskan kuis ini dalam satu atau dua kalimat"
                rows={3}
                maxLength={500}
                className="input"
              />
            </div>

            <Select value={kategori} onChange={setKategori} />

            <div>
              <label htmlFor="waktu" className="mb-2 block font-semibold">Waktu pengerjaan</label>
              <div className="flex items-center gap-3">
                <input
                  id="waktu"
                  value={waktu === 0 ? "" : waktu}
                  onChange={(e) => setWaktu(Number(e.target.value) || 0)}
                  type="number"
                  min={1}
                  placeholder="60"
                  className="input !w-32"
                />
                <span className="text-lembut">detik</span>
              </div>
            </div>

            <fieldset>
              <legend className="mb-2 font-semibold">Tipe akses</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <OpsiTipe nilai="publik" tipe={tipe} onPilih={aturTipe} judul="Publik" deskripsi="Tampil di beranda, siapa saja bisa main." />
                <OpsiTipe nilai="private" tipe={tipe} onPilih={aturTipe} judul="Private" deskripsi="Hanya bisa dimainkan lewat kode." />
              </div>

              {tipe === "private" && kodeSoal && (
                <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border-2 border-dashed border-tinta bg-pensil/30 px-4 py-3">
                  <div>
                    <div className="text-sm text-lembut">Kode akses</div>
                    <div className="font-display text-2xl font-extrabold tracking-widest uppercase">{kodeSoal}</div>
                  </div>
                  <Button onClick={salinKode}>
                    <Copy size={16} /> Salin
                  </Button>
                </div>
              )}
            </fieldset>
          </div>
        </section>

        <section aria-labelledby="daftar-soal">
          <h2 id="daftar-soal" className="text-xl font-bold">Pertanyaan ({pertanyaan.length})</h2>

          {pertanyaan.map((p, index) => (
            <SoalBaru
              key={p.kunci}
              nomorSoal={index + 1}
              data={p}
              onUbah={(perubahan) => ubahSoal(p.kunci, perubahan)}
              onDelete={() => hapusSoal(index)}
            />
          ))}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button onClick={tambahPertanyaan} variant="primary" size="md">
              <Plus size={18} /> Tambah pertanyaan
            </Button>

            <Button onClick={handleBuatSoal} variant="secondary" size="md" disabled={menyimpan}>
              {menyimpan ? "Menyimpan..." : "Simpan kuis"}
            </Button>
          </div>
        </section>
      </form>
    </div>
  );
};

export default Page;
