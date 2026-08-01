'use client';

import { useState, useEffect } from 'react';
import { Plus, ArrowUpRight, ArrowDownRight, X, Save, Trash2, CheckCircle2, Circle, Handshake } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, where } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentDebt, setCurrentDebt] = useState({ id: '', name: '', amount: '', description: '', type: 'payable', isPaid: false });

  useEffect(() => {
    const q = query(collection(db, 'debts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDebts(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentDebt.name.trim() || !currentDebt.amount) return;
    const amountNum = parseFloat(currentDebt.amount);
    
    try {
      if (currentDebt.id) {
        await updateDoc(doc(db, 'debts', currentDebt.id), {
          name: currentDebt.name,
          amount: amountNum,
          description: currentDebt.description,
          type: currentDebt.type,
          isPaid: currentDebt.isPaid
        });

        // Update the linked initial finance transaction
        const qTx = query(collection(db, 'finance'), where('linkedDebtId', '==', currentDebt.id), where('isDebtRepayment', '==', false));
        const snap = await getDocs(qTx);
        snap.forEach(async (d) => {
          await updateDoc(doc(db, 'finance', d.id), {
            title: currentDebt.type === 'payable' ? `Hutang dari ${currentDebt.name}` : `Piutang ke ${currentDebt.name}`,
            amount: amountNum,
            type: currentDebt.type === 'payable' ? 'income' : 'expense'
          });
        });

      } else {
        const docRef = await addDoc(collection(db, 'debts'), {
          name: currentDebt.name,
          amount: amountNum,
          description: currentDebt.description,
          type: currentDebt.type,
          isPaid: false,
          createdAt: serverTimestamp()
        });

        // Create linked finance transaction for the new debt
        await addDoc(collection(db, 'finance'), {
          title: currentDebt.type === 'payable' ? `Hutang dari ${currentDebt.name}` : `Piutang ke ${currentDebt.name}`,
          amount: amountNum,
          type: currentDebt.type === 'payable' ? 'income' : 'expense',
          createdAt: serverTimestamp(),
          linkedDebtId: docRef.id,
          isDebtRepayment: false
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
        await deleteDoc(doc(db, 'debts', id));
        
        // Delete all linked finance transactions (initial and repayment)
        const qTx = query(collection(db, 'finance'), where('linkedDebtId', '==', id));
        const snap = await getDocs(qTx);
        snap.forEach(async (d) => {
          await deleteDoc(doc(db, 'finance', d.id));
        });
        
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const toggleStatus = async (debt: any) => {
    try {
      const newStatus = !debt.isPaid;
      await updateDoc(doc(db, 'debts', debt.id), {
        isPaid: newStatus
      });

      if (newStatus) {
        // Just marked as paid, create a repayment transaction
        await addDoc(collection(db, 'finance'), {
          title: debt.type === 'payable' ? `Bayar Hutang ke ${debt.name}` : `Pelunasan Piutang dari ${debt.name}`,
          amount: debt.amount,
          type: debt.type === 'payable' ? 'expense' : 'income',
          createdAt: serverTimestamp(),
          linkedDebtId: debt.id,
          isDebtRepayment: true
        });
      } else {
        // Marked as unpaid, delete the repayment transaction
        const qTx = query(collection(db, 'finance'), where('linkedDebtId', '==', debt.id), where('isDebtRepayment', '==', true));
        const snap = await getDocs(qTx);
        snap.forEach(async (d) => {
          await deleteDoc(doc(db, 'finance', d.id));
        });
      }
    } catch (error: any) {
      alert('Gagal mengubah status: ' + error.message);
    }
  };

  const openEditor = (d = { id: '', name: '', amount: '', description: '', type: 'payable', isPaid: false }) => {
    setCurrentDebt(d);
    setIsEditing(true);
  };

  // Calculate totals for UNPAID debts
  const totalPayable = debts.filter(d => d.type === 'payable' && !d.isPaid).reduce((acc, curr) => acc + curr.amount, 0);
  const totalReceivable = debts.filter(d => d.type === 'receivable' && !d.isPaid).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Keuangan</p>
          <h1 className="text-2xl font-bold text-gray-100">Hutang & Piutang</h1>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#050608] border border-gray-800 p-5 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Hutang Saya<br/>(Belum Lunas)</p>
          </div>
          <h2 className="text-xl font-bold text-gray-100">Rp {totalPayable.toLocaleString('id-ID')}</h2>
        </div>
        <div className="bg-[#050608] border border-gray-800 p-5 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-neon/20 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 text-neon" />
            </div>
            <p className="text-xs text-gray-400 font-medium">Uang Saya<br/>(Dipinjam Orang)</p>
          </div>
          <h2 className="text-xl font-bold text-gray-100">Rp {totalReceivable.toLocaleString('id-ID')}</h2>
        </div>
      </div>
      
      {/* Huge CTA */}
      <button 
        onClick={() => openEditor()}
        className="w-full bg-neon text-[#0B0E14] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00c968] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.3)] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Catat Hutang / Piutang
      </button>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentDebt.id ? 'Edit Catatan' : 'Buat Catatan'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex bg-[#050608] p-1 rounded-xl">
                <button 
                  onClick={() => setCurrentDebt({...currentDebt, type: 'payable'})}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", currentDebt.type === 'payable' ? "bg-darkcard border border-gray-800 text-red-500" : "text-gray-500 hover:text-gray-400")}
                >
                  Saya Berhutang
                </button>
                <button 
                  onClick={() => setCurrentDebt({...currentDebt, type: 'receivable'})}
                  className={cn("flex-1 py-2 text-sm font-medium rounded-lg transition-colors", currentDebt.type === 'receivable' ? "bg-darkcard border border-gray-800 text-neon" : "text-gray-500 hover:text-gray-400")}
                >
                  Uang Dipinjam
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nama Orang / Pihak</label>
                <input 
                  type="text"
                  value={currentDebt.name}
                  onChange={e => setCurrentDebt({...currentDebt, name: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Budi"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Keterangan (Opsional)</label>
                <input 
                  type="text"
                  value={currentDebt.description}
                  onChange={e => setCurrentDebt({...currentDebt, description: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Patungan makan siang"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nominal (Rp)</label>
                <input 
                  type="number"
                  value={currentDebt.amount}
                  onChange={e => setCurrentDebt({...currentDebt, amount: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="50000"
                />
              </div>
              
              {currentDebt.id && (
                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={() => setCurrentDebt({...currentDebt, isPaid: !currentDebt.isPaid})}
                    className="flex items-center gap-2 text-sm font-medium text-gray-300"
                  >
                    {currentDebt.isPaid ? <CheckCircle2 className="w-5 h-5 text-neon" /> : <Circle className="w-5 h-5 text-gray-500" />}
                    Tandai Lunas
                  </button>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentDebt.id ? (
                <button onClick={() => handleDelete(currentDebt.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
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
        <h3 className="font-bold text-gray-200 mb-4">Daftar Catatan</h3>
        
        <div className="space-y-3">
          {debts.length === 0 && (
            <div className="text-center py-8 border border-dashed border-gray-800 rounded-2xl">
              <p className="text-gray-500 text-sm">Belum ada catatan hutang/piutang.</p>
            </div>
          )}
          {debts.map((d) => (
            <div 
              key={d.id} 
              className={cn(
                "bg-darkcard border p-4 rounded-2xl flex justify-between items-center transition-colors",
                d.isPaid ? "border-gray-800 opacity-60" : (d.type === 'payable' ? "border-red-500/30" : "border-neon/30")
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleStatus(d); }}
                  className="shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {d.isPaid ? <CheckCircle2 className="w-6 h-6 text-neon" /> : <Circle className="w-6 h-6" />}
                </button>
                
                <div 
                  className="flex-1 cursor-pointer min-w-0"
                  onClick={() => openEditor(d)}
                >
                  <p className={cn("font-semibold truncate", d.isPaid ? "text-gray-400 line-through" : "text-gray-200")}>
                    {d.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider",
                      d.type === 'payable' ? "bg-red-500/10 text-red-500" : "bg-neon/10 text-neon"
                    )}>
                      {d.type === 'payable' ? 'Hutang' : 'Piutang'}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {d.description || (d.createdAt?.toDate ? format(d.createdAt.toDate(), 'dd MMM', { locale: localeId }) : '')}
                    </span>
                  </div>
                </div>
              </div>
              
              <div 
                className="shrink-0 ml-3 cursor-pointer"
                onClick={() => openEditor(d)}
              >
                <p className={cn(
                  "font-bold text-right",
                  d.isPaid ? "text-gray-500" : (d.type === 'payable' ? "text-red-500" : "text-neon")
                )}>
                  Rp {d.amount.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
