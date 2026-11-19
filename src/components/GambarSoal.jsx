const GambarSoal = ({ src, className = "" }) => {
  if (!src) return null
  return (
    <img
      src={src}
      alt="Gambar pendukung soal"
      className={`mx-auto max-h-72 w-auto max-w-full rounded-2xl border-2 border-tinta bg-white object-contain ${className}`}
    />
  )
}

export default GambarSoal
