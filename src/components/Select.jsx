'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { KATEGORI as options } from '@/libs/kategori'

const Select = ({ onChange, value = null }) => {
  const [terbuka, setTerbuka] = useState(false)
  const dipilih = value || null
  const ref = useRef(null)

  useEffect(() => {
    if (!terbuka) return
    const klikLuar = (e) => ref.current && !ref.current.contains(e.target) && setTerbuka(false)
    const esc = (e) => e.key === 'Escape' && setTerbuka(false)
    document.addEventListener('mousedown', klikLuar)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', klikLuar)
      document.removeEventListener('keydown', esc)
    }
  }, [terbuka])

  const pilih = (option) => {
    setTerbuka(false)
    onChange && onChange(option)
  }

  return (
    <div className="relative w-full" ref={ref}>
      <span id="label-kategori" className="mb-2 block font-semibold">Kategori</span>

      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={terbuka}
        aria-labelledby="label-kategori"
        onClick={() => setTerbuka((t) => !t)}
        className="input flex cursor-pointer items-center justify-between text-left"
      >
        <span className={dipilih ? '' : 'text-[#98a1b3]'}>{dipilih ?? 'Pilih kategori'}</span>
        <ChevronDown size={18} className={`transition-transform duration-200 ${terbuka ? 'rotate-180' : ''}`} />
      </button>

      {terbuka && (
        <ul
          role="listbox"
          className="absolute left-0 top-full z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border-2 border-tinta bg-white py-1 shadow-[0_4px_0_0_var(--tinta)]"
        >
          {options.map((option) => (
            <li
              key={option}
              role="option"
              aria-selected={dipilih === option}
              onClick={() => pilih(option)}
              className={`flex cursor-pointer items-center justify-between px-4 py-2.5 hover:bg-biru-muda ${
                dipilih === option ? 'bg-biru-muda font-semibold text-biru-tua' : ''
              }`}
            >
              {option}
              {dipilih === option && <Check size={16} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default Select
