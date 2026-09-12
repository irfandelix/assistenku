'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Users, Plus, Phone, Trash2, Edit2, X, Check, ArrowLeft, Share2 } from 'lucide-react';
import Link from 'next/link';
import LayoutWrapper from '@/components/LayoutWrapper';

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

      // Ambil semua proyek untuk di-mapping ke konsultan
      const projSnap = await getDocs(collection(db, 'projects'));
      const allProjects = projSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

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
    if (!confirm('Hapus konsultan ini?')) return;
    try {
      await deleteDoc(doc(db, 'consultants', id));
      fetchConsultants();
    } catch (error) {
      alert('Gagal menghapus konsultan');
    }
  };

  return (
    <LayoutWrapper>
      <div className="max-w-xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
        <header className="flex items-center gap-4">
          <Link href="/projects" className="p-2 bg-[#050608] border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-accent-blue" />
              Kelola Konsultan
            </h1>
            <p className="text-sm text-gray-400">Daftar kontak konsultan untuk proyek.</p>
          </div>
        </header>

        {isAdding ? (
          <div className="bg-[#050608] border border-accent-blue/30 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-gray-200">Konsultan Baru</h2>
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
                placeholder="Nomor WA (contoh: 08123456789)"
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
            className="w-full py-4 border-2 border-dashed border-gray-800 rounded-2xl text-gray-400 font-bold hover:text-accent-blue hover:border-accent-blue transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Tambah Konsultan
          </button>
        )}

        <div className="space-y-3">
          {loading ? (
            <p className="text-center text-gray-500 py-10">Memuat data...</p>
          ) : consultants.length === 0 ? (
            <p className="text-center text-gray-500 py-10">Belum ada konsultan.</p>
          ) : (
            consultants.map(c => (
              <div key={c.id} className="bg-[#050608] border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                {editingId === c.id ? (
                  <div className="space-y-3">
                    <input 
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue"
                    />
                    <input 
                      type="text"
                      value={editForm.phone}
                      onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full bg-gray-900 border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue"
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
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <p className="text-gray-200 font-bold">{c.name}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                        <Phone className="w-3 h-3" /> {c.phone || '-'}
                      </p>
                      {c.projects && c.projects.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-800">
                          <p className="text-xs text-gray-400 mb-2">Proyek Aktif:</p>
                          <ul className="space-y-1">
                            {c.projects.map((p: any) => (
                              <li key={p.id} className="text-xs text-accent-blue truncate">
                                • {p.title}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCopyLink(c.id)}
                        className="p-2 text-gray-500 hover:text-green-500 bg-gray-900 rounded-lg relative"
                        title="Salin Link Bucket"
                      >
                        {copiedId === c.id ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => { setEditingId(c.id); setEditForm({ name: c.name, phone: c.phone || '' }); }}
                        className="p-2 text-gray-500 hover:text-accent-blue bg-gray-900 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-2 text-gray-500 hover:text-red-500 bg-gray-900 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </LayoutWrapper>
  );
}
