import Link from 'next/link';
import { Wallet, CheckSquare, Map, FileText, ArrowRight } from 'lucide-react';

export default function Home() {
  const modules = [
    { name: 'Keuangan', href: '/finance', icon: Wallet, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { name: 'To-Do List', href: '/todo', icon: CheckSquare, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { name: 'Daftar Proyek', href: '/projects', icon: Map, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { name: 'Catatan', href: '/notes', icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  ];

  return (
    <div className="space-y-8">
      <header className="pt-4">
        <h1 className="text-3xl font-bold">Selamat Datang! 👋</h1>
        <p className="text-gray-500 mt-2">Ini adalah asisten digital pribadi Anda.</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Link key={mod.name} href={mod.href} className="group block">
              <div className={`p-6 rounded-3xl border border-gray-100 dark:border-gray-800 ${mod.bg} transition-all hover:shadow-md`}>
                <div className="flex justify-between items-center mb-4">
                  <div className={`p-3 rounded-2xl bg-white dark:bg-gray-800 shadow-sm ${mod.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{mod.name}</h2>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
