export const formatDurasi = (detik) => {
  const d = Number(detik) || 0
  if (d < 60) return `${d} detik`
  const menit = Math.floor(d / 60)
  const sisa = d % 60
  return sisa ? `${menit} mnt ${sisa} dtk` : `${menit} menit`
}
