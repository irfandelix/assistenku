'use client';

import Link from 'next/link';
import { ChevronLeft, Laptop, ExternalLink, AlertCircle } from 'lucide-react';

export default function RemoteDesktopPage() {
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

      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm mx-auto">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6">
          <Laptop className="w-10 h-10 text-blue-500" />
        </div>
        
        <h2 className="text-xl font-bold text-white mb-3">Siap Mengendalikan Laptop?</h2>
        <p className="text-gray-400 text-sm mb-8">
          Untuk performa terbaik dan menghindari layar hitam (pemblokiran sistem keamanan iPhone/Android), silakan buka Remote Desktop di tab baru.
        </p>

        <a 
          href="https://web.rustdesk.com/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg shadow-blue-500/20"
        >
          <span>Buka Layar Remote</span>
          <ExternalLink className="w-5 h-5" />
        </a>

        <div className="mt-8 bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3 text-left">
          <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <div className="text-xs text-orange-200">
            <span className="font-bold block mb-1">Cara Penggunaan:</span>
            1. Buka aplikasi RustDesk di Laptop Anda.<br/>
            2. Klik tombol biru di atas.<br/>
            3. Masukkan ID dan Password Laptop ke web yang terbuka.
          </div>
        </div>
      </div>
    </div>
  );
}
