'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, Tv, ChevronLeft, Calendar, CreditCard } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { format, addMonths, parseISO, differenceInDays } from 'date-fns';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [payMonths, setPayMonths] = useState(1);
  const [currentSub, setCurrentSub] = useState({ id: '', name: '', price: '', nextDueDate: '' });

  useEffect(() => {
    const q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubs(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentSub.name.trim() || !currentSub.price || !currentSub.nextDueDate) return;
    const priceNum = parseFloat(currentSub.price);
    
    try {
      if (currentSub.id) {
        await updateDoc(doc(db, 'subscriptions', currentSub.id), {
          name: currentSub.name,
          price: priceNum,
          nextDueDate: currentSub.nextDueDate
        });
      } else {
        await addDoc(collection(db, 'subscriptions'), {
          name: currentSub.name,
          price: priceNum,
          nextDueDate: currentSub.nextDueDate,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const executePayment = async () => {
    if (!currentSub.id) return;
    const totalPrice = parseFloat(currentSub.price) * payMonths;
    
    try {
      // 1. Add Expense
      await addDoc(collection(db, 'finance'), {
        title: `Bayar Langganan: ${currentSub.name} (${payMonths} bulan)`,
        amount: totalPrice,
        type: 'expense',
        createdAt: serverTimestamp()
      });

      // 2. Extend Due Date
      const currentDue = parseISO(currentSub.nextDueDate);
      const newDue = addMonths(currentDue, payMonths);
      const newDueStr = format(newDue, 'yyyy-MM-dd');

      await updateDoc(doc(db, 'subscriptions', currentSub.id), {
        nextDueDate: newDueStr
      });

      setIsPaying(false);
    } catch (e: any) {
      alert('Gagal memproses pembayaran: ' + e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus langganan ini?')) {
      try {
        await deleteDoc(doc(db, 'subscriptions', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (s: any = null) => {
    if (s) {
      // Compatibility fallback: if they only have billingDay from old schema, convert to nextDueDate
      let initialDate = s.nextDueDate || format(new Date(), 'yyyy-MM-dd');
      setCurrentSub({ id: s.id, name: s.name, price: s.price, nextDueDate: initialDate });
    } else {
      setCurrentSub({ id: '', name: '', price: '', nextDueDate: format(new Date(), 'yyyy-MM-dd') });
    }
    setIsEditing(true);
  };

  const openPayment = (s: any) => {
    let initialDate = s.nextDueDate || format(new Date(), 'yyyy-MM-dd');
    setCurrentSub({ id: s.id, name: s.name, price: s.price, nextDueDate: initialDate });
    setPayMonths(1);
    setIsPaying(true);
  };

  const getTheme = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('netflix') || n.includes('youtube')) return 'bg-red-500/10 text-red-500 border-red-500/30';
    if (n.includes('spotify') || n.includes('xbox')) return 'bg-green-500/10 text-green-500 border-green-500/30';
    if (n.includes('prime') || n.includes('disney') || n.includes('zoom')) return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
    if (n.includes('apple') || n.includes('icloud')) return 'bg-gray-100/10 text-gray-200 border-gray-600/30';
    return 'bg-neon/10 text-neon border-neon/30';
  };

  const totalMonthly = subs.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

  const renderStatus = (nextDueStr: string) => {
    if (!nextDueStr) return <span className="text-gray-500 text-xs font-bold">SET DATE</span>;
    const due = parseISO(nextDueStr);
    const now = new Date();
    const diff = differenceInDays(due, now);

    if (diff < 0) return <span className="text-red-500 text-xs font-bold uppercase">Terlewat</span>;
    if (diff === 0) return <span className="text-orange-500 text-xs font-bold uppercase">Hari Ini</span>;
    if (diff <= 7) return <span className="text-yellow-500 text-xs font-bold uppercase">H-{diff}</span>;
    return <span className="text-gray-400 text-xs font-bold uppercase">{format(due, 'dd MMM yyyy')}</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/more" className="p-2 bg-darkcard border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Expenses</p>
          <h1 className="text-2xl font-bold text-gray-100">Langganan</h1>
        </div>
      </header>

      {/* Summary Card */}
      <div className="bg-[#050608] border border-gray-800 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <p className="text-gray-400 text-sm font-medium mb-1">Total Tagihan Bulanan</p>
        <h2 className="text-3xl font-bold text-gray-100">Rp {totalMonthly.toLocaleString('id-ID')}</h2>
      </div>

      <div className="bg-[#050608] border border-gray-800 p-4 rounded-2xl">
        <p className="text-sm text-gray-400">💡 <strong>Tips:</strong> Tekan ikon kartu kredit pada langganan untuk membayar, otomatis memotong saldo dan memajukan tanggal tagihan!</p>
      </div>

      {/* Huge CTA */}
      <button 
        onClick={() => openEditor()}
        className="w-full bg-neon text-[#0B0E14] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00c968] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.3)] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Catat Langganan Baru
      </button>

      {/* Payment Modal */}
      {isPaying && (
        <div className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold text-gray-100 mb-2">Bayar Langganan</h2>
            <p className="text-gray-400 text-sm mb-6">Anda akan membayar {currentSub.name} seharga Rp {parseFloat(currentSub.price).toLocaleString('id-ID')} / bulan.</p>
            
            <label className="block text-sm font-medium mb-2 text-gray-300">Bayar untuk berapa bulan?</label>
            <div className="flex items-center gap-4 bg-[#050608] p-2 rounded-2xl border border-gray-800 mb-6">
              <button onClick={() => setPayMonths(Math.max(1, payMonths - 1))} className="w-10 h-10 bg-gray-800 rounded-xl font-bold">-</button>
              <div className="flex-1 text-center font-bold text-xl">{payMonths}</div>
              <button onClick={() => setPayMonths(payMonths + 1)} className="w-10 h-10 bg-neon text-black rounded-xl font-bold">+</button>
            </div>

            <div className="bg-gray-800/50 p-4 rounded-2xl mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Total Potongan</span>
                <span className="font-bold text-red-400">- Rp {(parseFloat(currentSub.price) * payMonths).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Jatuh Tempo Baru</span>
                <span className="font-bold text-neon">{format(addMonths(parseISO(currentSub.nextDueDate), payMonths), 'dd MMM yyyy')}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setIsPaying(false)} className="flex-1 p-3 rounded-xl border border-gray-700 text-gray-300 font-bold">Batal</button>
              <button onClick={executePayment} className="flex-1 p-3 rounded-xl bg-neon text-black font-bold">Konfirmasi</button>
            </div>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentSub.id ? 'Edit Langganan' : 'Catat Langganan'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nama Layanan</label>
                <input 
                  type="text"
                  value={currentSub.name}
                  onChange={e => setCurrentSub({...currentSub, name: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Netflix"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Biaya per Bulan (Rp)</label>
                <input 
                  type="number"
                  value={currentSub.price}
                  onChange={e => setCurrentSub({...currentSub, price: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="186000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Jatuh Tempo Berikutnya</label>
                <input 
                  type="date"
                  value={currentSub.nextDueDate}
                  onChange={e => setCurrentSub({...currentSub, nextDueDate: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentSub.id ? (
                <button onClick={() => handleDelete(currentSub.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
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

      {/* List */}
      <div className="grid gap-3">
        {subs.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <Tv className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Tidak ada langganan yang tercatat.</p>
          </div>
        )}
        {subs.map((s) => (
          <div 
            key={s.id} 
            className={cn(
              "p-4 rounded-2xl flex flex-col md:flex-row items-start md:items-center gap-4 hover:border-gray-700 transition-colors border bg-darkcard",
              getTheme(s.name)
            )}
          >
            <div className="flex items-center gap-4 flex-1 w-full" onClick={() => openEditor(s)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#050608] border border-inherit cursor-pointer">
                <Tv className="w-6 h-6 border-inherit text-inherit" />
              </div>
              <div className="flex-1 min-w-0 cursor-pointer">
                <h3 className="font-bold text-gray-100 truncate">{s.name}</h3>
                <p className="font-medium text-inherit">Rp {s.price?.toLocaleString('id-ID')}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto justify-end mt-2 md:mt-0 pt-3 md:pt-0 border-t border-gray-800 md:border-none">
              <div className="text-right px-3">
                <div className="flex items-center justify-end gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-gray-400" />
                </div>
                {renderStatus(s.nextDueDate)}
              </div>
              <button 
                onClick={() => openPayment(s)}
                className="bg-[#050608] border border-gray-700 hover:border-neon text-gray-300 hover:text-neon p-3 rounded-xl transition-colors shrink-0"
              >
                <CreditCard className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
