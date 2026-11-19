"use client";

import Loading from "@/app/loading";
import Button from "@/components/Button";
import { ambilKuis, ambilGambarKuis } from "@/libs/ambilKuis";
import GambarSoal from "@/components/GambarSoal";
import SuasanaKompetisi from "@/components/SuasanaKompetisi";
import { hitungIntensitas, labelTingkat } from "@/libs/intensitas";
import { suara } from "@/libs/suara";
import { Clock, Trophy, House, CheckCircle, XCircle, Question } from "@phosphor-icons/react/dist/ssr";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MulaiKuisClient() {
    const { id } = useParams();
    const router = useRouter();
    const [kuis, setKuis] = useState([]);
    const [loading, setLoading] = useState(true);
    const [detik, setDetik] = useState(0);
    const [index, setIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [pilihanAcak, setPilihanAcak] = useState([]);
    const [pilihanJawaban, setPilihanJawaban] = useState(null);
    const [jawabanUser, setJawabanUser] = useState([]);
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [timeExpired, setTimeExpired] = useState(false);
    const [activeTab, setActiveTab] = useState('all');
    const [gambarMap, setGambarMap] = useState({});

    const formatWaktu = (detik) => {
        const jam = Math.floor(detik / 3600);
        const menit = Math.floor((detik % 3600) / 60);
        const sisaDetik = detik % 60;
        const pad = (n) => String(n).padStart(2, '0');
        return `${pad(jam)}:${pad(menit)}:${pad(sisaDetik)}`;
    };

    const acakArray = (arr) => {
        return [...arr].sort(() => Math.random() - 0.5);
    };

    const handlePilihanJawaban = (i) => {
        if (pilihanJawaban !== null) return;
        setPilihanJawaban(i);

        const benar = pilihanAcak[i].benar;
        if (benar) suara.benar(); else suara.salah();
        const jawabanInfo = {
            soalIndex: index,
            soal: kuis[index].soal,
            jawabanUser: pilihanAcak[i].text,
            jawabanBenar: kuis[index].benar,
            isCorrect: benar
        };
        
        setJawabanUser(prev => [...prev, jawabanInfo]);

        if (benar) {
            setScore((prev) => prev + 100 / kuis.length);
        }

        setTimeout(() => {
            if (index + 1 >= kuis.length) {
                setQuizCompleted(true);
            } else {
                setIndex((prev) => prev + 1);
            }
        }, 1000); 
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;

            try {
                const data = await ambilKuis(id);
                setDetik(data.waktu);
                setKuis(data.pertanyaan);
                setGambarMap(await ambilGambarKuis(id));
            } catch (err) {
                toast.error("Gagal mengambil data kuis.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    useEffect(() => {
        const interval = setInterval(() => {
            setDetik((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setTimeExpired(true);
                    
                    const answeredIndices = jawabanUser.map(jawaban => jawaban.soalIndex);
                    const unansweredQuestions = kuis.filter((_q, i) => !answeredIndices.includes(i))
                        .map((q, i) => {
                            const realIndex = kuis.findIndex((_q, idx) => !answeredIndices.includes(idx) && idx >= i);
                            return {
                                soalIndex: realIndex,
                                soal: q.soal,
                                jawabanUser: null,
                                jawabanBenar: q.benar,
                                isCorrect: false
                            };
                        });
                    
                    setJawabanUser(prev => [...prev, ...unansweredQuestions]);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [kuis, jawabanUser]);

    useEffect(() => {
        if (kuis.length === 0 || index >= kuis.length) return;

        const opsi = [
            { text: kuis[index].benar, benar: true },
            ...kuis[index].salah.map((s) => ({ text: s, benar: false }))
        ];
        setPilihanAcak(acakArray(opsi));
        setPilihanJawaban(null);
    }, [index, kuis]);

    const selesai = quizCompleted || timeExpired;
    const t = hitungIntensitas(index, kuis.length);
    const terakhir = kuis.length > 0 && index + 1 >= kuis.length;

    // Suasana: soal baru berbunyi, detak jantung makin cepat di soal akhir
    useEffect(() => {
        if (loading || kuis.length === 0 || selesai) return;
        if (terakhir && kuis.length > 1) suara.final(); else if (index === 0) suara.mulai(); else suara.soal(t);
        suara.mulaiDenyut(t);
        return () => suara.hentikanDenyut();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [index, loading, kuis.length, selesai]);

    useEffect(() => {
        if (!selesai) return;
        suara.hentikanDenyut();
        suara.fanfare();
    }, [selesai]);

    useEffect(() => {
        if (!selesai && detik > 0 && detik <= 10 && kuis.length > 0) suara.tik(Math.min(detik, 5), t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [detik]);

    const handleBackToHome = () => {
        router.push('/');
    };

    if (loading) return <Loading />;
    if (!kuis || kuis.length === 0) return (
        <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
            <h1 className="text-2xl font-bold">Kuis tidak ditemukan</h1>
            <Button variant="secondary" size="md" className="mt-6" onClick={handleBackToHome}>Kembali ke beranda</Button>
        </div>
    );
    
    const ResultComponent = () => {
        const correctAnswers = jawabanUser.filter(jawaban => jawaban.isCorrect).length;
        const incorrectAnswers = jawabanUser.filter(jawaban => jawaban.jawabanUser && !jawaban.isCorrect).length;
        const unansweredQuestions = jawabanUser.filter(jawaban => jawaban.jawabanUser === null).length;

        const filteredAnswers = activeTab === 'all'
            ? jawabanUser
            : activeTab === 'correct'
                ? jawabanUser.filter(jawaban => jawaban.isCorrect)
                : activeTab === 'incorrect'
                    ? jawabanUser.filter(jawaban => jawaban.jawabanUser && !jawaban.isCorrect)
                    : jawabanUser.filter(jawaban => jawaban.jawabanUser === null);

        const tab = [
            { id: 'all', label: 'Semua', jumlah: jawabanUser.length },
            { id: 'correct', label: 'Benar', jumlah: correctAnswers },
            { id: 'incorrect', label: 'Salah', jumlah: incorrectAnswers },
            { id: 'unanswered', label: 'Tidak terjawab', jumlah: unansweredQuestions },
        ];

        return (
            <div className="mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
                <div className="rounded-3xl border-2 border-tinta bg-white p-6 sm:p-10">
                    <p className="font-semibold text-lembut">{timeExpired ? "Waktu habis" : "Kuis selesai"}</p>

                    <div className="mt-2 flex flex-wrap items-end gap-x-6 gap-y-4">
                        <div className="flex items-center gap-3">
                            <Trophy size={48} weight="fill" className="text-pensil [filter:drop-shadow(0_2px_0_var(--tinta))]" />
                            <div className="font-display text-7xl font-extrabold leading-none">{Math.round(score)}</div>
                        </div>
                        <div className="pb-1 text-lembut">dari 100 poin</div>
                    </div>

                    <div className="mt-8 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-benar-muda p-4">
                            <CheckCircle size={24} weight="fill" className="text-benar" />
                            <div className="mt-2 text-2xl font-extrabold">{correctAnswers}</div>
                            <div className="text-sm text-lembut">Benar</div>
                        </div>
                        <div className="rounded-2xl bg-salah-muda p-4">
                            <XCircle size={24} weight="fill" className="text-salah" />
                            <div className="mt-2 text-2xl font-extrabold">{incorrectAnswers}</div>
                            <div className="text-sm text-lembut">Salah</div>
                        </div>
                        <div className="rounded-2xl bg-kertas p-4">
                            <Question size={24} weight="fill" className="text-lembut" />
                            <div className="mt-2 text-2xl font-extrabold">{unansweredQuestions}</div>
                            <div className="text-sm text-lembut">Tidak terjawab</div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-start">
                        <Button onClick={handleBackToHome} variant="secondary" size="md">
                            <House size={20} /> Kembali ke beranda
                        </Button>
                    </div>
                </div>

                <section aria-labelledby="judul-pembahasan" className="mt-10">
                    <h2 id="judul-pembahasan" className="text-2xl font-bold">Pembahasan</h2>

                    <div role="tablist" className="mt-4 flex flex-wrap gap-2 border-b-2 border-tinta pb-3">
                        {tab.map((t) => (
                            <button
                                key={t.id}
                                role="tab"
                                aria-selected={activeTab === t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`cursor-pointer rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
                                    activeTab === t.id
                                        ? 'border-tinta bg-tinta text-white'
                                        : 'border-garis bg-white hover:border-tinta'
                                }`}
                            >
                                {t.label} ({t.jumlah})
                            </button>
                        ))}
                    </div>

                    <ol className="mt-6 space-y-4">
                        {[...filteredAnswers].sort((a, b) => a.soalIndex - b.soalIndex).map((jawaban, idx) => {
                            const kosong = jawaban.jawabanUser === null
                            const gaya = jawaban.isCorrect
                                ? 'border-benar bg-benar-muda'
                                : kosong
                                    ? 'border-garis bg-white'
                                    : 'border-salah bg-salah-muda'
                            return (
                                <li key={idx} className={`rounded-2xl border-2 p-5 ${gaya}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="gelembung gelembung-terisi">{jawaban.soalIndex + 1}</span>
                                        <div className="pt-1 font-semibold">{jawaban.soal}</div>
                                    </div>

                                    <div className="ml-12 mt-3 space-y-2 text-sm">
                                        {!kosong && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lembut">Jawabanmu:</span>
                                                <span className={`font-semibold ${jawaban.isCorrect ? 'text-benar' : 'text-salah'}`}>
                                                    {jawaban.jawabanUser}
                                                </span>
                                                {jawaban.isCorrect
                                                    ? <CheckCircle size={16} weight="fill" className="text-benar" />
                                                    : <XCircle size={16} weight="fill" className="text-salah" />}
                                            </div>
                                        )}
                                        {kosong && <div className="text-lembut">Tidak dijawab</div>}
                                        {(!jawaban.isCorrect || kosong) && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-lembut">Jawaban benar:</span>
                                                <span className="font-semibold text-benar">{jawaban.jawabanBenar}</span>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            )
                        })}
                    </ol>
                </section>
            </div>
        );
    };

    if (quizCompleted || timeExpired) {
        return <ResultComponent />;
    }

    const menitMerah = detik <= 10;
    const tingkat = labelTingkat(t, terakhir && kuis.length > 1);
    const pengumuman = index === 0
        ? { teks: "Mulai!", sub: `${kuis.length} soal` }
        : terakhir
            ? { teks: "Soal final" }
            : tingkat.nama !== labelTingkat(hitungIntensitas(index - 1, kuis.length), false).nama
                ? { teks: `${tingkat.nama}!` }
                : null;

    return (
        <SuasanaKompetisi
            intensitas={t}
            genting={menitMerah && detik > 0 && t >= 0.34}
            umumkan={pengumuman ? { kunci: index, ...pengumuman } : null}
        >
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-8 sm:px-6 sm:pt-12">
            <div className="flex items-center justify-between gap-3">
                <div
                    role="timer"
                    aria-label="Sisa waktu"
                    className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 font-mono text-lg font-bold ${
                        menitMerah ? 'border-salah bg-salah-muda text-salah' : 'border-tinta bg-white'
                    }`}
                >
                    <Clock size={20} weight="bold" /> {formatWaktu(detik)}
                </div>

                <div className="inline-flex items-center gap-2 rounded-full border-2 border-tinta bg-pensil px-4 py-2 font-mono text-lg font-bold">
                    <Trophy size={20} weight="fill" /> {Math.round(score)} poin
                </div>
            </div>

            <div className="arena-kartu mt-6 rounded-3xl border-2 border-tinta bg-white p-6 sm:p-10">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-sm font-semibold text-lembut">
                        Pertanyaan {index + 1} dari {kuis.length}
                        <span className={`rounded-full border-2 border-tinta px-2.5 py-0.5 text-xs font-extrabold uppercase ${tingkat.warna}`}>
                            {tingkat.nama}
                        </span>
                    </div>
                    <div
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={kuis.length}
                        aria-valuenow={index + 1}
                        className="h-2.5 w-32 overflow-hidden rounded-full bg-biru-muda"
                    >
                        <div
                            className="aksen-bar h-full rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${((index + 1) / kuis.length) * 100}%` }}
                        />
                    </div>
                </div>

                <h1 className="arena-judul mt-6 leading-tight">
                    {kuis[index].soal}
                </h1>

                {kuis[index].gambar && gambarMap[kuis[index].gambar] && (
                    <GambarSoal src={gambarMap[kuis[index].gambar]} className="mt-6" />
                )}

                <div className="mt-8 space-y-3">
                    {pilihanAcak.map((pilihan, i) => {
                        const belumMenjawab = pilihanJawaban === null
                        const dipilih = pilihanJawaban === i
                        const status = belumMenjawab
                            ? 'netral'
                            : dipilih
                                ? (pilihan.benar ? 'benar' : 'salah')
                                : (pilihan.benar ? 'kunci' : 'pudar')

                        const gayaTombol = {
                            netral: 'border-garis bg-white hover:border-tinta hover:bg-kertas',
                            benar: 'border-benar bg-benar-muda',
                            salah: 'border-salah bg-salah-muda',
                            kunci: 'border-benar bg-white',
                            pudar: 'border-garis bg-white opacity-50',
                        }[status]

                        const gayaGelembung = {
                            netral: '',
                            benar: 'gelembung-terisi !border-benar !bg-benar',
                            salah: 'gelembung-terisi !border-salah !bg-salah',
                            kunci: '!border-benar !text-benar',
                            pudar: '',
                        }[status]

                        return (
                            <button
                                key={i}
                                onClick={() => handlePilihanJawaban(i)}
                                disabled={!belumMenjawab}
                                className={`flex w-full items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition-colors ${gayaTombol} ${belumMenjawab ? 'cursor-pointer' : 'cursor-default'}`}
                            >
                                <span className={`gelembung ${gayaGelembung}`}>
                                    {String.fromCharCode(65 + i)}
                                </span>
                                <span className="flex-1 text-lg">{pilihan.text}</span>

                                {!belumMenjawab && pilihan.benar && (
                                    <CheckCircle size={26} weight="fill" className="text-benar" aria-label="Jawaban benar" />
                                )}
                                {dipilih && !pilihan.benar && (
                                    <XCircle size={26} weight="fill" className="text-salah" aria-label="Jawaban salah" />
                                )}
                            </button>
                        )
                    })}
                </div>

                {pilihanJawaban === null && (
                    <p className="mt-5 text-sm text-lembut">Pilih satu jawaban. Jawaban tidak bisa diubah.</p>
                )}
            </div>
        </div>
        </SuasanaKompetisi>
    );
}
