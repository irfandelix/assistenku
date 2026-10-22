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
      {/* Mobile Bottom Navigation (Always Icon-First) */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-[#07090E]/95 backdrop-blur-xl border-t border-white/[0.08] px-3 pt-2.5 pb-[calc(env(safe-area-inset-bottom,1rem)+0.5rem)] md:hidden shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all active:scale-90",
                isActive ? item.activeColor : "text-gray-500 hover:text-gray-300"
              )}
            >
              <Icon className={cn("w-6 h-6", isActive ? "scale-110" : "")} />
              <span className={cn("text-[10px] font-semibold mt-1", isActive ? "text-white" : "text-gray-500")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop / Landscape Sleek Icon Rail (No Boring Wide Sidebar!) */}
      <nav className="hidden md:flex flex-col items-center w-20 h-screen fixed left-0 top-0 bg-[#07090E] border-r border-white/[0.08] py-6 z-50 justify-between shadow-2xl">
        
        {/* Top App Logo Mark */}
        <div className="flex flex-col items-center gap-4">
          <Link href="/" className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shadow-lg shadow-blue-600/30 active:scale-95 transition-transform" title="Assistenku">
            A
          </Link>

          <div className="w-8 h-[1px] bg-white/[0.08] my-2"></div>
        </div>

        {/* Center Icons List */}
        <div className="flex flex-col items-center gap-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative group w-12 h-12 rounded-2xl flex items-center justify-center border transition-all active:scale-90",
                  isActive
                    ? cn(item.activeColor, "shadow-lg shadow-black/40 scale-105")
                    : "border-transparent text-gray-500 hover:text-gray-200 hover:bg-white/[0.04]"
                )}
                title={item.label}
              >
                <Icon className="w-5 h-5" />

                {/* Tooltip on Hover */}
                <span className="absolute left-16 px-3 py-1.5 bg-[#0E131F] border border-white/10 text-white text-xs font-semibold rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity shadow-2xl z-50">
                  {item.label}
                </span>

                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute -left-1 w-1.5 h-4 bg-blue-500 rounded-r-full shadow-[0_0_8px_#3B82F6]"></span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Sparkle / Help Mark */}
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-400">
            <Sparkles className="w-4 h-4 text-amber-400/80" />
          </div>
        </div>

      </nav>
    </>
  );
}
