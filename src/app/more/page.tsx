'use client';

import Link from 'next/link';
import { CheckSquare, FileText, Settings, User } from 'lucide-react';

export default function MorePage() {
  const menuItems = [
    { title: 'Tugas Harian (To-Do)', icon: CheckSquare, href: '/todo', color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
    { title: 'Catatan Ide (Notes)', icon: FileText, href: '/notes', color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    { title: 'Profil Saya', icon: User, href: '#', color: 'text-gray-400', bg: 'bg-gray-800' },
    { title: 'Pengaturan Sistem', icon: Settings, href: '#', color: 'text-gray-400', bg: 'bg-gray-800' },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-100">Menu Lainnya</h1>
        <p className="text-gray-400 text-sm mt-1">Akses semua fitur tambahan di sini.</p>
      </header>

      <div className="grid gap-4">
        {menuItems.map((item, idx) => (
          <Link key={idx} href={item.href} className="flex items-center gap-4 bg-darkcard p-4 rounded-2xl border border-gray-800 hover:border-gray-700 transition-all active:scale-[0.98]">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.bg} ${item.color}`}>
              <item.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-200">{item.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
