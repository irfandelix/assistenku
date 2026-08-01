'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, Tv, ChevronLeft, Calendar } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function SubscriptionsPage() {
  const [subs, setSubs] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSub, setCurrentSub] = useState({ id: '', name: '', price: '', billingDay: '' });

  useEffect(() => {
    const q = query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubs(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentSub.name.trim() || !currentSub.price || !currentSub.billingDay) return;
    const priceNum = parseFloat(currentSub.price);
    let dayNum = parseInt(currentSub.billingDay);
    if (dayNum < 1) dayNum = 1;
    if (dayNum > 31) dayNum = 31;
    
    try {
      if (currentSub.id) {
        await updateDoc(doc(db, 'subscriptions', currentSub.id), {
          name: currentSub.name,
          price: priceNum,
          billingDay: dayNum
        });
      } else {
        await addDoc(collection(db, 'subscriptions'), {
          name: currentSub.name,
          price: priceNum,
          billingDay: dayNum,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
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

  const openEditor = (s = { id: '', name: '', price: '', billingDay: '' }) => {
    setCurrentSub(s);
    setIsEditing(true);
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

      {/* Huge CTA */}
      <button 
        onClick={() => openEditor()}
        className="w-full bg-neon text-[#0B0E14] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00c968] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.3)] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Catat Langganan Baru
      </button>

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
                <label className="block text-sm font-medium mb-1 text-gray-400">Tanggal Jatuh Tempo (1-31)</label>
                <input 
                  type="number"
                  min="1" max="31"
                  value={currentSub.billingDay}
                  onChange={e => setCurrentSub({...currentSub, billingDay: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="15"
                />
                <p className="text-xs text-gray-500 mt-1">Bot akan mengingatkan Anda H-1 sebelum tanggal ini.</p>
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
            onClick={() => openEditor(s)}
            className={cn(
              "p-4 rounded-2xl flex items-center gap-4 cursor-pointer hover:border-gray-700 transition-colors border bg-darkcard",
              getTheme(s.name)
            )}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-[#050608] border border-inherit">
              <Tv className="w-6 h-6 border-inherit text-inherit" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-100 truncate">{s.name}</h3>
              <p className="font-medium text-inherit">Rp {s.price.toLocaleString('id-ID')}</p>
            </div>
            <div className="shrink-0 text-right bg-[#050608] px-3 py-2 rounded-xl border border-gray-800">
              <div className="flex items-center gap-1 text-gray-400 justify-center">
                <Calendar className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Tgl</span>
              </div>
              <p className="text-lg font-black text-gray-200 leading-tight">{s.billingDay}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
