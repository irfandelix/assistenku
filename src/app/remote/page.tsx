'use client';

import Link from 'next/link';
import { ChevronLeft, Laptop } from 'lucide-react';

export default function RemoteDesktopPage() {
  return (
    <div className="flex flex-col h-screen pb-20 animate-in fade-in duration-500">
      <header className="flex items-center gap-4 mb-4 shrink-0">
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

      <div className="flex-1 bg-black rounded-2xl overflow-hidden border border-gray-800 shadow-2xl relative">
        {/* Loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center -z-10 bg-darkcard">
          <div className="text-gray-500 flex flex-col items-center gap-2">
            <Laptop className="w-8 h-8 animate-pulse text-blue-500" />
            <p>Memuat RustDesk Web Client...</p>
          </div>
        </div>
        
        {/* RustDesk Web iframe */}
        <iframe 
          src="https://web.rustdesk.com/" 
          className="w-full h-full border-0 z-10 relative"
          allow="clipboard-read; clipboard-write; display-capture"
          title="RustDesk Remote Desktop"
        />
      </div>
      
      <p className="text-xs text-center text-gray-500 mt-4 shrink-0">
        Ditenagai oleh <a href="https://rustdesk.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">RustDesk Web Client</a>. Pastikan aplikasi RustDesk menyala di laptop Anda.
      </p>
    </div>
  );
}
