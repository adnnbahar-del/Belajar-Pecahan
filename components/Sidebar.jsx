import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  Gamepad2, 
  GraduationCap, 
  Sliders, 
  PieChart, 
  CheckCircle2, 
  Trophy, 
  Sparkles,
  ShieldCheck,
  LogOut
} from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();

  // Handler kembali ke laman login murid / admin
  const handleBackToLogin = () => {
    if (window.confirm('Keluar dari Dasbor dan kembali ke laman login murid/admin?')) {
      // 1. Arahkan ke rute /login di React Router
      navigate('/login');
      // 2. Jika Anda ingin kembali ke halaman login HTML aplikasi utama:
      // window.location.href = 'index.html';
    }
  };

  // Definisi konfigurasi menu navigasi
  const navMenuGroups = [
    {
      groupTitle: 'MENU UTAMA',
      items: [
        {
          name: 'Dashboard',
          path: '/dashboard',
          icon: LayoutDashboard,
          badge: null
        },
        {
          name: 'Kelola Materi Pecahan',
          path: '/materi-pecahan',
          icon: BookOpen,
          badge: {
            type: 'text',
            content: '5/4',
            className: 'bg-orange-100 text-orange-700 border border-orange-200'
          }
        },
        {
          name: 'Kelola Game & Kuis',
          path: '/game-kuis',
          icon: Gamepad2,
          badge: {
            type: 'icon',
            icon: CheckCircle2,
            className: 'bg-emerald-100 text-emerald-700 border border-emerald-200'
          }
        },
        {
          name: 'Daftar & Nilai Siswa',
          path: '/nilai-siswa',
          icon: GraduationCap,
          badge: {
            type: 'icon',
            icon: Trophy,
            className: 'bg-amber-100 text-amber-700 border border-amber-200'
          }
        }
      ]
    },
    {
      groupTitle: 'ADMINISTRASI',
      items: [
        {
          name: 'Pengaturan Aplikasi',
          path: '/pengaturan',
          icon: Sliders,
          badge: null
        },
        {
          name: 'Laporan & Analitik',
          path: '/laporan',
          icon: PieChart,
          badge: {
            type: 'icon',
            icon: PieChart,
            className: 'bg-sky-100 text-sky-700 border border-sky-200'
          }
        }
      ]
    }
  ];

  return (
    <aside 
      className="w-72 h-screen flex flex-col justify-between p-4 select-none
                 bg-gradient-to-b from-emerald-100/70 via-white/60 to-emerald-50/80 
                 backdrop-blur-2xl border-r border-white/80 shadow-xl shadow-slate-900/5 
                 transition-all duration-300"
    >
      {/* 1. BRAND HEADER */}
      <div>
        <div className="flex items-center gap-3 px-3 py-3 mb-4 rounded-2xl bg-white/70 border border-white/90 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center font-extrabold text-lg shadow-md shadow-emerald-500/20">
            ½
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base text-slate-800 tracking-tight flex items-center gap-1.5">
              PecahanSeru
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
              Konversi Pecahan SD
            </span>
          </div>
        </div>

        {/* 2. DAFTAR MENU BERDASARKAN GRUP */}
        <nav className="space-y-6">
          {navMenuGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-1.5">
              {/* Judul Bagian Menu */}
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-3 block">
                {group.groupTitle}
              </span>

              {/* Items Navigasi dengan NavLink */}
              {group.items.map((item, itemIdx) => {
                const IconComponent = item.icon;

                return (
                  <NavLink
                    key={itemIdx}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative flex items-center justify-between px-3.5 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-lg shadow-slate-200/60 scale-[1.02]'
                          : 'text-slate-700 hover:text-slate-950 hover:bg-white/55 hover:translate-x-1'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Indikator Garis Vertikal Oranye saat Menu Aktif */}
                        {isActive && (
                          <span 
                            className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-md bg-gradient-to-b from-orange-500 to-amber-500 shadow-sm" 
                            aria-hidden="true"
                          />
                        )}

                        {/* Label & Ikon Kiri */}
                        <div className="flex items-center gap-3 min-w-0">
                          <IconComponent 
                            className={`w-5 h-5 flex-shrink-0 transition-colors duration-200 ${
                              isActive 
                                ? 'text-orange-500' 
                                : 'text-slate-600 group-hover:text-slate-900'
                            }`} 
                          />
                          <span className="truncate">{item.name}</span>
                        </div>

                        {/* Badge Sisi Kanan (Jika ada) */}
                        {item.badge && (
                          <div className={`ml-2 px-2 py-0.5 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-extrabold shadow-2xs ${item.badge.className}`}>
                            {item.badge.type === 'text' && (
                              <span>{item.badge.content}</span>
                            )}
                            {item.badge.type === 'icon' && (
                              <item.badge.icon className="w-3.5 h-3.5" />
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* 3. FOOTER INFO STATUS PENDIDIK */}
      <div className="p-3.5 rounded-2xl bg-white/70 border border-white/90 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center text-sm font-bold">
            👨‍🏫
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs font-extrabold text-slate-800">Pak Adnan Dahar</span>
            <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Guru Pengajar
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Modul konversi pecahan biasa, desimal, dan persen aktif.
        </p>

        {/* Tombol Aksi: Kembali ke Laman Login Murid / Admin */}
        <button
          onClick={handleBackToLogin}
          className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl 
                     bg-rose-50/90 hover:bg-rose-100 text-rose-600 border border-rose-200 
                     text-xs font-extrabold transition-all duration-200 shadow-2xs hover:shadow-sm cursor-pointer"
          title="Keluar dari dasbor dan kembali ke halaman login"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Kembali ke Laman Login</span>
        </button>
      </div>
    </aside>
  );
}
