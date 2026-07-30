'use client';

import { useState, useEffect } from 'react';
import { Plus, StickyNote, X, Save, Trash2 } from 'lucide-react';
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
  const [currentNote, setCurrentNote] = useState({ id: '', title: '', content: '' });

  useEffect(() => {
    const q = query(collection(db, 'notes'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotes(notesData);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentNote.title.trim() && !currentNote.content.trim()) return;
    
    try {
      if (currentNote.id) {
        await updateDoc(doc(db, 'notes', currentNote.id), {
          title: currentNote.title,
          content: currentNote.content,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'notes'), {
          title: currentNote.title,
          content: currentNote.content,
          updatedAt: serverTimestamp()
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
        await deleteDoc(doc(db, 'notes', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (note = { id: '', title: '', content: '' }) => {
    setCurrentNote(note);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Catatan</h1>
        <button 
          onClick={() => openEditor()}
          className="bg-amber-500 text-white p-2 rounded-full shadow-lg hover:bg-amber-600 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl p-6 shadow-2xl flex flex-col h-[80vh]">
            <div className="flex justify-between items-center mb-4">
              <input 
                type="text"
                placeholder="Judul Catatan..."
                value={currentNote.title}
                onChange={e => setCurrentNote({...currentNote, title: e.target.value})}
                className="text-xl font-bold bg-transparent outline-none flex-1 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                {currentNote.id && (
                  <button onClick={() => handleDelete(currentNote.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <textarea
              placeholder="Mulai menulis..."
              value={currentNote.content}
              onChange={e => setCurrentNote({...currentNote, content: e.target.value})}
              className="flex-1 bg-transparent outline-none resize-none text-gray-700 dark:text-gray-300"
            />
            
            <div className="mt-4 flex justify-end">
              <button 
                onClick={handleSave}
                className="bg-amber-500 text-white px-6 py-2 rounded-xl font-medium hover:bg-amber-600 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {notes.length === 0 && <p className="text-gray-500 italic">Belum ada catatan.</p>}
        {notes.map((note) => (
          <div 
            key={note.id} 
            onClick={() => openEditor(note)}
            className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl shadow-sm border border-amber-100 dark:border-amber-900/50 cursor-pointer hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
              <StickyNote className="w-4 h-4 shrink-0" />
              <h3 className="font-semibold truncate">{note.title || 'Tanpa Judul'}</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 whitespace-pre-wrap">
              {note.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
