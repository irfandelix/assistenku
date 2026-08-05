'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Laptop, ExternalLink, AlertCircle, Smartphone } from 'lucide-react';

export default function RemoteDesktopPage() {
  const [laptopId, setLaptopId] = useState('');

  // Muat ID yang tersimpan saat pertama kali halaman dibuka
  useEffect(() => {
    const saved = localStorage.getItem('rustdesk_id');
    if (saved) setLaptopId(saved);
  }, []);

  // Simpan ID setiap kali ada perubahan
  const handleIdChange = (val: string) => {
    const cleanId = val.replace(/\s/g, ''); // Hapus spasi
    setLaptopId(cleanId);
    localStorage.setItem('rustdesk_id', cleanId);
  };

  return (
    <div className="flex flex-col h-screen pb-20 animate-in fade-in duration-500 p-4">
      <header className="flex items-center gap-4 mb-8 shrink-0">
        <Link href="/more" className="p-2 bg-darkcard border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div className="flex-1">
          <p className="text-blue-500 font-medium text-sm tracking-widest uppercase mb-1">Screen Mirroring</p>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
            <Laptop className="w-6 h-6 text-blue-500" />
            Remote Desktop
          </h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto w-full">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
          <Smartphone className="w-10 h-10 text-blue-500" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-2">Hubungkan ke Aplikasi</h2>
        <p className="text-gray-400 text-sm mb-6">
          Masukkan ID RustDesk Laptop Anda agar tombol di bawah bisa langsung membuka aplikasinya!
        </p>

        <div className="w-full mb-8 text-left">
          <label className="block text-sm font-medium mb-1 text-gray-400">ID Laptop (RustDesk)</label>
          <input 
            type="text"
            value={laptopId}
            onChange={e => handleIdChange(e.target.value)}
            className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors font-mono text-lg text-center tracking-widest"
            placeholder="Misal: 101802429"
          />
        </div>

        <a 
          href={laptopId ? `rustdesk://${laptopId}` : '#'} 
          onClick={(e) => !laptopId && e.preventDefault()}
          className={`w-full font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg ${laptopId ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' : 'bg-gray-800 text-gray-500 cursor-not-allowed'}`}
        >
          <span>Buka Aplikasi RustDesk</span>
          <ExternalLink className="w-5 h-5" />
        </a>

        <div className="mt-4 flex items-center gap-4 w-full">
          <div className="h-px bg-gray-800 flex-1"></div>
          <span className="text-xs text-gray-500 uppercase tracking-widest">Atau</span>
          <div className="h-px bg-gray-800 flex-1"></div>
        </div>

        <a 
          href="https://web.rustdesk.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full mt-4 bg-darkcard border border-gray-800 hover:border-gray-700 text-gray-300 font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-colors"
        >
          <span>Gunakan Versi Web</span>
        </a>

        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3 text-left w-full">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200">
            <span className="font-bold block mb-1">Tips Pintar:</span>
            ID Anda akan tersimpan otomatis. Lain kali Anda cukup menekan tombol biru dan iPhone Anda akan langsung melompat masuk ke aplikasi RustDesk!
          </div>
        </div>
      </div>
    </div>
  );
}
