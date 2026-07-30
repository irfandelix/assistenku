'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, X, Save, Trash2, Send, Coffee, ShoppingBag, Briefcase, CreditCard } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, subDays, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Helper to pick icon based on title
function getCategoryIcon(title: string, type: string) {
  const t = title.toLowerCase();
  if (t.includes('makan') || t.includes('kopi') || t.includes('food') || t.includes('minum')) return <Coffee className="w-5 h-5" />;
  if (t.includes('belanja') || t.includes('shop') || t.includes('beli')) return <ShoppingBag className="w-5 h-5" />;
  if (t.includes('gaji') || t.includes('proyek') || t.includes('project') || t.includes('fee')) return <Briefcase className="w-5 h-5" />;
  if (t.includes('bayar') || t.includes('tagihan') || t.includes('listrik')) return <CreditCard className="w-5 h-5" />;
  return type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTx, setCurrentTx] = useState({ id: '', title: '', amount: '', type: 'expense' });
  const [isSendingReport, setIsSendingReport] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'finance'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentTx.title.trim() || !currentTx.amount) return;
    const amountNum = parseFloat(currentTx.amount);
    
    try {
      if (currentTx.id) {
        await updateDoc(doc(db, 'finance', currentTx.id), {
          title: currentTx.title, amount: amountNum, type: currentTx.type
        });
      } else {
        await addDoc(collection(db, 'finance'), {
          title: currentTx.title, amount: amountNum, type: currentTx.type, createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      try {
        await deleteDoc(doc(db, 'finance', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (tx = { id: '', title: '', amount: '', type: 'expense' }) => {
    setCurrentTx(tx);
    setIsEditing(true);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const balance = totalIncome - totalExpense;

  const sendMonthlyReport = async () => {
    if (isSendingReport) return;
    setIsSendingReport(true);
    try {
      const currentMonth = format(new Date(), 'MMMM yyyy', { locale: localeId });
      const formatRp = (num: number) => `Rp ${num.toLocaleString('id-ID')}`;
      const message = `📊 <b>Laporan Keuangan ${currentMonth}</b>\n\n` +
        `📈 Pemasukan: <b>${formatRp(totalIncome)}</b>\n` +
        `📉 Pengeluaran: <b>${formatRp(totalExpense)}</b>\n` +
        `💰 <b>Sisa Saldo: ${formatRp(balance)}</b>\n\n` +
        `<i>Tetap semangat dan bijak dalam mengelola keuangan!</i> ✨`;
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      alert('Laporan berhasil dikirim ke Telegram!');
    } catch (e) {
      alert('Gagal mengirim laporan.');
    } finally {
      setIsSendingReport(false);
    }
  };

  // Prepare chart data (last 7 days expenses)
  const chartData = Array.from({length: 7}).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    const dayTotal = transactions.filter(t => t.type === 'expense' && t.createdAt?.toDate && isSameDay(t.createdAt.toDate(), d))
      .reduce((acc, curr) => acc + curr.amount, 0);
    return { day: format(d, 'EE', {locale: localeId}), amount: dayTotal };
  });
  const maxExpense = Math.max(...chartData.map(d => d.amount), 1);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Keuangan</p>
          <h1 className="text-2xl font-bold text-gray-100">Budget Overview</h1>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="bg-darkcard border border-gray-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <p className="text-gray-400 text-sm font-medium mb-1">Total Saldo Aktif</p>
        <h2 className="text-4xl font-bold text-gray-100 mb-6">Rp {balance.toLocaleString('id-ID')}</h2>
        
        <div className="flex gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-neon/20 flex items-center justify-center">
                <ArrowUpRight className="w-3 h-3 text-neon" />
              </div>
              <p className="text-xs text-gray-400 font-medium">Pemasukan</p>
            </div>
            <p className="font-bold text-gray-200">Rp {totalIncome.toLocaleString('id-ID')}</p>
          </div>
          <div className="w-px bg-gray-800" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                <ArrowDownRight className="w-3 h-3 text-red-500" />
              </div>
              <p className="text-xs text-gray-400 font-medium">Pengeluaran</p>
            </div>
            <p className="font-bold text-gray-200">Rp {totalExpense.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Weekly Expense Chart */}
      <div className="bg-darkcard border border-gray-800 p-5 rounded-3xl">
        <h3 className="text-sm font-bold text-gray-200 mb-4">Grafik Pengeluaran (7 Hari)</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {chartData.map((d, i) => {
            const height = Math.max((d.amount / maxExpense) * 100, 5); // min 5%
            const isToday = i === 6;
            return (
              <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
                <div className="w-full relative flex justify-center items-end h-full">
                  <div 
                    className={cn(
                      "w-full max-w-[2rem] rounded-md transition-all duration-500 group-hover:opacity-80", 
                      isToday ? "bg-neon" : "bg-gray-700"
                    )}
                    style={{ height: `${height}%` }}
                  />
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-xs text-white px-2 py-1 rounded whitespace-nowrap pointer-events-none">
                    Rp {d.amount.toLocaleString('id-ID')}
                  </div>
                </div>
                <span className={cn("text-[10px] font-medium uppercase tracking-wider", isToday ? "text-neon" : "text-gray-500")}>
                  {d.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Huge CTA */}
      <button 
        onClick={() => openEditor()}
        className="w-full bg-neon text-[#0B0E14] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00c968] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.3)] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Tambah Transaksi Baru
      </button>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentTx.id ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex bg-[#050608] p-1 rounded-xl">
                <button 
                  onClick={() => setCurrentTx({...currentTx, type: 'expense'})}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", currentTx.type === 'expense' ? "bg-darkcard border border-gray-800 text-red-500" : "text-gray-500 hover:text-gray-400")}
                >
                  Pengeluaran
                </button>
                <button 
                  onClick={() => setCurrentTx({...currentTx, type: 'income'})}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", currentTx.type === 'income' ? "bg-darkcard border border-gray-800 text-neon" : "text-gray-500 hover:text-gray-400")}
                >
                  Pemasukan
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Judul / Keterangan</label>
                <input 
                  type="text"
                  value={currentTx.title}
                  onChange={e => setCurrentTx({...currentTx, title: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Makan siang"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nominal (Rp)</label>
                <input 
                  type="number"
                  value={currentTx.amount}
                  onChange={e => setCurrentTx({...currentTx, amount: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="50000"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentTx.id ? (
                <button onClick={() => handleDelete(currentTx.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-neon text-[#0B0E14] px-6 py-3 rounded-xl font-bold hover:bg-[#00c968] flex items-center gap-2 transition-colors active:scale-95"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-200">Riwayat Terakhir</h3>
          <button onClick={sendMonthlyReport} disabled={isSendingReport} className="text-xs font-medium text-accent-blue bg-accent-blue/10 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-accent-blue/20 transition-colors disabled:opacity-50">
            <Send className="w-3 h-3" /> Report
          </button>
        </div>
        
        <div className="space-y-3">
          {transactions.length === 0 && (
            <div className="text-center py-8 border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500 text-sm">Belum ada transaksi.</p>
            </div>
          )}
          {transactions.map((t) => (
            <div 
              key={t.id} 
              onClick={() => openEditor(t)}
              className="bg-darkcard border border-gray-800 p-4 rounded-2xl flex justify-between items-center cursor-pointer hover:border-gray-700 transition-colors active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  t.type === 'income' ? "bg-neon/10 text-neon" : "bg-gray-800 text-gray-400"
                )}>
                  {getCategoryIcon(t.title, t.type)}
                </div>
                <div>
                  <p className="font-semibold text-gray-200">{t.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {t.createdAt?.toDate ? format(t.createdAt.toDate(), 'dd MMM', { locale: localeId }) : 'Hari ini'}
                  </p>
                </div>
              </div>
              <p className={cn(
                "font-bold",
                t.type === 'income' ? "text-neon" : "text-gray-100"
              )}>
                {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
