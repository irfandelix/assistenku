'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, ExternalLink, MapPin, X, Save, Trash2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState({ id: '', title: '', client: '', link: '', isPaid: false });

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProjects(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentProject.title.trim()) return;
    
    if (currentProject.id) {
      await updateDoc(doc(db, 'projects', currentProject.id), {
        title: currentProject.title,
        client: currentProject.client,
        link: currentProject.link,
        isPaid: currentProject.isPaid
      });
    } else {
      await addDoc(collection(db, 'projects'), {
        title: currentProject.title,
        client: currentProject.client,
        link: currentProject.link,
        isPaid: currentProject.isPaid,
        createdAt: serverTimestamp()
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus proyek ini?')) {
      await deleteDoc(doc(db, 'projects', id));
      setIsEditing(false);
    }
  };

  const toggleStatus = async (project: any) => {
    await updateDoc(doc(db, 'projects', project.id), {
      isPaid: !project.isPaid
    });
  };

  const openEditor = (project = { id: '', title: '', client: '', link: '', isPaid: false }) => {
    setCurrentProject(project);
    setIsEditing(true);
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Daftar Proyek</h1>
        <button 
          onClick={() => openEditor()}
          className="bg-emerald-600 text-white p-2 rounded-full shadow-lg hover:bg-emerald-700 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">{currentProject.id ? 'Edit Proyek' : 'Proyek Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full dark:hover:bg-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Proyek</label>
                <input 
                  type="text"
                  value={currentProject.title}
                  onChange={e => setCurrentProject({...currentProject, title: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500"
                  placeholder="Misal: Peta Topografi Desa X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Klien / Instansi</label>
                <input 
                  type="text"
                  value={currentProject.client}
                  onChange={e => setCurrentProject({...currentProject, client: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500"
                  placeholder="Misal: PT. Maju Jaya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Link Google Drive</label>
                <input 
                  type="url"
                  value={currentProject.link}
                  onChange={e => setCurrentProject({...currentProject, link: e.target.value})}
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 outline-none focus:border-emerald-500"
                  placeholder="https://drive.google.com/..."
                />
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isPaid"
                  checked={currentProject.isPaid}
                  onChange={e => setCurrentProject({...currentProject, isPaid: e.target.checked})}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <label htmlFor="isPaid" className="text-sm font-medium">Sudah Dibayar (Lunas)</label>
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentProject.id ? (
                <button onClick={() => handleDelete(currentProject.id)} className="text-red-500 font-medium hover:text-red-700 flex items-center gap-1">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-emerald-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {projects.length === 0 && <p className="text-gray-500 italic">Belum ada proyek.</p>}
        {projects.map((project) => (
          <div key={project.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="flex gap-3 cursor-pointer group flex-1"
                  onClick={() => openEditor(project)}
                >
                  <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400 mt-1 transition-colors group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold group-hover:text-emerald-600 transition-colors line-clamp-2">{project.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1">{project.client}</p>
                  </div>
                </div>
                <button 
                  onClick={() => toggleStatus(project)}
                  className={cn(
                  "px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shrink-0 transition-colors active:scale-95 ml-2",
                  project.isPaid 
                    ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400" 
                    : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400"
                )}>
                  {project.isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                  {project.isPaid ? 'Lunas' : 'Belum'}
                </button>
              </div>
            </div>
            
            <a 
              href={project.link || '#'} 
              target={project.link ? "_blank" : "_self"} 
              rel="noreferrer"
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-colors mt-2",
                project.link 
                  ? "bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800/50 dark:text-gray-600"
              )}
            >
              <ExternalLink className="w-4 h-4" />
              {project.link ? 'Buka Link Drive' : 'Tidak ada link'}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

