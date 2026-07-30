'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, FileText, X, Save, Trash2, Send } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
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
    
    if (currentTx.id) {
      await updateDoc(doc(db, 'finance', currentTx.id), {
        title: currentTx.title,
        amount: amountNum,
        type: currentTx.type
      });
    } else {
      await addDoc(collection(db, 'finance'), {
        title: currentTx.title,
        amount: amountNum,
        type: currentTx.type,
        createdAt: serverTimestamp()
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus catatan ini?')) {
      await deleteDoc(doc(db, 'finance', id));
      setIsEditing(false);
    }
  };

  const openEditor = (tx = { id: '', title: '', amount: '', type: 'expense' }) => {
    setCurrentTx(tx);
    setIsEditing(true);
  };

  // Calculate totals
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

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Keuangan</h1>
        <button 
          onClick={() => openEditor()}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5 rounded-3xl text-white shadow-blue-500/20 shadow-lg col-span-2">
          <p className="text-blue-100 text-sm font-medium mb-1">Total Saldo</p>
          <h2 className="text-3xl font-bold">Rp {balance.toLocaleString('id-ID')}</h2>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pemasukan</p>
            <p className="font-bold text-gray-900 dark:text-white mt-0.5">Rp {totalIncome.toLocaleString('id-ID')}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-2 shadow-sm">
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Pengeluaran</p>
            <p className="font-bold text-gray-900 dark:text-white mt-0.5">Rp {totalExpense.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
      
      <button 
        onClick={sendMonthlyReport}
        disabled={isSendingReport}
        className="w-full bg-gray-900 dark:bg-gray-800 text-white p-4 rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        <Send className="w-4 h-4" /> {isSendingReport ? 'Mengirim...' : 'Kirim Laporan ke Telegram'}
      </button>

      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{currentTx.id ? 'Edit Transaksi' : 'Catat Transaksi'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                <button 
                  onClick={() => setCurrentTx({...currentTx, type: 'expense'})}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", currentTx.type === 'expense' ? "bg-white dark:bg-gray-700 shadow-sm text-red-600" : "text-gray-500")}
                >
                  Pengeluaran
                </button>
                <button 
                  onClick={() => setCurrentTx({...currentTx, type: 'income'})}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", currentTx.type === 'income' ? "bg-white dark:bg-gray-700 shadow-sm text-green-600" : "text-gray-500")}
                >
                  Pemasukan
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Judul / Keterangan</label>
                <input 
                  type="text"
                  value={currentTx.title}
                  onChange={e => setCurrentTx({...currentTx, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="Misal: Makan siang"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nominal (Rp)</label>
                <input 
                  type="number"
                  value={currentTx.amount}
                  onChange={e => setCurrentTx({...currentTx, amount: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-blue-500"
                  placeholder="50000"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentTx.id ? (
                <button onClick={() => handleDelete(currentTx.id)} className="text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div>
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Riwayat Terakhir</h3>
        <div className="space-y-3">
          {transactions.length === 0 && <p className="text-gray-500 italic">Belum ada transaksi.</p>}
          {transactions.map((t) => (
            <div 
              key={t.id} 
              onClick={() => openEditor(t)}
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl flex justify-between items-center border border-gray-100 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  t.type === 'income' ? "bg-green-100 text-green-600 dark:bg-green-900/30" : "bg-red-100 text-red-600 dark:bg-red-900/30"
                )}>
                  {t.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.title}</p>
                  <p className="text-xs text-gray-500">
                    {t.createdAt?.toDate ? format(t.createdAt.toDate(), 'dd MMM yyyy', { locale: localeId }) : 'Hari ini'}
                  </p>
                </div>
              </div>
              <p className={cn(
                "font-bold",
                t.type === 'income' ? "text-green-600 dark:text-green-400" : "text-gray-900 dark:text-white"
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
