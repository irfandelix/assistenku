'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { 
  Map, 
  Users, 
  Wallet, 
  Handshake, 
  CheckSquare, 
  FileText, 
  Target, 
  ShoppingBag, 
  Activity, 
  Utensils, 
  Laptop, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import AIAssistant from '@/components/AIAssistant';

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [consultantCount, setConsultantCount] = useState(0);
  const [debtCount, setDebtCount] = useState(0);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [recentNotesCount, setRecentNotesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Finance Listener
    const qFinance = query(collection(db, 'finance'), orderBy('createdAt', 'desc'));
    const unsubFinance = onSnapshot(qFinance, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        if (data.type === 'income') total += data.amount;
        if (data.type === 'expense') total -= data.amount;
      });
      setBalance(total);
    });

    // 2. Active Projects Listener
    const qProjects = query(collection(db, 'projects'), where('isPaid', '==', false));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setActiveProjects(snapshot.docs.length);
    });

    // 3. Consultants Listener
    const qCons = query(collection(db, 'consultants'));
    const unsubCons = onSnapshot(qCons, (snapshot) => {
      setConsultantCount(snapshot.docs.length);
    });

    // 4. Debts Listener
    const qDebts = query(collection(db, 'debts'), where('isSettled', '==', false));
    const unsubDebts = onSnapshot(qDebts, (snapshot) => {
      setDebtCount(snapshot.docs.length);
    });

    // 5. Todo Listener
    const qTodo = query(collection(db, 'todos'));
    const unsubTodo = onSnapshot(qTodo, (snapshot) => {
      let completed = 0;
      let totalToday = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.done) completed++;
        totalToday++;
      });
      setTaskStats({ total: totalToday, completed });
    });

    // 6. Notes Listener
    const qNotes = query(collection(db, 'notes'));
    const unsubNotes = onSnapshot(qNotes, (snapshot) => {
      setRecentNotesCount(snapshot.docs.length);
      setLoading(false);
    });

    return () => {
      unsubFinance();
      unsubProjects();
      unsubCons();
      unsubDebts();
      unsubTodo();
      unsubNotes();
    };
  }, []);

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const menuIcons = [
    {
      title: 'Proyek',
      description: 'Kelola berkas & status klien',
      href: '/projects',
      badge: `${activeProjects} Aktif`,
      icon: Map,
      gradient: 'from-blue-600 to-indigo-600',
      shadow: 'shadow-blue-600/25',
      glow: 'group-hover:border-blue-500/40',
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
    },
    {
      title: 'Konsultan',
      description: 'Bucket & kirim link WhatsApp',
      href: '/consultants',
      badge: `${consultantCount} Konsultan`,
      icon: Users,
      gradient: 'from-indigo-600 to-purple-600',
      shadow: 'shadow-indigo-600/25',
      glow: 'group-hover:border-indigo-500/40',
      badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
    },
    {
      title: 'Keuangan',
      description: 'Arus kas & mutasi saldo',
      href: '/finance',
      badge: `Rp ${(balance / 1000).toFixed(0)}k`,
      icon: Wallet,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/25',
      glow: 'group-hover:border-emerald-500/40',
      badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
    },
    {
      title: 'Hutang / Piutang',
      description: 'Pencatat tagihan & pinjaman',
      href: '/debts',
      badge: `${debtCount} Berjalan`,
      icon: Handshake,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-500/25',
      glow: 'group-hover:border-amber-500/40',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
    },
    {
      title: 'Tugas (To-Do)',
      description: 'Daftar kerjaan harian',
      href: '/todo',
      badge: `${taskStats.completed}/${taskStats.total} Selesai`,
      icon: CheckSquare,
      gradient: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-cyan-500/25',
      glow: 'group-hover:border-cyan-500/40',
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
    },
    {
      title: 'Catatan Ide',
      description: 'Memo & ringkasan cepat',
      href: '/notes',
      badge: `${recentNotesCount} Catatan`,
      icon: FileText,
      gradient: 'from-orange-500 to-amber-600',
      shadow: 'shadow-orange-500/25',
      glow: 'group-hover:border-orange-500/40',
      badgeColor: 'bg-orange-500/15 text-orange-400 border-orange-500/30'
    },
    {
      title: 'Target Tabungan',
      description: 'Goals & rencana finansial',
      href: '/goals',
      badge: 'Tabungan',
      icon: Target,
      gradient: 'from-pink-500 to-rose-600',
      shadow: 'shadow-pink-500/25',
      glow: 'group-hover:border-pink-500/40',
      badgeColor: 'bg-pink-500/15 text-pink-400 border-pink-500/30'
    },
    {
      title: 'Pengendali Hasrat',
      description: 'Wishlist belanja terkontrol',
      href: '/wishlist',
      badge: 'Wishlist',
      icon: ShoppingBag,
      gradient: 'from-purple-500 to-violet-600',
      shadow: 'shadow-purple-500/25',
      glow: 'group-hover:border-purple-500/40',
      badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30'
    },
    {
      title: 'Mood & Habits',
      description: 'Kesehatan mental & kebiasaan',
      href: '/mood',
      badge: 'Kesehatan',
      icon: Activity,
      gradient: 'from-teal-500 to-emerald-600',
      shadow: 'shadow-teal-500/25',
      glow: 'group-hover:border-teal-500/40',
      badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/30'
    },
    {
      title: 'Katalog Kuliner',
      description: 'Tempat makan & kuliner favorit',
      href: '/food',
      badge: 'Kuliner',
      icon: Utensils,
      gradient: 'from-red-500 to-orange-600',
      shadow: 'shadow-red-500/25',
      glow: 'group-hover:border-red-500/40',
      badgeColor: 'bg-red-500/15 text-red-400 border-red-500/30'
    },
    {
      title: 'Remote Desktop',
      description: 'Akses desktop jarak jauh',
      href: '/remote',
      badge: 'Remote',
      icon: Laptop,
      gradient: 'from-sky-500 to-blue-600',
      shadow: 'shadow-sky-500/25',
      glow: 'group-hover:border-sky-500/40',
      badgeColor: 'bg-sky-500/15 text-sky-400 border-sky-500/30'
    }
  ];

  const contextData = `
Total Saldo: Rp ${balance.toLocaleString('id-ID')}
Proyek Aktif: ${activeProjects}
Konsultan: ${consultantCount}
Tugas Selesai: ${taskStats.completed} dari ${taskStats.total}
  `.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto pb-12">
      
      {/* Top Greeting Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34D399]"></span>
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">ASSISTENKU ONLINE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Pusat Menu & Fitur
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-1.5 pt-0.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500" />
            {todayFormatted}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <AIAssistant contextData={contextData} />
        </div>
      </header>

      {/* Main Interactive Icon Menu Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
        {menuIcons.map((item, idx) => {
          const Icon = item.icon;

          return (
            <Link
              key={idx}
              href={item.href}
              className={`group bg-[#0E131F]/90 backdrop-blur-md border border-white/[0.08] ${item.glow} hover:bg-[#131929] rounded-3xl p-5 sm:p-6 flex flex-col justify-between transition-all duration-200 active:scale-95 shadow-xl hover:shadow-2xl relative overflow-hidden`}
            >
              {/* Top Row: Icon & Arrow */}
              <div className="flex items-start justify-between mb-4">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center shadow-lg ${item.shadow} group-hover:scale-105 transition-transform duration-200`}>
                  <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                </div>
                <div className="w-8 h-8 rounded-full bg-white/[0.04] group-hover:bg-white/[0.1] text-gray-400 group-hover:text-white flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <h3 className="font-bold text-base sm:text-lg text-white group-hover:text-blue-400 transition-colors tracking-tight">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Bottom Badge */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${item.badgeColor}`}>
                  {item.badge}
                </span>
                <span className="text-[11px] text-gray-500 font-medium group-hover:text-gray-300 transition-colors">
                  Buka &rarr;
                </span>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
