import React, { useState, useEffect } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { 
  LayoutDashboard, 
  BookOpen, 
  Gamepad2, 
  GraduationCap, 
  Sliders, 
  BarChart3, 
  Star, 
  Coins, 
  Users, 
  Bell, 
  Search, 
  Plus, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Trash2, 
  Edit3, 
  Smile, 
  RefreshCw,
  Sparkles,
  Award
} from 'lucide-react';

// ============================================================================
// 1. SIMULASI DATABASE MOCK DATA (JSON)
// ============================================================================

export const mockDatabase = {
  teacherProfile: {
    name: 'Pak Adnan Dahar',
    role: 'Guru Kelas 4 SD & Administrator',
    nip: '198804122015031002',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    totalSiswa: 245,
    jumlahBintang: 99,
    jumlahKoin: 999,
    unreadNotifications: 4
  },

  // Data Progres Kelulusan Modul untuk Donut Chart
  moduleProgress: [
    { name: 'Modul 1: Pengenalan Pecahan', value: 80, fraction: '1/2', displayFraction: '50%', color: '#0ea5e9' },
    { name: 'Modul 2: Pecahan Senilai', value: 70, fraction: '3/4', displayFraction: '47%', color: '#f97316' },
    { name: 'Modul 3: Operasi Penjumlahan', value: 90, fraction: '2/5', displayFraction: '50%', color: '#f43f5e' }
  ],

  // JSON Array studentLogs: Merekam aktivitas login & skor kuis pecahan real-time
  studentLogs: [
    {
      id: 'LOG-001',
      studentName: 'Budi Pratama',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Budi',
      activityType: 'quiz_complete',
      description: 'Menyelesaikan Kuis Pecahan Sederhana',
      score: 95,
      timestamp: '4 menit yang lalu',
      status: 'success'
    },
    {
      id: 'LOG-002',
      studentName: 'Anma Wijaya',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Anma',
      activityType: 'quiz_complete',
      description: 'Menyelesaikan Kuis Pecahan Senilai',
      score: 98,
      timestamp: '2 menit yang lalu',
      status: 'success'
    },
    {
      id: 'LOG-003',
      studentName: 'Nanm Omuy',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nanm',
      activityType: 'login',
      description: 'Login ke Aplikasi PecahanSeru',
      score: null,
      timestamp: '1 menit yang lalu',
      status: 'info'
    },
    {
      id: 'LOG-004',
      studentName: 'Budi Annan',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Annan',
      activityType: 'quiz_complete',
      description: 'Menyelesaikan Kuis Pecahan Campuran',
      score: 95,
      timestamp: '7 menit yang lalu',
      status: 'success'
    },
    {
      id: 'LOG-005',
      studentName: 'Citra Kirana',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Citra',
      activityType: 'quiz_complete',
      description: 'Menyelesaikan Tantangan Pizza Pecahan',
      score: 100,
      timestamp: '12 menit yang lalu',
      status: 'perfect'
    }
  ],

  // Konten Unggulan Guru
  featuredContents: [
    { id: 1, title: 'Matematika itu Menyenangkan!', likes: 42 },
    { id: 2, title: 'Setiap Pecahan Memiliki Makna', likes: 38 }
  ],

  // Murid dengan persentase penyelesaian tertinggi
  topStudent: {
    name: 'Siswa Berprestasi Bulan Ini',
    studentName: 'Citra Kirana',
    avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80',
    modulCompleted: 'Modul 1: 80% Selesai',
    progressPercentage: 80,
    needAttentionCount: 6
  }
};

// ============================================================================
// 2. SIMULASI MOCK API SERVICE DENGAN ASYNC / PROMISE
// ============================================================================

export const mockApiService = {
  // Ambil data metrik & profile guru
  fetchTeacherData: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...mockDatabase.teacherProfile });
      }, 500);
    });
  },

  // Ambil riwayat log aktivitas siswa (Simulasi Real-time)
  fetchStudentLogs: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockDatabase.studentLogs]);
      }, 600);
    });
  },

  // Ambil data progres modul untuk Donut Chart
  fetchModuleProgress: () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([...mockDatabase.moduleProgress]);
      }, 450);
    });
  }
};

// ============================================================================
// 3. KOMPONEN UTAMA DASHBOARD
// ============================================================================

export default function TeacherAdminDashboard() {
  // State Management
  const [teacher, setTeacher] = useState(mockDatabase.teacherProfile);
  const [logs, setLogs] = useState([]);
  const [moduleStats, setModuleStats] = useState([]);
  const [featuredList, setFeaturedList] = useState(mockDatabase.featuredContents);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifModal, setShowNotifModal] = useState(false);

  // Hook useEffect: Simulasi Fetching Data Real-time saat Komponen Dipasang
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [teacherData, logsData, progressData] = await Promise.all([
          mockApiService.fetchTeacherData(),
          mockApiService.fetchStudentLogs(),
          mockApiService.fetchModuleProgress()
        ]);
        setTeacher(teacherData);
        setLogs(logsData);
        setModuleStats(progressData);
      } catch (error) {
        console.error('Gagal mengambil data dasbor:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Handler: Tambah Log Baru (Simulasi WebSocket Event / Aktivitas Baru)
  const handleSimulateNewActivity = () => {
    const newLog = {
      id: `LOG-${Date.now()}`,
      studentName: 'Ahmad Fauzi',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${Date.now()}`,
      activityType: 'quiz_complete',
      description: 'Menyelesaikan Kuis Pembagian Pecahan',
      score: 92,
      timestamp: 'Baru saja',
      status: 'success'
    };
    setLogs((prev) => [newLog, ...prev]);
  };

  // Handler: Hapus Konten Unggulan
  const handleDeleteFeatured = (id) => {
    setFeaturedList((prev) => prev.filter((item) => item.id !== id));
  };

  // Handler: Beri Reaksi Like / Senyum
  const handleLikeFeatured = (id) => {
    setFeaturedList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      )
    );
  };

  // Filter Log Siswa berdasarkan Input Pencarian
  const filteredLogs = logs.filter(
    (log) =>
      log.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col font-sans bg-sky-300 select-none">
      
      {/* 3D School Garden Landscape Scenic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <img
          src="assets/admin_garden_bg.jpg"
          alt="3D Garden Background"
          className="w-full h-full object-cover object-bottom brightness-[1.02] saturate-[1.15]"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1920&q=80';
          }}
        />
        {/* Soft Glass Frosted Blur Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-sky-50/15 to-slate-900/30 backdrop-blur-[3px]" />
      </div>

      {/* Floating 3D Math Fraction Badges in the Background */}
      <div className="absolute top-[14%] left-[25%] pointer-events-none z-10 animate-bounce">
        <div className="w-12 h-12 rounded-full bg-white/90 border-2 border-white shadow-lg backdrop-blur-md flex flex-col items-center justify-center font-bold text-sky-600 text-xs">
          <span>1</span>
          <span className="w-4 h-[2px] bg-sky-600 my-[1px]" />
          <span>2</span>
        </div>
      </div>

      <div className="absolute top-[20%] right-[32%] pointer-events-none z-10 animate-pulse">
        <div className="w-11 h-11 rounded-full bg-white/90 border-2 border-white shadow-lg backdrop-blur-md flex flex-col items-center justify-center font-bold text-emerald-600 text-xs">
          <span>3</span>
          <span className="w-4 h-[2px] bg-emerald-600 my-[1px]" />
          <span>4</span>
        </div>
      </div>

      {/* ================================================================== */}
      {/* 1. TOP HEADER BAR (EDGE-TO-EDGE FULL-WIDTH)                         */}
      {/* ================================================================== */}
      <header className="relative z-20 w-full h-[68px] px-6 bg-white/80 backdrop-blur-xl border-b border-white/80 shadow-sm flex items-center justify-between gap-4">
        
        {/* Left: Brand & Teacher Profile Capsule */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/20">
            <div className="w-7 h-7 rounded-full bg-white text-sky-600 flex items-center justify-center font-extrabold text-sm">
              ½
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-sm tracking-wide">PecahanSeru</span>
              <span className="text-[10px] text-sky-100 font-semibold uppercase">Portal Guru</span>
            </div>
          </div>

          {/* Teacher Info Pill */}
          <div className="flex items-center gap-3 px-3.5 py-1 rounded-full bg-white/85 border border-white shadow-sm">
            <img
              src={teacher.avatar}
              alt={teacher.name}
              className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-inner bg-slate-200"
            />
            <div className="flex flex-col leading-tight">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Portal Guru &amp; Administrator:
              </span>
              <span className="text-xs font-extrabold text-slate-800">
                {teacher.name} (Guru)
              </span>
            </div>
          </div>
        </div>

        {/* Center: Top Header Info Metrics (totalSiswa, jumlahBintang, jumlahKoin) */}
        <div className="flex items-center gap-3">
          
          {/* Jumlah Bintang */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50/95 border border-amber-200 text-amber-700 font-bold text-sm shadow-sm transition hover:-translate-y-0.5">
            <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{teacher.jumlahBintang} Bintang</span>
          </div>

          {/* Jumlah Koin */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-50/95 border border-yellow-200 text-yellow-800 font-bold text-sm shadow-sm transition hover:-translate-y-0.5">
            <Coins className="w-4 h-4 text-yellow-500" />
            <span>{teacher.jumlahKoin} Koin</span>
          </div>

          {/* Total Siswa */}
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-50/95 border border-sky-200 text-sky-700 font-bold text-sm shadow-sm transition hover:-translate-y-0.5">
            <Users className="w-4 h-4 text-sky-600" />
            <span>Total Siswa: {teacher.totalSiswa}</span>
          </div>

          {/* Notifikasi Bell */}
          <button
            onClick={() => setShowNotifModal(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50/95 border border-rose-200 text-rose-700 font-bold text-sm shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-100 cursor-pointer relative"
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping absolute top-2 right-2" />
            <Bell className="w-4 h-4 text-rose-600" />
            <span>Notifikasi ({teacher.unreadNotifications})</span>
          </button>
        </div>

        {/* Right: Quick Search & Settings */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-white/90 shadow-inner w-44 focus-within:w-60 transition-all">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari siswa/kuis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none w-full placeholder-slate-400"
            />
          </div>

          <button
            onClick={handleSimulateNewActivity}
            title="Simulasi Masuknya Aktivitas Baru Siswa"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulasi Event</span>
          </button>

          <button
            onClick={() => alert('Buka pengaturan')}
            className="w-9 h-9 rounded-xl bg-white/80 border border-white text-slate-600 hover:text-sky-600 flex items-center justify-center transition hover:-translate-y-0.5 shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </button>

          <button
            onClick={() => alert('Logout')}
            className="w-9 h-9 rounded-xl bg-white/80 border border-white text-slate-600 hover:text-rose-600 flex items-center justify-center transition hover:-translate-y-0.5 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* 2. BODY WORKSPACE: VERTICAL SIDEBAR + 3-COLUMN CONTENT              */}
      {/* ================================================================== */}
      <div className="relative z-20 w-full flex-1 flex overflow-hidden">
        
        {/* SIDEBAR NAVIGATION (STRETCHES VERTICALLY TO BOTTOM) */}
        <aside className="w-64 h-full bg-white/75 backdrop-blur-2xl border-r border-white/80 p-4 flex flex-col justify-between overflow-y-auto">
          
          <div className="space-y-1.5">
            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Menu Navigasi
            </span>

            {/* Nav: Dashboard */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition relative ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className={`w-4 h-4 ${activeTab === 'dashboard' ? 'text-orange-500' : 'text-slate-400'}`} />
                <span>Dashboard</span>
              </div>
              {activeTab === 'dashboard' && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-md bg-gradient-to-b from-orange-500 to-amber-500" />
              )}
            </button>

            {/* Nav: Kelola Materi Pecahan */}
            <button
              onClick={() => setActiveTab('materi')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition ${
                activeTab === 'materi'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span>Kelola Materi Pecahan</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-orange-100 text-orange-700 font-extrabold text-[10px]">
                5/4
              </span>
            </button>

            {/* Nav: Kelola Game & Kuis */}
            <button
              onClick={() => setActiveTab('game')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition ${
                activeTab === 'game'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-4 h-4 text-slate-400" />
                <span>Kelola Game &amp; Kuis</span>
              </div>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-extrabold text-[10px]">
                <CheckCircle2 className="w-3 h-3 inline" />
              </span>
            </button>

            {/* Nav: Daftar & Nilai Siswa */}
            <button
              onClick={() => setActiveTab('nilai')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition ${
                activeTab === 'nilai'
                  ? 'bg-white text-slate-900 shadow-md shadow-slate-200/50'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>Daftar &amp; Nilai Siswa</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-extrabold text-[10px]">
                🏆 Top
              </span>
            </button>

            <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider px-3 pt-3 pb-1 block">
              Pengaturan
            </span>

            {/* Nav: Pengaturan */}
            <button
              onClick={() => setActiveTab('pengaturan')}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-white/60 hover:text-slate-900 transition"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Pengaturan Aplikasi</span>
            </button>

            {/* Nav: Laporan & Analitik */}
            <button
              onClick={() => setActiveTab('analitik')}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-white/60 hover:text-slate-900 transition"
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Laporan &amp; Analitik</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-700 font-extrabold text-[10px]">
                📊
              </span>
            </button>
          </div>

          {/* Sidebar Footer Info Card */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-sky-50/90 to-sky-100/90 border border-sky-200 shadow-sm">
            <div className="flex items-center justify-between text-xs font-extrabold text-sky-800 mb-1">
              <span>Status Pembelajaran</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                Aktif
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-snug">
              Semua modul pecahan kelas 4 berjalan optimal dengan mesin interaktif.
            </p>
          </div>
        </aside>

        {/* MAIN STAGE WORKSPACE (COHESIVE 3-COLUMN LAYOUT) */}
        <main className="flex-1 h-full p-4 flex flex-col gap-3 overflow-hidden">
          
          {/* Main Title Banner */}
          <div className="flex items-center justify-between px-1 flex-shrink-0">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                Dasbor Pembelajaran Pecahan
              </h1>
              <p className="text-xs font-semibold text-slate-500">
                Ringkasan capaian akademik dan log pengerjaan interaktif murid
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/80 border border-white text-slate-600 text-xs font-bold shadow-sm">
                Semester Ganjil 2026/2027
              </span>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-white text-slate-800 text-xs font-extrabold shadow-sm">
                <img
                  src={mockDatabase.topStudent.avatar}
                  alt="Avatar"
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>Profil</span>
              </div>
            </div>
          </div>

          {/* ================================================================ */}
          {/* COHESIVE 3-COLUMN GLASSMORPHISM GRID SYSTEM                      */}
          {/* ================================================================ */}
          <div className="flex-1 grid grid-cols-12 gap-3.5 min-h-0">
            
            {/* -------------------------------------------------------------- */}
            {/* KOLOM 1 (KIRI): GRAFIK KEMAJUAN GLOBAL (RECHARTS DONUT CHART)  */}
            {/* -------------------------------------------------------------- */}
            <section className="col-span-4 h-full bg-white/75 backdrop-blur-2xl border border-white/85 rounded-3xl p-4 shadow-lg shadow-slate-900/5 flex flex-col justify-between relative overflow-hidden">
              
              {/* Badge 1/2 */}
              <div className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white border border-rose-200 text-rose-500 font-extrabold text-[11px] shadow-sm flex flex-col items-center justify-center leading-none">
                <span>1</span>
                <span className="w-3 h-[1.5px] bg-rose-500 my-[1px]" />
                <span>2</span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Ringkasan Kemajuan Global</h2>
                <p className="text-xs font-semibold text-slate-500">Semua siswa siswa</p>
              </div>

              {/* RECHARTS DONUT CHART SIMULATION */}
              <div className="relative w-full h-48 flex items-center justify-center my-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip
                      formatter={(val, name) => [`${val}% Selesai`, name]}
                      contentStyle={{
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    />
                    <Pie
                      data={moduleStats}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={78}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {moduleStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Fraction Badge */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="flex flex-col items-center justify-center text-sky-600 font-extrabold leading-tight">
                    <span className="text-xl">3</span>
                    <span className="w-5 h-[2px] bg-sky-600 my-[1px]" />
                    <span className="text-xl">4</span>
                  </div>
                </div>
              </div>

              {/* Module Progress List Breakdown */}
              <div className="space-y-2 mt-auto">
                {moduleStats.map((mod, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50/80 border border-slate-200/80 text-xs font-bold text-slate-700 transition hover:bg-white"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: mod.color }} />
                      <span>{mod.name.split(':')[0]}: {mod.value}% Selesai</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white border border-slate-200 shadow-2xs">
                      {mod.fraction} {mod.displayFraction}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Quote Banner */}
              <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-100/90 to-yellow-100/90 border border-amber-300 text-amber-800 text-xs font-bold text-center shadow-xs">
                "Langkah kecil hari ini, prestasi besar nanti!"
              </div>
            </section>

            {/* -------------------------------------------------------------- */}
            {/* KOLOM 2 (TENGAH - KRUSIAL): AKTIVITAS TERBARU SISWA (LOG FEED) */}
            {/* -------------------------------------------------------------- */}
            <section className="col-span-4 h-full bg-white/75 backdrop-blur-2xl border border-white/85 rounded-3xl p-4 shadow-lg shadow-slate-900/5 flex flex-col justify-between relative overflow-hidden">
              
              {/* Badge 3/4 */}
              <div className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white border border-emerald-200 text-emerald-600 font-extrabold text-[11px] shadow-sm flex flex-col items-center justify-center leading-none">
                <span>3</span>
                <span className="w-3 h-[1.5px] bg-emerald-600 my-[1px]" />
                <span>4</span>
              </div>

              <div>
                <h2 className="text-lg font-extrabold text-slate-800">Aktivitas Terbaru Siswa</h2>
                <p className="text-xs font-semibold text-slate-500">Merekam login murid dan skor kuis real-time</p>
              </div>

              {/* Live Status Bar */}
              <div className="flex items-center justify-between py-1 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 my-1">
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Feed Real-Time
                </span>
                <span>{filteredLogs.length} Aktivitas Terekam</span>
              </div>

              {/* Scrollable Student Logs List */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 my-1 min-h-0">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Memuat log aktivitas siswa...
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400">
                    Tidak ada aktivitas ditemukan.
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      onClick={() => alert(`Detail Aktivitas: ${log.studentName} - ${log.description}`)}
                      className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs hover:shadow-md hover:bg-white hover:scale-[1.01] transition-all cursor-pointer"
                    >
                      {/* Avatar */}
                      <img
                        src={log.avatar}
                        alt={log.studentName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-xs bg-slate-100 flex-shrink-0"
                      />

                      {/* Info & Description */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-800 text-xs truncate">
                            {log.studentName}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 truncate">
                          {log.description}
                        </p>
                      </div>

                      {/* Skor Kuis Pill (Jika Ada) */}
                      {log.score !== null ? (
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold flex-shrink-0 ${
                          log.score >= 95
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                            : 'bg-sky-100 text-sky-700 border border-sky-200'
                        }`}>
                          Skor: {log.score}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                          Login
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Bottom Efficiency Banner */}
              <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-100/90 to-yellow-100/90 border border-amber-300 text-amber-800 text-xs font-bold text-center shadow-xs">
                "Manajemen Pembelajaran Pecahan yang Efisien"
              </div>
            </section>

            {/* -------------------------------------------------------------- */}
            {/* KOLOM 3 (KANAN): KONTEN UNGGULAN & SISWA BERPRESTASI           */}
            {/* -------------------------------------------------------------- */}
            <section className="col-span-4 h-full bg-white/75 backdrop-blur-2xl border border-white/85 rounded-3xl p-4 shadow-lg shadow-slate-900/5 flex flex-col justify-between relative overflow-hidden">
              
              {/* Badge 2/5 */}
              <div className="absolute top-3 right-4 w-8 h-8 rounded-full bg-white border border-sky-200 text-sky-600 font-extrabold text-[11px] shadow-sm flex flex-col items-center justify-center leading-none">
                <span>2</span>
                <span className="w-3 h-[1.5px] bg-sky-600 my-[1px]" />
                <span>5</span>
              </div>

              <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                
                {/* 3A. KONTEN UNGGULAN (INTERAKTIF: EDIT, SENYUM, HAPUS) */}
                <div className="p-3 rounded-2xl bg-white/80 border border-white shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-extrabold text-slate-800 text-sm">Konten Unggulan</h3>
                    <button
                      onClick={() => alert('Buka Manager Konten Unggulan')}
                      className="text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1"
                    >
                      Manager &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {featuredList.map((item) => (
                      <div
                        key={item.id}
                        className="p-2.5 rounded-xl bg-amber-50/90 border border-amber-200 shadow-2xs flex flex-col justify-between"
                      >
                        <span className="font-bold text-xs text-amber-900 leading-snug line-clamp-2">
                          {item.title}
                        </span>

                        {/* Action Buttons: Edit, Senyum, Hapus */}
                        <div className="flex items-center justify-around mt-2 pt-1.5 border-t border-amber-200/80">
                          <button
                            onClick={() => alert(`Edit konten: ${item.title}`)}
                            className="p-1 text-sky-600 hover:scale-125 transition"
                            title="Edit Materi"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleLikeFeatured(item.id)}
                            className="p-1 text-amber-600 hover:scale-125 transition flex items-center gap-0.5"
                            title="Beri Reaksi Senang"
                          >
                            <Smile className="w-3.5 h-3.5" />
                            <span className="text-[10px] font-bold">{item.likes}</span>
                          </button>
                          <button
                            onClick={() => handleDeleteFeatured(item.id)}
                            className="p-1 text-rose-600 hover:scale-125 transition"
                            title="Hapus Konten"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3B. SISWA BERPRESTASI BULAN INI (PERSENTASE TERTINGGI) */}
                <div className="p-3.5 rounded-2xl bg-white/85 border border-white shadow-xs flex items-center gap-3.5">
                  <div className="relative flex-shrink-0">
                    <img
                      src={mockDatabase.topStudent.avatar}
                      alt={mockDatabase.topStudent.studentName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md bg-slate-100"
                    />
                    <span className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-400 text-white shadow-sm">
                      <Award className="w-3 h-3" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-extrabold text-slate-800 text-xs leading-tight">
                      {mockDatabase.topStudent.name}
                    </h4>
                    <p className="text-[11px] font-bold text-sky-600 mb-1">
                      {mockDatabase.topStudent.studentName}
                    </p>

                    {/* Progress Bar 1: Modul 1 80% */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>{mockDatabase.topStudent.modulCompleted}</span>
                        <span>{mockDatabase.topStudent.progressPercentage}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-600"
                          style={{ width: `${mockDatabase.topStudent.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Progress Bar 2: Siswa Perlu Perhatian (Rainbow Gradient) */}
                    <div className="space-y-1 mt-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-500">Siswa Perlu Perhatian</span>
                        <span className="text-rose-600 font-extrabold">
                          {mockDatabase.topStudent.needAttentionCount} Siswa
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-500 to-cyan-500 w-[65%]" />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Bottom Quote Banner */}
              <div className="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-100/90 to-yellow-100/90 border border-amber-300 text-amber-800 text-xs font-bold text-center shadow-xs">
                "Langkah kecil hari ini, prestasi besar nanti!"
              </div>
            </section>

          </div>

        </main>

      </div>

      {/* ================================================================== */}
      {/* 4. MODAL POPUP NOTIFIKASI KELAS                                    */}
      {/* ================================================================== */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-white/80 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" />
                Notifikasi Kelas Terkini
              </h3>
              <button
                onClick={() => setShowNotifModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-700">
                <strong className="text-slate-900 block font-bold mb-0.5">🎉 Rekor Sempurna:</strong>
                Citra Kirana meraih skor 100 pada tantangan Game Pizza Pecahan!
              </div>
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800">
                <strong className="text-rose-900 block font-bold mb-0.5">⚠️ Perhatian Diperlukan:</strong>
                6 siswa masih kesulitan pada materi Modul 2 (Pecahan Senilai).
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
