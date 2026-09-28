/**
 * ===================================================================
 * PecahanSeru - Media Pembelajaran Interaktif Belajar Pecahan
 * JavaScript Core Architecture:
 * 1. Web Audio Synthesizer (Zero External Dependencies)
 * 2. Canvas Confetti Particle System
 * 3. Session & Role Management (Siswa & Admin: adnanbahar@gmail.com / adnan)
 * 4. Interactive Fraction Visualizer (SVG Pizza & Bar Simulator)
 * 5. Game Engine ("Koki Pizza Pecahan")
 * 6. Interactive Quiz System (10 Soal + Timer + Pembahasan)
 * 7. Score & History Engine + Admin Dashboard & CSV Export
 * ===================================================================
 */

(function () {
  'use strict';

  // -------------------------------------------------------------
  // 1. WEB AUDIO SYNTHESIZER
  // -------------------------------------------------------------
  class SoundEffects {
    constructor() {
      this.ctx = null;
      this.isMuted = false;
    }

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    toggleMute() {
      this.isMuted = !this.isMuted;
      return this.isMuted;
    }

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // Audio fallback ignore
      }
    }

    click() {
      this.playTone(600, 'triangle', 0.06, 0.08);
    }

    pop() {
      this.playTone(850, 'sine', 0.09, 0.12);
    }

    correct() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'sine', 0.22, 0.12);
        }, i * 75);
      });
    }

    wrong() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      [280, 230].forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'sawtooth', 0.2, 0.09);
        }, i * 130);
      });
    }

    celebrate() {
      if (this.isMuted) return;
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880, 740, 880];
      notes.forEach((freq, i) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.25, 0.12);
        }, i * 90);
      });
    }

    star() {
      this.playTone(987.77, 'sine', 0.3, 0.1);
    }
  }

  const sfx = new SoundEffects();

  // -------------------------------------------------------------
  // 2. CANVAS CONFETTI PARTICLE SYSTEM
  // -------------------------------------------------------------
  class ConfettiSystem {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
      this.particles = [];
      this.animId = null;
      this.colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }

    burst(count = 70) {
      if (!this.canvas || !this.ctx) return;
      this.resize();

      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          y: window.innerHeight / 2 - 80 + (Math.random() - 0.5) * 100,
          vx: (Math.random() - 0.5) * 16,
          vy: (Math.random() - 0.8) * 16,
          size: Math.random() * 9 + 6,
          color: this.colors[Math.floor(Math.random() * this.colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 12,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.01
        });
      }

      if (!this.animId) {
        this.render();
      }
    }

    render() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.rotation += p.vRot;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        this.animId = requestAnimationFrame(() => this.render());
      } else {
        this.animId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  }

  const confetti = new ConfettiSystem('confettiCanvas');

  // -------------------------------------------------------------
  // 3. STATE & STORAGE MANAGEMENT
  // -------------------------------------------------------------
  const STORAGE_KEY_RECORDS = 'pecahan_seru_quiz_records_v1';
  const STORAGE_KEY_USER_PROFILE = 'pecahan_seru_current_user_v1';

  let currentUser = {
    role: 'siswa', // 'siswa' or 'admin'
    nama: 'Adnan Bahar',
    absen: 1,
    avatar: '👨‍🎓',
    stars: 3,
    coins: 50,
    bestQuizScore: 0,
    bestGameScore: 0
  };

  // Pre-seed some demo data if local storage is empty for a rich initial presentation
  function seedDefaultRecords() {
    const existing = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!existing) {
      const initialRecords = [
        { id: '1', absen: 1, nama: 'Ahmad Fauzi', score: 90, correct: 9, total: 10, time: '2026-09-12 08:30', role: 'siswa' },
        { id: '2', absen: 4, nama: 'Citra Kirana', score: 100, correct: 10, total: 10, time: '2026-09-12 08:45', role: 'siswa' },
        { id: '3', absen: 7, nama: 'Dinda Permata', score: 80, correct: 8, total: 10, time: '2026-09-12 09:15', role: 'siswa' },
        { id: '4', absen: 12, nama: 'Gilang Ramadhan', score: 60, correct: 6, total: 10, time: '2026-09-12 09:40', role: 'siswa' },
        { id: '5', absen: 15, nama: 'Rian Pratama', score: 90, correct: 9, total: 10, time: '2026-09-13 10:10', role: 'siswa' }
      ];
      localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(initialRecords));
    }
  }
  seedDefaultRecords();

  function getQuizRecords() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_RECORDS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveQuizRecord(record) {
    const records = getQuizRecords();
    records.unshift(record);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  }

  // ── CATATAN SISWA KHUSUS DARI GURU (PAK ADNAN) ──
  const STORAGE_KEY_STUDENT_NOTES = 'pecahan_seru_student_notes_v1';

  function seedDefaultStudentNotes() {
    const existing = localStorage.getItem(STORAGE_KEY_STUDENT_NOTES);
    if (!existing) {
      const initialNotes = {
        'ahmad fauzi': {
          absen: 1,
          nama: 'Ahmad Fauzi',
          tag: 'Tuntas',
          note: 'Pemahaman konsep pecahan senilai sudah sangat baik. Tingkatkan latihan mandiri pada operasi pengurangan pecahan penyebut berbeda.',
          date: '2026-09-15 09:30',
          teacher: 'Pak Adnan Bahar, S.Pd.'
        },
        'citra kirana': {
          absen: 4,
          nama: 'Citra Kirana',
          tag: 'Sangat Baik',
          note: 'Luar biasa! Meraih nilai sempurna 100 pada kuis dan sangat teliti. Siap untuk materi pengayaan pecahan campuran lanjutan!',
          date: '2026-09-18 10:15',
          teacher: 'Pak Adnan Bahar, S.Pd.'
        },
        'gilang ramadhan': {
          absen: 12,
          nama: 'Gilang Ramadhan',
          tag: 'Perlu Bimbingan',
          note: 'Perlu bimbingan khusus pada perbandingan pecahan dan pembagian. Disarankan mengulang simulasi pizza dan berkonsultasi jika kesulitan.',
          date: '2026-09-20 11:00',
          teacher: 'Pak Adnan Bahar, S.Pd.'
        },
        'rian pratama': {
          absen: 15,
          nama: 'Rian Pratama',
          tag: 'Sangat Baik',
          note: 'Kemajuan belajar sangat pesat! Terus pertahankan ketelitian dan kecepatan dalam menyelesaikan kuis pecahan.',
          date: '2026-09-21 08:30',
          teacher: 'Pak Adnan Bahar, S.Pd.'
        }
      };
      localStorage.setItem(STORAGE_KEY_STUDENT_NOTES, JSON.stringify(initialNotes));
    }
  }
  seedDefaultStudentNotes();

  function getStudentNotes() {
    try {
      const data = localStorage.getItem(STORAGE_KEY_STUDENT_NOTES);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveStudentNote(nama, absen, note, tag) {
    if (currentUser.role !== 'admin') {
      alert('Akses Terbatas: Hanya Administrator (Pak Adnan) yang dapat menambah atau mengubah catatan siswa!');
      return false;
    }
    if (!nama || !note) return false;

    const notes = getStudentNotes();
    const key = nama.trim().toLowerCase();
    const now = new Date();
    const dateStr = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0') + ' ' +
      String(now.getHours()).padStart(2, '0') + ':' +
      String(now.getMinutes()).padStart(2, '0');

    notes[key] = {
      absen: absen || 1,
      nama: nama.trim(),
      tag: tag || 'Tuntas',
      note: note.trim(),
      date: dateStr,
      teacher: 'Pak Adnan Bahar, S.Pd.'
    };
    localStorage.setItem(STORAGE_KEY_STUDENT_NOTES, JSON.stringify(notes));
    return true;
  }

  function deleteStudentNote(nama) {
    if (currentUser.role !== 'admin') {
      alert('Akses Terbatas: Hanya Administrator (Pak Adnan) yang dapat menghapus catatan siswa!');
      return false;
    }
    const notes = getStudentNotes();
    const key = nama.trim().toLowerCase();
    if (notes[key]) {
      delete notes[key];
      localStorage.setItem(STORAGE_KEY_STUDENT_NOTES, JSON.stringify(notes));
      return true;
    }
    return false;
  }

  // -------------------------------------------------------------
  // 4. NAVIGATION & SCREEN MANAGER
  // -------------------------------------------------------------
  const screens = {
    welcome: document.getElementById('loginSection'),
    login: document.getElementById('loginSection'),
    mainMenu: document.getElementById('mainMenuSection'),
    materi: document.getElementById('materiSection'),
    game: document.getElementById('gameSection'),
    kuis: document.getElementById('kuisSection'),
    petunjuk: document.getElementById('petunjukSection'),
    hasil: document.getElementById('hasilSection')
  };

  // Welcome Screen Handlers
  const btnMulaiHotspot = document.getElementById('btnMulaiHotspot');
  const welcomeArtworkCard = document.getElementById('welcomeArtworkCard');
  const welcomeCoverImg = document.getElementById('welcomeCoverImg');
  const btnBackToWelcome = document.getElementById('btnBackToWelcome');

  function proceedToLogin() {
    sfx.celebrate();
    confetti.burst(50);
    switchScreen('login');
  }

  if (btnMulaiHotspot) {
    btnMulaiHotspot.addEventListener('click', (e) => {
      e.stopPropagation();
      proceedToLogin();
    });
    btnMulaiHotspot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        proceedToLogin();
      }
    });
  }
  if (welcomeCoverImg) {
    welcomeCoverImg.addEventListener('click', () => {
      proceedToLogin();
    });
  }
  if (welcomeArtworkCard) {
    welcomeArtworkCard.addEventListener('click', (e) => {
      if (e.target !== btnMulaiHotspot && !btnMulaiHotspot.contains(e.target)) {
        proceedToLogin();
      }
    });
  }
  if (btnBackToWelcome) {
    btnBackToWelcome.addEventListener('click', () => {
      sfx.click();
      switchScreen('login');
    });
  }

  function switchScreen(screenName) {
    sfx.click();
    Object.values(screens).forEach((scr) => {
      if (scr) scr.classList.remove('active');
    });

    const target = screens[screenName];
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Pause video if navigating away from materi screen
    if (screenName !== 'materi') {
      const materiVid = document.getElementById('materiVideoPlayer');
      if (materiVid && !materiVid.paused) {
        materiVid.pause();
      }
    }

    // Trigger on-enter hooks
    if (screenName === 'mainMenu') updateHeaderProfile();
    if (screenName === 'hasil') renderHasilScreen();
    if (screenName === 'materi') renderPizzaVisualizer();
    if (screenName === 'game') {
      if (typeof showGameSubScreen === 'function') showGameSubScreen('gameLobbyView');
      if (typeof updateGameHubHeader === 'function') updateGameHubHeader();
    }
  }

  function updateHeaderProfile() {
    const avatarEl = document.getElementById('userDisplayAvatar');
    const nameEl = document.getElementById('userDisplayName');
    const roleTagEl = document.getElementById('greetingRoleTag');
    const starsEl = document.getElementById('userDisplayStars');
    const coinsEl = document.getElementById('userDisplayCoins');
    const hasilDescEl = document.getElementById('hasilMenuDesc');

    if (currentUser.role === 'admin') {
      if (roleTagEl) roleTagEl.textContent = 'Portal Guru & Administrator';
      if (nameEl) nameEl.textContent = currentUser.nama || 'Pak Adnan Bahar (Guru)';
      if (avatarEl) {
        avatarEl.innerHTML = '<img src="assets/teacher_pak_adnan.jpg" alt="Pak Adnan" class="header-avatar-photo">';
      }
      if (hasilDescEl) hasilDescEl.textContent = 'Rekap lengkap nilai kuis seluruh siswa kelas, filter, dan unduh laporan Excel/CSV.';
    } else {
      if (roleTagEl) roleTagEl.textContent = `Absen ${currentUser.absen || '1'} • Siswa Hebat`;
      if (nameEl) nameEl.textContent = currentUser.nama || 'Siswa SD';
      if (avatarEl) {
        avatarEl.textContent = currentUser.avatar || '🚀';
      }
      if (hasilDescEl) hasilDescEl.textContent = 'Lihat riwayat skormu, lencana pencapaian, dan evaluasi hasil latihan.';
    }

    if (starsEl) starsEl.textContent = currentUser.stars !== undefined ? currentUser.stars : 99;
    if (coinsEl) coinsEl.textContent = currentUser.coins !== undefined ? currentUser.coins : 999;
  }

  // -------------------------------------------------------------
  // 5. LOGIN HANDLERS (SISWA & ADMIN) - MODULAR ARCHITECTURE
  // -------------------------------------------------------------

  // ── Helper: tampilkan/sembunyikan alert box di dalam card ──
  function showLoginAlert(msg) {
    const box = document.getElementById('loginAlertBox');
    const txt = document.getElementById('loginAlertMsg');
    if (!box || !txt) return;
    txt.textContent = msg;
    box.classList.remove('hidden');
    box.style.animation = 'none';
    // Trigger reflow to restart animation
    void box.offsetWidth;
    box.style.animation = '';
  }

  function hideLoginAlert() {
    const box = document.getElementById('loginAlertBox');
    if (box) box.classList.add('hidden');
  }

  // ── Helper: set button loading state ──
  function setLoginBtnLoading(isLoading) {
    const btn = document.getElementById('btnStudentLogin');
    const txt = document.getElementById('btnMasukText');
    const ico = document.getElementById('btnMasukIcon');
    if (!btn) return;
    if (isLoading) {
      btn.disabled = true;
      if (txt) txt.textContent = 'Memuat...';
      if (ico) { ico.className = 'fa-solid fa-spinner fa-spin'; }
    } else {
      btn.disabled = false;
      if (txt) txt.textContent = 'Masuk';
      if (ico) { ico.className = 'fa-solid fa-arrow-right'; }
    }
  }

  // ── NEW: Siswa Login Form Handler ──
  const formStudentLogin = document.getElementById('formStudentLogin');
  const studentNameInput  = document.getElementById('studentNameInput');
  const studentNumberInput = document.getElementById('studentNumberInput');
  const btnStudentLogin   = document.getElementById('btnStudentLogin');
  const mainLoginCard     = document.getElementById('mainLoginCard');

  function doStudentLogin() {
    const nama  = studentNameInput  ? studentNameInput.value.trim()  : '';
    const absen = studentNumberInput ? studentNumberInput.value.trim() : '';

    // Validation
    if (!nama) {
      showLoginAlert('Silakan masukkan nama lengkap.');
      if (studentNameInput) studentNameInput.focus();
      sfx.wrong();
      return;
    }
    if (!absen) {
      showLoginAlert('Silakan masukkan nomor absen.');
      if (studentNumberInput) studentNumberInput.focus();
      sfx.wrong();
      return;
    }
    if (!/^\d+$/.test(absen)) {
      showLoginAlert('Nomor absen hanya boleh berupa angka.');
      if (studentNumberInput) { studentNumberInput.value = ''; studentNumberInput.focus(); }
      sfx.wrong();
      return;
    }

    hideLoginAlert();

    // Loading animation
    setLoginBtnLoading(true);
    if (mainLoginCard) mainLoginCard.classList.add('card-submitting');

    sfx.celebrate();
    confetti.burst(55);

    // Persist to localStorage
    localStorage.setItem('studentName',   nama);
    localStorage.setItem('studentNumber', absen);

    // Update session state
    currentUser = {
      role: 'siswa',
      nama: nama,
      absen: parseInt(absen, 10),
      avatar: '🚀',
      stars: 3,
      coins: 50,
      bestQuizScore: 0,
      bestGameScore: 0
    };

    // Smooth transition after short delay
    setTimeout(() => {
      setLoginBtnLoading(false);
      if (mainLoginCard) mainLoginCard.classList.remove('card-submitting');
      switchScreen('mainMenu');
    }, 650);
  }

  if (btnStudentLogin) {
    btnStudentLogin.addEventListener('click', (e) => {
      e.preventDefault();
      doStudentLogin();
    });
  }

  if (formStudentLogin) {
    formStudentLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      doStudentLogin();
    });
  }

  // Clear alert on input
  if (studentNameInput) {
    studentNameInput.addEventListener('input', hideLoginAlert);
  }
  if (studentNumberInput) {
    studentNumberInput.addEventListener('input', hideLoginAlert);
  }

  // ── LEGACY: old siswa form (kept for backward compat if DOM still present) ──
  const btnMasukSiswa  = document.getElementById('btnMasukSiswa');
  const inputSiswaNama = document.getElementById('siswaNama');
  const inputSiswaAbsen = document.getElementById('siswaAbsen');

  if (btnMasukSiswa) {
    btnMasukSiswa.addEventListener('click', () => {
      const nama  = inputSiswaNama  ? inputSiswaNama.value.trim()  : '';
      const absen = inputSiswaAbsen ? inputSiswaAbsen.value.trim() : '';
      if (!nama) { sfx.wrong(); alert('Silakan masukkan Nama Lengkap Siswa!'); return; }
      if (!absen) { sfx.wrong(); alert('Silakan masukkan Nomor Absen siswa!'); return; }
      currentUser = { role: 'siswa', nama, absen: parseInt(absen, 10), avatar: '🚀', stars: 3, coins: 50, bestQuizScore: 0, bestGameScore: 0 };
      sfx.celebrate(); confetti.burst(50); switchScreen('mainMenu');
    });
  }

  // ── ADMIN MODAL HANDLER (Portal Guru - Pak Adnan) ──
  // ── ADMIN MODAL HANDLER (Portal Guru - Pak Adnan) ──
  const adminLoginModal        = document.getElementById('adminLoginModal');
  const adminModalCard         = document.getElementById('adminModalCard');
  const btnOpenAdminModal      = document.getElementById('btnOpenAdminModal');
  const btnCloseAdminModal     = document.getElementById('btnCloseAdminModal');
  const btnAdminModalCloseIcon = document.getElementById('btnAdminModalCloseIcon');
  const btnSubmitAdminLogin    = document.getElementById('btnSubmitAdminLogin');
  const adminSubmitText        = document.getElementById('adminSubmitText');
  const adminSubmitIcon        = document.getElementById('adminSubmitIcon');
  const modalAdminEmail        = document.getElementById('modalAdminEmail');
  const modalAdminPassword     = document.getElementById('modalAdminPassword');
  const adminModalAlert        = document.getElementById('adminModalAlert');
  const adminModalAlertText    = document.getElementById('adminModalAlertText');
  const btnAutoFillAdmin       = document.getElementById('btnAutoFillAdmin');
  const btnToggleAdminPassword = document.getElementById('btnToggleAdminPassword');
  const iconToggleAdminPassword = document.getElementById('iconToggleAdminPassword');
  const formAdminLoginModal    = document.getElementById('formAdminLoginModal');

  function openAdminModal() {
    if (adminLoginModal) {
      adminLoginModal.classList.remove('hidden');
      if (adminModalAlert) adminModalAlert.classList.add('hidden');
      if (modalAdminEmail) {
        setTimeout(() => modalAdminEmail.focus(), 150);
      }
    }
    sfx.pop();
  }

  function closeAdminModal() {
    if (adminLoginModal) adminLoginModal.classList.add('hidden');
    if (btnSubmitAdminLogin) {
      btnSubmitAdminLogin.disabled = false;
      if (adminSubmitText) adminSubmitText.textContent = 'Masuk Portal Admin';
      if (adminSubmitIcon) adminSubmitIcon.className = 'fa-solid fa-arrow-right-to-bracket';
    }
    sfx.click();
  }

  // Password visibility toggle handler
  if (btnToggleAdminPassword && modalAdminPassword) {
    btnToggleAdminPassword.addEventListener('click', () => {
      sfx.click();
      const isPassword = modalAdminPassword.type === 'password';
      modalAdminPassword.type = isPassword ? 'text' : 'password';
      if (iconToggleAdminPassword) {
        iconToggleAdminPassword.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
      }
    });
  }

  // Auto-Fill Helper Chip
  if (btnAutoFillAdmin) {
    btnAutoFillAdmin.addEventListener('click', () => {
      sfx.star();
      if (modalAdminEmail) modalAdminEmail.value = 'adnanbahar@gmail.com';
      if (modalAdminPassword) modalAdminPassword.value = 'adnan';
      if (adminModalAlert) adminModalAlert.classList.add('hidden');
      confetti.burst(20);

      // Visual flash feedback on button
      const originalHtml = btnAutoFillAdmin.innerHTML;
      btnAutoFillAdmin.innerHTML = '<i class="fa-solid fa-check"></i> Terisi!';
      btnAutoFillAdmin.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
      setTimeout(() => {
        btnAutoFillAdmin.innerHTML = originalHtml;
        btnAutoFillAdmin.style.background = '';
      }, 1200);
    });
  }

  function submitAdminLogin() {
    const email    = modalAdminEmail    ? modalAdminEmail.value.trim().toLowerCase()    : '';
    const password = modalAdminPassword ? modalAdminPassword.value.trim() : '';

    if (email === 'adnanbahar@gmail.com' && password === 'adnan') {
      // Loading State feedback
      if (btnSubmitAdminLogin) {
        btnSubmitAdminLogin.disabled = true;
        if (adminSubmitText) adminSubmitText.textContent = 'Memverifikasi...';
        if (adminSubmitIcon) adminSubmitIcon.className = 'fa-solid fa-spinner fa-spin';
      }

      currentUser = {
        role: 'admin',
        nama: 'Pak Adnan Bahar (Guru)',
        absen: 'Admin',
        avatar: '👨‍🏫',
        stars: 99,
        coins: 999,
        bestQuizScore: 100,
        bestGameScore: 999
      };

      sfx.celebrate();
      confetti.burst(70);

      setTimeout(() => {
        closeAdminModal();
        switchScreen('mainMenu');
      }, 450);
    } else {
      sfx.wrong();
      if (adminModalAlert) {
        const errorMsg = !email || !password 
          ? 'Silakan lengkapi email dan kata sandi terlebih dahulu!'
          : 'Email atau kata sandi tidak cocok. Silakan periksa kembali!';
        if (adminModalAlertText) {
          adminModalAlertText.textContent = errorMsg;
        } else {
          adminModalAlert.textContent = errorMsg;
        }
        adminModalAlert.classList.remove('hidden');
      }

      // Trigger card shake animation
      if (adminModalCard) {
        adminModalCard.classList.remove('shake');
        void adminModalCard.offsetWidth; // force reflow
        adminModalCard.classList.add('shake');
      }

      if (modalAdminPassword) {
        modalAdminPassword.focus();
        modalAdminPassword.select();
      }
    }
  }

  if (btnOpenAdminModal)      btnOpenAdminModal.addEventListener('click', openAdminModal);
  if (btnCloseAdminModal)     btnCloseAdminModal.addEventListener('click', closeAdminModal);
  if (btnAdminModalCloseIcon) btnAdminModalCloseIcon.addEventListener('click', closeAdminModal);
  if (btnSubmitAdminLogin)    btnSubmitAdminLogin.addEventListener('click', submitAdminLogin);

  if (formAdminLoginModal) {
    formAdminLoginModal.addEventListener('submit', (e) => {
      e.preventDefault();
      submitAdminLogin();
    });
  }

  // Close modal when clicking on backdrop
  if (adminLoginModal) {
    adminLoginModal.addEventListener('click', (e) => {
      if (e.target === adminLoginModal) closeAdminModal();
    });
  }

  // Clear alert when user starts re-typing
  if (modalAdminEmail) {
    modalAdminEmail.addEventListener('input', () => {
      if (adminModalAlert) adminModalAlert.classList.add('hidden');
    });
  }
  if (modalAdminPassword) {
    modalAdminPassword.addEventListener('input', () => {
      if (adminModalAlert) adminModalAlert.classList.add('hidden');
    });
  }

  // Escape key global listener to close modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && adminLoginModal && !adminLoginModal.classList.contains('hidden')) {
      closeAdminModal();
    }
  });

  // ── LEGACY: old admin form if DOM still present ──
  const btnMasukAdmin  = document.getElementById('btnMasukAdmin');
  const inputAdminEmail = document.getElementById('adminEmail');
  const adminPasswordInput = document.getElementById('adminPassword');

  if (btnMasukAdmin) {
    btnMasukAdmin.addEventListener('click', () => {
      const email    = inputAdminEmail    ? inputAdminEmail.value.trim().toLowerCase() : '';
      const password = adminPasswordInput ? adminPasswordInput.value.trim() : '';
      if (email === 'adnanbahar@gmail.com' && password === 'adnan') {
        currentUser = { role: 'admin', nama: 'Pak Adnan Bahar (Guru)', absen: 'Admin', avatar: '👨‍🏫', stars: 99, coins: 999, bestQuizScore: 100, bestGameScore: 999 };
        sfx.celebrate(); confetti.burst(60); switchScreen('mainMenu');
      } else {
        sfx.wrong();
        alert('Kredensial Admin salah!\n\nSilakan gunakan:\nUsername: adnanbahar@gmail.com\nPassword: adnan');
      }
    });
  }

  // Avatar items (legacy login form support)
  const avatarItems = document.querySelectorAll('.avatar-item');
  let selectedAvatar = '🚀';
  avatarItems.forEach((item) => {
    item.addEventListener('click', () => {
      avatarItems.forEach((av) => av.classList.remove('selected'));
      item.classList.add('selected');
      selectedAvatar = item.dataset.avatar || '🚀';
      sfx.pop();
    });
  });

  // Tab handlers for legacy login form
  const tabSiswa = document.getElementById('tabSiswa');
  const tabAdmin = document.getElementById('tabAdmin');
  const formSiswa = document.getElementById('formLoginSiswa');
  const formAdmin = document.getElementById('formLoginAdmin');

  if (tabSiswa && tabAdmin) {
    tabSiswa.addEventListener('click', () => {
      tabSiswa.classList.add('active'); tabAdmin.classList.remove('active');
      if (formSiswa) formSiswa.classList.add('active');
      if (formAdmin) formAdmin.classList.remove('active');
      sfx.click();
    });
    tabAdmin.addEventListener('click', () => {
      tabAdmin.classList.add('active'); tabSiswa.classList.remove('active');
      if (formAdmin) formAdmin.classList.add('active');
      if (formSiswa) formSiswa.classList.remove('active');
      sfx.click();
    });
  }

  // Legacy password toggle
  const btnTogglePassword = document.getElementById('btnTogglePassword');
  if (btnTogglePassword && adminPasswordInput) {
    btnTogglePassword.addEventListener('click', () => {
      const isPwd = adminPasswordInput.type === 'password';
      adminPasswordInput.type = isPwd ? 'text' : 'password';
      btnTogglePassword.innerHTML = isPwd
        ? '<i class="fa-solid fa-eye-slash"></i>'
        : '<i class="fa-solid fa-eye"></i>';
      sfx.click();
    });
  }

  // -------------------------------------------------------------
  // -------------------------------------------------------------
  // 6. MAIN MENU BUTTONS & LOGOUT (INTERACTIVE 3D COMPONENT LOGIC)
  // -------------------------------------------------------------
  const menuButtons = document.querySelectorAll('.btn-3d-glossy');
  menuButtons.forEach((btn) => {
    // Audio pop on hover
    btn.addEventListener('mouseenter', () => {
      sfx.click();
    });

    // Ripple & push animation helper
    const triggerMenuAction = (actionFn) => {
      sfx.pop();
      btn.style.transform = 'translateY(7px) scale(0.97)';
      setTimeout(() => {
        btn.style.transform = '';
        actionFn();
      }, 140);
    };

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });

  const menuBtnMateri = document.getElementById('menuBtnMateri');
  if (menuBtnMateri) {
    menuBtnMateri.addEventListener('click', () => {
      sfx.pop();
      menuBtnMateri.style.transform = 'translateY(7px) scale(0.97)';
      setTimeout(() => {
        menuBtnMateri.style.transform = '';
        switchScreen('materi');
      }, 140);
    });
  }

  const menuBtnGame = document.getElementById('menuBtnGame');
  if (menuBtnGame) {
    menuBtnGame.addEventListener('click', () => {
      sfx.pop();
      menuBtnGame.style.transform = 'translateY(7px) scale(0.97)';
      setTimeout(() => {
        menuBtnGame.style.transform = '';
        switchScreen('game');
        showGameSubScreen('gameLobbyView');
      }, 140);
    });
  }

  const menuBtnKuis = document.getElementById('menuBtnKuis');
  if (menuBtnKuis) {
    menuBtnKuis.addEventListener('click', () => {
      sfx.pop();
      menuBtnKuis.style.transform = 'translateY(7px) scale(0.97)';
      setTimeout(() => {
        menuBtnKuis.style.transform = '';
        switchScreen('kuis');
        resetQuizToHome();
      }, 140);
    });
  }

  const menuBtnPetunjuk = document.getElementById('menuBtnPetunjuk');
  if (menuBtnPetunjuk) {
    menuBtnPetunjuk.addEventListener('click', () => {
      sfx.pop();
      menuBtnPetunjuk.style.transform = 'translateY(7px) scale(0.97)';
      setTimeout(() => {
        menuBtnPetunjuk.style.transform = '';
        switchScreen('petunjuk');
      }, 140);
    });
  }

  const menuBtnHasil = document.getElementById('menuBtnHasil');
  if (menuBtnHasil) {
    menuBtnHasil.addEventListener('click', () => {
      sfx.pop();
      menuBtnHasil.style.transform = 'translateY(7px) scale(0.97)';
      setTimeout(() => {
        menuBtnHasil.style.transform = '';
        switchScreen('hasil');
      }, 140);
    });
  }

  const menuBtnKeluar = document.getElementById('menuBtnKeluar');
  if (menuBtnKeluar) {
    menuBtnKeluar.addEventListener('click', (e) => {
      e.preventDefault();
      sfx.pop();
      menuBtnKeluar.style.transform = 'translateY(7px) scale(0.97)';
      setTimeout(() => {
        menuBtnKeluar.style.transform = '';
        showLogoutModal();
      }, 140);
    });
  }

  // Back to Main Menu buttons
  document.querySelectorAll('.btnBackToMain').forEach((btn) => {
    btn.addEventListener('click', () => switchScreen('mainMenu'));
  });

  // Sound toggle button
  const btnToggleSound = document.getElementById('btnToggleSound');
  const btnMenuAudioToggle = document.getElementById('btnMenuAudioToggle');
  const menuAudioIcon = document.getElementById('menuAudioIcon');

  function syncAudioUI(muted) {
    if (btnToggleSound) {
      btnToggleSound.classList.toggle('muted', muted);
      btnToggleSound.innerHTML = muted
        ? '<i class="fa-solid fa-volume-xmark"></i>'
        : '<i class="fa-solid fa-volume-high"></i>';
    }
    if (btnMenuAudioToggle) {
      btnMenuAudioToggle.classList.toggle('muted', muted);
    }
    if (menuAudioIcon) {
      menuAudioIcon.className = muted
        ? 'fa-solid fa-volume-xmark'
        : 'fa-solid fa-volume-high';
    }
  }

  if (btnToggleSound) {
    btnToggleSound.addEventListener('click', () => {
      const muted = sfx.toggleMute();
      syncAudioUI(muted);
    });
  }

  if (btnMenuAudioToggle) {
    btnMenuAudioToggle.addEventListener('click', () => {
      const muted = sfx.toggleMute();
      syncAudioUI(muted);
    });
  }

  // Quick Logout button in header
  const btnQuickLogout = document.getElementById('btnQuickLogout');
  if (btnQuickLogout) {
    btnQuickLogout.addEventListener('click', (e) => {
      e.preventDefault();
      showLogoutModal();
    });
  }

  // Logout Modal Handling
  const logoutModal = document.getElementById('logoutModal');
  const btnCancelLogout = document.getElementById('btnCancelLogout');
  const btnConfirmLogout = document.getElementById('btnConfirmLogout');

  function showLogoutModal() {
    sfx.click();
    if (logoutModal) logoutModal.classList.remove('hidden');
  }

  function hideLogoutModal() {
    sfx.click();
    if (logoutModal) logoutModal.classList.add('hidden');
  }

  function doLogout() {
    sfx.pop();
    if (logoutModal) logoutModal.classList.add('hidden');

    // Reset student login form inputs
    const studentNameInput = document.getElementById('studentName');
    const studentNumberInput = document.getElementById('studentNumber');
    if (studentNameInput) studentNameInput.value = '';
    if (studentNumberInput) studentNumberInput.value = '';

    // Reset admin modal inputs
    const modalAdminEmail = document.getElementById('modalAdminEmail');
    const modalAdminPassword = document.getElementById('modalAdminPassword');
    if (modalAdminEmail) modalAdminEmail.value = 'adnanbahar@gmail.com';
    if (modalAdminPassword) modalAdminPassword.value = 'adnan';

    // Reset user state to unauthenticated
    currentUser = {
      role: 'siswa',
      nama: '',
      absen: '',
      avatar: '🚀',
      stars: 3,
      coins: 50,
      bestQuizScore: 0,
      bestGameScore: 0
    };

    // Transition back to login page
    switchScreen('login');
  }

  if (btnCancelLogout) {
    btnCancelLogout.addEventListener('click', (e) => {
      e.preventDefault();
      hideLogoutModal();
    });
  }

  if (btnConfirmLogout) {
    btnConfirmLogout.addEventListener('click', (e) => {
      e.preventDefault();
      doLogout();
    });
  }

  // Close modal when clicking backdrop outside dialog
  if (logoutModal) {
    logoutModal.addEventListener('click', (e) => {
      if (e.target === logoutModal) hideLogoutModal();
    });
  }

  // ESC key to cancel logout
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && logoutModal && !logoutModal.classList.contains('hidden')) {
      hideLogoutModal();
    }
  });

  // -------------------------------------------------------------
  // 7. MODUL MATERI & FRACTION SIMULATOR
  // -------------------------------------------------------------
  // Materi Tabs
  const materiTabBtns = document.querySelectorAll('.materi-tab-btn');
  const materiPanels = document.querySelectorAll('.materi-panel');

  materiTabBtns.forEach((tab) => {
    tab.addEventListener('click', () => {
      sfx.click();
      materiTabBtns.forEach((b) => b.classList.remove('active'));
      materiPanels.forEach((p) => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = 'panel' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');

      if (tab.dataset.tab !== 'materiVideo') {
        const vid = document.getElementById('materiVideoPlayer');
        if (vid && !vid.paused) vid.pause();
      }
    });
  });

  // Interactive Simulator Controls
  let simDen = 4; // Penyebut
  let simNum = 3; // Pembilang
  let simMode = 'pizza'; // 'pizza' or 'bar'

  const sliderPenyebut = document.getElementById('sliderPenyebut');
  const sliderPembilang = document.getElementById('sliderPembilang');
  const lblPenyebut = document.getElementById('lblPenyebut');
  const lblPembilang = document.getElementById('lblPembilang');
  const simValNum = document.getElementById('simValNum');
  const simValDen = document.getElementById('simValDen');
  const simBadgeReadText = document.getElementById('simBadgeReadText');
  const pizzaSvg = document.getElementById('pizzaSvg');
  const fractionBarStrip = document.getElementById('fractionBarStrip');
  const pizzaVisualContainer = document.getElementById('pizzaVisualContainer');
  const barVisualContainer = document.getElementById('barVisualContainer');

  const btnDecDen = document.getElementById('btnDecDen');
  const btnIncDen = document.getElementById('btnIncDen');
  const btnDecNum = document.getElementById('btnDecNum');
  const btnIncNum = document.getElementById('btnIncNum');

  const simModePizza = document.getElementById('simModePizza');
  const simModeBar = document.getElementById('simModeBar');

  if (simModePizza && simModeBar) {
    simModePizza.addEventListener('click', () => {
      simMode = 'pizza';
      simModePizza.classList.add('active');
      simModeBar.classList.remove('active');
      pizzaVisualContainer.classList.remove('hidden');
      barVisualContainer.classList.add('hidden');
      sfx.click();
      renderPizzaVisualizer();
    });

    simModeBar.addEventListener('click', () => {
      simMode = 'bar';
      simModeBar.classList.add('active');
      simModePizza.classList.remove('active');
      barVisualContainer.classList.remove('hidden');
      pizzaVisualContainer.classList.add('hidden');
      sfx.click();
      renderBarVisualizer();
    });
  }

  function getIndonesianFractionName(num, den) {
    const numWords = ['Nol', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua Belas'];
    const denWords = ['', '', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas', 'Dua Belas'];

    let name = '';
    if (num === 1 && den === 2) name = 'Setengah (Seperdua)';
    else if (num === 1 && den === 4) name = 'Seperempat';
    else if (num === den) name = 'Satu Utuh';
    else {
      name = `${numWords[num] || num} per ${denWords[den] || den}`;
    }

    const percentage = Math.round((num / den) * 100);
    return `"${name}" (${percentage}%)`;
  }

  function updateSimulatorControls() {
    if (simNum > simDen) simNum = simDen;
    sliderPembilang.max = simDen;
    sliderPembilang.value = simNum;
    sliderPenyebut.value = simDen;

    lblPenyebut.textContent = simDen;
    lblPembilang.textContent = simNum;
    simValNum.textContent = simNum;
    simValDen.textContent = simDen;
    simBadgeReadText.textContent = getIndonesianFractionName(simNum, simDen);

    if (simMode === 'pizza') {
      renderPizzaVisualizer();
    } else {
      renderBarVisualizer();
    }
  }

  // Slider events
  sliderPenyebut.addEventListener('input', (e) => {
    simDen = parseInt(e.target.value, 10);
    if (simNum > simDen) simNum = simDen;
    sfx.pop();
    updateSimulatorControls();
  });

  sliderPembilang.addEventListener('input', (e) => {
    simNum = parseInt(e.target.value, 10);
    sfx.pop();
    updateSimulatorControls();
  });

  btnDecDen.addEventListener('click', () => {
    if (simDen > 2) {
      simDen--;
      sfx.click();
      updateSimulatorControls();
    }
  });
  btnIncDen.addEventListener('click', () => {
    if (simDen < 12) {
      simDen++;
      sfx.click();
      updateSimulatorControls();
    }
  });

  btnDecNum.addEventListener('click', () => {
    if (simNum > 0) {
      simNum--;
      sfx.click();
      updateSimulatorControls();
    }
  });
  btnIncNum.addEventListener('click', () => {
    if (simNum < simDen) {
      simNum++;
      sfx.click();
      updateSimulatorControls();
    }
  });

  // SVG Pizza Arc Generator Helper
  function getPizzaSlicePath(cx, cy, r, startAngle, endAngle) {
    const rad = Math.PI / 180;
    const x1 = cx + r * Math.cos(startAngle * rad);
    const y1 = cy + r * Math.sin(startAngle * rad);
    const x2 = cx + r * Math.cos(endAngle * rad);
    const y2 = cy + r * Math.sin(endAngle * rad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  }

  // Render SVG Pizza for Simulator
  function renderPizzaVisualizer() {
    if (!pizzaSvg) return;
    pizzaSvg.innerHTML = '';

    const r = 95;
    const sliceAngle = 360 / simDen;

    // Background pizza plate/dough base
    const baseCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    baseCircle.setAttribute('cx', '0');
    baseCircle.setAttribute('cy', '0');
    baseCircle.setAttribute('r', (r + 8).toString());
    baseCircle.setAttribute('fill', '#fde68a');
    baseCircle.setAttribute('stroke', '#d97706');
    baseCircle.setAttribute('stroke-width', '6');
    pizzaSvg.appendChild(baseCircle);

    // Render Slices
    for (let i = 0; i < simDen; i++) {
      const startAngle = i * sliceAngle - 90;
      const endAngle = startAngle + sliceAngle;
      const pathData = getPizzaSlicePath(0, 0, r, startAngle, endAngle);

      const slicePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      slicePath.setAttribute('d', pathData);
      slicePath.setAttribute('stroke', '#b45309');
      slicePath.setAttribute('stroke-width', '2.5');

      const isSelected = i < simNum;
      slicePath.setAttribute('fill', isSelected ? '#ea580c' : '#fef3c7');
      slicePath.setAttribute('class', 'pizza-slice-path');
      slicePath.style.cursor = 'pointer';

      // Click to toggle slice
      slicePath.addEventListener('click', () => {
        if (i < simNum) {
          simNum = i; // Reduce
        } else {
          simNum = i + 1; // Increase up to this slice
        }
        sfx.pop();
        updateSimulatorControls();
      });

      pizzaSvg.appendChild(slicePath);

      // Render pepperoni decoration if selected
      if (isSelected && sliceAngle >= 25) {
        const midAngle = (startAngle + endAngle) / 2;
        const pepR = r * 0.6;
        const pepX = pepR * Math.cos((midAngle * Math.PI) / 180);
        const pepY = pepR * Math.sin((midAngle * Math.PI) / 180);

        const pep = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        pep.setAttribute('cx', pepX.toFixed(1));
        pep.setAttribute('cy', pepY.toFixed(1));
        pep.setAttribute('r', (sliceAngle < 40 ? 5 : 8).toString());
        pep.setAttribute('fill', '#dc2626');
        pep.setAttribute('stroke', '#991b1b');
        pep.setAttribute('stroke-width', '1.5');
        pep.style.pointerEvents = 'none';
        pizzaSvg.appendChild(pep);
      }
    }
  }

  // Render Bar Visualizer
  function renderBarVisualizer() {
    if (!fractionBarStrip) return;
    fractionBarStrip.innerHTML = '';

    for (let i = 0; i < simDen; i++) {
      const cell = document.createElement('div');
      cell.className = 'bar-cell' + (i < simNum ? ' active' : '');
      cell.textContent = `1/${simDen}`;

      cell.addEventListener('click', () => {
        if (i < simNum) {
          simNum = i;
        } else {
          simNum = i + 1;
        }
        sfx.pop();
        updateSimulatorControls();
      });

      fractionBarStrip.appendChild(cell);
    }
  }

  // Initial draw
  updateSimulatorControls();

  // -------------------------------------------------------------
  // 7.1 ENRICHED MATERI INTERACTIVE WIDGETS
  // -------------------------------------------------------------

  // Mini Converter in Bab 2
  const calcInputNum = document.getElementById('calcInputNum');
  const calcInputDen = document.getElementById('calcInputDen');
  const btnRunMiniConvert = document.getElementById('btnRunMiniConvert');
  const calcResultDisplay = document.getElementById('calcResultDisplay');

  function runMiniConvert() {
    sfx.click();
    const num = parseFloat(calcInputNum ? calcInputNum.value : 1) || 1;
    const den = parseFloat(calcInputDen ? calcInputDen.value : 4) || 1;
    if (den === 0) {
      if (calcResultDisplay) calcResultDisplay.innerHTML = '<span style="color:#dc2626;">Penyebut tidak boleh 0!</span>';
      return;
    }
    const des = (num / den).toFixed(2).replace('.', ',');
    const pct = ((num / den) * 100).toFixed(1).replace('.0', '').replace('.', ',');
    if (calcResultDisplay) {
      calcResultDisplay.innerHTML = `<span>Desimal: <strong>${des}</strong></span> &bull; <span>Persen: <strong>${pct}%</strong></span>`;
    }
  }

  if (btnRunMiniConvert) btnRunMiniConvert.addEventListener('click', runMiniConvert);
  if (calcInputNum) calcInputNum.addEventListener('input', runMiniConvert);
  if (calcInputDen) calcInputDen.addEventListener('input', runMiniConvert);

  // Mini Challenge in Bab 3 (Pecahan Senilai)
  const senilaiChallengeOptions = document.getElementById('senilaiChallengeOptions');
  const senilaiFeedback = document.getElementById('senilaiFeedback');

  if (senilaiChallengeOptions) {
    const btns = senilaiChallengeOptions.querySelectorAll('.btn-challenge');
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const isCorrect = btn.dataset.correct === 'true';
        btns.forEach((b) => {
          b.classList.remove('selected-correct', 'selected-wrong');
        });

        if (isCorrect) {
          sfx.correct();
          confetti.burst(30);
          btn.classList.add('selected-correct');
          if (senilaiFeedback) {
            senilaiFeedback.className = 'challenge-feedback correct';
            senilaiFeedback.innerHTML = '🎉 <strong>BENAR SEKALI!</strong> 3/5 dikali 2/2 = <strong>6/10</strong>. Luar biasa, pemahamanmu hebat!';
            senilaiFeedback.classList.remove('hidden');
          }
        } else {
          sfx.wrong();
          btn.classList.add('selected-wrong');
          if (senilaiFeedback) {
            senilaiFeedback.className = 'challenge-feedback wrong';
            senilaiFeedback.innerHTML = '❌ <em>Belum tepat.</em> Coba kalikan pembilang dan penyebut 3/5 dengan angka 2 (3&times;2 dan 5&times;2)!';
            senilaiFeedback.classList.remove('hidden');
          }
        }
      });
    });
  }

  // Story Problem Accordion Toggles in Bab 5
  document.querySelectorAll('.btn-toggle-story').forEach((btn) => {
    btn.addEventListener('click', () => {
      sfx.click();
      const targetId = btn.dataset.target;
      const targetBox = document.getElementById(targetId);
      if (targetBox) {
        const isHidden = targetBox.classList.contains('hidden');
        targetBox.classList.toggle('hidden', !isHidden);
        btn.innerHTML = isHidden
          ? '<i class="fa-solid fa-eye-slash"></i> Sembunyikan Pembahasan'
          : '<i class="fa-solid fa-eye"></i> Lihat Pembahasan Lengkap';
      }
    });
  });

  // -------------------------------------------------------------
  // 8. ULAR TANGGA PECAHAN — GAME ENGINE
  // -------------------------------------------------------------

  // ── Board Configuration (30 Kotak, 6 Kolom x 5 Baris) ──
  const UT_COLS = 6;
  const UT_ROWS = 5;
  const UT_BOARD_SIZE = 30;

  // Tangga (Ladder: bawah -> atas)
  const UT_LADDERS = { 4: 14, 9: 21, 15: 26, 20: 29 };
  // Ular (Snake: kepala -> ekor)
  const UT_SNAKES  = { 12: 3, 19: 7, 25: 8, 28: 10 };
  // Kotak Soal Pecahan (didistribusikan merata)
  const UT_QUESTION_SQUARES = new Set([2, 5, 8, 11, 13, 16, 18, 22, 24, 27]);
  const UT_DICE_FACES = ['⚀','⚁','⚂','⚃','⚄','⚅'];
  const UT_CELL_COLORS = ['cell-blue','cell-yellow','cell-green','cell-orange','cell-pink','cell-purple'];

  // ── Question Bank ──
  const UT_QUESTIONS = [
    // 1. Konsep Dasar
    { q: 'Apa yang dimaksud dengan pecahan?', vis: 'bar:3:4', opts: ['Bilangan bulat saja','Bagian dari keseluruhan','Bilangan negatif','Bilangan prima'], ans: 1,
      explain: 'Pecahan adalah bagian dari keseluruhan. Contoh: 3/4 artinya 3 bagian dari 4 bagian total.' },
    { q: 'Sebuah apel dibagi 2 sama besar, masing-masing bagian = ?', vis: 'bar:1:2', opts: ['1/3','1/4','1/2','2/1'], ans: 2,
      explain: '1 dari 2 bagian sama besar = 1/2 (satu per dua).' },
    // 2. Pembilang & Penyebut
    { q: 'Pada pecahan 3/4, angka 3 disebut …', vis: 'frac:3:4', opts: ['Penyebut','Pecahan biasa','Pembilang','Bilangan cacah'], ans: 2,
      explain: 'Angka di atas (3) = PEMBILANG. Angka di bawah (4) = PENYEBUT.' },
    { q: 'Pada pecahan 5/8, angka 8 disebut …', vis: 'frac:5:8', opts: ['Pembilang','Penyebut','Sisa','Faktor'], ans: 1,
      explain: 'Angka di bawah garis pecahan (8) = PENYEBUT, menunjukkan jumlah bagian total.' },
    { q: 'Berapa pembilang dari pecahan 2/7?', vis: 'frac:2:7', opts: ['7','9','2','14'], ans: 2,
      explain: 'Pembilang adalah angka di atas garis: 2/7 → pembilangnya adalah 2.' },
    // 3. Pecahan dari Gambar
    { q: 'Berapa pecahan yang berwarna biru?', vis: 'bar:2:5', opts: ['2/5','3/5','1/5','2/3'], ans: 0,
      explain: '2 kotak dari 5 kotak total berwarna biru, jadi pecahannya = 2/5.' },
    { q: 'Pizza dipotong 4 sama besar, 1 potong dimakan. Pecahan yang tersisa = ?', vis: 'pie:3:4', opts: ['1/4','3/4','2/4','4/4'], ans: 1,
      explain: 'Tersisa 3 dari 4 potongan = 3/4 pizza.' },
    { q: 'Berapa pecahan bagian yang diwarnai?', vis: 'bar:1:3', opts: ['1/2','2/3','1/3','3/3'], ans: 2,
      explain: '1 dari 3 bagian diwarnai, jadi jawabannya = 1/3.' },
    { q: 'Gambar menunjukkan berapa bagian berwarna?', vis: 'bar:3:6', opts: ['3/6','2/6','1/6','4/6'], ans: 0,
      explain: '3 dari 6 bagian berwarna = 3/6 (sama dengan 1/2).' },
    // 4. Membandingkan Pecahan
    { q: 'Mana yang lebih BESAR?', vis: 'compare:1:2:1:3', opts: ['1/3','1/2','Sama besar','Tidak bisa dibandingkan'], ans: 1,
      explain: '1/2 = 0,5 dan 1/3 ≈ 0,33, jadi 1/2 > 1/3.' },
    { q: 'Mana yang lebih KECIL: 3/4 atau 2/4?', vis: 'compare:3:4:2:4', opts: ['3/4','2/4','Sama besar','Keduanya nol'], ans: 1,
      explain: 'Penyebut sama (4), bandingkan pembilang: 2 < 3, jadi 2/4 < 3/4.' },
    { q: 'Bandingkan: 1/4 … 1/2', vis: 'compare:1:4:1:2', opts: ['> (lebih besar)','= (sama)','< (lebih kecil)','Tidak bisa'], ans: 2,
      explain: '1/4 = 0,25 dan 1/2 = 0,5, jadi 1/4 < 1/2.' },
    // 5. Mengurutkan
    { q: 'Urutkan dari terkecil ke terbesar: 1/2, 1/4, 3/4', vis: 'none', opts: ['1/4, 1/2, 3/4','3/4, 1/2, 1/4','1/2, 1/4, 3/4','1/4, 3/4, 1/2'], ans: 0,
      explain: '1/4=0,25 < 1/2=0,5 < 3/4=0,75. Urutan benar: 1/4, 1/2, 3/4.' },
    { q: 'Urutkan dari TERBESAR: 2/3, 1/3, 3/3', vis: 'none', opts: ['1/3, 2/3, 3/3','3/3, 2/3, 1/3','2/3, 3/3, 1/3','3/3, 1/3, 2/3'], ans: 1,
      explain: '3/3=1 > 2/3 > 1/3. Urutan dari terbesar: 3/3, 2/3, 1/3.' },
    // 6. Penjumlahan
    { q: '1/4 + 1/4 = …', vis: 'frac:1:4', opts: ['1/2','2/8','2/4','1/8'], ans: 2,
      explain: '1/4 + 1/4 = 2/4 (penyebut sama, tambahkan pembilang).' },
    { q: '1/3 + 1/3 = …', vis: 'frac:1:3', opts: ['2/6','2/3','1/6','3/3'], ans: 1,
      explain: '1/3 + 1/3 = 2/3 (penyebut sama, pembilang: 1+1=2).' },
    { q: '2/5 + 1/5 = …', vis: 'frac:2:5', opts: ['3/5','3/10','1/5','2/5'], ans: 0,
      explain: '2/5 + 1/5 = 3/5 (penyebut sama: 2+1=3, penyebut tetap 5).' },
    // 7. Pecahan Senilai
    { q: '2/4 dalam bentuk paling sederhana = …', vis: 'frac:2:4', opts: ['1/4','1/3','1/2','2/6'], ans: 2,
      explain: '2/4 = 1/2 (bagi pembilang dan penyebut dengan 2).' },
    { q: 'Berapa nilai dari 4/4?', vis: 'frac:4:4', opts: ['0','4','2','1'], ans: 3,
      explain: '4/4 = 1 (satu), karena keseluruhan dibagi jadi 4 bagian, diambil semua 4 bagian.' },
    { q: 'Pecahan manakah yang SENILAI dengan 1/2?', vis: 'frac:1:2', opts: ['2/6','2/4','1/3','3/8'], ans: 1,
      explain: '2/4 = 1/2 karena 1×2=2 dan 2×2=4. Pecahan senilai didapat dengan mengalikan pembilang dan penyebut dengan angka yang sama.' },
    // Extra
    { q: 'Kue dipotong 6 bagian sama besar. Adik makan 2 potong. Sisa kue = ?', vis: 'pie:4:6', opts: ['2/6','4/6','1/6','5/6'], ans: 1,
      explain: '6 - 2 = 4 potong tersisa dari 6 total = 4/6.' },
    { q: 'Lambang pecahan "satu per tiga" adalah …', vis: 'none', opts: ['3/1','1/3','1/4','3/3'], ans: 1,
      explain: '"Satu per tiga" ditulis 1/3: pembilang 1, penyebut 3.' },
    { q: 'Apel dibagi 4, Budi makan 3 potong. Bagian Budi = …', vis: 'pie:3:4', opts: ['1/4','4/3','3/4','3/3'], ans: 2,
      explain: '3 dari 4 bagian dimakan Budi = 3/4.' },
  ];

  // ── Game State ──
  let utState = {
    pos: 0,          // 0 = belum mulai
    score: 0,
    qAnswered: 0,
    turn: 1,
    rolling: false,
    waitingAnswer: false,
    waitingContinue: false,
    gameOver: false,
    diceVal: 0
  };

  // ── DOM References ──
  const utBoardGrid    = document.getElementById('utBoardGrid');
  const utSvgOverlay   = document.getElementById('utSvgOverlay');
  const utBoardContainer = document.getElementById('utBoardContainer');
  const utPion         = document.getElementById('utPion');
  const utDice         = document.getElementById('utDice');
  const utDiceFace     = document.getElementById('utDiceFace');
  const utDiceValue    = document.getElementById('utDiceValue');
  const btnRollDice    = document.getElementById('btnRollDice');
  const utPositionEl   = document.getElementById('utPosition');
  const utScoreEl      = document.getElementById('utScore');
  const utQAnsweredEl  = document.getElementById('utQAnswered');
  const utTurnEl       = document.getElementById('utTurn');
  const utStatusBox    = document.getElementById('utStatusBox');
  const utStatusIcon   = document.getElementById('utStatusIcon');
  const utStatusMsg    = document.getElementById('utStatusMsg');
  const utEventLog     = document.getElementById('utEventLog');
  // Question modal
  const utQuestionModal = document.getElementById('utQuestionModal');
  const utSqNum        = document.getElementById('utSqNum');
  const utQuestionText = document.getElementById('utQuestionText');
  const utQuestionVisual = document.getElementById('utQuestionVisual');
  const utOptionsGrid  = document.getElementById('utOptionsGrid');
  const utFeedbackMsg  = document.getElementById('utFeedbackMsg');
  const utFeedbackIcon = document.getElementById('utFeedbackIcon');
  const utFeedbackText = document.getElementById('utFeedbackText');
  // Event modal
  const utEventModal   = document.getElementById('utEventModal');
  const utEventModalCard = document.getElementById('utEventModalCard');
  const utEventModalEmoji = document.getElementById('utEventModalEmoji');
  const utEventModalTitle = document.getElementById('utEventModalTitle');
  const utEventModalMsg   = document.getElementById('utEventModalMsg');
  const btnContinueAfterEvent = document.getElementById('btnContinueAfterEvent');
  // Win screen
  const utWinScreen    = document.getElementById('utWinScreen');
  const utFinalScore   = document.getElementById('utFinalScore');
  const utFinalCorrect = document.getElementById('utFinalCorrect');
  const utFinalTurns   = document.getElementById('utFinalTurns');
  const btnUtPlayAgain = document.getElementById('btnUtPlayAgain');
  const btnUtReset     = document.getElementById('btnUtReset');

  // ── Helper: Square number → grid position (row 1=top, col 1=left) ──
  function utSquareToGrid(n) {
    const rowFromBottom = Math.floor((n - 1) / UT_COLS); // 0–4
    const posInRow = (n - 1) % UT_COLS;                  // 0–5
    const col = rowFromBottom % 2 === 0 ? posInRow + 1 : UT_COLS - posInRow;
    const row = UT_ROWS - rowFromBottom;                 // 1=top, 5=bottom
    return { row, col };
  }

  // ── Helper: Square center as percentage of board ──
  function utSquarePct(n) {
    const { row, col } = utSquareToGrid(n);
    const cellW = 100 / UT_COLS;
    const cellH = 100 / UT_ROWS;
    return {
      x: (col - 1) * cellW + cellW / 2,
      y: (row - 1) * cellH + cellH / 2
    };
  }

  // ── Helper: Square center in SVG coords (0–600 x 0–500) ──
  function utSquareSVG(n) {
    const pct = utSquarePct(n);
    return { x: pct.x * 6, y: pct.y * 5 };
  }

  // ── Generate Board ──
  function utGenerateBoard() {
    if (!utBoardGrid) return;
    utBoardGrid.innerHTML = '';

    for (let sq = 1; sq <= UT_BOARD_SIZE; sq++) {
      const { row, col } = utSquareToGrid(sq);
      const cell = document.createElement('div');
      cell.id = `utCell-${sq}`;
      cell.style.gridRow = row;
      cell.style.gridColumn = col;

      // Determine type
      const isStart    = sq === 1;
      const isFinish   = sq === UT_BOARD_SIZE;
      const isSnakeHead = sq in UT_SNAKES;
      const isLadderBot = sq in UT_LADDERS;
      const isQuestion  = UT_QUESTION_SQUARES.has(sq);

      // Classes
      cell.className = 'ut-cell';
      if (isStart)       cell.classList.add('cell-start');
      else if (isFinish) cell.classList.add('cell-finish');
      else if (isQuestion) cell.classList.add('cell-question');
      else               cell.classList.add(UT_CELL_COLORS[(sq - 1) % UT_CELL_COLORS.length]);

      if (isSnakeHead)  cell.classList.add('cell-snake-head');
      if (isLadderBot)  cell.classList.add('cell-ladder-bottom');

      // Number label
      const numEl = document.createElement('div');
      numEl.className = 'ut-cell-num';
      numEl.textContent = sq;
      cell.appendChild(numEl);

      // Center icon
      const iconEl = document.createElement('div');
      iconEl.className = 'ut-cell-icon';
      if (isStart)        iconEl.textContent = '🏁';
      else if (isFinish)  iconEl.textContent = '🏆';
      else if (isSnakeHead)  iconEl.textContent = sq === 28 ? '🐍' : sq === 25 ? '🦎' : sq === 19 ? '🐊' : '🐉';
      else if (isLadderBot)  iconEl.textContent = '🪜';
      else if (isQuestion)   iconEl.textContent = '❓';
      else {
        // decorative icons
        const decos = ['🍕','🎂','🍎','🧁','🍭','🌟','📐','✏️','📚','🎈'];
        iconEl.textContent = sq % 10 === 0 ? '🎯' : decos[sq % decos.length];
      }
      cell.appendChild(iconEl);

      // Finish label
      if (isFinish) {
        const finLabel = document.createElement('div');
        finLabel.className = 'cell-finish-label';
        finLabel.textContent = 'FINISH';
        cell.appendChild(finLabel);
      }
      if (isStart) {
        const stLabel = document.createElement('div');
        stLabel.className = 'cell-start-label';
        stLabel.textContent = 'START';
        cell.appendChild(stLabel);
      }

      utBoardGrid.appendChild(cell);
    }
  }

  // ── Draw Snakes & Ladders on SVG ──
  function utDrawSVGElements() {
    if (!utSvgOverlay) return;
    utSvgOverlay.innerHTML = '';

    // Draw SNAKES
    const snakeColors = ['#ef4444','#7c3aed','#0ea5e9','#16a34a'];
    let sIdx = 0;
    for (const [head, tail] of Object.entries(UT_SNAKES)) {
      const h = parseInt(head);
      const t = parseInt(tail);
      const from = utSquareSVG(h);
      const to   = utSquareSVG(t);
      const color = snakeColors[sIdx++ % snakeColors.length];
      const mid = { x: (from.x + to.x) / 2 + (from.x > to.x ? 40 : -40), y: (from.y + to.y) / 2 };

      // Snake body (cubic bezier)
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      const cp1x = from.x + (to.x - from.x) * 0.25 + 55;
      const cp1y = from.y + (to.y - from.y) * 0.15;
      const cp2x = to.x   + (from.x - to.x) * 0.25 - 55;
      const cp2y = to.y   + (from.y - to.y) * 0.15;
      path.setAttribute('d', `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '10');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('opacity', '0.82');
      utSvgOverlay.appendChild(path);

      // Pattern overlay (scale pattern)
      const path2 = document.createElementNS('http://www.w3.org/2000/svg','path');
      path2.setAttribute('d', `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`);
      path2.setAttribute('fill', 'none');
      path2.setAttribute('stroke', 'rgba(255,255,255,0.35)');
      path2.setAttribute('stroke-width', '4');
      path2.setAttribute('stroke-linecap', 'round');
      path2.setAttribute('stroke-dasharray', '8 10');
      path2.setAttribute('opacity', '0.9');
      utSvgOverlay.appendChild(path2);

      // Snake head circle
      const hCircle = document.createElementNS('http://www.w3.org/2000/svg','circle');
      hCircle.setAttribute('cx', from.x); hCircle.setAttribute('cy', from.y);
      hCircle.setAttribute('r', '16');
      hCircle.setAttribute('fill', color); hCircle.setAttribute('opacity', '0.25');
      utSvgOverlay.appendChild(hCircle);

      // Tail dot
      const tCircle = document.createElementNS('http://www.w3.org/2000/svg','circle');
      tCircle.setAttribute('cx', to.x); tCircle.setAttribute('cy', to.y);
      tCircle.setAttribute('r', '8'); tCircle.setAttribute('fill', color); tCircle.setAttribute('opacity', '0.4');
      utSvgOverlay.appendChild(tCircle);
    }

    // Draw LADDERS
    for (const [bot, top] of Object.entries(UT_LADDERS)) {
      const b = parseInt(bot);
      const t = parseInt(top);
      const from = utSquareSVG(b); // bottom
      const to   = utSquareSVG(t); // top
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const len = Math.sqrt(dx*dx + dy*dy);
      const nx = -dy / len * 10; // normal offset for rails
      const ny =  dx / len * 10;

      // Two rails
      ['left','right'].forEach((side, si) => {
        const sign = si === 0 ? 1 : -1;
        const rail = document.createElementNS('http://www.w3.org/2000/svg','line');
        rail.setAttribute('x1', from.x + sign*nx); rail.setAttribute('y1', from.y + sign*ny);
        rail.setAttribute('x2', to.x   + sign*nx); rail.setAttribute('y2', to.y   + sign*ny);
        rail.setAttribute('stroke', '#92400e'); rail.setAttribute('stroke-width', '5');
        rail.setAttribute('stroke-linecap', 'round'); rail.setAttribute('opacity', '0.85');
        utSvgOverlay.appendChild(rail);
      });

      // Rungs
      const numRungs = Math.max(3, Math.floor(len / 28));
      for (let r = 1; r <= numRungs; r++) {
        const t_val = r / (numRungs + 1);
        const cx = from.x + dx * t_val;
        const cy = from.y + dy * t_val;
        const rung = document.createElementNS('http://www.w3.org/2000/svg','line');
        rung.setAttribute('x1', cx + nx); rung.setAttribute('y1', cy + ny);
        rung.setAttribute('x2', cx - nx); rung.setAttribute('y2', cy - ny);
        rung.setAttribute('stroke', '#d97706'); rung.setAttribute('stroke-width', '4');
        rung.setAttribute('stroke-linecap', 'round'); rung.setAttribute('opacity', '0.9');
        utSvgOverlay.appendChild(rung);
      }

      // Glow at bottom
      const glow = document.createElementNS('http://www.w3.org/2000/svg','circle');
      glow.setAttribute('cx', from.x); glow.setAttribute('cy', from.y);
      glow.setAttribute('r', '14'); glow.setAttribute('fill', '#22c55e'); glow.setAttribute('opacity', '0.18');
      utSvgOverlay.appendChild(glow);
    }
  }

  // ── Position Pion ──
  function utPositionPion(sq) {
    if (!utPion || !utBoardContainer) return;
    const pct = utSquarePct(sq);
    const container = utBoardContainer;
    const cw = container.offsetWidth || container.clientWidth;
    const ch = container.offsetHeight || container.clientHeight;
    const left = (pct.x / 100) * cw;
    const top  = (pct.y / 100) * ch;
    utPion.style.left = left + 'px';
    utPion.style.top  = top  + 'px';
    utPion.style.display = 'flex';

    // Highlight active cell
    document.querySelectorAll('.ut-cell.cell-active').forEach(c => c.classList.remove('cell-active'));
    const activeCell = document.getElementById(`utCell-${sq}`);
    if (activeCell) activeCell.classList.add('cell-active');
  }

  // ── Reposition pion (responsive) ──
  let utResizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(utResizeTimer);
    utResizeTimer = setTimeout(() => {
      if (utState.pos > 0) utPositionPion(utState.pos);
    }, 100);
  });

  // ── Add Log Entry ──
  function utAddLog(msg, type = 'log-move') {
    if (!utEventLog) return;
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = msg;
    utEventLog.insertBefore(entry, utEventLog.firstChild);
  }

  // ── Update HUD ──
  function utUpdateHUD() {
    if (utPositionEl) utPositionEl.textContent = utState.pos === 0 ? 'START' : (utState.pos === UT_BOARD_SIZE ? 'FINISH' : utState.pos);
    if (utScoreEl)    utScoreEl.textContent    = utState.score;
    if (utQAnsweredEl) utQAnsweredEl.textContent = utState.qAnswered;
    if (utTurnEl)     utTurnEl.textContent     = utState.turn;
  }

  // ── Set Status ──
  function utSetStatus(icon, msg, type = '') {
    if (!utStatusBox) return;
    utStatusBox.className = 'ut-status-box' + (type ? ` status-${type}` : '');
    if (utStatusIcon) utStatusIcon.textContent = icon;
    if (utStatusMsg)  utStatusMsg.innerHTML    = msg;
  }

  // ── Build Question Visual ──
  function utBuildVisual(vis) {
    if (!utQuestionVisual) return;
    utQuestionVisual.innerHTML = '';
    if (!vis || vis === 'none') return;

    const parts = vis.split(':');
    const type  = parts[0];

    if (type === 'bar') {
      const filled = parseInt(parts[1]);
      const total  = parseInt(parts[2]);
      const wrap = document.createElement('div'); wrap.className = 'q-bar-wrap';
      for (let i = 0; i < total; i++) {
        const seg = document.createElement('div');
        seg.className = 'q-bar-seg ' + (i < filled ? 'filled' : 'empty');
        seg.style.width = Math.max(18, Math.floor(220 / total)) + 'px';
        wrap.appendChild(seg);
      }
      utQuestionVisual.appendChild(wrap);
    }
    else if (type === 'frac') {
      const num = parts[1]; const den = parts[2];
      const frac = document.createElement('div'); frac.className = 'q-frac-large';
      frac.innerHTML = `<span>${num}</span><div class="q-frac-line"></div><span>${den}</span>`;
      utQuestionVisual.appendChild(frac);
    }
    else if (type === 'pie') {
      const filled = parseInt(parts[1]); const total = parseInt(parts[2]);
      const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 100 100'); svg.setAttribute('class','q-pie-svg');
      const cx = 50; const cy = 50; const r = 45;
      svg.innerHTML += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#fde68a" stroke="#d97706" stroke-width="2"/>`;
      const sliceAngle = 360 / total;
      const colors = ['#3b82f6','#f97316','#10b981','#ef4444','#8b5cf6','#f59e0b'];
      for (let i = 0; i < total; i++) {
        const startDeg = -90 + i * sliceAngle;
        const endDeg   = startDeg + sliceAngle;
        const x1 = cx + r * Math.cos(startDeg * Math.PI/180);
        const y1 = cy + r * Math.sin(startDeg * Math.PI/180);
        const x2 = cx + r * Math.cos(endDeg * Math.PI/180);
        const y2 = cy + r * Math.sin(endDeg * Math.PI/180);
        const lg = sliceAngle > 180 ? 1 : 0;
        const fill = i < filled ? (colors[i % colors.length]) : '#f1f5f9';
        svg.innerHTML += `<path d="M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${lg} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${fill}" stroke="white" stroke-width="1.5"/>`;
      }
      utQuestionVisual.appendChild(svg);
    }
    else if (type === 'compare') {
      const n1=parts[1]; const d1=parts[2]; const n2=parts[3]; const d2=parts[4];
      const f1 = document.createElement('div'); f1.className = 'q-frac-large';
      f1.innerHTML = `<span>${n1}</span><div class="q-frac-line"></div><span>${d1}</span>`;
      const vs = document.createElement('span');
      vs.textContent = ' … '; vs.style.cssText = 'font-size:1.6rem;font-weight:800;color:#64748b;margin:0 6px;';
      const f2 = document.createElement('div'); f2.className = 'q-frac-large';
      f2.innerHTML = `<span>${n2}</span><div class="q-frac-line"></div><span>${d2}</span>`;
      utQuestionVisual.append(f1, vs, f2);
    }
  }

  // ── Show Question ──
  let utCurrentQuestion = null;
  function utShowQuestion(sq) {
    if (!utQuestionModal) return;
    utState.waitingAnswer = true;
    if (btnRollDice) btnRollDice.disabled = true;

    // Pick a random question
    utCurrentQuestion = UT_QUESTIONS[Math.floor(Math.random() * UT_QUESTIONS.length)];
    const q = utCurrentQuestion;

    if (utSqNum)         utSqNum.textContent     = `Kotak ${sq} — Ada Soal!`;
    if (utQuestionText)  utQuestionText.textContent = q.q;
    if (utFeedbackMsg)   { utFeedbackMsg.className = 'ut-question-feedback hidden'; }

    utBuildVisual(q.vis);

    // Build options
    if (utOptionsGrid) {
      utOptionsGrid.innerHTML = '';
      q.opts.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'ut-option-btn';
        btn.textContent = opt;
        btn.addEventListener('click', () => utHandleAnswer(idx, btn));
        utOptionsGrid.appendChild(btn);
      });
    }

    utQuestionModal.style.display = 'flex';
    sfx.pop();
    utSetStatus('❓', `<strong>Soal Pecahan!</strong><br>Jawab dengan benar untuk mendapat +10 poin!`, 'question');
  }

  // ── Handle Answer ──
  function utHandleAnswer(selected, clickedBtn) {
    if (!utCurrentQuestion) return;
    const correct = utCurrentQuestion.ans;
    const allBtns = utOptionsGrid ? utOptionsGrid.querySelectorAll('.ut-option-btn') : [];
    allBtns.forEach(b => b.disabled = true);

    if (selected === correct) {
      clickedBtn.classList.add('correct');
      utState.score += 10;
      utState.qAnswered++;
      sfx.correct();
      if (utFeedbackMsg) {
        utFeedbackMsg.className = 'ut-question-feedback feedback-correct';
        if (utFeedbackIcon) utFeedbackIcon.textContent = '✅';
        if (utFeedbackText) utFeedbackText.textContent = `Benar! +10 poin. ${utCurrentQuestion.explain}`;
      }
      utAddLog(`✅ Jawaban benar! +10 skor (total: ${utState.score})`, 'log-correct');
      confetti.burst(30);

      if (currentUser) {
        currentUser.coins = (currentUser.coins || 50) + 10;
        currentUser.stars = (currentUser.stars || 3) + 1;
        try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser)); } catch (e) {}
        updateHeaderProfile();
        updateGameHubHeader();
      }
    } else {
      clickedBtn.classList.add('wrong');
      allBtns[correct].classList.add('correct');
      sfx.wrong();
      if (utFeedbackMsg) {
        utFeedbackMsg.className = 'ut-question-feedback feedback-wrong';
        if (utFeedbackIcon) utFeedbackIcon.textContent = '❌';
        if (utFeedbackText) utFeedbackText.textContent = `Salah. ${utCurrentQuestion.explain}`;
      }
      utAddLog(`❌ Jawaban salah. Pelajari lagi ya!`, 'log-wrong');
    }

    utUpdateHUD();

    setTimeout(() => {
      if (utQuestionModal) utQuestionModal.style.display = 'none';
      utState.waitingAnswer = false;
      if (btnRollDice) btnRollDice.disabled = false;
      utSetStatus('🎲', 'Tekan <strong>LEMPAR DADU</strong> untuk lanjut!');
    }, 2200);
  }

  // ── Show Event Modal (snake or ladder) ──
  function utShowEventModal(type, fromSq, toSq, callback) {
    if (!utEventModal) { callback(); return; }
    if (btnRollDice) btnRollDice.disabled = true;
    utState.waitingContinue = true;

    if (utEventModalCard) {
      utEventModalCard.className = `ut-event-modal-card event-${type}`;
    }

    if (type === 'snake') {
      if (utEventModalEmoji) utEventModalEmoji.textContent = '🐍';
      if (utEventModalTitle) utEventModalTitle.textContent = 'Kena Ular! Turun!';
      if (utEventModalMsg) utEventModalMsg.textContent = `Oops! Ada ular di kotak ${fromSq}. Kamu turun ke kotak ${toSq}. Semangat ya!`;
      sfx.wrong();
      utSetStatus('🐍', `Kena ular! Turun dari kotak <strong>${fromSq}</strong> ke kotak <strong>${toSq}</strong>.`, 'snake');
    } else {
      if (utEventModalEmoji) utEventModalEmoji.textContent = '🪜';
      if (utEventModalTitle) utEventModalTitle.textContent = 'Naik Tangga! Hore!';
      if (utEventModalMsg) utEventModalMsg.textContent = `Wow! Ada tangga di kotak ${fromSq}. Kamu naik ke kotak ${toSq}. Keren!`;
      sfx.correct();
      confetti.burst(25);
      utSetStatus('🪜', `Naik tangga! Dari kotak <strong>${fromSq}</strong> ke kotak <strong>${toSq}</strong>. 🎉`, 'ladder');
    }

    utEventModal.style.display = 'flex';

    const handler = () => {
      utEventModal.style.display = 'none';
      utState.waitingContinue = false;
      if (btnRollDice) btnRollDice.disabled = false;
      if (btnContinueAfterEvent) btnContinueAfterEvent.removeEventListener('click', handler);
      callback();
    };
    if (btnContinueAfterEvent) {
      btnContinueAfterEvent.addEventListener('click', handler, { once: true });
    }
  }

  // ── Move Pion Step by Step ──
  function utMovePion(targetSq, callback) {
    if (utState.pos === 0) {
      utState.pos = 1;
      utPositionPion(1);
      setTimeout(() => utMovePionTo(targetSq, callback), 300);
      return;
    }

    let current = utState.pos;
    const step = () => {
      if (current >= targetSq) {
        utState.pos = targetSq;
        utPositionPion(targetSq);
        setTimeout(callback, 300);
        return;
      }
      current++;
      utState.pos = current;
      utPositionPion(current);
      sfx.click();
      setTimeout(step, 280);
    };
    step();
  }

  function utMovePionTo(sq, callback) {
    utState.pos = sq;
    utPositionPion(sq);
    setTimeout(callback, 400);
  }

  // ── Check Win ──
  function utCheckWin() {
    if (utState.pos >= UT_BOARD_SIZE) {
      utState.pos = UT_BOARD_SIZE;
      utPositionPion(UT_BOARD_SIZE);
      utState.gameOver = true;
      if (btnRollDice) btnRollDice.disabled = true;
      utAddLog(`🏆 MENANG! Kotak ${UT_BOARD_SIZE} tercapai dalam ${utState.turn} giliran!`, 'log-win');
      sfx.celebrate();
      confetti.burst(100);

      if (currentUser) {
        if (!currentUser.bestGameScore || utState.score > currentUser.bestGameScore) {
          currentUser.bestGameScore = utState.score;
        }
        currentUser.hasWonGame = true;
        currentUser.stars = (currentUser.stars || 3) + 3;
        currentUser.coins = (currentUser.coins || 50) + 30;
        try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser)); } catch (e) {}
        updateHeaderProfile();
        updateGameHubHeader();
      }

      setTimeout(() => {
        if (utFinalScore)   utFinalScore.textContent   = utState.score;
        if (utFinalCorrect) utFinalCorrect.textContent = utState.qAnswered;
        if (utFinalTurns)   utFinalTurns.textContent   = utState.turn;
        if (utWinScreen)    utWinScreen.style.display  = 'flex';
      }, 800);
      return true;
    }
    return false;
  }

  // ── Roll Dice Handler ──
  function utRollDice() {
    if (utState.rolling || utState.waitingAnswer || utState.waitingContinue || utState.gameOver) return;
    sfx.pop();
    utState.rolling = true;
    if (btnRollDice) btnRollDice.disabled = true;

    // Animate dice
    const dice = document.getElementById('utDice');
    if (dice) dice.classList.add('rolling');

    let rollCount = 0;
    const rollInterval = setInterval(() => {
      const tempVal = Math.floor(Math.random() * 6) + 1;
      if (utDiceFace) utDiceFace.querySelector('.dice-emoji').textContent = UT_DICE_FACES[tempVal - 1];
      rollCount++;
      if (rollCount >= 10) {
        clearInterval(rollInterval);
        if (dice) dice.classList.remove('rolling');

        const rolled = Math.floor(Math.random() * 6) + 1;
        utState.diceVal = rolled;
        if (utDiceFace) utDiceFace.querySelector('.dice-emoji').textContent = UT_DICE_FACES[rolled - 1];
        if (utDiceValue) utDiceValue.textContent = rolled;

        utAddLog(`🎲 Dadu: ${rolled} (giliran ${utState.turn})`, 'log-move');

        const currentPos = utState.pos === 0 ? 0 : utState.pos;
        let targetPos = Math.min(currentPos + rolled, UT_BOARD_SIZE);

        utSetStatus('🚀', `Dadu <strong>${rolled}</strong>! Bergerak ke kotak ${targetPos}...`);

        // Move pion step by step
        utMovePion(targetPos, () => {
          utUpdateHUD();
          const landedSq = utState.pos;

          // Check win first
          if (utCheckWin()) {
            utState.rolling = false;
            return;
          }

          // Check snake
          if (landedSq in UT_SNAKES) {
            const snakeTail = UT_SNAKES[landedSq];
            utAddLog(`🐍 Ular di kotak ${landedSq}! Turun ke ${snakeTail}.`, 'log-snake');
            setTimeout(() => {
              utShowEventModal('snake', landedSq, snakeTail, () => {
                utMovePionTo(snakeTail, () => {
                  utState.pos = snakeTail;
                  utUpdateHUD();
                  // Check question
                  if (UT_QUESTION_SQUARES.has(snakeTail)) {
                    setTimeout(() => utShowQuestion(snakeTail), 400);
                  }
                  utState.rolling = false;
                  utState.turn++;
                  utUpdateHUD();
                  if (btnRollDice) btnRollDice.disabled = false;
                });
              });
            }, 300);
          }
          // Check ladder
          else if (landedSq in UT_LADDERS) {
            const ladderTop = UT_LADDERS[landedSq];
            utAddLog(`🪜 Tangga di kotak ${landedSq}! Naik ke ${ladderTop}.`, 'log-ladder');
            setTimeout(() => {
              utShowEventModal('ladder', landedSq, ladderTop, () => {
                utMovePionTo(ladderTop, () => {
                  utState.pos = ladderTop;
                  utUpdateHUD();
                  if (utCheckWin()) { utState.rolling = false; return; }
                  if (UT_QUESTION_SQUARES.has(ladderTop)) {
                    setTimeout(() => utShowQuestion(ladderTop), 400);
                  }
                  utState.rolling = false;
                  utState.turn++;
                  utUpdateHUD();
                  if (btnRollDice) btnRollDice.disabled = false;
                });
              });
            }, 300);
          }
          // Check question
          else if (UT_QUESTION_SQUARES.has(landedSq)) {
            setTimeout(() => {
              utShowQuestion(landedSq);
              utState.rolling = false;
              utState.turn++;
              utUpdateHUD();
            }, 400);
          }
          // Normal square
          else {
            utSetStatus('🎲', 'Tekan <strong>LEMPAR DADU</strong> untuk giliran berikutnya!');
            utState.rolling = false;
            utState.turn++;
            utUpdateHUD();
            if (btnRollDice) btnRollDice.disabled = false;
          }
        });
      }
    }, 65);
  }

  // ── Initialize / Reset Game ──
  function initGameSession() {
    utState = { pos: 0, score: 0, qAnswered: 0, turn: 1, rolling: false, waitingAnswer: false, waitingContinue: false, gameOver: false, diceVal: 0 };
    utUpdateHUD();

    if (utBoardGrid) utGenerateBoard();
    if (utSvgOverlay) {
      // Small delay to let DOM settle
      setTimeout(utDrawSVGElements, 50);
    }

    // Hide pion initially
    if (utPion) { utPion.style.display = 'none'; }

    // Reset dice face
    if (utDiceFace) utDiceFace.querySelector('.dice-emoji').textContent = '🎲';
    if (utDiceValue) utDiceValue.textContent = '-';

    // Clear log
    if (utEventLog) {
      utEventLog.innerHTML = '<div class="log-entry log-start">🎬 Game dimulai! Semangat belajar!</div>';
    }

    // Close all modals
    if (utQuestionModal) utQuestionModal.style.display = 'none';
    if (utEventModal)    utEventModal.style.display    = 'none';
    if (utWinScreen)     utWinScreen.style.display     = 'none';

    // Enable roll button
    if (btnRollDice) btnRollDice.disabled = false;

    utSetStatus('🎮', 'Tekan <strong>LEMPAR DADU</strong> untuk memulai petualangan belajarmu!');
  }

  // ── Wire up buttons ──
  if (btnRollDice)   btnRollDice.addEventListener('click',  utRollDice);
  if (btnUtReset)    btnUtReset.addEventListener('click',   () => { sfx.click(); initGameSession(); });
  if (btnUtPlayAgain) btnUtPlayAgain.addEventListener('click', () => { sfx.click(); initGameSession(); });

  // -------------------------------------------------------------
  // 8.B ARENA GAME PECAHAN - HUB ROUTER & 3 GAME BARU
  // -------------------------------------------------------------
  const gameSubviews = {
    lobby: document.getElementById('gameLobbyView'),
    ularTangga: document.getElementById('gameViewUlarTangga'),
    pizzaChef: document.getElementById('gameViewPizzaChef'),
    balon: document.getElementById('gameViewBalon'),
    timbangan: document.getElementById('gameViewTimbangan')
  };

  function updateGameHubHeader() {
    const ghAvatar = document.getElementById('ghUserAvatar');
    const ghName = document.getElementById('ghUserName');
    const ghStars = document.getElementById('ghUserStars');
    const ghScore = document.getElementById('ghUserScore');
    const ghCoins = document.getElementById('ghUserCoins');
    const ghProgressFill = document.getElementById('ghProgressFill');
    const ghProgressText = document.getElementById('ghProgressText');

    const stars = currentUser && currentUser.stars !== undefined ? currentUser.stars : 3;
    const coins = currentUser && currentUser.coins !== undefined ? currentUser.coins : 50;

    if (ghAvatar) ghAvatar.textContent = (currentUser && currentUser.avatar) || '👨‍🎓';
    if (ghName) ghName.textContent = (currentUser && currentUser.nama) || 'Adnan Bahar';
    if (ghStars) ghStars.textContent = stars;
    if (ghScore) ghScore.textContent = coins;
    if (ghCoins) ghCoins.textContent = coins;
    if (ghProgressFill) {
      const pct = Math.min(100, Math.max(15, Math.round((stars / 10) * 100)));
      ghProgressFill.style.width = pct + '%';
    }
    if (ghProgressText) {
      ghProgressText.textContent = `${stars}/10 Bintang Juara`;
    }
  }

  const btnHubSoundToggle = document.getElementById('btnHubSoundToggle');
  if (btnHubSoundToggle) {
    btnHubSoundToggle.addEventListener('click', () => {
      const muted = sfx.toggleMute();
      const icon = btnHubSoundToggle.querySelector('i');
      if (icon) {
        icon.className = muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      }
      if (!muted) sfx.pop();
    });
  }

  const btnHubBackHome = document.getElementById('btnHubBackHome');
  if (btnHubBackHome) {
    btnHubBackHome.addEventListener('click', () => {
      sfx.click();
      switchScreen('mainMenu');
    });
  }

  // Micro-interaction sound on card hover
  document.querySelectorAll('.game-card-3d').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (typeof sfx !== 'undefined' && sfx.playTone) {
        sfx.playTone(520, 'triangle', 0.08, 0.03);
      }
    });
  });

  function showGameSubScreen(subviewId) {
    Object.values(gameSubviews).forEach(v => {
      if (v) {
        v.classList.remove('active');
        v.style.display = 'none';
      }
    });

    const target = document.getElementById(subviewId);
    if (target) {
      target.classList.add('active');
      target.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (subviewId === 'gameLobbyView') {
      updateGameHubHeader();
      const winModal = document.getElementById('gameHubWinModal');
      if (winModal) winModal.style.display = 'none';
      if (typeof balonTimerInterval !== 'undefined' && balonTimerInterval) {
        clearInterval(balonTimerInterval);
      }
    }
  }

  // Wire up back to lobby buttons
  document.querySelectorAll('.btnBackToGameLobby').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx.click();
      showGameSubScreen('gameLobbyView');
    });
  });

  // Launch buttons from Lobby
  const btnLaunchGameUt = document.getElementById('btnLaunchGameUt');
  if (btnLaunchGameUt) {
    btnLaunchGameUt.addEventListener('click', () => {
      sfx.celebrate();
      showGameSubScreen('gameViewUlarTangga');
      initGameSession();
    });
  }

  const btnLaunchGamePizza = document.getElementById('btnLaunchGamePizza');
  if (btnLaunchGamePizza) {
    btnLaunchGamePizza.addEventListener('click', () => {
      sfx.celebrate();
      showGameSubScreen('gameViewPizzaChef');
      initPizzaChefGame();
    });
  }

  const btnLaunchGameBalon = document.getElementById('btnLaunchGameBalon');
  if (btnLaunchGameBalon) {
    btnLaunchGameBalon.addEventListener('click', () => {
      sfx.celebrate();
      showGameSubScreen('gameViewBalon');
      initBalloonGame();
    });
  }

  const btnLaunchGameTimbangan = document.getElementById('btnLaunchGameTimbangan');
  if (btnLaunchGameTimbangan) {
    btnLaunchGameTimbangan.addEventListener('click', () => {
      sfx.celebrate();
      showGameSubScreen('gameViewTimbangan');
      initScaleGame();
    });
  }

  // Universal Game Win Modal
  function showGameHubWinModal({ title, subtitle, score, coins, accuracy, onPlayAgain }) {
    sfx.celebrate();
    confetti.burst(90);

    const winModal = document.getElementById('gameHubWinModal');
    const titleEl = document.getElementById('ghWinTitle');
    const subEl = document.getElementById('ghWinSubtitle');
    const scoreEl = document.getElementById('ghWinFinalScore');
    const coinsEl = document.getElementById('ghWinCoins');
    const accEl = document.getElementById('ghWinAccuracy');

    if (titleEl) titleEl.innerHTML = title;
    if (subEl) subEl.textContent = subtitle;
    if (scoreEl) scoreEl.textContent = score;
    if (coinsEl) coinsEl.textContent = `+${coins}`;
    if (accEl) accEl.textContent = accuracy;

    // Update player currency & records
    currentUser.stars = (currentUser.stars || 0) + 3;
    currentUser.coins = (currentUser.coins || 0) + coins;
    if (!currentUser.bestGameScore || score > currentUser.bestGameScore) {
      currentUser.bestGameScore = score;
    }
    currentUser.hasWonGame = true;
    updateHeaderProfile();
    updateGameHubHeader();

    const btnPlayAgain = document.getElementById('btnGhPlayAgain');
    if (btnPlayAgain) {
      btnPlayAgain.onclick = () => {
        sfx.click();
        if (winModal) winModal.style.display = 'none';
        if (onPlayAgain) onPlayAgain();
      };
    }

    if (winModal) winModal.style.display = 'flex';
  }

  // ── 1. KOKI PIZZA PECAHAN ENGINE ──
  const pizzaOrders = [
    { num: 3, den: 4, avatar: '🦊', name: 'Pak Rubah', speech: 'Halo Koki Cilik! Aku ingin pizza keju dengan 3 dari 4 bagian diberi topping lezat!' },
    { num: 2, den: 3, avatar: '🐼', name: 'Mimi Panda', speech: 'Hai Koki! Tolong siapkan 2 per 3 loyang pizza hangat untukku ya!' },
    { num: 5, den: 8, avatar: '🐱', name: 'Kucing Muezza', speech: 'Meow! Perutku lapar, tolong buatkan pizza dengan topping pada 5 dari 8 potong!' },
    { num: 1, den: 2, avatar: '🐰', name: 'Kelinci Cici', speech: 'Halo! Aku ingin memakan setengah pizza, tolong hias 1 dari 2 potong!' },
    { num: 4, den: 6, avatar: '🦁', name: 'Singa Leo', speech: 'Aum! Aku singa perkasa yang ingin makan 4 per 6 bagian pizza lezat!' }
  ];

  let pizzaOrderIndex = 0;
  let pizzaScore = 0;
  let pizzaStreak = 0;
  let pizzaCoins = 0;
  let pizzaSelectedSlices = new Set();

  function initPizzaChefGame() {
    pizzaOrderIndex = 0;
    pizzaScore = 0;
    pizzaStreak = 0;
    pizzaCoins = 0;
    pizzaSelectedSlices.clear();
    updatePizzaHUD();
    renderPizzaOrder();
  }

  function updatePizzaHUD() {
    const orderNumEl = document.getElementById('pizzaOrderNum');
    const scoreEl = document.getElementById('pizzaScore');
    const streakEl = document.getElementById('pizzaStreak');
    const coinsEl = document.getElementById('pizzaCoins');

    if (orderNumEl) orderNumEl.textContent = `${pizzaOrderIndex + 1} / ${pizzaOrders.length}`;
    if (scoreEl) scoreEl.textContent = pizzaScore;
    if (streakEl) streakEl.textContent = pizzaStreak;
    if (coinsEl) coinsEl.textContent = pizzaCoins;
  }

  function renderPizzaOrder() {
    pizzaSelectedSlices.clear();
    updatePizzaMeter();

    const order = pizzaOrders[pizzaOrderIndex];
    if (!order) return;

    const custAvatar = document.getElementById('pizzaCustomerAvatar');
    const custSpeech = document.getElementById('pizzaCustomerSpeech');
    const targetNum = document.getElementById('pizzaTargetNum');
    const targetDen = document.getElementById('pizzaTargetDen');
    const targetHint = document.getElementById('pizzaTargetHint');
    const feedbackBox = document.getElementById('pizzaFeedbackBox');
    const feedbackText = document.getElementById('pizzaFeedbackText');
    const feedbackIcon = document.getElementById('pizzaFeedbackIcon');

    if (custAvatar) custAvatar.textContent = order.avatar;
    if (custSpeech) custSpeech.textContent = `"${order.speech}"`;
    if (targetNum) targetNum.textContent = order.num;
    if (targetDen) targetDen.textContent = order.den;
    if (targetHint) targetHint.innerHTML = `Beri topping pada <b>${order.num}</b> dari <b>${order.den}</b> potong pizza!`;

    if (feedbackBox) {
      feedbackBox.className = 'pizza-feedback-box';
      if (feedbackIcon) feedbackIcon.textContent = '👨‍🍳';
      if (feedbackText) feedbackText.textContent = 'Klik potongan pizza untuk memberi topping!';
    }

    renderPizzaSVG(order.den);
    renderPizzaChoiceCards(order);
  }

  function renderPizzaChoiceCards(order) {
    const choiceContainer = document.getElementById('pizzaChoiceCards');
    if (!choiceContainer) return;
    choiceContainer.innerHTML = '';

    const pool = [
      { num: order.num, den: order.den, correct: true },
      { num: Math.max(1, order.den - order.num), den: order.den, correct: false },
      { num: Math.min(order.den, order.num + 1), den: order.den, correct: false },
      { num: order.num, den: order.den + 2, correct: false }
    ];

    const seen = new Set();
    const uniqueChoices = [];
    pool.forEach(c => {
      const key = `${c.num}/${c.den}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueChoices.push(c);
      }
    });

    const fallbacks = [
      { num: 1, den: 2 }, { num: 2, den: 3 }, { num: 3, den: 4 }, { num: 1, den: 4 }
    ];
    for (const fb of fallbacks) {
      if (uniqueChoices.length >= 4) break;
      const key = `${fb.num}/${fb.den}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueChoices.push({ ...fb, correct: false });
      }
    }

    const shuffled = uniqueChoices.sort(() => Math.random() - 0.5);

    shuffled.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'btn-pizza-choice';
      btn.innerHTML = `
        <div class="p-choice-frac">
          <span class="p-num">${choice.num}</span>
          <span class="p-line"></span>
          <span class="p-den">${choice.den}</span>
        </div>
        <span class="p-choice-label">${choice.num} per ${choice.den}</span>
      `;

      btn.addEventListener('click', () => {
        if (choice.correct) {
          btn.classList.add('selected-correct');
          choiceContainer.querySelectorAll('.btn-pizza-choice').forEach(b => b.disabled = true);

          pizzaSelectedSlices.clear();
          const svgContainer = document.getElementById('pizzaSvgContainer');
          for (let i = 0; i < order.num; i++) {
            pizzaSelectedSlices.add(i);
            if (svgContainer) {
              const p = svgContainer.querySelector(`.slice-path[data-slice="${i}"]`);
              const t = document.getElementById(`sliceToppings_${i}`);
              if (p) p.classList.add('active');
              if (t) t.classList.add('active');
            }
          }
          updatePizzaMeter();

          sfx.correct();
          confetti.burst(35);
          pizzaStreak++;
          const gainedScore = 20 + (pizzaStreak * 5);
          pizzaScore += gainedScore;
          pizzaCoins += 15;
          updatePizzaHUD();

          if (currentUser) {
            currentUser.coins = (currentUser.coins || 50) + 15;
            currentUser.stars = (currentUser.stars || 3) + 1;
            try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser)); } catch (e) {}
            updateHeaderProfile();
            updateGameHubHeader();
          }

          const feedbackBox = document.getElementById('pizzaFeedbackBox');
          const feedbackText = document.getElementById('pizzaFeedbackText');
          const feedbackIcon = document.getElementById('pizzaFeedbackIcon');
          if (feedbackBox) {
            feedbackBox.className = 'pizza-feedback-box correct';
            if (feedbackIcon) feedbackIcon.textContent = '🎉';
            if (feedbackText) feedbackText.textContent = `Luar biasa! Tepat ${order.num}/${order.den} pizza untuk ${order.name}! (+${gainedScore} Skor, +15 Koin)`;
          }

          setTimeout(() => {
            pizzaOrderIndex++;
            if (pizzaOrderIndex >= pizzaOrders.length) {
              showGameHubWinModal({
                title: 'RESTORAN SUKSES BESAR! 🍕👨‍🍳',
                subtitle: 'Semua pelanggan senang dan kenyang dengan pesanan pizza pecahan yang tepat!',
                score: pizzaScore,
                coins: pizzaCoins,
                accuracy: `${pizzaOrders.length}/${pizzaOrders.length} Pesanan`,
                onPlayAgain: initPizzaChefGame
              });
            } else {
              renderPizzaOrder();
              updatePizzaHUD();
            }
          }, 1200);

        } else {
          btn.classList.add('selected-wrong');
          sfx.wrong();
          pizzaStreak = 0;
          updatePizzaHUD();

          const feedbackBox = document.getElementById('pizzaFeedbackBox');
          const feedbackText = document.getElementById('pizzaFeedbackText');
          const feedbackIcon = document.getElementById('pizzaFeedbackIcon');
          if (feedbackBox) {
            feedbackBox.className = 'pizza-feedback-box wrong';
            if (feedbackIcon) feedbackIcon.textContent = '🤔';
            if (feedbackText) feedbackText.textContent = `Belum tepat! ${order.name} memesan ${order.num}/${order.den} pizza. Coba perhatikan jumlah bagiannya!`;
          }
        }
      });

      choiceContainer.appendChild(btn);
    });
  }

  function renderPizzaSVG(den) {
    const container = document.getElementById('pizzaSvgContainer');
    if (!container) return;

    const cx = 150, cy = 150, r = 135;
    let pathsHtml = '';

    for (let i = 0; i < den; i++) {
      const startAngle = (i * 360 / den) - 90;
      const endAngle = ((i + 1) * 360 / den) - 90;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);

      const largeArc = (360 / den) > 180 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;

      const midAngle = (startAngle + endAngle) / 2;
      const midRad = (midAngle * Math.PI) / 180;
      const lx = cx + (r * 0.6) * Math.cos(midRad);
      const ly = cy + (r * 0.6) * Math.sin(midRad);

      const top1X = cx + (r * 0.45) * Math.cos(midRad - 0.1);
      const top1Y = cy + (r * 0.45) * Math.sin(midRad - 0.1);
      const top2X = cx + (r * 0.75) * Math.cos(midRad + 0.1);
      const top2Y = cy + (r * 0.75) * Math.sin(midRad + 0.1);

      pathsHtml += `
        <g class="slice-group" data-slice="${i}">
          <path class="slice-path" d="${d}" data-slice="${i}"></path>
          <g class="slice-toppings-group" id="sliceToppings_${i}">
            <path d="${d}" fill="#facc15" opacity="0.9" pointer-events="none"></path>
            <circle cx="${top1X.toFixed(1)}" cy="${top1Y.toFixed(1)}" r="10" fill="#e11d48" stroke="#9f1239" stroke-width="1.5"></circle>
            <circle cx="${top2X.toFixed(1)}" cy="${top2Y.toFixed(1)}" r="8" fill="#e11d48" stroke="#9f1239" stroke-width="1.5"></circle>
            <circle cx="${(top1X + 4).toFixed(1)}" cy="${(top1Y - 5).toFixed(1)}" r="2" fill="#15803d"></circle>
            <circle cx="${(top2X - 5).toFixed(1)}" cy="${(top2Y + 4).toFixed(1)}" r="2.5" fill="#15803d"></circle>
          </g>
          <text class="slice-num-label" x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle">${i + 1}</text>
        </g>
      `;
    }

    container.innerHTML = `
      <svg viewBox="0 0 300 300">
        <circle cx="150" cy="150" r="145" fill="#b45309" stroke="#78350f" stroke-width="4"></circle>
        <circle cx="150" cy="150" r="138" fill="#d97706"></circle>
        <circle cx="150" cy="150" r="135" fill="#dc2626"></circle>
        ${pathsHtml}
      </svg>
    `;

    container.querySelectorAll('.slice-path').forEach(slice => {
      slice.addEventListener('click', () => {
        const sliceIdx = parseInt(slice.getAttribute('data-slice'), 10);
        togglePizzaSlice(sliceIdx);
      });
    });
  }

  function togglePizzaSlice(idx) {
    sfx.click();
    const container = document.getElementById('pizzaSvgContainer');
    if (!container) return;

    const path = container.querySelector(`.slice-path[data-slice="${idx}"]`);
    const toppings = document.getElementById(`sliceToppings_${idx}`);

    if (pizzaSelectedSlices.has(idx)) {
      pizzaSelectedSlices.delete(idx);
      if (path) path.classList.remove('active');
      if (toppings) toppings.classList.remove('active');
    } else {
      pizzaSelectedSlices.add(idx);
      if (path) path.classList.add('active');
      if (toppings) toppings.classList.add('active');
    }

    updatePizzaMeter();
  }

  function updatePizzaMeter() {
    const selEl = document.getElementById('pizzaSelectedNum');
    const totEl = document.getElementById('pizzaTotalDen');
    const curOrder = pizzaOrders[pizzaOrderIndex];

    if (selEl) selEl.textContent = pizzaSelectedSlices.size;
    if (totEl && curOrder) totEl.textContent = curOrder.den;
  }

  function servePizzaOrder() {
    const order = pizzaOrders[pizzaOrderIndex];
    if (!order) return;

    const feedbackBox = document.getElementById('pizzaFeedbackBox');
    const feedbackText = document.getElementById('pizzaFeedbackText');
    const feedbackIcon = document.getElementById('pizzaFeedbackIcon');

    if (pizzaSelectedSlices.size === order.num) {
      sfx.correct();
      pizzaStreak++;
      const gainedScore = 20 + (pizzaStreak * 5);
      pizzaScore += gainedScore;
      pizzaCoins += 15;
      updatePizzaHUD();

      if (feedbackBox) {
        feedbackBox.className = 'pizza-feedback-box correct';
        if (feedbackIcon) feedbackIcon.textContent = '🎉';
        if (feedbackText) feedbackText.textContent = `Luar biasa! Tepat ${order.num}/${order.den} bagian! (+${gainedScore} Skor, +15 Koin)`;
      }

      if (currentUser) {
        currentUser.coins = (currentUser.coins || 50) + 15;
        currentUser.stars = (currentUser.stars || 3) + 1;
        try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser)); } catch (e) {}
        updateHeaderProfile();
        updateGameHubHeader();
      }

      setTimeout(() => {
        pizzaOrderIndex++;
        if (pizzaOrderIndex >= pizzaOrders.length) {
          showGameHubWinModal({
            title: 'RESTORAN SUKSES BESAR! 🍕👨‍🍳',
            subtitle: 'Semua pelanggan senang dan kenyang dengan pesanan pizza pecahan yang tepat!',
            score: pizzaScore,
            coins: pizzaCoins,
            accuracy: `${pizzaOrders.length}/${pizzaOrders.length} Pesanan`,
            onPlayAgain: initPizzaChefGame
          });
        } else {
          renderPizzaOrder();
          updatePizzaHUD();
        }
      }, 1200);

    } else {
      sfx.wrong();
      pizzaStreak = 0;
      updatePizzaHUD();

      if (feedbackBox) {
        feedbackBox.className = 'pizza-feedback-box wrong';
        if (feedbackIcon) feedbackIcon.textContent = '🤔';
        if (feedbackText) feedbackText.textContent = `Ups! Kamu memilih ${pizzaSelectedSlices.size}/${order.den}, sedangkan pesanan adalah ${order.num}/${order.den}. Coba sesuaikan ya!`;
      }
    }
  }

  const btnPizzaServe = document.getElementById('btnPizzaServe');
  if (btnPizzaServe) btnPizzaServe.addEventListener('click', servePizzaOrder);

  const btnPizzaClearSlices = document.getElementById('btnPizzaClearSlices');
  if (btnPizzaClearSlices) {
    btnPizzaClearSlices.addEventListener('click', () => {
      sfx.click();
      pizzaSelectedSlices.clear();
      const container = document.getElementById('pizzaSvgContainer');
      if (container) {
        container.querySelectorAll('.slice-path').forEach(p => p.classList.remove('active'));
        container.querySelectorAll('.slice-toppings-group').forEach(t => t.classList.remove('active'));
      }
      updatePizzaMeter();
    });
  }

  const btnPizzaReset = document.getElementById('btnPizzaReset');
  if (btnPizzaReset) btnPizzaReset.addEventListener('click', () => { sfx.click(); initPizzaChefGame(); });

  // ── 2. BALON PECAHAN SENILAI ENGINE ──
  const balloonMissions = [
    {
      targetText: '1/2',
      targetVal: 0.5,
      equivalents: ['2/4', '3/6', '4/8', '5/10', '6/12'],
      distractors: ['1/3', '2/5', '3/4', '2/3', '3/8', '4/7', '5/8']
    },
    {
      targetText: '2/3',
      targetVal: 2/3,
      equivalents: ['4/6', '6/9', '8/12', '10/15'],
      distractors: ['2/4', '3/5', '1/2', '3/4', '4/7', '5/6', '1/3']
    },
    {
      targetText: '3/4',
      targetVal: 0.75,
      equivalents: ['6/8', '9/12', '12/16', '15/20'],
      distractors: ['3/5', '2/3', '1/2', '4/5', '5/8', '7/10', '2/4']
    },
    {
      targetText: '1/4',
      targetVal: 0.25,
      equivalents: ['2/8', '3/12', '4/16', '5/20'],
      distractors: ['1/3', '2/5', '1/5', '3/8', '1/2', '2/6', '3/10']
    }
  ];

  let balonMissionIndex = 0;
  let balonScore = 0;
  let balonPopped = 0;
  let balonTimerVal = 40;
  let balonTimerInterval = null;
  const balloonColors = ['b-red', 'b-blue', 'b-green', 'b-purple', 'b-orange', 'b-pink'];

  function initBalloonGame() {
    if (balonTimerInterval) clearInterval(balonTimerInterval);
    balonMissionIndex = Math.floor(Math.random() * balloonMissions.length);
    balonScore = 0;
    balonPopped = 0;
    balonTimerVal = 40;

    updateBalonHUD();
    renderBalonMission();
    startBalonTimer();
  }

  function updateBalonHUD() {
    const timerEl = document.getElementById('balonTimer');
    const scoreEl = document.getElementById('balonScore');
    const poppedEl = document.getElementById('balonPoppedCount');

    if (timerEl) timerEl.textContent = `${balonTimerVal}s`;
    if (scoreEl) scoreEl.textContent = balonScore;
    if (poppedEl) poppedEl.textContent = balonPopped;
  }

  function startBalonTimer() {
    if (balonTimerInterval) clearInterval(balonTimerInterval);
    balonTimerInterval = setInterval(() => {
      balonTimerVal--;
      updateBalonHUD();

      if (balonTimerVal <= 0) {
        clearInterval(balonTimerInterval);
        endBalloonGame();
      }
    }, 1000);
  }

  function renderBalonMission() {
    const mission = balloonMissions[balonMissionIndex];
    const targetEl = document.getElementById('balonTargetDisplay');
    const hintText = document.getElementById('balonHintText');

    if (targetEl && mission) {
      const parts = mission.targetText.split('/');
      targetEl.innerHTML = `
        <span class="tf-num">${parts[0]}</span>
        <span class="tf-bar"></span>
        <span class="tf-den">${parts[1]}</span>
      `;
    }

    if (hintText && mission) {
      hintText.textContent = `Klik balon yang memiliki nilai pecahan sama dengan ${mission.targetText}!`;
    }

    spawnBalloonsGrid();
  }

  function spawnBalloonsGrid() {
    const grid = document.getElementById('balonClusterGrid');
    if (!grid) return;
    grid.innerHTML = '';

    const mission = balloonMissions[balonMissionIndex];
    const eqList = [...mission.equivalents].sort(() => 0.5 - Math.random()).slice(0, 4);
    const distList = [...mission.distractors].sort(() => 0.5 - Math.random()).slice(0, 4);

    const combined = [
      ...eqList.map(t => ({ text: t, isCorrect: true })),
      ...distList.map(t => ({ text: t, isCorrect: false }))
    ].sort(() => 0.5 - Math.random());

    combined.forEach(item => {
      const color = balloonColors[Math.floor(Math.random() * balloonColors.length)];
      const parts = item.text.split('/');
      const card = document.createElement('div');
      card.className = `balloon-card ${color}`;
      card.innerHTML = `
        <div class="balloon-body">
          <div class="balloon-frac">
            <span class="bf-num">${parts[0]}</span>
            <span class="bf-bar"></span>
            <span class="bf-den">${parts[1]}</span>
          </div>
        </div>
        <div class="balloon-knot"></div>
        <div class="balloon-string"></div>
      `;

      card.addEventListener('click', () => {
        handleBalloonClick(card, item);
      });

      grid.appendChild(card);
    });
  }

  function handleBalloonClick(cardEl, item) {
    if (cardEl.classList.contains('balloon-popping')) return;

    if (item.isCorrect) {
      sfx.pop();
      cardEl.classList.add('balloon-popping');
      balonScore += 15;
      balonPopped++;
      updateBalonHUD();

      setTimeout(() => {
        cardEl.remove();
        const remaining = document.querySelectorAll('.balloon-card:not(.balloon-popping)');
        if (remaining.length <= 3) {
          spawnBalloonsGrid();
        }
      }, 350);

    } else {
      sfx.wrong();
      balonScore = Math.max(0, balonScore - 5);
      updateBalonHUD();

      const hintText = document.getElementById('balonHintText');
      if (hintText) {
        hintText.innerHTML = `❌ <b>${item.text}</b> tidak senilai dengan target! (-5 poin)`;
        setTimeout(() => {
          const mission = balloonMissions[balonMissionIndex];
          if (mission && hintText) hintText.textContent = `Klik balon yang memiliki nilai pecahan sama dengan ${mission.targetText}!`;
        }, 1800);
      }
    }
  }

  function endBalloonGame() {
    sfx.celebrate();
    const earnedCoins = Math.floor(balonScore / 2);
    showGameHubWinModal({
      title: 'WAKTU SELESAI! 🎈🎉',
      subtitle: `Kamu berhasil meletuskan ${balonPopped} balon pecahan senilai dengan sangat tangkas!`,
      score: balonScore,
      coins: earnedCoins,
      accuracy: `${balonPopped} Balon`,
      onPlayAgain: initBalloonGame
    });
  }

  const btnBalonReset = document.getElementById('btnBalonReset');
  if (btnBalonReset) btnBalonReset.addEventListener('click', () => { sfx.click(); initBalloonGame(); });

  // ── 3. TIMBANGAN PECAHAN ENGINE ──
  const scaleQuestions = [
    {
      left: { num: 1, den: 2 },
      right: { num: 3, den: 4 },
      ans: 'lesser',
      explanation: 'Disamakan penyebutnya: 1/2 senilai dengan 2/4. Karena 2/4 lebih kecil dari 3/4, maka 1/2 < 3/4. Timbangan miring ke kanan!'
    },
    {
      left: { num: 2, den: 4 },
      right: { num: 1, den: 2 },
      ans: 'equal',
      explanation: 'Pecahan senilai! 2/4 disederhanakan dengan membagi 2 menjadi 1/2. Kedua sisi sama berat, timbangan seimbang (=)!'
    },
    {
      left: { num: 3, den: 5 },
      right: { num: 2, den: 5 },
      ans: 'greater',
      explanation: 'Penyebutnya sama (5). Bandingkan pembilangnya: 3 lebih besar dari 2. Maka 3/5 > 2/5. Timbangan miring ke kiri!'
    },
    {
      left: { num: 4, den: 6 },
      right: { num: 2, den: 3 },
      ans: 'equal',
      explanation: 'Pecahan senilai! 4/6 jika pembilang & penyebut dibagi 2 menghasilkan 2/3. Kedua sisi seimbang (=)!'
    },
    {
      left: { num: 5, den: 6 },
      right: { num: 3, den: 6 },
      ans: 'greater',
      explanation: 'Penyebut sama (6). Pembilang 5 lebih besar dari 3, maka 5/6 > 3/6. Timbangan miring ke kiri!'
    }
  ];

  let scaleRoundIndex = 0;
  let scaleScore = 0;
  let scaleCorrect = 0;
  let scaleAnswered = false;

  function initScaleGame() {
    scaleRoundIndex = 0;
    scaleScore = 0;
    scaleCorrect = 0;
    scaleAnswered = false;
    updateScaleHUD();
    renderScaleRound();
  }

  function updateScaleHUD() {
    const roundEl = document.getElementById('scaleRoundNum');
    const scoreEl = document.getElementById('scaleScore');
    const correctEl = document.getElementById('scaleCorrectCount');

    if (roundEl) roundEl.textContent = `${scaleRoundIndex + 1} / ${scaleQuestions.length}`;
    if (scoreEl) scoreEl.textContent = scaleScore;
    if (correctEl) correctEl.textContent = scaleCorrect;
  }

  function generateFractionMiniPieSVG(num, den, color = '#0284c7') {
    const r = 36, cx = 40, cy = 40;
    let paths = '';
    for (let i = 0; i < den; i++) {
      const sa = (i * 360 / den) - 90;
      const ea = ((i + 1) * 360 / den) - 90;
      const sRad = (sa * Math.PI) / 180;
      const eRad = (ea * Math.PI) / 180;

      const x1 = cx + r * Math.cos(sRad);
      const y1 = cy + r * Math.sin(sRad);
      const x2 = cx + r * Math.cos(eRad);
      const y2 = cy + r * Math.sin(eRad);
      const largeArc = (360 / den) > 180 ? 1 : 0;
      const d = `M ${cx} ${cy} L ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(1)} ${y2.toFixed(1)} Z`;

      const isFilled = i < num;
      const fill = isFilled ? color : '#f1f5f9';
      const stroke = '#94a3b8';

      paths += `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"></path>`;
    }

    return `<svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="38" fill="#fff" stroke="#cbd5e1" stroke-width="2"></circle>${paths}</svg>`;
  }

  function renderScaleRound() {
    scaleAnswered = false;
    const q = scaleQuestions[scaleRoundIndex];
    if (!q) return;

    const beam = document.getElementById('scaleBeamBar');
    if (beam) beam.className = 'scale-beam-bar';

    const leftDish = document.getElementById('scaleLeftDish');
    const rightDish = document.getElementById('scaleRightDish');
    if (leftDish) leftDish.classList.remove('highlight-winner');
    if (rightDish) rightDish.classList.remove('highlight-winner');

    document.querySelectorAll('.btn-scale-choice').forEach(b => {
      b.classList.remove('choice-correct', 'choice-wrong');
      b.disabled = false;
    });

    const expCard = document.getElementById('scaleExplanationCard');
    if (expCard) expCard.classList.add('hidden');

    const leftFrac = document.getElementById('scaleLeftFrac');
    const rightFrac = document.getElementById('scaleRightFrac');
    const leftVisual = document.getElementById('scaleLeftVisual');
    const rightVisual = document.getElementById('scaleRightVisual');

    if (leftFrac) leftFrac.innerHTML = `<span class="pf-num">${q.left.num}</span><span class="pf-bar"></span><span class="pf-den">${q.left.den}</span>`;
    if (rightFrac) rightFrac.innerHTML = `<span class="pf-num">${q.right.num}</span><span class="pf-bar"></span><span class="pf-den">${q.right.den}</span>`;

    if (leftVisual) leftVisual.innerHTML = generateFractionMiniPieSVG(q.left.num, q.left.den, '#f59e0b');
    if (rightVisual) rightVisual.innerHTML = generateFractionMiniPieSVG(q.right.num, q.right.den, '#3b82f6');
  }

  function handleScaleChoice(choice) {
    if (scaleAnswered) return;
    scaleAnswered = true;

    const q = scaleQuestions[scaleRoundIndex];
    if (!q) return;

    const beam = document.getElementById('scaleBeamBar');
    const leftDish = document.getElementById('scaleLeftDish');
    const rightDish = document.getElementById('scaleRightDish');

    if (beam) {
      if (q.ans === 'greater') {
        beam.classList.add('tilt-left');
        if (leftDish) leftDish.classList.add('highlight-winner');
      } else if (q.ans === 'lesser') {
        beam.classList.add('tilt-right');
        if (rightDish) rightDish.classList.add('highlight-winner');
      } else {
        beam.classList.add('tilt-equal');
        if (leftDish) leftDish.classList.add('highlight-winner');
        if (rightDish) rightDish.classList.add('highlight-winner');
      }
    }

    const clickedBtn = document.querySelector(`.btn-scale-choice[data-choice="${choice}"]`);
    const correctBtn = document.querySelector(`.btn-scale-choice[data-choice="${q.ans}"]`);

    document.querySelectorAll('.btn-scale-choice').forEach(b => b.disabled = true);

    if (choice === q.ans) {
      sfx.correct();
      scaleScore += 20;
      scaleCorrect++;
      if (clickedBtn) clickedBtn.classList.add('choice-correct');

      if (currentUser) {
        currentUser.coins = (currentUser.coins || 50) + 15;
        currentUser.stars = (currentUser.stars || 3) + 1;
        try { localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser)); } catch (e) {}
        updateHeaderProfile();
        updateGameHubHeader();
      }
    } else {
      sfx.wrong();
      if (clickedBtn) clickedBtn.classList.add('choice-wrong');
      if (correctBtn) correctBtn.classList.add('choice-correct');
    }

    updateScaleHUD();

    const expCard = document.getElementById('scaleExplanationCard');
    const expIcon = document.getElementById('scaleExpIcon');
    const expTitle = document.getElementById('scaleExpTitle');
    const expText = document.getElementById('scaleExpText');

    if (expCard) {
      expCard.classList.remove('hidden');
      if (expIcon) expIcon.textContent = choice === q.ans ? '🎉' : '💡';
      if (expTitle) expTitle.textContent = choice === q.ans ? 'Jawabanmu Tepat Sekali! (+20 Skor)' : 'Hampir Benar, Pelajari Penjelasannya:';
      if (expText) expText.textContent = q.explanation;
    }
  }

  document.querySelectorAll('.btn-scale-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const choice = btn.getAttribute('data-choice');
      handleScaleChoice(choice);
    });
  });

  const btnScaleNext = document.getElementById('btnScaleNext');
  if (btnScaleNext) {
    btnScaleNext.addEventListener('click', () => {
      sfx.click();
      scaleRoundIndex++;
      if (scaleRoundIndex >= scaleQuestions.length) {
        showGameHubWinModal({
          title: 'TIMBANGAN SELESAI! ⚖️🧠',
          subtitle: `Kamu telah menyelesaikan semua ronde penimbangan pecahan dengan sangat baik!`,
          score: scaleScore,
          coins: scaleCorrect * 10,
          accuracy: `${scaleCorrect}/${scaleQuestions.length} Benar`,
          onPlayAgain: initScaleGame
        });
      } else {
        updateScaleHUD();
        renderScaleRound();
      }
    });
  }

  const btnTimbanganReset = document.getElementById('btnTimbanganReset');
  if (btnTimbanganReset) btnTimbanganReset.addEventListener('click', () => { sfx.click(); initScaleGame(); });


  // -------------------------------------------------------------
  // 9. KUIS ENGINE (10 SOAL + TIMER + PEMBAHASAN)
  // -------------------------------------------------------------
  const quizQuestionsBank = [
    {
      category: 'Konsep Dasar Pecahan',
      question: 'Pada bentuk pecahan 3/7, bilangan 3 disebut sebagai apa?',
      options: ['Penyebut', 'Pembilang', 'Bilangan Bulat', 'Sisa Bagi'],
      correct: 1,
      explanation: 'Pada bentuk pecahan a/b, angka di bagian atas (a) adalah PEMBILANG, sedangkan angka di bagian bawah (b) adalah PENYEBUT.'
    },
    {
      category: 'Konsep Pecahan Sehari-hari',
      question: 'Sebuah semangka dibelah menjadi 8 potong sama besar. Budi memakan 3 potong. Berapa bagian semangka yang dimakan Budi?',
      options: ['3/8', '5/8', '8/3', '3/5'],
      correct: 0,
      explanation: 'Bagian yang dimakan adalah 3 dari total 8 potong semangka, sehingga bernilai 3/8.'
    },
    {
      category: 'Pecahan Senilai',
      question: 'Manakah di bawah ini pecahan yang senilai dengan 1/2?',
      options: ['2/3', '3/6', '2/5', '3/8'],
      correct: 1,
      explanation: '1/2 senilai dengan 3/6 karena jika pembilang dan penyebut 1/2 dikalikan dengan 3, diperoleh (1×3)/(2×3) = 3/6.'
    },
    {
      category: 'Pecahan Senilai',
      question: 'Bentuk paling sederhana dari pecahan 6/12 adalah...',
      options: ['2/4', '3/6', '1/2', '1/3'],
      correct: 2,
      explanation: 'Pecahan 6/12 disederhanakan dengan membagi pembilang dan penyebut dengan FPB-nya yaitu 6: (6÷6)/(12÷6) = 1/2.'
    },
    {
      category: 'Penjumlahan Pecahan',
      question: 'Berapakah hasil dari 2/7 + 3/7 ?',
      options: ['5/14', '5/7', '6/7', '1/7'],
      correct: 1,
      explanation: 'Karena penyebutnya sudah sama (7), kita cukup menjumlahkan pembilangnya: (2 + 3)/7 = 5/7.'
    },
    {
      category: 'Pengurangan Pecahan',
      question: 'Berapakah hasil dari 7/9 - 4/9 ?',
      options: ['3/9 (disederhanakan jadi 1/3)', '3/0', '11/9', '3/18'],
      correct: 0,
      explanation: 'Penyebutnya sama (9), kurangkan pembilang: (7 - 4)/9 = 3/9. Jika disederhanakan menjadi 1/3.'
    },
    {
      category: 'Jenis Pecahan',
      question: 'Pecahan 1 2/5 (satu dua per lima) termasuk ke dalam jenis pecahan...',
      options: ['Pecahan Desimal', 'Pecahan Biasa Murni', 'Pecahan Campuran', 'Pecahan Persen'],
      correct: 2,
      explanation: 'Pecahan yang terdiri dari bilangan bulat (1) dan pecahan biasa (2/5) disebut sebagai PECAHAN CAMPURAN.'
    },
    {
      category: 'Konversi Pecahan',
      question: 'Bentuk desimal dari pecahan 3/4 adalah...',
      options: ['0,25', '0,5', '0,75', '0,34'],
      correct: 2,
      explanation: '3/4 = (3 × 25)/(4 × 25) = 75/100 = 0,75.'
    },
    {
      category: 'Persen',
      question: 'Bentuk pecahan biasa yang paling sederhana dari 50% adalah...',
      options: ['5/10', '1/2', '1/4', '50/100'],
      correct: 1,
      explanation: '50% artinya 50/100. Bentuk paling sederhananya adalah membagi dengan 50, yaitu 1/2.'
    },
    {
      category: 'Operasi Penjumlahan Pecahan Berbeda Penyebut',
      question: 'Berapakah hasil dari 1/2 + 1/4 ?',
      options: ['2/6', '3/4', '1/8', '2/4'],
      correct: 1,
      explanation: 'Samakan penyebut dengan KPK (4): 1/2 = 2/4. Kemudian 2/4 + 1/4 = 3/4.'
    }
  ];

  let currentQuestionIndex = 0;
  let quizScore = 0;
  let correctAnswersCount = 0;
  let wrongAnswersCount = 0;
  let quizTimerInterval = null;
  let quizSecondsLeft = 30;
  let isAnswerSubmitted = false;

  const quizIntroCard = document.getElementById('quizIntroCard');
  const quizPlayCard = document.getElementById('quizPlayCard');
  const quizResultCard = document.getElementById('quizResultCard');

  const btnStartQuiz = document.getElementById('btnStartQuiz');
  const currentQuestionNumEl = document.getElementById('currentQuestionNum');
  const totalQuestionsNumEl = document.getElementById('totalQuestionsNum');
  const quizTimeRemainingEl = document.getElementById('quizTimeRemaining');
  const quizLiveScoreEl = document.getElementById('quizLiveScore');
  const quizProgressBar = document.getElementById('quizProgressBar');
  const questionCategoryEl = document.getElementById('questionCategory');
  const questionTextEl = document.getElementById('questionText');
  const answerOptionsGrid = document.getElementById('answerOptionsGrid');
  const explanationBox = document.getElementById('explanationBox');
  const expHeader = document.getElementById('expHeader');
  const expText = document.getElementById('expText');
  const btnNextQuestion = document.getElementById('btnNextQuestion');

  function resetQuizToHome() {
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    quizIntroCard.classList.remove('hidden');
    quizPlayCard.classList.add('hidden');
    quizResultCard.classList.add('hidden');
  }

  btnStartQuiz.addEventListener('click', () => {
    sfx.click();
    startQuiz();
  });

  function startQuiz() {
    currentQuestionIndex = 0;
    quizScore = 0;
    correctAnswersCount = 0;
    wrongAnswersCount = 0;

    quizIntroCard.classList.add('hidden');
    quizPlayCard.classList.remove('hidden');
    quizResultCard.classList.add('hidden');

    totalQuestionsNumEl.textContent = quizQuestionsBank.length;
    quizLiveScoreEl.textContent = '0';

    loadQuestion(0);
  }

  function loadQuestion(index) {
    if (index >= quizQuestionsBank.length) {
      finishQuiz();
      return;
    }

    isAnswerSubmitted = false;
    explanationBox.classList.add('hidden');
    currentQuestionNumEl.textContent = index + 1;

    const progressPct = ((index + 1) / quizQuestionsBank.length) * 100;
    quizProgressBar.style.width = `${progressPct}%`;

    const qData = quizQuestionsBank[index];
    questionCategoryEl.textContent = qData.category;
    questionTextEl.textContent = qData.question;

    // Reset Options
    answerOptionsGrid.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];

    qData.options.forEach((optText, optIdx) => {
      const optBtn = document.createElement('button');
      optBtn.type = 'button';
      optBtn.className = 'btn-option';
      optBtn.innerHTML = `<span class="opt-letter">${letters[optIdx]}</span> <span>${optText}</span>`;

      optBtn.addEventListener('click', () => {
        if (isAnswerSubmitted) return;
        submitQuizAnswer(optIdx, qData);
      });

      answerOptionsGrid.appendChild(optBtn);
    });

    // Reset Question Timer
    if (quizTimerInterval) clearInterval(quizTimerInterval);
    quizSecondsLeft = 30;
    quizTimeRemainingEl.textContent = quizSecondsLeft;
    quizTimeRemainingEl.parentElement.style.background = '#fee2e2';
    quizTimeRemainingEl.parentElement.style.color = '#dc2626';

    quizTimerInterval = setInterval(() => {
      quizSecondsLeft--;
      quizTimeRemainingEl.textContent = quizSecondsLeft;

      if (quizSecondsLeft <= 0) {
        clearInterval(quizTimerInterval);
        if (!isAnswerSubmitted) {
          // Time's up - count as wrong
          submitQuizAnswer(-1, qData);
        }
      }
    }, 1000);
  }

  function submitQuizAnswer(chosenIdx, qData) {
    isAnswerSubmitted = true;
    if (quizTimerInterval) clearInterval(quizTimerInterval);

    const optionButtons = answerOptionsGrid.querySelectorAll('.btn-option');
    optionButtons.forEach((btn) => (btn.disabled = true));

    const isCorrect = chosenIdx === qData.correct;

    if (isCorrect) {
      sfx.correct();
      confetti.burst(30);
      quizScore += 10;
      correctAnswersCount++;
      quizLiveScoreEl.textContent = quizScore;

      if (optionButtons[chosenIdx]) {
        optionButtons[chosenIdx].classList.add('correct');
      }

      expHeader.className = 'exp-header correct';
      expHeader.innerHTML = '<i class="fa-solid fa-circle-check"></i> <span>Hebat! Jawabanmu Benar (+10 Poin)</span>';
    } else {
      sfx.wrong();
      wrongAnswersCount++;

      if (chosenIdx >= 0 && optionButtons[chosenIdx]) {
        optionButtons[chosenIdx].classList.add('wrong');
      }

      // Highlight correct answer
      if (optionButtons[qData.correct]) {
        optionButtons[qData.correct].classList.add('correct');
      }

      expHeader.className = 'exp-header wrong';
      const reason = chosenIdx === -1 ? 'Waktu habis!' : 'Jawabanmu belum tepat.';
      expHeader.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> <span>${reason}</span>`;
    }

    expText.textContent = qData.explanation;
    explanationBox.classList.remove('hidden');

    if (currentQuestionIndex === quizQuestionsBank.length - 1) {
      btnNextQuestion.innerHTML = 'Lihat Hasil Akhir <i class="fa-solid fa-trophy"></i>';
    } else {
      btnNextQuestion.innerHTML = 'Lanjut ke Soal Berikutnya <i class="fa-solid fa-arrow-right"></i>';
    }
  }

  btnNextQuestion.addEventListener('click', () => {
    sfx.click();
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
  });

  function finishQuiz() {
    if (quizTimerInterval) clearInterval(quizTimerInterval);

    quizPlayCard.classList.add('hidden');
    quizResultCard.classList.remove('hidden');

    const finalQuizScoreEl = document.getElementById('finalQuizScore');
    const resCorrectCountEl = document.getElementById('resCorrectCount');
    const resWrongCountEl = document.getElementById('resWrongCount');
    const resStarsEarnedEl = document.getElementById('resStarsEarned');
    const resultHeadlineEl = document.getElementById('resultHeadline');
    const resultSubtitleEl = document.getElementById('resultSubtitle');
    const resultTrophyIconEl = document.getElementById('resultTrophyIcon');

    finalQuizScoreEl.textContent = quizScore;
    resCorrectCountEl.textContent = correctAnswersCount;
    resWrongCountEl.textContent = wrongAnswersCount;

    let earnedStars = 1;
    if (quizScore >= 90) earnedStars = 3;
    else if (quizScore >= 70) earnedStars = 2;

    resStarsEarnedEl.textContent = `+${earnedStars}`;

    if (quizScore === 100) {
      resultTrophyIconEl.textContent = '👑';
      resultHeadlineEl.textContent = 'Sempurna! Kamu Master Pecahan!';
      resultSubtitleEl.textContent = 'Semua jawabanmu benar tanpa cela. Pertahankan prestasimu!';
    } else if (quizScore >= 80) {
      resultTrophyIconEl.textContent = '🏆';
      resultHeadlineEl.textContent = 'Hebat Sekali, Nilaimu Luar Biasa!';
      resultSubtitleEl.textContent = 'Pemahamanmu tentang materi pecahan sudah sangat baik!';
    } else if (quizScore >= 60) {
      resultTrophyIconEl.textContent = '⭐';
      resultHeadlineEl.textContent = 'Bagus! Tetap Semangat Belajar!';
      resultSubtitleEl.textContent = 'Tingkatkan pemahamanmu dengan membaca kembali modul materi ya!';
    } else {
      resultTrophyIconEl.textContent = '🌱';
      resultHeadlineEl.textContent = 'Jangan Menyerah, Ayo Coba Lagi!';
      resultSubtitleEl.textContent = 'Pelajari materi pecahan dengan simulator pizza agar semakin paham!';
    }

    // Award rewards
    currentUser.stars += earnedStars;
    currentUser.coins += quizScore;
    if (quizScore > currentUser.bestQuizScore) {
      currentUser.bestQuizScore = quizScore;
    }
    updateHeaderProfile();

    // Save record to storage
    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newRecord = {
      id: Date.now().toString(),
      absen: currentUser.absen,
      nama: currentUser.nama,
      score: quizScore,
      correct: correctAnswersCount,
      total: quizQuestionsBank.length,
      time: formattedDate,
      role: currentUser.role
    };
    saveQuizRecord(newRecord);

    sfx.celebrate();
    confetti.burst(80);
  }

  document.getElementById('btnRetakeQuiz').addEventListener('click', () => {
    sfx.click();
    startQuiz();
  });

  document.getElementById('btnViewResultsPage').addEventListener('click', () => {
    switchScreen('hasil');
  });

  // -------------------------------------------------------------
  // 10. HASIL SCREEN (SISWA & ADMIN DASHBOARD)
  // -------------------------------------------------------------
  function renderHasilScreen() {
    const hasilViewSiswa = document.getElementById('hasilViewSiswa');
    const hasilViewAdmin = document.getElementById('hasilViewAdmin');
    const hasilSubtitle = document.getElementById('hasilSubtitle');

    if (currentUser.role === 'admin') {
      hasilViewSiswa.classList.add('hidden');
      hasilViewAdmin.classList.remove('hidden');
      hasilSubtitle.textContent = 'Rekap Nilai Siswa Kelas & Data Evaluasi Pembelajaran';
      renderAdminDashboard();
    } else {
      hasilViewAdmin.classList.add('hidden');
      hasilViewSiswa.classList.remove('hidden');
      hasilSubtitle.textContent = 'Pencapaian belajar siswa dan evaluasi latihan';
      renderStudentResults();
    }
  }

  function renderStudentResults() {
    document.getElementById('achieveUserAvatar').textContent = currentUser.avatar;
    document.getElementById('achieveUserName').textContent = currentUser.nama;
    document.getElementById('achieveUserAbsen').textContent = currentUser.absen;

    const records = getQuizRecords().filter(
      (r) => r.nama.toLowerCase() === currentUser.nama.toLowerCase()
    );

    let maxScore = '-';
    if (records.length > 0) {
      maxScore = Math.max(...records.map((r) => r.score));
      currentUser.bestQuizScore = maxScore;
    }

    document.getElementById('achieveBestScore').textContent = maxScore !== '-' ? `${maxScore} / 100` : '-';
    document.getElementById('achieveTotalStars').textContent = currentUser.stars;
    document.getElementById('achieveBestGameScore').textContent = currentUser.bestGameScore > 0 ? currentUser.bestGameScore : '-';

    // Unlock Badges
    const badgeQuizMaster = document.getElementById('badgeQuizMaster');
    const badgeGamePro = document.getElementById('badgeGamePro');
    const badgeCollector = document.getElementById('badgeCollector');
    const badgeSkorBesar = document.getElementById('badgeSkorBesar');

    if (badgeQuizMaster) badgeQuizMaster.classList.toggle('unlocked', maxScore === 100);
    if (badgeGamePro) badgeGamePro.classList.toggle('unlocked', !!currentUser.hasWonGame || (currentUser.bestGameScore || 0) > 0);
    if (badgeCollector) badgeCollector.classList.toggle('unlocked', (currentUser.stars || 0) >= 10);
    if (badgeSkorBesar) badgeSkorBesar.classList.toggle('unlocked', (currentUser.bestGameScore || 0) >= 50);

    // Populate History Table
    const tbody = document.getElementById('studentHistoryTableBody');
    tbody.innerHTML = '';

    if (records.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #94a3b8; padding: 24px;">Belum ada riwayat pengerjaan kuis. Ayo coba kerjakan kuis sekarang!</td></tr>`;
      return;
    }

    records.forEach((rec) => {
      const tr = document.createElement('tr');
      let badgeClass = 'need-practice';
      let predikat = 'Perlu Bimbingan';
      if (rec.score >= 85) {
        badgeClass = 'perfect';
        predikat = 'Sangat Memuaskan';
      } else if (rec.score >= 70) {
        badgeClass = 'good';
        predikat = 'Baik';
      }

      tr.innerHTML = `
        <td>${rec.time}</td>
        <td><strong>${rec.score}</strong> / 100</td>
        <td>${rec.correct} dari ${rec.total} Soal</td>
        <td><span class="status-badge ${badgeClass}">${predikat}</span></td>
      `;
      tbody.appendChild(tr);
    });

    // ── RENDER CATATAN KHUSUS DARI GURU (PAK ADNAN) ──
    const studentNotes = getStudentNotes();
    const myNote = studentNotes[currentUser.nama.trim().toLowerCase()];
    const noteMsgEl = document.getElementById('studentNoteMessage');
    const noteDateEl = document.getElementById('studentNoteDateText');
    const noteStatusPill = document.getElementById('studentNoteStatusPill');

    if (myNote && myNote.note) {
      if (noteMsgEl) noteMsgEl.textContent = myNote.note;
      if (noteDateEl) noteDateEl.textContent = `📅 Diperbarui: ${myNote.date}`;
      if (noteStatusPill) {
        let tagIcon = 'fa-circle-check';
        let statusClass = 'status-tuntas';
        if (myNote.tag === 'Sangat Baik') {
          tagIcon = 'fa-star';
          statusClass = 'status-sangat-baik';
        } else if (myNote.tag === 'Perlu Bimbingan') {
          tagIcon = 'fa-magnifying-glass';
          statusClass = 'status-perlu-bimbingan';
        } else if (myNote.tag === 'Pengayaan') {
          tagIcon = 'fa-rocket';
          statusClass = 'status-pengayaan';
        } else if (myNote.tag === 'Motivasi') {
          tagIcon = 'fa-dumbbell';
          statusClass = 'status-motivasi';
        }
        noteStatusPill.className = `tnd-status-pill ${statusClass}`;
        noteStatusPill.innerHTML = `<i class="fa-solid ${tagIcon}"></i> ${myNote.tag}`;
      }
    } else {
      if (noteMsgEl) {
        noteMsgEl.textContent = 'Belum ada catatan khusus dari Pak Adnan untukmu saat ini. Terus rajin belajar dan raih bintang juara pecahan!';
      }
      if (noteDateEl) noteDateEl.textContent = '-';
      if (noteStatusPill) {
        noteStatusPill.className = 'tnd-status-pill status-tuntas';
        noteStatusPill.innerHTML = '<i class="fa-solid fa-seedling"></i> Pemantauan Aktif';
      }
    }
  }

  // ADMIN DASHBOARD
  const adminSearchInput = document.getElementById('adminSearchInput');
  const adminScoreFilter = document.getElementById('adminScoreFilter');
  const adminDataTableBody = document.getElementById('adminDataTableBody');
  const adminRowCount = document.getElementById('adminRowCount');
  const btnExportCSV = document.getElementById('btnExportCSV');
  const btnResetData = document.getElementById('btnResetData');
  const btnAdminQuickNote = document.getElementById('btnAdminQuickNote');

  // Modal Kelola Catatan Siswa
  const adminNoteModal         = document.getElementById('adminNoteModal');
  const adminNoteModalCard     = document.getElementById('adminNoteModalCard');
  const btnCloseNoteModal      = document.getElementById('btnCloseNoteModal');
  const btnCancelNoteModal     = document.getElementById('btnCancelNoteModal');
  const modalNoteStudentSelect = document.getElementById('modalNoteStudentSelect');
  const noteTargetAbsenHint    = document.getElementById('noteTargetAbsenHint');
  const modalNoteTagSelect     = document.getElementById('modalNoteTagSelect');
  const modalNoteTextarea      = document.getElementById('modalNoteTextarea');
  const btnSaveStudentNote     = document.getElementById('btnSaveStudentNote');
  const btnDeleteStudentNote   = document.getElementById('btnDeleteStudentNote');
  const adminNoteModalAlert    = document.getElementById('adminNoteModalAlert');
  const adminNoteModalAlertText = document.getElementById('adminNoteModalAlertText');

  function renderAdminDashboard() {
    const allRecords = getQuizRecords();
    const studentNotes = getStudentNotes();
    const query = adminSearchInput ? adminSearchInput.value.trim().toLowerCase() : '';
    const filter = adminScoreFilter ? adminScoreFilter.value : 'all';

    let filtered = allRecords.filter((rec) => {
      const matchesSearch =
        rec.nama.toLowerCase().includes(query) ||
        String(rec.absen).toLowerCase().includes(query);

      let matchesFilter = true;
      if (filter === 'high') matchesFilter = rec.score >= 80;
      else if (filter === 'medium') matchesFilter = rec.score >= 60 && rec.score < 80;
      else if (filter === 'low') matchesFilter = rec.score < 60;

      return matchesSearch && matchesFilter;
    });

    if (adminRowCount) adminRowCount.textContent = filtered.length;
    if (!adminDataTableBody) return;

    adminDataTableBody.innerHTML = '';
    if (filtered.length === 0) {
      adminDataTableBody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: #94a3b8; padding: 24px;">Tidak ada data pengerjaan siswa yang sesuai dengan filter.</td></tr>`;
      return;
    }

    filtered.forEach((rec, idx) => {
      const tr = document.createElement('tr');
      let badgeClass = 'need-practice';
      let statusText = 'Perlu Remedial';
      if (rec.score >= 85) {
        badgeClass = 'perfect';
        statusText = 'Tuntas (Sangat Baik)';
      } else if (rec.score >= 70) {
        badgeClass = 'good';
        statusText = 'Tuntas';
      }

      const wrongCount = rec.total - rec.correct;
      const note = studentNotes[rec.nama.trim().toLowerCase()];

      const noteCellHtml = note && note.note
        ? `<div class="note-preview-pill" title="${note.note.replace(/"/g, '&quot;')}">
             <span class="np-tag"><i class="fa-solid fa-tag"></i> ${note.tag}</span>
             <span class="np-text">${note.note}</span>
           </div>`
        : `<span class="note-empty-pill">Belum ada catatan</span>`;

      const actionBtnHtml = `
        <button type="button" class="btn-table-note" data-nama="${rec.nama}" data-absen="${rec.absen}">
          <i class="fa-solid fa-pen-to-square"></i> ${note ? 'Ubah' : 'Beri Catatan'}
        </button>
      `;

      tr.innerHTML = `
        <td>${idx + 1}</td>
        <td><strong>${rec.absen}</strong></td>
        <td>${rec.nama}</td>
        <td><strong>${rec.score}</strong></td>
        <td>${rec.correct} benar, ${wrongCount} salah</td>
        <td>${rec.time}</td>
        <td><span class="status-badge ${badgeClass}">${statusText}</span></td>
        <td class="admin-note-cell">${noteCellHtml}</td>
        <td>${actionBtnHtml}</td>
      `;
      adminDataTableBody.appendChild(tr);
    });

    // Attach click listeners to row action buttons
    adminDataTableBody.querySelectorAll('.btn-table-note').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetNama = btn.getAttribute('data-nama');
        const targetAbsen = btn.getAttribute('data-absen');
        openStudentNoteModal(targetNama, targetAbsen);
      });
    });
  }

  // ── MODAL BERI / KELOLA CATATAN SISWA (ADMIN ONLY) ──
  function populateStudentSelect(targetNama) {
    if (!modalNoteStudentSelect) return;
    const records = getQuizRecords();
    const notes = getStudentNotes();
    const studentsMap = new Map();

    // Collect from records
    records.forEach(r => {
      if (r.nama && !studentsMap.has(r.nama.trim().toLowerCase())) {
        studentsMap.set(r.nama.trim().toLowerCase(), { nama: r.nama.trim(), absen: r.absen });
      }
    });

    // Collect from notes
    Object.values(notes).forEach(n => {
      if (n.nama && !studentsMap.has(n.nama.trim().toLowerCase())) {
        studentsMap.set(n.nama.trim().toLowerCase(), { nama: n.nama.trim(), absen: n.absen });
      }
    });

    modalNoteStudentSelect.innerHTML = '';
    const studentList = Array.from(studentsMap.values()).sort((a, b) => (Number(a.absen) || 0) - (Number(b.absen) || 0));

    studentList.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.nama;
      opt.setAttribute('data-absen', s.absen);
      opt.textContent = `${s.nama} (Absen ${s.absen})`;
      modalNoteStudentSelect.appendChild(opt);
    });

    if (targetNama) {
      modalNoteStudentSelect.value = targetNama;
    }
  }

  function syncNoteFormWithSelectedStudent() {
    if (!modalNoteStudentSelect) return;
    const selectedOpt = modalNoteStudentSelect.options[modalNoteStudentSelect.selectedIndex];
    const nama = modalNoteStudentSelect.value;
    const absen = selectedOpt ? selectedOpt.getAttribute('data-absen') : '';

    if (noteTargetAbsenHint) {
      noteTargetAbsenHint.textContent = absen ? `Nomor Absen: ${absen}` : '';
    }

    const notes = getStudentNotes();
    const existing = notes[nama.trim().toLowerCase()];

    if (existing && existing.note) {
      if (modalNoteTextarea) modalNoteTextarea.value = existing.note;
      if (modalNoteTagSelect) modalNoteTagSelect.value = existing.tag || 'Tuntas';
      if (btnDeleteStudentNote) btnDeleteStudentNote.classList.remove('hidden');
    } else {
      if (modalNoteTextarea) modalNoteTextarea.value = '';
      if (modalNoteTagSelect) modalNoteTagSelect.value = 'Sangat Baik';
      if (btnDeleteStudentNote) btnDeleteStudentNote.classList.add('hidden');
    }

    if (adminNoteModalAlert) adminNoteModalAlert.classList.add('hidden');
  }

  function openStudentNoteModal(targetNama, targetAbsen) {
    if (currentUser.role !== 'admin') {
      alert('Akses Terbatas: Hanya Administrator (Pak Adnan) yang dapat memberikan catatan kepada siswa!');
      return;
    }

    populateStudentSelect(targetNama);
    syncNoteFormWithSelectedStudent();

    if (adminNoteModal) {
      adminNoteModal.classList.remove('hidden');
      if (modalNoteTextarea) {
        setTimeout(() => modalNoteTextarea.focus(), 120);
      }
    }
    sfx.pop();
  }

  function closeStudentNoteModal() {
    if (adminNoteModal) adminNoteModal.classList.add('hidden');
    sfx.click();
  }

  if (modalNoteStudentSelect) {
    modalNoteStudentSelect.addEventListener('change', () => {
      syncNoteFormWithSelectedStudent();
    });
  }

  // Quick Template Chips click handler
  document.querySelectorAll('.qt-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const templateText = chip.getAttribute('data-text');
      if (modalNoteTextarea && templateText) {
        modalNoteTextarea.value = templateText;
        modalNoteTextarea.focus();
        sfx.pop();
      }
    });
  });

  // Save Note Handler
  if (btnSaveStudentNote) {
    btnSaveStudentNote.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentUser.role !== 'admin') {
        alert('Akses Terbatas: Hanya Administrator (Pak Adnan) yang dapat menyimpan catatan siswa!');
        return;
      }

      const nama = modalNoteStudentSelect ? modalNoteStudentSelect.value.trim() : '';
      const selectedOpt = modalNoteStudentSelect ? modalNoteStudentSelect.options[modalNoteStudentSelect.selectedIndex] : null;
      const absen = selectedOpt ? selectedOpt.getAttribute('data-absen') : 1;
      const noteText = modalNoteTextarea ? modalNoteTextarea.value.trim() : '';
      const tag = modalNoteTagSelect ? modalNoteTagSelect.value : 'Tuntas';

      if (!nama || !noteText) {
        sfx.wrong();
        if (adminNoteModalAlert) {
          if (adminNoteModalAlertText) {
            adminNoteModalAlertText.textContent = 'Silakan pilih siswa dan isi catatan terlebih dahulu!';
          }
          adminNoteModalAlert.classList.remove('hidden');
        }
        if (adminNoteModalCard) {
          adminNoteModalCard.classList.remove('shake');
          void adminNoteModalCard.offsetWidth;
          adminNoteModalCard.classList.add('shake');
        }
        return;
      }

      saveStudentNote(nama, absen, noteText, tag);
      sfx.celebrate();
      confetti.burst(50);
      closeStudentNoteModal();
      renderAdminDashboard();
    });
  }

  // Delete Note Handler
  if (btnDeleteStudentNote) {
    btnDeleteStudentNote.addEventListener('click', () => {
      if (currentUser.role !== 'admin') return;
      const nama = modalNoteStudentSelect ? modalNoteStudentSelect.value.trim() : '';
      if (!nama) return;

      const ok = confirm(`Hapus catatan guru untuk siswa "${nama}"?`);
      if (ok) {
        deleteStudentNote(nama);
        sfx.pop();
        closeStudentNoteModal();
        renderAdminDashboard();
      }
    });
  }

  if (btnAdminQuickNote) {
    btnAdminQuickNote.addEventListener('click', () => {
      openStudentNoteModal();
    });
  }

  if (btnCloseNoteModal)   btnCloseNoteModal.addEventListener('click', closeStudentNoteModal);
  if (btnCancelNoteModal)  btnCancelNoteModal.addEventListener('click', closeStudentNoteModal);

  if (adminNoteModal) {
    adminNoteModal.addEventListener('click', (e) => {
      if (e.target === adminNoteModal) closeStudentNoteModal();
    });
  }

  // Escape key closes note modal
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && adminNoteModal && !adminNoteModal.classList.contains('hidden')) {
      closeStudentNoteModal();
    }
  });

  if (adminSearchInput) {
    adminSearchInput.addEventListener('input', () => renderAdminDashboard());
  }
  if (adminScoreFilter) {
    adminScoreFilter.addEventListener('change', () => renderAdminDashboard());
  }

  // Export CSV / Excel with Student Notes
  if (btnExportCSV) {
    btnExportCSV.addEventListener('click', () => {
      const allRecords = getQuizRecords();
      const notes = getStudentNotes();
      if (allRecords.length === 0) {
        alert('Belum ada data nilai untuk diekspor.');
        return;
      }

      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'No,Nomor Absen,Nama Siswa,Nilai Kuis,Benar,Salah,Total Soal,Waktu Pengerjaan,Kategori Evaluasi,Catatan Guru\n';

      allRecords.forEach((rec, i) => {
        const wrong = rec.total - rec.correct;
        const note = notes[rec.nama.trim().toLowerCase()];
        const tag = note ? note.tag : '-';
        const noteText = note ? note.note.replace(/"/g, '""') : '-';
        csvContent += `${i + 1},"${rec.absen}","${rec.nama}",${rec.score},${rec.correct},${wrong},${rec.total},"${rec.time}","${tag}","${noteText}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `Rekap_Nilai_PecahanSeru_Beserta_Catatan_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      sfx.celebrate();
    });
  }

  // Reset All Data (Admin only)
  if (btnResetData) {
    btnResetData.addEventListener('click', () => {
      const ok = confirm('PERINGATAN!\n\nApakah Anda yakin ingin menghapus seluruh data nilai kuis siswa? Tindakan ini tidak dapat dibatalkan.');
      if (ok) {
        localStorage.removeItem(STORAGE_KEY_RECORDS);
        sfx.pop();
        renderAdminDashboard();
        alert('Seluruh data nilai berhasil dihapus.');
      }
    });
  }

  // Run initial setup
  updateHeaderProfile();
})();
