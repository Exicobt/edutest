<<<<<<< HEAD
# edutest
=======
# EduTest

**A Web-Based Educational Quiz Application**

EduTest is a web application project designed to provide an online quiz and learning experience. Built with Next.js, React, and Firebase, this project explores modern web development through an interactive educational platform.

## Overview

EduTest aims to provide a platform for users to engage with educational quizzes through a web-based interface.

The application is developed using modern JavaScript technologies, with Next.js handling the frontend application and Firebase providing backend service integration.

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 15 | React framework |
| React 19 | User interface |
| JavaScript | Programming language |
| Firebase | Backend services |
| Tailwind CSS 4 | Styling |
| Lucide React | Icons |
| Phosphor Icons | Additional icons |
| React Hot Toast | Notifications |
| SweetAlert2 | Interactive dialogs |

## Project Structure

```text
edutest/
├── .firebase/
├── dataconnect/
├── public/
├── src/
│
├── .firebaserc
├── .gitignore
├── README.md
├── eslint.config.mjs
├── firebase.json
├── jsconfig.json
├── next.config.mjs
├── package.json
├── package-lock.json
├── pnpm-lock.yaml
└── soal.json
```

## Getting Started

Follow these instructions to run EduTest locally.

### 1. Clone the Repository

```bash
git clone https://github.com/Exicobt/edutest.git
```

### 2. Navigate to the Project Directory

```bash
cd edutest
```

### 3. Install Dependencies

Using npm:

```bash
npm install
```

### 4. Configure Environment Variables

If the application requires Firebase configuration, create a `.env.local` file in the project root.

Example:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

Use the actual variable names referenced by the Firebase configuration in the source code.

Do not commit private credentials or sensitive configuration files.

### 5. Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to:

```text
http://localhost:3000
```

## Foto Profil

Pengguna bisa mengunggah foto di halaman `/profil` (menu avatar di navbar, lalu "Profil saya").

- Foto dipotong persegi dan dikecilkan ke 256x256 px di browser, lalu disimpan sebagai data URL JPEG di field `fotoProfil` pada dokumen `users/{uid}` di Firestore (sekitar 15-40 KB).
- Urutan foto yang ditampilkan: foto unggahan, lalu foto akun Google, lalu inisial nama.
- Firestore rules harus mengizinkan pemilik akun menulis dokumennya sendiri, contoh:

```text
match /users/{uid} {
  allow read: if true;
  allow write: if request.auth != null && request.auth.uid == uid;
}
```

Jika nanti ingin memakai Firebase Storage, ganti isi `simpanFotoProfil` di `src/libs/profil.js` agar mengunggah Blob dan menyimpan URL-nya.

## Multiplayer dan Gambar Soal

**Alur multiplayer**

1. Pembuat kuis membuka halaman kuisnya lalu menekan **Buat ruang multiplayer**. Ia menjadi host dan mendapat kode ruang 6 karakter.
2. Pemain memasukkan kode di beranda (atau membuka tautan `/ruang/KODE`) dan masuk ke lobi.
3. Host mengatur waktu per soal dan menekan **Mulai permainan**. Soal berganti per fase: soal, hasil (jawaban benar dan papan skor), lalu soal berikutnya atas klik host.
4. Poin untuk jawaban benar 500 sampai 1000, makin cepat makin besar. Papan skor akhir tampil di host dan pemain.

**Host tidak ikut bermain.** Host tidak punya dokumen pemain, tidak bisa bergabung di ruangnya sendiri, dan pembuat kuis ditolak bila mencoba masuk sebagai pemain. Mode main sendiri tetap terbuka untuk semua orang.

**Data di Firestore**

- `ruang/{kode}`: status (`lobi`, `main`, `selesai`), soal aktif, fase, waktu per soal, `hostUid`.
- `ruang/{kode}/pemain/{uid}`: nama, foto kecil, skor, jawaban.
- `quis/{id}`: kini menyimpan `pembuat` dan `pembuatNama`. Kuis lama tanpa field ini bisa di-host siapa saja yang sudah masuk.
- `quis/{id}/gambar/g{n}`: gambar soal (JPEG hasil kompresi, maksimal sekitar 150 KB per gambar).

Salin dan sesuaikan aturan di `firestore.rules.example` ke Firestore Rules. Aturan itulah yang memaksa host tidak bisa menjadi pemain di sisi server.

**Batasan:** skor dihitung di browser pemain, dan kunci jawaban ikut terkirim bersama soal. Ini cukup untuk kelas atau acara santai, tetapi tidak tahan terhadap peserta yang sengaja curang. Untuk kompetisi serius, hitung skor dan simpan kunci jawaban di Cloud Functions. Ruang lama juga tidak dihapus otomatis.

## Suasana Kompetitif, Evaluasi, dan Riwayat

**Intensitas makin tinggi seiring soal naik.** Intensitas dihitung dari posisi soal (0 di soal pertama, 1 di soal terakhir) dan dipakai di multiplayer maupun mode main sendiri:

- Latar menghangat, vinyet merah menebal, garis hazard muncul di atas layar, kartu soal dan bayangannya menebal, judul soal membesar.
- Label tingkat: Pemanasan, Panas, Genting, lalu Soal final. Pengumuman layar penuh muncul di soal pertama, saat tingkat naik, dan di soal final.
- Detik terakhir: timer berdenyut merah dan layar bergetar (hanya di tingkat Panas ke atas).
- Soal final bernilai poin ganda (x2). Jawaban benar berturut-turut memberi bonus streak (+50 per langkah, maksimal +250).
- Papan skor menampilkan perubahan peringkat setelah tiap soal.

**Suara** disintesis langsung di browser dengan Web Audio API (tanpa file audio): soal baru, detak jantung yang makin cepat, detak jam di 5 detik terakhir, benar, salah, soal final, dan fanfare. Tombol bisukan ada di pojok kanan bawah dan pilihannya diingat. Browser baru mengizinkan suara setelah pengguna berinteraksi dengan halaman.

**Evaluasi soal** muncul di akhir permainan. Host melihat persentase benar per soal, sebaran jawaban per opsi, rata-rata waktu menjawab, tingkat kesulitan, dan saran soal yang layak dibahas ulang. Pemain melihat statistik yang sama ditambah jawabannya sendiri.

**Riwayat** ada di `/riwayat`: daftar kuis yang dibuat (dengan tombol host multiplayer), serta ruang yang pernah di-host beserta ringkasan dan tautan ke hasil dan evaluasi. Kuis yang dibuat sebelum field `pembuat` ada tidak muncul di riwayat.

## Impor Soal dari JSON

Di halaman **Buat kuis**, panel "Impor soal dari JSON" mengisi form secara otomatis dari file `.json` (pilih file atau seret ke panel) atau dari teks yang ditempel. Hasilnya tetap bisa diedit sebelum disimpan. Jika form sudah berisi soal, muncul pilihan menambahkan atau mengganti semua.

```json
{
  "judul": "Kuis Matematika Dasar",
  "deskripsi": "Latihan penjumlahan dan perkalian",
  "kategori": "Matematika",
  "waktu": 120,
  "tipe": "publik",
  "pertanyaan": [
    { "soal": "Berapa 1 + 1?", "benar": "2", "salah": ["1", "3", "4"] }
  ]
}
```

- Hanya `pertanyaan` yang wajib. Tiap soal butuh `soal`, `benar`, dan `salah` (1 sampai 4 jawaban). Total pilihan per soal 2 sampai 5.
- `judul`, `deskripsi`, `waktu` (detik), `kategori` (Matematika, Sains, Sejarah, Bahasa, Teknologi, Geografis), dan `tipe` (`publik` atau `private`) opsional.
- Soal yang cacat dilewati dan alasannya ditampilkan, sedangkan soal yang valid tetap diimpor. Jawaban salah yang sama dengan pilihan lain dibuang otomatis.
- JSON yang dibungkus code fence (```json) tetap terbaca, jadi hasil dari AI bisa langsung ditempel. Tombol "Salin prompt untuk AI" menyiapkan prompt dengan format ini.
- Format lama seperti `soal.json` (kunci `Pertanyaan 1`, `True`, `False`) juga dikenali.
- Maksimal 100 soal per impor. Gambar soal ditambahkan manual setelah impor.
- Contoh siap pakai: `contoh-kuis.json`. Logika pembacaan ada di `src/libs/impor.js`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` | Build the application |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run export` | Run the configured export script, if supported |

Refer to `package.json` for the exact script configuration.

## Backend Integration

EduTest includes Firebase as part of its technology stack.

The repository also contains a `dataconnect` directory for Firebase Data Connect-related configuration.

Refer to the source code and Firebase configuration for the actual services and data structures used by the application.

## Deployment

The repository is associated with Vercel deployment.

To deploy:

1. Import the GitHub repository into Vercel.
2. Configure the required environment variables.
3. Ensure the build configuration is compatible with the project.
4. Deploy the application.

## Development

Contributions and improvements are welcome.

For development:

1. Fork the repository.
2. Create a new feature branch.
3. Implement your changes.
4. Test your implementation.
5. Submit a pull request.

## Repository

GitHub: https://github.com/Exicobt/edutest

## License

No license has been specified yet.

All rights remain with the repository owner unless a license is added.
>>>>>>> 58bb2d0 (update)
