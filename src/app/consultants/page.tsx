'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Users, Plus, Phone, Trash2, Edit2, X, Check, ArrowLeft, Share2, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

export default function ConsultantsPage() {
  const [consultants, setConsultants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newConsultant, setNewConsultant] = useState({ name: '', phone: '' });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });

  useEffect(() => {
    fetchConsultants();
  }, []);

  const fetchConsultants = async () => {
    try {
      const q = query(collection(db, 'consultants'), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      const consData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const projSnap = await getDocs(collection(db, 'projects'));
      const allProjects = projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      // Sort projects by newest first
      allProjects.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });

      const dataWithProjects = consData.map((c: any) => ({
        ...c,
        projects: allProjects.filter(p => p.consultantName === c.name)
      }));

      setConsultants(dataWithProjects);
    } catch (error) {
      console.error('Error fetching consultants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/c/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdd = async () => {
    if (!newConsultant.name) return;
    try {
      await addDoc(collection(db, 'consultants'), {
        name: newConsultant.name,
        phone: newConsultant.phone,
        createdAt: serverTimestamp()
      });
      setIsAdding(false);
      setNewConsultant({ name: '', phone: '' });
      fetchConsultants();
    } catch (error) {
      alert('Gagal menambah konsultan');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editForm.name) return;
    try {
      await updateDoc(doc(db, 'consultants', id), {
        name: editForm.name,
        phone: editForm.phone
      });
      setEditingId(null);
      fetchConsultants();
    } catch (error) {
      alert('Gagal mengupdate konsultan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus konsultan ini beserta tautannya? (Proyek aslinya tidak akan terhapus)')) return;
    try {
      await deleteDoc(doc(db, 'consultants', id));
      fetchConsultants();
    } catch (error) {
      alert('Gagal menghapus konsultan');
    }
  };

  return (
    <>
    <div className="h-[100dvh] flex flex-col overflow-hidden animate-in fade-in duration-500">
          <header className="flex items-center gap-4 px-6 md:px-10 py-6 md:py-8 shrink-0">
            <Link href="/projects" className="p-3 bg-[#050608] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <Users className="w-6 h-6 text-accent-blue" />
                Kelola Bucket Konsultan
              </h1>
              <p className="text-sm text-gray-400">Setiap bucket adalah link portal pribadi untuk satu konsultan.</p>
            </div>
          </header>

          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">Memuat data...</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden md:overflow-x-auto md:overflow-y-hidden px-4 md:px-10 pb-20 md:pb-10 scrollbar-hide">
              <div className="flex flex-col md:flex-row gap-8 md:h-full items-center md:items-start">
                
                {consultants.map(c => (
                  <div key={c.id} className="w-full max-w-[400px] md:max-w-none md:w-[380px] shrink-0 h-[70vh] md:h-[80vh] max-h-[750px] bg-[#050608] border border-gray-800 rounded-[2rem] flex flex-col overflow-hidden shadow-2xl relative">
                  
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-800 bg-[#0a0c10] shrink-0 z-10">
                    {editingId === c.id ? (
                      <div className="space-y-3">
                        <input 
                          type="text"
                          value={editForm.name}
                          onChange={e => setEditForm({...editForm, name: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue"
                          placeholder="Nama Konsultan"
                        />
                        <input 
                          type="text"
                          value={editForm.phone}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full bg-gray-900 border border-gray-700 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue"
                          placeholder="Nomor WA"
                        />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="p-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700">
                            <X className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleUpdate(c.id)} className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30">
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="pr-2">
                          <h3 className="text-lg font-bold text-gray-100 break-words line-clamp-2">{c.name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {c.phone || '-'}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button 
                            onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, phone: c.phone || '' }); }}
                            className="p-1.5 text-gray-600 hover:text-accent-blue bg-gray-900 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-gray-600 hover:text-red-500 bg-gray-900 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scrollable Projects Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050608]/50 custom-scrollbar">
                    {c.projects && c.projects.length > 0 ? (
                      c.projects.map((p: any) => (
                        <Link 
                          key={p.id} 
                          href={`/p/${p.id}`}
                          target="_blank"
                          className="block bg-[#0B0E14] border border-gray-800 p-4 rounded-2xl hover:border-accent-blue/40 transition-colors group"
                        >
                          <h4 className="font-bold text-gray-200 text-sm mb-1 group-hover:text-accent-blue">{p.title}</h4>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <FolderOpen className="w-3 h-3" /> {p.documentType || 'Proyek'}
                          </p>
                        </Link>
                      ))
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <FolderOpen className="w-10 h-10 text-gray-800 mb-3" />
                        <p className="text-sm text-gray-500">Belum ada proyek yang ditugaskan</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer / Share */}
                  <div className="p-4 border-t border-gray-800 bg-[#0a0c10] shrink-0 z-10">
                    <button 
                      onClick={() => handleCopyLink(c.id)}
                      className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                        copiedId === c.id 
                          ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                          : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20 border border-accent-blue/20'
                      }`}
                    >
                      {copiedId === c.id ? (
                        <>
                          <Check className="w-5 h-5" /> Tersalin!
                        </>
                      ) : (
                        <>
                          <Share2 className="w-5 h-5" /> Bagikan Bucket
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}

              {/* Add New Consultant Column */}
              <div className="w-full max-w-[400px] md:max-w-none md:w-[380px] shrink-0 h-[60vh] md:h-[80vh] max-h-[750px] flex flex-col mb-10 md:mb-0">
                {isAdding ? (
                  <div className="bg-[#050608] border border-accent-blue/30 rounded-[2rem] p-6 space-y-4 shadow-xl">
                    <h2 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Konsultan Baru</h2>
                    <div className="space-y-3">
                      <input 
                        type="text"
                        placeholder="Nama Lengkap"
                        value={newConsultant.name}
                        onChange={e => setNewConsultant({...newConsultant, name: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue"
                      />
                      <input 
                        type="text"
                        placeholder="Nomor WA (opsional)"
                        value={newConsultant.phone}
                        onChange={e => setNewConsultant({...newConsultant, phone: e.target.value})}
                        className="w-full bg-gray-900 border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue"
                      />
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={handleAdd}
                          className="flex-1 bg-accent-blue hover:bg-blue-600 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Simpan
                        </button>
                        <button 
                          onClick={() => setIsAdding(false)}
                          className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsAdding(true)}
                    className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-800 rounded-[2rem] flex flex-col items-center justify-center text-gray-500 hover:text-accent-blue hover:border-accent-blue/50 transition-colors gap-3 bg-[#050608]/30"
                  >
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-bold">Tambah Bucket Konsultan</span>
                  </button>
                )}
              </div>
              
              {/* Padding to allow scrolling past the last item */}
              <div className="w-8 shrink-0"></div>

            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #1f2937;
          border-radius: 20px;
        }
      `}} />
    </>
  );
}
