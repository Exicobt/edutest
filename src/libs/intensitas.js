/** 0 pada soal pertama, 1 pada soal terakhir. */
export const hitungIntensitas = (indeks, total) => (total <= 1 ? 1 : Math.min(1, Math.max(0, indeks / (total - 1))))

export const labelTingkat = (t, terakhir) => {
  if (terakhir) return { nama: "Soal final", warna: "bg-salah text-white" }
  if (t < 0.34) return { nama: "Pemanasan", warna: "bg-biru-muda text-biru-tua" }
  if (t < 0.67) return { nama: "Panas", warna: "bg-pensil text-tinta" }
  return { nama: "Genting", warna: "bg-salah text-white" }
}
