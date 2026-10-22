'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutGrid, 
  Map, 
  Users, 
  Wallet, 
  Layers, 
  CheckSquare, 
  FileText, 
  Handshake, 
  Sparkles 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Menu Utama', icon: LayoutGrid, activeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { href: '/projects', label: 'Proyek', icon: Map, activeColor: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
    { href: '/consultants', label: 'Konsultan', icon: Users, activeColor: 'text-indigo-400 bg-indigo-500/15 border-indigo-500/30' },
    { href: '/finance', label: 'Keuangan', icon: Wallet, activeColor: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/30' },
    { href: '/more', label: 'Lainnya', icon: Layers, activeColor: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  ];

  return (
    <>
      {/* Bottom Navigation (Always Icon-First, Zero Sidebar) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-[#07090E]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 pt-2.5 pb-[calc(env(safe-area-inset-bottom,1rem)+0.5rem)] shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-4 rounded-2xl transition-all active:scale-90",
                isActive ? item.activeColor : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "scale-110" : "")} />
              <span className={cn("text-[11px] font-semibold mt-1", isActive ? "text-white" : "text-gray-500")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
