'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, Smile, Frown, Meh, Angry, ChevronLeft, Heart } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, limit } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const MOODS = [
  { id: 'happy', label: 'Senang', emoji: '😄', icon: Smile, color: 'text-neon', bg: 'bg-neon/10 border-neon/30' },
  { id: 'neutral', label: 'Biasa', emoji: '😐', icon: Meh, color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/30' },
  { id: 'sad', label: 'Sedih', emoji: '😔', icon: Frown, color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/30' },
  { id: 'stressed', label: 'Stres', emoji: '😫', icon: Angry, color: 'text-orange-500', bg: 'bg-orange-500/10 border-orange-500/30' },
];

export default function MoodPage() {
  const [moods, setMoods] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEntry, setCurrentEntry] = useState({ id: '', moodId: 'happy', title: '', note: '' });

  useEffect(() => {
    const q = query(collection(db, 'moods'), orderBy('createdAt', 'desc'), limit(30));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMoods(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    try {
      if (currentEntry.id) {
        await updateDoc(doc(db, 'moods', currentEntry.id), {
          moodId: currentEntry.moodId,
          title: currentEntry.title || '',
          note: currentEntry.note
        });
      } else {
        await addDoc(collection(db, 'moods'), {
          moodId: currentEntry.moodId,
          title: currentEntry.title || '',
          note: currentEntry.note,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus jurnal mood ini?')) {
      try {
        await deleteDoc(doc(db, 'moods', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (e = { id: '', moodId: 'happy', title: '', note: '' }) => {
    setCurrentEntry(e);
    setIsEditing(true);
  };

  const getMoodConfig = (id: string) => MOODS.find(m => m.id === id) || MOODS[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/more" className="p-2 bg-darkcard border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Mental Health</p>
          <h1 className="text-2xl font-bold text-gray-100">Mood Tracker</h1>
        </div>
      </header>

      <button 
        onClick={() => openEditor()}
        className="w-full bg-darkcard border border-gray-800 text-gray-100 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:border-gray-700 transition-colors active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Catat Perasaan Hari Ini
      </button>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentEntry.id ? 'Edit Jurnal' : 'Jurnal Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3 text-gray-400">Bagaimana perasaan Anda?</label>
                <div className="grid grid-cols-4 gap-2">
                  {MOODS.map(m => {
                    const isSelected = currentEntry.moodId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => setCurrentEntry({...currentEntry, moodId: m.id})}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all",
                          isSelected ? `${m.bg} border ${m.color}` : "bg-[#050608] border-gray-800 text-gray-500 hover:border-gray-700 hover:bg-gray-800/50"
                        )}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Judul Alasan (Singkat)</label>
                <input 
                  type="text"
                  value={currentEntry.title || ''}
                  onChange={e => setCurrentEntry({...currentEntry, title: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors mb-4"
                  placeholder="Misal: Dikasih bonus bos!"
                  maxLength={50}
                />
                
                <label className="block text-sm font-medium mb-1 text-gray-400">Cerita Detail (Opsional)</label>
                <textarea 
                  value={currentEntry.note}
                  onChange={e => setCurrentEntry({...currentEntry, note: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors h-24 resize-none"
                  placeholder="Hari ini aku..."
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentEntry.id ? (
                <button onClick={() => handleDelete(currentEntry.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
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
      <div className="space-y-4">
        {moods.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <Heart className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada catatan mood.</p>
          </div>
        )}
        
        {moods.map((m) => {
          const config = getMoodConfig(m.moodId);
          const dateStr = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' }) : 'Baru saja';
          
          return (
            <div 
              key={m.id} 
              onClick={() => openEditor(m)}
              className={cn("bg-darkcard border p-4 rounded-2xl cursor-pointer flex gap-4 transition-all hover:border-gray-700", config.bg.split(' ')[1] /* Use border from config */)}
            >
              <div className={cn("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl", config.bg.split(' ')[0])}>
                {config.emoji}
              </div>
              <div className="flex-1 min-w-0 py-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={cn("font-bold text-sm uppercase tracking-wide", config.color)}>{config.label}</h3>
                  <span className="text-xs text-gray-500">{dateStr}</span>
                </div>
                {m.title && (
                  <h4 className="text-gray-100 font-medium text-base mb-1">{m.title}</h4>
                )}
                {m.note && (
                  <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed">{m.note}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
