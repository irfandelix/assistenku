'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Clock, Bell, X, Save, Trash2, AlertTriangle, User, Wallet } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodo, setCurrentTodo] = useState({ id: '', title: '', time: '', priority: 'High Priority', done: false });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'todos'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTodos(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentTodo.title.trim()) return;
    try {
      if (currentTodo.id) {
        await updateDoc(doc(db, 'todos', currentTodo.id), {
          title: currentTodo.title,
          time: currentTodo.time,
          priority: currentTodo.priority,
          done: currentTodo.done
        });
      } else {
        await addDoc(collection(db, 'todos'), {
          title: currentTodo.title,
          time: currentTodo.time || 'Kapan saja',
          priority: currentTodo.priority,
          done: false,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (todoId: string) => {
    if (confirm('Hapus tugas ini?')) {
      try {
        await deleteDoc(doc(db, 'todos', todoId));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const toggleDone = async (todo: any) => {
    await updateDoc(doc(db, 'todos', todo.id), {
      done: !todo.done
    });
  };

  const openEditor = (todo = { id: '', title: '', time: '', priority: 'High Priority', done: false }) => {
    setCurrentTodo({ ...todo, priority: todo.priority || 'High Priority' });
    setIsEditing(true);
  };

  const sendReminderToTelegram = async (todo: any) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const message = `🔔 <b>Pengingat Tugas!</b>\n\n📝 <b>${todo.title}</b>\n⏰ Waktu: ${todo.time}\n📌 Prioritas: ${todo.priority || 'Normal'}\n\n<i>Jangan lupa diselesaikan ya!</i>`;
      await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      alert('Pengingat berhasil dikirim ke Telegram!');
    } catch (e) {
      alert('Gagal mengirim pengingat.');
    } finally {
      setIsSending(false);
    }
  };

  const priorities = [
    { label: 'High Priority', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500' },
    { label: 'Personal', icon: User, color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-blue-500' },
    { label: 'Finance', icon: Wallet, color: 'text-neon', bg: 'bg-neon/10', border: 'border-green-500' }
  ];

  const getPriorityConfig = (label: string) => {
    return priorities.find(p => p.label === label) || priorities[0];
  };

  // Grouping todos
  const groupedTodos = priorities.map(p => ({
    ...p,
    items: todos.filter(t => (t.priority === p.label || (!t.priority && p.label === 'High Priority')))
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-neon font-medium text-sm tracking-widest uppercase mb-1">Eksekusi Harian</p>
          <h1 className="text-2xl font-bold text-gray-100">To-Do List</h1>
        </div>
        <button 
          onClick={() => openEditor()}
          className="bg-neon text-[#0B0E14] p-3 rounded-xl shadow-lg hover:bg-[#00c968] transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 font-bold" />
        </button>
      </header>

      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentTodo.id ? 'Edit Tugas' : 'Tugas Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Judul Tugas</label>
                <input 
                  type="text"
                  value={currentTodo.title}
                  onChange={e => setCurrentTodo({...currentTodo, title: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                  placeholder="Misal: Meeting Klien"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Kategori Prioritas</label>
                <div className="grid grid-cols-3 gap-2">
                  {priorities.map((p) => {
                    const isSelected = currentTodo.priority === p.label;
                    return (
                      <button
                        key={p.label}
                        onClick={() => setCurrentTodo({...currentTodo, priority: p.label})}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-xs font-medium",
                          isSelected ? `${p.border} ${p.bg} ${p.color}` : "border-gray-800 bg-[#050608] text-gray-500 hover:border-gray-700 hover:text-gray-300"
                        )}
                      >
                        <p.icon className="w-5 h-5" />
                        {p.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Tenggat Waktu (Deadline)</label>
                <input 
                  type="datetime-local"
                  value={currentTodo.time}
                  onChange={e => setCurrentTodo({...currentTodo, time: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors [color-scheme:dark]"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentTodo.id ? (
                <button onClick={() => handleDelete(currentTodo.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
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

      <div className="space-y-8">
        {todos.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-500">Hore! Tidak ada tugas yang menunggu.</p>
          </div>
        )}
        
        {groupedTodos.map((group) => (
          <div key={group.label} className="space-y-3">
            <h3 className="flex items-center gap-2 font-bold text-gray-300 text-sm tracking-wide uppercase">
              <group.icon className={cn("w-4 h-4", group.color)} /> {group.label}
            </h3>
            <div className="space-y-2">
              {group.items.map((todo) => (
                <div 
                  key={todo.id} 
                  className={cn(
                    "p-4 rounded-2xl border flex items-center gap-4 transition-all group/item",
                    todo.done 
                      ? "bg-darkcard/50 border-gray-800/50 opacity-50" 
                      : "bg-darkcard border-gray-800 hover:border-gray-700"
                  )}
                >
                  <button 
                    onClick={() => toggleDone(todo)}
                    className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-all active:scale-90",
                    todo.done ? "bg-neon border-neon text-[#0B0E14]" : "border-gray-600 text-transparent hover:border-neon"
                  )}>
                    <Check className="w-4 h-4" />
                  </button>
                  
                  <div className="flex-1 cursor-pointer" onClick={() => openEditor(todo)}>
                    <p className={cn("font-semibold text-gray-200 transition-colors", todo.done && "line-through text-gray-500")}>
                      {todo.title}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {todo.time 
                          ? (todo.time.includes('T') ? format(parseISO(todo.time), 'dd MMM yyyy, HH:mm', { locale: localeId }) : todo.time)
                          : 'Tidak ada tenggat waktu'}
                      </span>
                    </div>
                  </div>
                  
                  {!todo.done && (
                    <button 
                      onClick={() => sendReminderToTelegram(todo)}
                      disabled={isSending}
                      title="Kirim pengingat ke Telegram"
                      className="text-gray-500 hover:text-neon p-2 active:scale-90 transition-all disabled:opacity-50 bg-gray-800/50 rounded-xl opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                    >
                      <Bell className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
