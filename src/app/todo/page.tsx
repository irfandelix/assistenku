'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Clock, Bell, X, Save, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function TodoPage() {
  const [todos, setTodos] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodo, setCurrentTodo] = useState({ id: '', title: '', time: '', done: false });
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
          done: currentTodo.done
        });
      } else {
        await addDoc(collection(db, 'todos'), {
          title: currentTodo.title,
          time: currentTodo.time || 'Kapan saja',
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

  const openEditor = (todo = { id: '', title: '', time: '', done: false }) => {
    setCurrentTodo(todo);
    setIsEditing(true);
  };

  const sendReminderToTelegram = async (todo: any) => {
    if (isSending) return;
    setIsSending(true);
    try {
      const message = `🔔 <b>Pengingat Tugas!</b>\n\n📝 <b>${todo.title}</b>\n⏰ Waktu: ${todo.time}\n\n<i>Jangan lupa diselesaikan ya!</i>`;
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

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">To-Do List</h1>
        <button 
          onClick={() => openEditor()}
          className="bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{currentTodo.id ? 'Edit Tugas' : 'Tugas Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Judul Tugas</label>
                <input 
                  type="text"
                  value={currentTodo.title}
                  onChange={e => setCurrentTodo({...currentTodo, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-indigo-500"
                  placeholder="Misal: Beli susu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Waktu / Keterangan</label>
                <input 
                  type="text"
                  value={currentTodo.time}
                  onChange={e => setCurrentTodo({...currentTodo, time: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-indigo-500"
                  placeholder="Misal: Hari ini, 10:00"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentTodo.id ? (
                <button onClick={() => handleDelete(currentTodo.id)} className="text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-indigo-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {todos.length === 0 && <p className="text-gray-500 italic">Hore! Tidak ada tugas yang menunggu.</p>}
        {todos.map((todo) => (
          <div 
            key={todo.id} 
            className={cn(
              "p-4 rounded-2xl shadow-sm border flex items-center gap-4 transition-all group",
              todo.done 
                ? "bg-gray-50 border-gray-100 dark:bg-gray-900/50 dark:border-gray-800 opacity-60" 
                : "bg-white border-gray-100 dark:bg-gray-900 dark:border-gray-800 hover:shadow-md"
            )}
          >
            <button 
              onClick={() => toggleDone(todo)}
              className={cn(
              "w-6 h-6 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors active:scale-90",
              todo.done ? "bg-green-500 border-green-500 text-white" : "border-gray-300 text-transparent hover:border-indigo-500"
            )}>
              <Check className="w-4 h-4" />
            </button>
            
            <div className="flex-1 cursor-pointer" onClick={() => openEditor(todo)}>
              <p className={cn("font-medium", todo.done && "line-through text-gray-500")}>
                {todo.title}
              </p>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>{todo.time}</span>
              </div>
            </div>
            
            {!todo.done && (
              <button 
                onClick={() => sendReminderToTelegram(todo)}
                disabled={isSending}
                title="Kirim pengingat ke Telegram sekarang"
                className="text-gray-400 hover:text-indigo-600 p-2 active:scale-90 transition-transform disabled:opacity-50"
              >
                <Bell className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

