'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, Edit3, Lightbulb, Users, User, ArrowRight } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentNote, setCurrentNote] = useState({ id: '', text: '', category: 'Ideation' });

  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentNote.text.trim()) return;
    try {
      if (currentNote.id) {
        await updateDoc(doc(db, 'notes', currentNote.id), {
          text: currentNote.text,
          category: currentNote.category
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          text: currentNote.text,
          category: currentNote.category,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (confirm('Hapus catatan ini?')) {
      try {
        await deleteDoc(doc(db, 'notes', noteId));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (note = { id: '', text: '', category: 'Ideation' }) => {
    setCurrentNote({ ...note, category: note.category || 'Ideation' });
    setIsEditing(true);
  };

  const categories = [
    { label: 'Ideation', icon: Lightbulb, color: 'text-accent-orange', bg: 'bg-accent-orange', border: 'border-orange-500', bgLight: 'bg-accent-orange/10' },
    { label: 'Meeting', icon: Users, color: 'text-accent-blue', bg: 'bg-accent-blue', border: 'border-blue-500', bgLight: 'bg-accent-blue/10' },
    { label: 'Personal', icon: User, color: 'text-neon', bg: 'bg-neon', border: 'border-green-500', bgLight: 'bg-neon/10' }
  ];

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-accent-orange font-medium text-sm tracking-widest uppercase mb-1">Knowledge Base</p>
          <h1 className="text-2xl font-bold text-gray-100">Catatan Ide</h1>
        </div>
        <button 
          onClick={() => openEditor()}
          className="bg-accent-orange text-[#0B0E14] p-3 rounded-xl shadow-lg hover:bg-orange-500 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5 font-bold" />
        </button>
      </header>

      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentNote.id ? 'Edit Catatan' : 'Tulis Ide Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-400">Kategori</label>
                <div className="grid grid-cols-3 gap-2">
                  {categories.map((c) => {
                    const isSelected = currentNote.category === c.label;
                    return (
                      <button
                        key={c.label}
                        onClick={() => setCurrentNote({...currentNote, category: c.label})}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-xs font-medium",
                          isSelected ? `${c.border} ${c.bgLight} ${c.color}` : "border-gray-800 bg-[#050608] text-gray-500 hover:border-gray-700 hover:text-gray-300"
                        )}
                      >
                        <c.icon className="w-5 h-5" />
                        {c.label}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Isi Catatan</label>
                <textarea 
                  value={currentNote.text}
                  onChange={e => setCurrentNote({...currentNote, text: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-orange transition-colors min-h-[150px] resize-none"
                  placeholder="Ketik ide cemerlangmu di sini..."
                  autoFocus
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentNote.id ? (
                <button onClick={() => handleDelete(currentNote.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-accent-orange text-[#0B0E14] px-6 py-3 rounded-xl font-bold hover:bg-orange-500 flex items-center gap-2 transition-colors active:scale-95"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Masonry-like Grid for Notes */}
      <div className="grid grid-cols-2 gap-4">
        {notes.length === 0 && (
          <div className="col-span-2 text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-500">Belum ada catatan ide.</p>
          </div>
        )}
        {notes.map((note) => {
          const cat = categories.find(c => c.label === (note.category || 'Ideation')) || categories[0];
          return (
            <div 
              key={note.id} 
              onClick={() => openEditor(note)}
              className="bg-darkcard border border-gray-800 p-4 rounded-2xl cursor-pointer hover:border-gray-700 transition-colors group relative overflow-hidden flex flex-col active:scale-[0.98]"
            >
              <div className={cn("absolute top-0 left-0 w-1 h-full", cat.bg)} />
              
              <div className="flex justify-between items-start mb-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider", cat.color)}>
                  {cat.label}
                </span>
                <Edit3 className="w-3 h-3 text-gray-600 group-hover:text-gray-400 transition-colors" />
              </div>
              
              <p className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap flex-1">
                {note.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
