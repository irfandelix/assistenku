'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, ExternalLink, MapPin, X, Save, Trash2, Copy, AlertCircle, Clock, CheckCircle } from 'lucide-react';
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

  const openEditor = (project = { id: '', title: '', client: '', link: '', isPaid: false, amountPaid: '', financeSynced: false }) => {
    setCurrentProject({
      ...project,
      amountPaid: project.amountPaid || '',
      financeSynced: project.financeSynced || false
    });
    setIsEditing(true);
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <p className="text-accent-blue font-medium text-sm tracking-widest uppercase mb-1">Manajemen</p>
          <h1 className="text-2xl font-bold text-gray-100">Daftar Proyek</h1>
        </div>
        <button 
          onClick={() => openEditor()}
          className="bg-accent-blue text-white p-3 rounded-xl shadow-lg hover:bg-blue-600 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </header>

      {/* Editor Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentProject.id ? 'Edit Proyek' : 'Proyek Baru'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nama Proyek</label>
                <input 
                  type="text"
                  value={currentProject.title}
                  onChange={e => setCurrentProject({...currentProject, title: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                  placeholder="Misal: Redesign Website"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Klien / Instansi</label>
                <input 
                  type="text"
                  value={currentProject.client}
                  onChange={e => setCurrentProject({...currentProject, client: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                  placeholder="Misal: PT. Maju Jaya"
                />
              </div>
              {currentProject.id && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Pustaka Proyek (File ZIP/PDF atau Link Drive)</label>
                  <div className="flex flex-col gap-2">
                    <input 
                      type="text"
                      value={currentProject.link}
                      onChange={e => setCurrentProject({...currentProject, link: e.target.value})}
                      className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                      placeholder="Paste link Drive atau unggah file di bawah..."
                    />
                    
                    <div className="relative border-2 border-dashed border-gray-800 rounded-xl p-4 hover:border-accent-blue transition-colors cursor-pointer bg-[#050608] flex items-center justify-center">
                      <input 
                        type="file" 
                        accept=".zip,.rar,.pdf,.doc,.docx,.ppt,.pptx"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('foodName', `Project_${currentProject.title || 'Draft'}`);
                            
                            setCurrentProject({...currentProject, link: 'Mengunggah ke Google Drive...'});
                            
                            const res = await fetch('/api/drive-upload', {
                              method: 'POST',
                              body: formData
                            });
                            
                            const data = await res.json();
                            if (data.success) {
                              setCurrentProject({...currentProject, link: data.webViewLink || data.url});
                            } else {
                              alert(data.error);
                              setCurrentProject({...currentProject, link: ''});
                            }
                          } catch (err: any) {
                            alert('Gagal mengunggah: ' + err.message);
                            setCurrentProject({...currentProject, link: ''});
                          }
                        }}
                      />
                      <div className="flex flex-col items-center gap-1 text-gray-400 pointer-events-none text-center">
                        <Plus className="w-5 h-5 text-accent-blue" />
                        <span className="text-xs font-medium">Atau ketuk untuk unggah file (ZIP/PDF) langsung ke Drive</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {currentProject.id && (
                currentProject.link.trim() === '' ? (
                  <div className="bg-accent-orange/10 p-4 rounded-xl border border-accent-orange/20 flex gap-3 mt-4">
                    <AlertCircle className="w-5 h-5 text-accent-orange shrink-0" />
                    <p className="text-sm text-accent-orange/90">Masukkan Link Google Drive proyek yang sudah selesai terlebih dahulu untuk membuka menu pelunasan.</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-800">
                      <input 
                        type="checkbox" 
                        id="isPaid"
                        checked={currentProject.isPaid}
                        onChange={e => setCurrentProject({...currentProject, isPaid: e.target.checked})}
                        className="w-5 h-5 text-accent-blue rounded focus:ring-accent-blue bg-[#050608] border-gray-700"
                      />
                      <label htmlFor="isPaid" className="text-sm font-medium text-gray-300">Tandai Lunas (Selesai)</label>
                    </div>

                    {currentProject.isPaid && !currentProject.financeSynced && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-4">
                        <label className="block text-sm font-medium mb-1 text-neon">Nominal Pembayaran (Rp)</label>
                        <input 
                          type="number"
                          value={currentProject.amountPaid}
                          onChange={e => setCurrentProject({...currentProject, amountPaid: e.target.value})}
                          className="w-full bg-neon/5 border border-neon/30 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-neon transition-colors"
                          placeholder="Contoh: 1500000"
                        />
                        <p className="text-xs text-gray-500 mt-1">Nominal ini akan otomatis masuk ke menu Keuangan Anda.</p>
                      </div>
                    )}
                    
                    {currentProject.isPaid && currentProject.financeSynced && (
                      <div className="p-3 mt-4 bg-gray-800/50 border border-gray-700 rounded-xl">
                        <p className="text-sm text-gray-300 font-medium">Pembayaran Lunas: Rp {parseFloat(currentProject.amountPaid || '0').toLocaleString('id-ID')}</p>
                        <p className="text-xs text-neon mt-1">✔️ Disinkronisasi ke Keuangan.</p>
                      </div>
                    )}
                  </>
                )
              )}
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentProject.id ? (
                <button onClick={() => handleDelete(currentProject.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-accent-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 flex items-center gap-2 transition-colors active:scale-95"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project List */}
      <div className="grid gap-4">
        {projects.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <p className="text-gray-500">Belum ada proyek.</p>
          </div>
        )}
        {projects.map((project) => (
          <div key={project.id} className="bg-darkcard border border-gray-800 rounded-3xl p-5 hover:border-gray-700 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => openEditor(project)}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* Status Tag */}
                  {project.isPaid ? (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-neon/10 text-neon uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Completed
                    </span>
                  ) : (project.link && project.link.trim() !== '') ? (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-accent-blue/10 text-accent-blue uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> In Progress
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-accent-orange/10 text-accent-orange uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Pending
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-xl text-gray-100 group-hover:text-accent-blue transition-colors">{project.title}</h3>
                <div className="flex items-center text-sm text-gray-400 mt-1">
                  <span className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-300 mr-2 border border-gray-700">
                    {project.client.charAt(0).toUpperCase()}
                  </span>
                  {project.client}
                </div>
              </div>
              
              {(!project.link || project.link.trim() === '') ? null : (
                <button 
                  onClick={() => toggleStatus(project)}
                  className={cn(
                  "p-2 rounded-xl transition-colors active:scale-95 ml-2",
                  project.isPaid 
                    ? "bg-neon/10 text-neon hover:bg-neon/20" 
                    : "bg-gray-800 text-gray-400 hover:text-white"
                )}>
                  {project.isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
              )}
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
              <a 
                href={project.link || '#'} 
                target={project.link ? "_blank" : "_self"} 
                rel="noreferrer"
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all",
                  project.link 
                    ? "bg-[#050608] border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white shadow-sm"
                    : "bg-[#050608] border border-transparent text-gray-600 cursor-not-allowed"
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
                  className="px-4 bg-[#050608] border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-sm"
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
