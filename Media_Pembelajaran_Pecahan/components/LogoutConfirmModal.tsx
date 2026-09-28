import React, { useEffect } from 'react';

export interface LogoutConfirmModalProps {
  /**
   * Menentukan apakah modal sedang terbuka
   */
  isOpen: boolean;

  /**
   * Callback saat pengguna membatalkan dan memilih lanjut belajar
   */
  onClose: () => void;

  /**
   * Callback saat pengguna mengonfirmasi keluar dari aplikasi
   */
  onConfirm: () => void;

  /**
   * URL atau path gambar maskot burung hantu (opsional, default: /assets/mascot_owl.png)
   */
  mascotSrc?: string;

  /**
   * Menutup modal saat backdrop gelap di-klik (opsional, default: true)
   */
  closeOnBackdropClick?: boolean;
}

/**
 * LogoutConfirmModal Component
 *
 * Pop-up modal konfirmasi keluar aplikasi dengan maskot 3D burung hantu
 * bertoga yang memegang diagram lingkaran pecahan berwarna-warni.
 *
 * Dibangun menggunakan React, TypeScript, dan Tailwind CSS.
 */
export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  mascotSrc = '/assets/mascot_owl.png',
  closeOnBackdropClick = true,
}) => {
  // Tutup modal saat tombol Escape ditekan & kunci scroll latar belakang
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      {/* 1. Backdrop Blur Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />

      {/* 2. Floating Modal Card Container */}
      <div
        className="relative z-10 w-full max-w-[400px] transform overflow-hidden rounded-[36px] bg-white px-7 py-9 text-center shadow-2xl transition-all sm:px-8 sm:py-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Maskot 3D Burung Hantu Bertoga */}
        <div className="mx-auto mb-3 flex h-36 w-36 items-center justify-center">
          <img
            src={mascotSrc}
            alt="Maskot Burung Hantu Pecahan"
            className="h-full w-full object-contain drop-shadow-md transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent && !parent.querySelector('.svg-fallback')) {
                const fallback = document.createElement('div');
                fallback.className = 'svg-fallback text-7xl select-none';
                fallback.innerHTML = '🦉🎓';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        {/* Tipografi: Judul & Deskripsi */}
        <h3
          id="logout-modal-title"
          className="mb-2 text-2xl font-extrabold tracking-tight text-slate-800 sm:text-[26px]"
          style={{ fontFamily: "'Fredoka', 'Plus Jakarta Sans', system-ui, sans-serif" }}
        >
          Konfirmasi Keluar
        </h3>

        <p className="mx-auto mb-7 max-w-[270px] text-sm font-medium leading-relaxed text-slate-500 sm:text-base">
          Apakah kamu yakin ingin keluar dari aplikasi{' '}
          <strong className="font-bold text-slate-700">PecahanSeru?</strong>
        </p>

        {/* Tombol Aksi (Button Layout) */}
        <div className="grid grid-cols-2 gap-3.5 w-full">
          {/* Tombol Utama (Kiri): Batal, Lanjut Belajar */}
          <button
            type="button"
            onClick={onClose}
            className="group relative flex items-center justify-center rounded-full bg-[#009bbd] px-3 py-3.5 text-center text-sm font-extrabold leading-tight text-white shadow-md transition-all duration-150 border-b-[4px] border-[#006e86] hover:bg-[#00a8cc] hover:brightness-105 active:translate-y-[2px] active:border-b-[2px] active:shadow-none focus:outline-none focus:ring-4 focus:ring-cyan-200"
          >
            <span>
              Batal, Lanjut<br />Belajar
            </span>
          </button>

          {/* Tombol Sekunder (Kanan): Ya, Keluar Sekarang */}
          <button
            type="button"
            onClick={onConfirm}
            className="flex items-center justify-center rounded-full border-2 border-rose-300 bg-transparent px-3 py-3.5 text-center text-sm font-extrabold leading-tight text-[#f87171] transition-all duration-150 hover:border-rose-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 focus:outline-none focus:ring-4 focus:ring-rose-100"
          >
            <span>
              Ya, Keluar<br />Sekarang
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
