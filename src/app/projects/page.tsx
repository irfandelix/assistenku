'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, ExternalLink, MapPin, X, Save, Trash2, Copy, AlertCircle } from 'lucide-react';
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
  const [currentProject, setCurrentProject] = useState({ id: '', title: '', client: '', link: '', isPaid: false, amountPaid: '', financeSynced: false });

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
    
    let isNowSynced = currentProject.financeSynced;
    
    try {
      if (currentProject.isPaid && !currentProject.financeSynced && currentProject.amountPaid) {
        const amountNum = parseFloat(currentProject.amountPaid);
        if (!isNaN(amountNum) && amountNum > 0) {
          await addDoc(collection(db, 'finance'), {
            title: `Proyek: ${currentProject.title}`,
            amount: amountNum,
            type: 'income',
            createdAt: serverTimestamp()
          });
          isNowSynced = true;
        }
      }

      if (currentProject.id) {
        await updateDoc(doc(db, 'projects', currentProject.id), {
          title: currentProject.title,
          client: currentProject.client,
          link: currentProject.link,
          isPaid: currentProject.isPaid,
          amountPaid: currentProject.amountPaid,
          financeSynced: isNowSynced
        });
      } else {
        await addDoc(collection(db, 'projects'), {
          title: currentProject.title,
          client: currentProject.client,
          link: currentProject.link,
          isPaid: currentProject.isPaid,
          amountPaid: currentProject.amountPaid,
          financeSynced: isNowSynced,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus proyek ini?')) {
      try {
        await deleteDoc(doc(db, 'projects', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const toggleStatus = async (project: any) => {
    let newIsPaid = !project.isPaid;
    let newAmountPaid = project.amountPaid || '';
    let newFinanceSynced = project.financeSynced || false;

    if (newIsPaid && !newFinanceSynced) {
      const amountStr = prompt(`Proyek "${project.title}" Lunas!\n\nMasukkan nominal pembayaran (Rp) untuk dikirim ke catatan Keuangan:`);
      if (amountStr !== null && amountStr.trim() !== '') {
        const amountNum = parseFloat(amountStr);
        if (!isNaN(amountNum) && amountNum > 0) {
          newAmountPaid = amountNum.toString();
          try {
            await addDoc(collection(db, 'finance'), {
              title: `Proyek: ${project.title}`,
              amount: amountNum,
              type: 'income',
              createdAt: serverTimestamp()
            });
            newFinanceSynced = true;
          } catch (error: any) {
            alert('Gagal mencatat ke Keuangan: ' + error.message);
          }
        }
      }
    }

    try {
      await updateDoc(doc(db, 'projects', project.id), {
        isPaid: newIsPaid,
        amountPaid: newAmountPaid,
        financeSynced: newFinanceSynced
      });
    } catch (error: any) {
      alert('Gagal mengubah status: ' + error.message);
    }
  };

  const openEditor = (project = { id: '', title: '', client: '', link: '', isPaid: false, amountPaid: '', financeSynced: false }) => {
    setCurrentProject({
      ...project,
      amountPaid: project.amountPaid || '',
      financeSynced: project.financeSynced || false
    });
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
              {currentProject.id && (
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
              )}
              {currentProject.id && (
                currentProject.link.trim() === '' ? (
                  <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-xl border border-yellow-200 dark:border-yellow-800/50 flex gap-3 mt-4">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 shrink-0" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-400">Masukkan Link Google Drive proyek yang sudah selesai terlebih dahulu untuk membuka menu pelunasan.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <input 
                        type="checkbox" 
                        id="isPaid"
                        checked={currentProject.isPaid}
                        onChange={e => setCurrentProject({...currentProject, isPaid: e.target.checked})}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor="isPaid" className="text-sm font-medium">Sudah Dibayar (Lunas)</label>
                    </div>

                    {currentProject.isPaid && !currentProject.financeSynced && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-4">
                        <label className="block text-sm font-medium mb-1 text-emerald-600">Nominal Pembayaran (Rp)</label>
                        <input 
                          type="number"
                          value={currentProject.amountPaid}
                          onChange={e => setCurrentProject({...currentProject, amountPaid: e.target.value})}
                          className="w-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-2 outline-none focus:border-emerald-500"
                          placeholder="Contoh: 1500000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Nominal ini akan otomatis masuk ke menu Keuangan Anda.</p>
                      </div>
                    )}
                    
                    {currentProject.isPaid && currentProject.financeSynced && (
                      <div className="p-3 mt-4 bg-gray-50 border border-gray-200 rounded-xl dark:bg-gray-800 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Pembayaran Lunas: Rp {parseFloat(currentProject.amountPaid || '0').toLocaleString('id-ID')}</p>
                        <p className="text-xs text-gray-500 mt-1">✔️ Nominal ini telah dicatat otomatis ke menu Keuangan.</p>
                      </div>
                    )}
                  </>
                )
              )}
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
                {(!project.link || project.link.trim() === '') ? (
                  <span className="px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 ml-2 shrink-0 self-start">
                    Menunggu Link
                  </span>
                ) : (
                  <button 
                    onClick={() => toggleStatus(project)}
                    className={cn(
                    "px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1 shrink-0 transition-colors active:scale-95 ml-2 self-start",
                    project.isPaid 
                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/40 dark:text-green-400" 
                      : "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/40 dark:text-red-400"
                  )}>
                    {project.isPaid ? <CheckCircle2 className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                    {project.isPaid ? 'Lunas' : 'Belum'}
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <a 
                href={project.link || '#'} 
                target={project.link ? "_blank" : "_self"} 
                rel="noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium transition-colors",
                  project.link 
                    ? "bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed dark:bg-gray-800/50 dark:text-gray-600"
                )}
              >
                <ExternalLink className="w-4 h-4" />
                {project.link ? 'Buka Link Drive' : 'Belum Ada Link'}
              </a>
              {project.link && (
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(project.link);
                    alert('Link berhasil disalin ke clipboard!');
                  }}
                  className="px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-xl transition-colors shrink-0 flex items-center justify-center"
                  title="Copy Link"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

