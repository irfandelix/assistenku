'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, limit, where } from 'firebase/firestore';
import { Wallet, Map, CheckSquare, FileText, ArrowRight, TrendingUp, TrendingDown, Clock, CheckCircle2, ChevronRight } from 'lucide-react';
import { startOfDay, endOfDay } from 'date-fns';
import FinanceChart from '@/components/FinanceChart';
import AIAssistant from '@/components/AIAssistant';

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [todayExpense, setTodayExpense] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeProjects, setActiveProjects] = useState(0);
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [recentNotes, setRecentNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ... (keep the rest identical until the return block, wait, I can't use replace_file_content across the whole file easily if I omit code. I need to be precise)

  useEffect(() => {
    // Finance Listener
    const qFinance = query(collection(db, 'finance'), orderBy('createdAt', 'desc'));
    const unsubFinance = onSnapshot(qFinance, (snapshot) => {
      let total = 0;
      let expensesToday = 0;
      const start = startOfDay(new Date()).getTime();
      const end = endOfDay(new Date()).getTime();
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

      txs.forEach(data => {
        if (data.type === 'income') total += data.amount;
        if (data.type === 'expense') {
          total -= data.amount;
          const time = data.createdAt?.toMillis() || 0;
          if (time >= start && time <= end) {
            expensesToday += data.amount;
          }
        }
      });
      setBalance(total);
      setTodayExpense(expensesToday);
      setTransactions(txs);
    });

    // Projects Listener
    const qProjects = query(collection(db, 'projects'), where('isPaid', '==', false));
    const unsubProjects = onSnapshot(qProjects, (snapshot) => {
      setActiveProjects(snapshot.docs.length);
    });

    // Todo Listener
    const qTodo = query(collection(db, 'todos'));
    const unsubTodo = onSnapshot(qTodo, (snapshot) => {
      let completed = 0;
      const start = startOfDay(new Date()).getTime();
      const end = endOfDay(new Date()).getTime();
      let totalToday = 0;

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Assuming we want to track today's progress or all active tasks
        // Let's track overall pending vs completed, or just total completed.
        // For simplicity:
        if (data.completed) {
          completed++;
        }
        totalToday++;
      });
      setTaskStats({ total: totalToday, completed });
    });

    // Notes Listener
    const qNotes = query(collection(db, 'notes'), orderBy('createdAt', 'desc'), limit(2));
    const unsubNotes = onSnapshot(qNotes, (snapshot) => {
      setRecentNotes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => {
      unsubFinance();
      unsubProjects();
      unsubTodo();
      unsubNotes();
    };
  }, []);

  const progressPercent = taskStats.total === 0 ? 0 : Math.round((taskStats.completed / taskStats.total) * 100);

  const contextData = `
Total Saldo: Rp ${balance.toLocaleString('id-ID')}
Pengeluaran Hari Ini: Rp ${todayExpense.toLocaleString('id-ID')}
Proyek Aktif: ${activeProjects}
Tugas Selesai: ${taskStats.completed} dari ${taskStats.total}
  `.trim();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="pt-2 flex justify-between items-center">
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Informasi</p>
          <h1 className="text-3xl font-bold text-gray-100 tracking-tight">Delix's Assistant</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-darkcard border border-gray-800 flex items-center justify-center p-2">
          <img src="/logo.svg" alt="D Checklist Logo" className="w-full h-full object-contain" />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Finance Card */}
        <div className="bg-darkcard border border-gray-800 rounded-3xl p-5 hover:border-gray-700 transition-all active:scale-[0.98] group flex flex-col">
          <Link href="/finance" className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-neon/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-neon" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-neon transition-colors" />
          </Link>
          <p className="text-gray-400 text-sm font-medium">Total Saldo</p>
          <h2 className="text-3xl font-bold text-gray-100 mt-1 mb-6">Rp {balance.toLocaleString('id-ID')}</h2>
          
          <div className="-mx-2 flex-1">
            <FinanceChart transactions={transactions} height={120} />
          </div>
        </div>

        {/* Projects & Tasks Combo */}
        <div className="flex flex-col gap-4">
          <Link href="/projects" className="bg-darkcard border border-gray-800 rounded-3xl p-5 hover:border-gray-700 transition-all active:scale-[0.98] flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center">
                <Map className="w-6 h-6 text-accent-blue" />
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium">Proyek Aktif</p>
                <h3 className="text-xl font-bold text-gray-100">{activeProjects} Klien</h3>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-accent-blue transition-colors" />
          </Link>

          <Link href="/todo" className="bg-darkcard border border-gray-800 rounded-3xl p-5 hover:border-gray-700 transition-all active:scale-[0.98] group relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-neon transition-all" style={{ width: `${progressPercent}%` }} />
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">Progress Tugas</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-100">{taskStats.completed}</h3>
                  <span className="text-gray-500 font-medium">/ {taskStats.total} Selesai</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gray-800/50 flex items-center justify-center">
                <CheckSquare className="w-6 h-6 text-gray-400 group-hover:text-neon transition-colors" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Quick Notes */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-200">Catatan Terbaru</h2>
          <Link href="/notes" className="text-sm text-neon font-medium hover:underline flex items-center gap-1">
            Lihat Semua <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {recentNotes.length === 0 && !loading && (
            <div className="col-span-2 text-center py-8 border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500 text-sm">Belum ada catatan.</p>
            </div>
          )}
          {recentNotes.map((note) => (
            <div key={note.id} className="bg-darkcard border border-gray-800 p-4 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-accent-orange" />
              <p className="text-xs text-accent-orange font-medium mb-2 uppercase tracking-wider">{note.category || 'Idea'}</p>
              <p className="text-sm text-gray-300 line-clamp-3 leading-relaxed">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      <AIAssistant contextData={contextData} />
    </div>
  );
}
