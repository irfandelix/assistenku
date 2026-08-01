'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, Activity, ChevronLeft, Flame, Check } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import { format, subDays, isSameDay } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentHabit, setCurrentHabit] = useState({ id: '', title: '', icon: '💧' });

  useEffect(() => {
    const q = query(collection(db, 'habits'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHabits(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentHabit.title.trim()) return;
    
    try {
      if (currentHabit.id) {
        await updateDoc(doc(db, 'habits', currentHabit.id), {
          title: currentHabit.title,
          icon: currentHabit.icon || '📌'
        });
      } else {
        await addDoc(collection(db, 'habits'), {
          title: currentHabit.title,
          icon: currentHabit.icon || '📌',
          logs: {},
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus kebiasaan ini? Semua riwayat akan hilang.')) {
      try {
        await deleteDoc(doc(db, 'habits', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const toggleLog = async (habit: any, dateStr: string) => {
    try {
      const currentLogs = { ...(habit.logs || {}) };
      if (currentLogs[dateStr]) {
        delete currentLogs[dateStr]; // Uncheck
      } else {
        currentLogs[dateStr] = true; // Check
      }
      await updateDoc(doc(db, 'habits', habit.id), {
        logs: currentLogs
      });
    } catch (e: any) {
      alert('Gagal mengupdate habit: ' + e.message);
    }
  };

  const openEditor = (h = { id: '', title: '', icon: '💧' }) => {
    setCurrentHabit(h);
    setIsEditing(true);
  };

  // Helper to generate last 7 days
  const last7Days = Array.from({length: 7}).map((_, i) => {
    const d = subDays(new Date(), 6 - i);
    return {
      date: d,
      dateStr: format(d, 'yyyy-MM-dd'),
      dayName: format(d, 'EE', {locale: localeId}),
      isToday: isSameDay(d, new Date())
    };
  });

  const getStreak = (logs: any) => {
    let streak = 0;
    let current = new Date();
    while (true) {
      const dateStr = format(current, 'yyyy-MM-dd');
      if (logs[dateStr]) {
        streak++;
        current = subDays(current, 1);
      } else {
        // If today is missing, check yesterday before breaking the streak completely
        if (streak === 0 && isSameDay(current, new Date())) {
          current = subDays(current, 1);
        } else {
          break;
        }
      }
    }
    return streak;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex items-center gap-4">
        <Link href="/more" className="p-2 bg-darkcard border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Daily Routine</p>
          <h1 className="text-2xl font-bold text-gray-100">Kebiasaan</h1>
        </div>
      </header>

      {/* Huge CTA */}
      <button 
        onClick={() => openEditor()}
        className="w-full bg-neon text-[#0B0E14] p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#00c968] transition-colors shadow-[0_0_20px_rgba(0,230,118,0.3)] active:scale-[0.98]"
      >
        <Plus className="w-5 h-5" /> Tambah Kebiasaan Baru
      </button>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentHabit.id ? 'Edit Kebiasaan' : 'Kebiasaan Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Judul Kebiasaan</label>
                <input 
                  type="text"
                  value={currentHabit.title}
                  onChange={e => setCurrentHabit({...currentHabit, title: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Minum Air 2L"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Emoji / Ikon</label>
                <input 
                  type="text"
                  value={currentHabit.icon}
                  onChange={e => setCurrentHabit({...currentHabit, icon: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="💧"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentHabit.id ? (
                <button onClick={() => handleDelete(currentHabit.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
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

      {/* Habits List */}
      <div className="space-y-4">
        {habits.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <Activity className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada kebiasaan yang dicatat.</p>
          </div>
        )}
        
        {habits.map((habit) => {
          const streak = getStreak(habit.logs || {});
          
          return (
            <div key={habit.id} className="bg-darkcard border border-gray-800 p-5 rounded-3xl">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => openEditor(habit)}>
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl">
                    {habit.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-200 text-lg">{habit.title}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Flame className={cn("w-4 h-4", streak > 0 ? "text-orange-500" : "text-gray-600")} />
                      <span className={cn("text-sm font-bold", streak > 0 ? "text-orange-500" : "text-gray-500")}>
                        {streak} Hari Beruntun
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 7-Days Calendar */}
              <div className="flex justify-between items-center gap-2 mt-6">
                {last7Days.map((day) => {
                  const isDone = (habit.logs || {})[day.dateStr];
                  return (
                    <div key={day.dateStr} className="flex flex-col items-center gap-2 flex-1">
                      <span className={cn("text-[10px] font-bold uppercase tracking-wider", day.isToday ? "text-neon" : "text-gray-500")}>
                        {day.dayName}
                      </span>
                      <button
                        onClick={() => toggleLog(habit, day.dateStr)}
                        className={cn(
                          "w-full aspect-square max-w-[40px] rounded-xl flex items-center justify-center transition-all active:scale-90",
                          isDone 
                            ? "bg-neon text-[#0B0E14] shadow-[0_0_10px_rgba(0,230,118,0.4)]" 
                            : "bg-[#050608] border border-gray-800 text-gray-700 hover:border-gray-600"
                        )}
                      >
                        {isDone ? <Check className="w-5 h-5" /> : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
