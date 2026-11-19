'use client'

/**
 * Pembungkus "arena": makin tinggi `intensitas` (0 sampai 1), makin panas suasananya:
 * latar menghangat, vinyet merah menebal, garis hazard muncul, kartu soal menebal.
 * `genting` membuat seluruh layar bergetar. `umumkan` menampilkan teks besar layar penuh.
 */
const SuasanaKompetisi = ({ intensitas = 0, genting = false, umumkan, children }) => (
  <div className={`arena ${genting ? "getar" : ""}`} style={{ "--t": intensitas }}>
    {intensitas > 0.3 && <div aria-hidden className={`arena-garis ${intensitas > 0.6 ? "bergerak" : ""}`} />}
    {children}
    {umumkan && (
      <div key={umumkan.kunci} className="umumkan" aria-hidden>
        <div className="umumkan-teks">{umumkan.teks}</div>
        {umumkan.sub && (
          <div className="mt-4 rounded-full border-2 border-tinta bg-pensil px-5 py-1.5 font-display text-xl font-extrabold uppercase">
            {umumkan.sub}
          </div>
        )}
      </div>
    )}
  </div>
)

export default SuasanaKompetisi
