'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, ShoppingBag, ChevronLeft, Lock, Unlock, CheckCircle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { differenceInDays, differenceInHours, addDays, format } from 'date-fns';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function WishlistPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState({ id: '', itemName: '', price: '', reason: '', cooldownDays: 7 });

  useEffect(() => {
    const q = query(collection(db, 'wishlist'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentItem.itemName.trim() || !currentItem.price) return;
    const priceNum = parseFloat(currentItem.price);
    const cooldownNum = parseInt(currentItem.cooldownDays.toString()) || 7;
    
    try {
      if (currentItem.id) {
        await updateDoc(doc(db, 'wishlist', currentItem.id), {
          itemName: currentItem.itemName,
          price: priceNum,
          reason: currentItem.reason,
          cooldownDays: cooldownNum
        });
      } else {
        await addDoc(collection(db, 'wishlist'), {
          itemName: currentItem.itemName,
          price: priceNum,
          reason: currentItem.reason,
          cooldownDays: cooldownNum,
          status: 'pending', // pending, bought
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleBuy = async (item: any) => {
    if (confirm(`Saldo akan terpotong Rp ${item.price.toLocaleString('id-ID')} untuk membeli ${item.itemName}. Lanjutkan?`)) {
      try {
        // Mark as bought
        await updateDoc(doc(db, 'wishlist', item.id), { status: 'bought' });
        
        // Add to finance expense
        await addDoc(collection(db, 'finance'), {
          title: `Beli dari Wishlist: ${item.itemName}`,
          amount: item.price,
          type: 'expense',
          createdAt: serverTimestamp()
        });
      } catch (e: any) {
        alert('Gagal mengeksekusi pembelian: ' + e.message);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus barang ini dari Wishlist?')) {
      try {
        await deleteDoc(doc(db, 'wishlist', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (i = { id: '', itemName: '', price: '', reason: '', cooldownDays: 7 }) => {
    setCurrentItem(i);
    setIsEditing(true);
  };

  const getCooldownStatus = (createdAt: any, cooldownDays: number) => {
    if (!createdAt) return { isReady: false, daysLeft: cooldownDays, text: `Menunggu...` };
    const dateCreated = createdAt.toDate ? createdAt.toDate() : new Date();
    const unlockDate = addDays(dateCreated, cooldownDays);
    const now = new Date();
    
    const daysLeft = differenceInDays(unlockDate, now);
    const hoursLeft = differenceInHours(unlockDate, now);

    if (now >= unlockDate) {
      return { isReady: true, daysLeft: 0, text: 'Siap Dibeli!' };
    }
    
    if (daysLeft > 0) {
      return { isReady: false, daysLeft, text: `Tertahan ${daysLeft} Hari Lagi` };
    }
    
    return { isReady: false, daysLeft: 0, text: `Tertahan ${hoursLeft} Jam Lagi` };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/more" className="p-2 bg-darkcard border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Impulse Control</p>
          <h1 className="text-2xl font-bold text-gray-100">Wishlist</h1>
        </div>
      </header>

      <div className="bg-[#050608] border border-gray-800 p-4 rounded-2xl">
        <p className="text-sm text-gray-400">Barang yang dicatat di sini akan <strong>dikunci</strong> (cooldown) untuk mencegah Anda belanja impulsif. Jika setelah masa tunggu Anda masih ingin, silakan beli! 🛡️</p>
      </div>

      <button 
        onClick={() => openEditor()}
        className="w-full bg-neon text-[#0B0E14] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00c968] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.3)] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Catat Barang Impian
      </button>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentItem.id ? 'Edit Wishlist' : 'Tambah Wishlist'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nama Barang</label>
                <input 
                  type="text"
                  value={currentItem.itemName}
                  onChange={e => setCurrentItem({...currentItem, itemName: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Sepatu Lari"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Harga (Rp)</label>
                <input 
                  type="number"
                  value={currentItem.price}
                  onChange={e => setCurrentItem({...currentItem, price: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="850000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Kenapa butuh ini?</label>
                <input 
                  type="text"
                  value={currentItem.reason}
                  onChange={e => setCurrentItem({...currentItem, reason: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Buat lari pagi biar sehat"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Masa Tunggu (Hari)</label>
                <input 
                  type="number"
                  min="1" max="30"
                  value={currentItem.cooldownDays}
                  onChange={e => setCurrentItem({...currentItem, cooldownDays: parseInt(e.target.value) || 7})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                />
                <p className="text-xs text-gray-500 mt-1">Standarnya adalah 7 hari untuk menguji hasrat impulsif Anda.</p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentItem.id ? (
                <button onClick={() => handleDelete(currentItem.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
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
      <div className="grid gap-4">
        {items.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <ShoppingBag className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Tidak ada barang yang memicu hasrat belanja Anda saat ini.</p>
          </div>
        )}
        
        {items.map((item) => {
          const isBought = item.status === 'bought';
          const { isReady, text } = getCooldownStatus(item.createdAt, item.cooldownDays);
          
          return (
            <div key={item.id} className={cn("bg-darkcard border p-5 rounded-3xl relative overflow-hidden transition-all", isBought ? "border-gray-800 opacity-60" : (isReady ? "border-neon shadow-[0_0_15px_rgba(0,230,118,0.1)]" : "border-gray-800"))}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 cursor-pointer" onClick={() => !isBought && openEditor(item)}>
                  <h3 className={cn("font-bold text-lg", isBought ? "text-gray-400 line-through" : "text-gray-100")}>{item.itemName}</h3>
                  <p className={cn("font-medium", isBought ? "text-gray-500" : "text-gray-300")}>Rp {parseFloat(item.price).toLocaleString('id-ID')}</p>
                  {item.reason && (
                    <p className="text-sm text-gray-500 mt-2 bg-[#050608] p-2 rounded-lg italic">"{item.reason}"</p>
                  )}
                </div>
                {!isBought && (
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-gray-600 hover:text-red-500 rounded-full">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {!isBought ? (
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isReady ? <Unlock className="w-4 h-4 text-neon" /> : <Lock className="w-4 h-4 text-orange-500" />}
                    <span className={cn("text-xs font-bold uppercase tracking-wider", isReady ? "text-neon" : "text-orange-500")}>
                      {text}
                    </span>
                  </div>
                  
                  {isReady ? (
                    <button 
                      onClick={() => handleBuy(item)}
                      className="bg-neon text-[#0B0E14] px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 active:scale-95"
                    >
                      Beli Sekarang
                    </button>
                  ) : (
                    <button disabled className="bg-gray-800 text-gray-500 px-4 py-2 rounded-xl text-sm font-bold opacity-50 cursor-not-allowed">
                      Terkunci
                    </button>
                  )}
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-gray-800 flex items-center gap-2 text-gray-500">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Sudah Dibeli</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
