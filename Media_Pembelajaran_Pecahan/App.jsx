import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import { 
  GraduationCap, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  ArrowRight, 
  Sparkles,
  Home
} from 'lucide-react';

// ============================================================================
// 1. HALAMAN LOGIN UTAMA (MURID & GURU/ADMIN)
// ============================================================================
function LoginPage() {
  const navigate = useNavigate();
  const [roleTab, setRoleTab] = useState('siswa'); // 'siswa' atau 'admin'

  // State Form Siswa
  const [namaSiswa, setNamaSiswa] = useState('');
  const [absenSiswa, setAbsenSiswa] = useState('1');

  // State Form Admin
  const [emailAdmin, setEmailAdmin] = useState('');
  const [passwordAdmin, setPasswordAdmin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Handler Submit Siswa
  const handleSubmitSiswa = (e) => {
    e.preventDefault();
    if (!namaSiswa.trim()) {
      setErrorMsg('Silakan tuliskan nama kamu terlebih dahulu!');
      return;
    }
    // Masuk ke Dasbor / Materi Belajar
    navigate('/dashboard');
  };

  // Handler Submit Admin
  const handleSubmitAdmin = (e) => {
    e.preventDefault();
    if (emailAdmin === 'adnanbahar@gmail.com' && passwordAdmin === 'adnan') {
      navigate('/dashboard');
    } else {
      setErrorMsg('Email atau kata sandi admin salah! (Demo: adnanbahar@gmail.com / adnan)');
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex items-center justify-center font-sans bg-sky-200 select-none">
      
      {/* 3D Cartoon Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="assets/admin_garden_bg.jpg"
          alt="3D School Scenery"
          className="w-full h-full object-cover object-bottom brightness-[1.02] saturate-[1.15]"
          onError={(e) => {
            e.currentTarget.src = 'assets/admin_dashboard_mockup.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/30 via-slate-900/20 to-sky-950/40 backdrop-blur-[3px]" />
      </div>

      {/* Floating Fraction Bubbles */}
      <div className="absolute top-[12%] left-[18%] pointer-events-none z-10 animate-bounce">
        <div className="w-12 h-12 rounded-full bg-white/90 border-2 border-white shadow-lg backdrop-blur-md flex flex-col items-center justify-center font-bold text-sky-600 text-xs">
          <span>1</span>
          <span className="w-4 h-[2px] bg-sky-600 my-[1px]" />
          <span>2</span>
        </div>
      </div>

      <div className="absolute bottom-[16%] right-[20%] pointer-events-none z-10 animate-pulse">
        <div className="w-11 h-11 rounded-full bg-white/90 border-2 border-white shadow-lg backdrop-blur-md flex flex-col items-center justify-center font-bold text-emerald-600 text-xs">
          <span>3</span>
          <span className="w-4 h-[2px] bg-emerald-600 my-[1px]" />
          <span>4</span>
        </div>
      </div>

      {/* Main Glassmorphism Login Card */}
      <div className="relative z-20 w-full max-w-md mx-4 p-8 rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/90 shadow-2xl shadow-slate-900/20">
        
        {/* App Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white font-black text-2xl shadow-lg shadow-emerald-500/30 mb-3">
            ½
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center justify-center gap-1.5">
            PecahanSeru
            <Sparkles className="w-4 h-4 text-amber-500" />
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Media Pembelajaran Interaktif Konversi Pecahan SD
          </p>
        </div>

        {/* Dual Role Tabs: Siswa vs Guru/Admin */}
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-100/90 border border-slate-200/80 mb-6">
          <button
            type="button"
            onClick={() => { setRoleTab('siswa'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              roleTab === 'siswa'
                ? 'bg-white text-emerald-700 shadow-md shadow-slate-200/60 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Siswa SD</span>
          </button>

          <button
            type="button"
            onClick={() => { setRoleTab('admin'); setErrorMsg(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl font-extrabold text-xs transition-all ${
              roleTab === 'admin'
                ? 'bg-white text-sky-700 shadow-md shadow-slate-200/60 scale-[1.02]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Guru &amp; Admin</span>
          </button>
        </div>

        {/* Error Alert Box */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 animate-shake">
            {errorMsg}
          </div>
        )}

        {/* ============================================================== */}
        {/* FORM 1: LOGIN SISWA                                            */}
        {/* ============================================================== */}
        {roleTab === 'siswa' && (
          <form onSubmit={handleSubmitSiswa} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Nama Lengkap Siswa:
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white border border-slate-200 shadow-inner focus-within:border-emerald-500 transition">
                <User className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Contoh: Budi Pratama"
                  value={namaSiswa}
                  onChange={(e) => setNamaSiswa(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 outline-none bg-transparent placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Nomor Absen Siswa:
              </label>
              <select
                value={absenSiswa}
                onChange={(e) => setAbsenSiswa(e.target.value)}
                className="w-full px-3.5 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 outline-none shadow-inner focus:border-emerald-500 transition"
              >
                {Array.from({ length: 40 }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    Nomor Absen {num}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer mt-2"
            >
              <span>Mulai Belajar &amp; Bermain</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ============================================================== */}
        {/* FORM 2: LOGIN GURU / ADMIN                                     */}
        {/* ============================================================== */}
        {roleTab === 'admin' && (
          <form onSubmit={handleSubmitAdmin} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Email Pendidik:
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white border border-slate-200 shadow-inner focus-within:border-sky-500 transition">
                <Mail className="w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  placeholder="adnanbahar@gmail.com"
                  value={emailAdmin}
                  onChange={(e) => setEmailAdmin(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 outline-none bg-transparent placeholder-slate-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Kata Sandi:
              </label>
              <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white border border-slate-200 shadow-inner focus-within:border-sky-500 transition">
                <Lock className="w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  placeholder="Kata sandi admin (adnan)"
                  value={passwordAdmin}
                  onChange={(e) => setPasswordAdmin(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 outline-none bg-transparent placeholder-slate-400"
                />
              </div>
            </div>

            {/* Quick Auto-Fill Demo Button */}
            <button
              type="button"
              onClick={() => {
                setEmailAdmin('adnanbahar@gmail.com');
                setPasswordAdmin('adnan');
                setErrorMsg('');
              }}
              className="text-[11px] font-bold text-sky-600 hover:text-sky-800 underline block"
            >
              Isi Otomatis Akun Demo (Pak Adnan)
            </button>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-700 hover:to-sky-800 text-white font-extrabold text-sm shadow-lg shadow-sky-600/25 flex items-center justify-center gap-2 transition hover:-translate-y-0.5 cursor-pointer mt-2"
            >
              <span>Masuk Portal Dasbor Guru</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* Link Kembali ke index.html Utama */}
        <div className="mt-6 pt-4 border-t border-slate-200/80 text-center">
          <button
            onClick={() => { window.location.href = 'index.html'; }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 inline-flex items-center gap-1.5 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Statis Aplikasi Utama</span>
          </button>
        </div>

      </div>

    </div>
  );
}

// ============================================================================
// 2. SIMULASI HALAMAN INTERNAL DASHBOARD
// ============================================================================

function DashboardPage() {
  return (
    <div className="space-y-4">
      <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-md">
        <h2 className="text-2xl font-extrabold text-slate-800">Dasbor Pembelajaran Pecahan</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Selamat datang kembali di sistem monitoring media pembelajaran matematika SD.
        </p>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white/70 border border-white/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Total Siswa Aktif</span>
          <p className="text-3xl font-extrabold text-sky-600 mt-1">245 Siswa</p>
        </div>
        <div className="p-5 rounded-3xl bg-white/70 border border-white/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Rata-rata Kelulusan</span>
          <p className="text-3xl font-extrabold text-emerald-600 mt-1">88.5%</p>
        </div>
        <div className="p-5 rounded-3xl bg-white/70 border border-white/80 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase">Kuis Terselesaikan</span>
          <p className="text-3xl font-extrabold text-orange-500 mt-1">1,420 Kuis</p>
        </div>
      </div>
    </div>
  );
}

function MateriPecahanPage() {
  const conversionExamples = [
    { fraction: '1/2', decimal: '0.5', percent: '50%', note: 'Setengah bagian utuh' },
    { fraction: '1/4', decimal: '0.25', percent: '25%', note: 'Satu perempat bagian' },
    { fraction: '3/4', decimal: '0.75', percent: '75%', note: 'Tiga perempat bagian' },
    { fraction: '1/5', decimal: '0.2', percent: '20%', note: 'Satu perlima bagian' },
    { fraction: '5/4', decimal: '1.25', percent: '125%', note: 'Pecahan tidak murni (> 1)' }
  ];

  return (
    <div className="space-y-4">
      <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-md flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Kelola Materi Konversi Pecahan</h2>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Atur kurikulum konversi pecahan biasa, desimal, dan persentase untuk siswa SD.
          </p>
        </div>
        <button 
          onClick={() => alert('Tambah modul materi konversi')}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition hover:-translate-y-0.5"
        >
          + Tambah Modul Materi
        </button>
      </div>

      <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-md">
        <h3 className="text-lg font-extrabold text-slate-800 mb-4">Tabel Standar Konversi Pecahan Siswa</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-extrabold text-slate-400 uppercase">
                <th className="py-3 px-4">Pecahan Biasa</th>
                <th className="py-3 px-4">Bentuk Desimal</th>
                <th className="py-3 px-4">Bentuk Persen</th>
                <th className="py-3 px-4">Keterangan Visual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-bold text-slate-700">
              {conversionExamples.map((item, idx) => (
                <tr key={idx} className="hover:bg-white/60 transition">
                  <td className="py-3 px-4 text-sky-600 font-extrabold text-base">{item.fraction}</td>
                  <td className="py-3 px-4 text-emerald-600">{item.decimal}</td>
                  <td className="py-3 px-4 text-purple-600">{item.percent}</td>
                  <td className="py-3 px-4 text-slate-500 font-medium">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function GameKuisPage() {
  return (
    <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-md space-y-4">
      <h2 className="text-2xl font-extrabold text-slate-800">Kelola Game &amp; Kuis Pecahan</h2>
      <p className="text-sm font-medium text-slate-500">
        Konfigurasi tantangan interaktif: Pizza Match, Balon Pecahan, dan Kuis Cepat.
      </p>
    </div>
  );
}

function NilaiSiswaPage() {
  return (
    <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-md space-y-4">
      <h2 className="text-2xl font-extrabold text-slate-800">Daftar &amp; Rekap Nilai Siswa</h2>
      <p className="text-sm font-medium text-slate-500">Data hasil latihan konversi pecahan kelas 4 SD.</p>
    </div>
  );
}

function PengaturanPage() {
  return (
    <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-md space-y-4">
      <h2 className="text-2xl font-extrabold text-slate-800">Pengaturan Aplikasi</h2>
      <p className="text-sm font-medium text-slate-500">Konfigurasi audio dan batas waktu kuis.</p>
    </div>
  );
}

function LaporanPage() {
  return (
    <div className="p-6 rounded-3xl bg-white/75 backdrop-blur-xl border border-white/80 shadow-md space-y-4">
      <h2 className="text-2xl font-extrabold text-slate-800">Laporan &amp; Analitik Pembelajaran</h2>
      <p className="text-sm font-medium text-slate-500">Grafik statistik pemahaman konversi pecahan.</p>
    </div>
  );
}

// ============================================================================
// 3. MAIN APP ROUTING (TERINTEGRASI DENGAN RUTE LOGIN)
// ============================================================================
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* RUTE 1: HALAMAN LOGIN PENUH (MURID & GURU/ADMIN) */}
        <Route path="/login" element={<LoginPage />} />

        {/* RUTE 2: KELOMPOK HALAMAN DALAM DENGAN SIDEBAR */}
        <Route
          path="/*"
          element={
            <div className="w-screen h-screen overflow-hidden flex bg-slate-100 font-sans">
              {/* Sidebar Navigasi Fungsional */}
              <Sidebar />

              {/* Area Konten Dinamis di Sebelah Kanan */}
              <main className="flex-1 h-screen overflow-y-auto p-8 bg-gradient-to-br from-slate-50 via-emerald-50/20 to-sky-50/30">
                <Routes>
                  {/* Default redirect ke dashboard */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/materi-pecahan" element={<MateriPecahanPage />} />
                  <Route path="/game-kuis" element={<GameKuisPage />} />
                  <Route path="/nilai-siswa" element={<NilaiSiswaPage />} />
                  <Route path="/pengaturan" element={<PengaturanPage />} />
                  <Route path="/laporan" element={<LaporanPage />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
