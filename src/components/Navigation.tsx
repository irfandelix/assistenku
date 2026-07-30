'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet, CheckSquare, Map, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Navigation() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/finance', label: 'Keuangan', icon: Wallet },
    { href: '/todo', label: 'To-Do', icon: CheckSquare },
    { href: '/projects', label: 'Proyek', icon: Map },
    { href: '/notes', label: 'Notes', icon: FileText },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-white/90 backdrop-blur-md border-t border-gray-200 px-3 pt-3 pb-[calc(env(safe-area-inset-bottom,1rem)+0.5rem)] md:hidden dark:bg-gray-900/90 dark:border-gray-800">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full transition-colors",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              )}
            >
              <Icon className="w-6 h-6 mb-1" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Sidebar Navigation */}
      <nav className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-gray-200 p-4 dark:bg-gray-900 dark:border-gray-800 z-50">
        <div className="mb-8 px-4">
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            My Dashboard
          </h1>
        </div>
        <div className="flex flex-col gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                  isActive
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                    : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
