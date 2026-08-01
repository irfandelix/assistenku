'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, Target, ChevronLeft, TrendingUp } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingFund, setIsAddingFund] = useState(false);
  const [currentGoal, setCurrentGoal] = useState({ id: '', title: '', targetAmount: '', currentAmount: '' });
  const [fundAmount, setFundAmount] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'goals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setGoals(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentGoal.title.trim() || !currentGoal.targetAmount) return;
    const targetNum = parseFloat(currentGoal.targetAmount);
    const currentNum = currentGoal.currentAmount ? parseFloat(currentGoal.currentAmount) : 0;
    
    try {
      if (currentGoal.id) {
        await updateDoc(doc(db, 'goals', currentGoal.id), {
          title: currentGoal.title,
          targetAmount: targetNum,
          currentAmount: currentNum
        });
      } else {
        await addDoc(collection(db, 'goals'), {
          title: currentGoal.title,
          targetAmount: targetNum,
          currentAmount: currentNum,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleAddFund = async () => {
    if (!fundAmount || !currentGoal.id) return;
    const addNum = parseFloat(fundAmount);
    if (addNum <= 0) return;

    try {
      const newTotal = (parseFloat(currentGoal.currentAmount) || 0) + addNum;
      await updateDoc(doc(db, 'goals', currentGoal.id), {
        currentAmount: newTotal
      });
      setIsAddingFund(false);
      setFundAmount('');
    } catch (error: any) {
      alert('Gagal menambah tabungan: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus target tabungan ini?')) {
      try {
        await deleteDoc(doc(db, 'goals', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (g = { id: '', title: '', targetAmount: '', currentAmount: '' }) => {
    setCurrentGoal(g);
    setIsEditing(true);
  };

  const openFundModal = (g: any) => {
    setCurrentGoal(g);
    setFundAmount('');
    setIsAddingFund(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/more" className="p-2 bg-darkcard border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Financial Goals</p>
          <h1 className="text-2xl font-bold text-gray-100">Target Tabungan</h1>
        </div>
      </header>

      {/* Huge CTA */}
      <button 
        onClick={() => openEditor()}
        className="w-full bg-neon text-[#0B0E14] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00c968] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.3)] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Buat Target Baru
      </button>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentGoal.id ? 'Edit Target' : 'Target Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Judul / Impian</label>
                <input 
                  type="text"
                  value={currentGoal.title}
                  onChange={e => setCurrentGoal({...currentGoal, title: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Beli MacBook Pro"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Target Terkumpul (Rp)</label>
                <input 
                  type="number"
                  value={currentGoal.targetAmount}
                  onChange={e => setCurrentGoal({...currentGoal, targetAmount: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="20000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Tabungan Awal (Opsional)</label>
                <input 
                  type="number"
                  value={currentGoal.currentAmount}
                  onChange={e => setCurrentGoal({...currentGoal, currentAmount: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentGoal.id ? (
                <button onClick={() => handleDelete(currentGoal.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
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

      {/* Add Fund Modal */}
      {isAddingFund && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">Tambah Saldo</h2>
              <button onClick={() => setIsAddingFund(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">Target: <strong className="text-gray-200">{currentGoal.title}</strong></p>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nominal Ditabung (Rp)</label>
                <input 
                  type="number"
                  value={fundAmount}
                  onChange={e => setFundAmount(e.target.value)}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="50000"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleAddFund}
                className="bg-neon text-[#0B0E14] px-6 py-3 rounded-xl font-bold hover:bg-[#00c968] flex items-center gap-2 transition-colors active:scale-95 w-full justify-center"
              >
                <TrendingUp className="w-4 h-4" /> Masukkan ke Tabungan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <Target className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada target tabungan impian.</p>
          </div>
        )}
        {goals.map((g) => {
          const targetNum = parseFloat(g.targetAmount) || 1;
          const currentNum = parseFloat(g.currentAmount) || 0;
          const percentage = Math.min(100, Math.round((currentNum / targetNum) * 100));
          const isComplete = percentage >= 100;

          return (
            <div 
              key={g.id} 
              className={cn(
                "bg-darkcard border p-5 rounded-3xl transition-all relative overflow-hidden",
                isComplete ? "border-neon/50 shadow-[0_0_15px_rgba(0,230,118,0.1)]" : "border-gray-800"
              )}
            >
              {isComplete && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-neon/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
              )}
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex-1 cursor-pointer" onClick={() => openEditor(g)}>
                  <h3 className={cn("font-bold text-lg", isComplete ? "text-neon" : "text-gray-200")}>
                    {g.title} {isComplete && '🎉'}
                  </h3>
                  <p className="text-gray-500 text-sm mt-1">
                    <span className="text-gray-300 font-medium">Rp {currentNum.toLocaleString('id-ID')}</span> dari Rp {targetNum.toLocaleString('id-ID')}
                  </p>
                </div>
                {!isComplete && (
                  <button 
                    onClick={() => openFundModal(g)}
                    className="shrink-0 ml-3 bg-neon/10 text-neon hover:bg-neon/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Tabung
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              <div className="relative h-3 bg-[#050608] rounded-full overflow-hidden border border-gray-800">
                <div 
                  className={cn("absolute top-0 left-0 h-full rounded-full transition-all duration-1000", isComplete ? "bg-neon" : "bg-gradient-to-r from-accent-blue to-neon")}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-end mt-2">
                <span className={cn("text-xs font-bold", isComplete ? "text-neon" : "text-gray-400")}>
                  {percentage}% Terkumpul
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
