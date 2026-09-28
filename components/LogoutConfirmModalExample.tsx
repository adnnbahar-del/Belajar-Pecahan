import React, { useState } from 'react';
import { LogoutConfirmModal } from './LogoutConfirmModal';

export const AppExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleConfirmLogout = () => {
    console.log('Pengguna keluar dari aplikasi.');
    setIsModalOpen(false);
    // Jalankan logika keluar (misal: redirect ke halaman login atau clear session)
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-100 p-4">
      {/* Tombol pemicu untuk demonstrasi */}
      <button
        type="button"
        onClick={handleOpenModal}
        className="rounded-2xl bg-rose-500 px-6 py-3 font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        Buka Modal Konfirmasi Keluar
      </button>

      {/* Komponen Modal Dialog Konfirmasi Keluar */}
      <LogoutConfirmModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleConfirmLogout}
        mascotSrc="assets/mascot_owl.png"
      />
    </div>
  );
};

export default AppExample;
