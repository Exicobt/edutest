import { useSyncExternalStore } from "react"

// Mesin suara sintetis (Web Audio API): tanpa file audio, tanpa jaringan.
const KUNCI = "edutest-suara-bisu"

let ctx = null
let bisu = false
let denyutTimer = null
let sudahMuat = false
const pendengar = new Set()

const muatPengaturan = () => {
  if (sudahMuat || typeof window === "undefined") return
  sudahMuat = true
  try {
    bisu = window.localStorage.getItem(KUNCI) === "1"
  } catch {}
}

const ambil = () => {
  if (typeof window === "undefined") return null
  muatPengaturan()
  if (bisu) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {})
  return ctx
}

/** Satu nada: osilator dengan envelope cepat. */
const nada = (freq, mulai, durasi, { tipe = "sine", vol = 0.15, ke } = {}) => {
  const c = ambil()
  if (!c) return
  const t0 = c.currentTime + mulai
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = tipe
  osc.frequency.setValueAtTime(freq, t0)
  if (ke) osc.frequency.exponentialRampToValueAtTime(ke, t0 + durasi)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.012)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durasi)
  osc.connect(gain).connect(c.destination)
  osc.start(t0)
  osc.stop(t0 + durasi + 0.05)
}

/** Desis (white noise) untuk efek "whoosh". */
const desis = (mulai, durasi, { vol = 0.12, dari = 400, ke = 4000 } = {}) => {
  const c = ambil()
  if (!c) return
  const t0 = c.currentTime + mulai
  const panjang = Math.max(1, Math.floor(c.sampleRate * durasi))
  const buffer = c.createBuffer(1, panjang, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < panjang; i++) data[i] = Math.random() * 2 - 1

  const sumber = c.createBufferSource()
  sumber.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = "bandpass"
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(dari, t0)
  filter.frequency.exponentialRampToValueAtTime(ke, t0 + durasi)
  const gain = c.createGain()
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + durasi * 0.3)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durasi)
  sumber.connect(filter).connect(gain).connect(c.destination)
  sumber.start(t0)
}

const kick = (mulai, vol) => nada(95, mulai, 0.16, { tipe: "sine", vol, ke: 38 })

export const suara = {
  /** Soal baru muncul. Makin tinggi intensitas, makin tinggi nada dan makin ramai. */
  soal(t = 0) {
    desis(0, 0.45, { vol: 0.1 + t * 0.08, dari: 300 + t * 400, ke: 3500 + t * 3000 })
    nada(220 * (1 + t * 0.5), 0.05, 0.25, { tipe: "sawtooth", vol: 0.05 + t * 0.04, ke: 440 * (1 + t * 0.5) })
    if (t > 0.6) nada(110, 0, 0.5, { tipe: "square", vol: 0.04, ke: 55 })
  },
  /** Detak jam di 5 detik terakhir; nada naik tiap detik. */
  tik(sisaDetik = 5, t = 0) {
    const f = 700 + (5 - Math.min(5, sisaDetik)) * 110 + t * 150
    nada(f, 0, 0.07, { tipe: "square", vol: 0.07 })
  },
  klik() {
    nada(520, 0, 0.06, { tipe: "triangle", vol: 0.08 })
  },
  benar(streak = 0) {
    const dasar = 523.25 * Math.pow(2, Math.min(streak, 5) / 12)
    ;[1, 1.25, 1.5, 2].forEach((m, i) => nada(dasar * m, i * 0.07, 0.22, { tipe: "triangle", vol: 0.14 }))
  },
  salah() {
    nada(160, 0, 0.35, { tipe: "sawtooth", vol: 0.1, ke: 80 })
    nada(150, 0.12, 0.3, { tipe: "sawtooth", vol: 0.08, ke: 70 })
  },
  ting() {
    nada(880, 0, 0.3, { tipe: "sine", vol: 0.12 })
    nada(1320, 0.08, 0.35, { tipe: "sine", vol: 0.08 })
  },
  pop() {
    nada(400, 0, 0.12, { tipe: "sine", vol: 0.1, ke: 900 })
  },
  mulai() {
    ;[0, 0.12, 0.24].forEach((d, i) => nada(330 * (1 + i * 0.25), d, 0.18, { tipe: "square", vol: 0.07 }))
    nada(660, 0.38, 0.5, { tipe: "square", vol: 0.09 })
    desis(0.3, 0.7, { vol: 0.12, dari: 500, ke: 6000 })
  },
  final() {
    ;[0, 0.18, 0.36, 0.54].forEach((d, i) => nada(196 * Math.pow(1.26, i), d, 0.3, { tipe: "sawtooth", vol: 0.09 }))
    kick(0, 0.4)
    kick(0.18, 0.4)
    nada(98, 0.7, 0.9, { tipe: "square", vol: 0.07, ke: 49 })
  },
  fanfare() {
    const melodi = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.5]
    const durasi = [0.14, 0.14, 0.14, 0.14, 0.14, 0.7]
    let t = 0
    melodi.forEach((f, i) => {
      nada(f, t, durasi[i] + 0.1, { tipe: "square", vol: 0.08 })
      nada(f / 2, t, durasi[i] + 0.1, { tipe: "triangle", vol: 0.1 })
      t += durasi[i]
    })
    desis(0, 1, { vol: 0.08, dari: 800, ke: 7000 })
  },

  /** Detak jantung selama soal berlangsung; tempo naik mengikuti intensitas (0 sampai 1). */
  mulaiDenyut(t = 0) {
    this.hentikanDenyut()
    if (typeof window === "undefined") return
    const ketuk = () => {
      const vol = 0.14 + t * 0.2
      kick(0, vol)
      kick(0.17, vol * 0.7)
    }
    ketuk()
    denyutTimer = setInterval(ketuk, 60000 / (62 + t * 70))
  },
  hentikanDenyut() {
    if (denyutTimer) clearInterval(denyutTimer)
    denyutTimer = null
  },

  /** Membuka AudioContext pada interaksi pertama (syarat autoplay browser). */
  bukaKunci() {
    ambil()
  },
}

const ambilBisu = () => {
  muatPengaturan()
  return bisu
}
const langgananBisu = (cb) => {
  pendengar.add(cb)
  return () => pendengar.delete(cb)
}

export const aturBisu = (nilai) => {
  muatPengaturan()
  bisu = nilai
  try {
    window.localStorage.setItem(KUNCI, nilai ? "1" : "0")
  } catch {}
  if (nilai) suara.hentikanDenyut()
  pendengar.forEach((cb) => cb())
}

export const useBisu = () => useSyncExternalStore(langgananBisu, ambilBisu, () => false)
