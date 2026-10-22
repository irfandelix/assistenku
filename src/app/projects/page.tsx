'use client';

import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, ExternalLink, MapPin, X, Save, Trash2, Copy, AlertCircle, Clock, CheckCircle, MessageCircle, UploadCloud, Loader2, Check, Map, ArrowRight, Eye, Calendar, Wallet, Link as LinkIcon, ArrowLeft, Upload, ShieldCheck, MapIcon, User, Phone, FileText, Users, ChevronDown, Bell, Search, Filter } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs, where, Timestamp, arrayUnion, limit } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_PROJECT = { 
  id: '', 
  title: '', 
  client: '', 
  documentType: '', 
  pemrakarsa: '', 
  consultantName: '', 
  consultantNumber: '',
  link: '', 
  files: [] as {title: string, url: string}[], 
  isPaid: false, 
  amountPaid: '', 
  financeSynced: false,
  paidAt: '',
  feedback: [] as any[]
};

const parseIndonesianDate = (dateStr: string) => {
  if (!dateStr) return 0;
  const months: Record<string, number> = {
    'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'mei': 4, 'jun': 5,
    'jul': 6, 'agu': 7, 'sep': 8, 'okt': 9, 'nov': 10, 'des': 11
  };
  const parts = dateStr.toLowerCase().trim().split(/\s+/);
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    let month = 0;
    for (const [mName, mNum] of Object.entries(months)) {
      if (parts[1].startsWith(mName)) {
        month = mNum;
        break;
      }
    }
    const year = parseInt(parts[2], 10);
    if (!isNaN(day) && !isNaN(year)) {
      return new Date(year, month, day).getTime();
    }
  }
  return 0;
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState(DEFAULT_PROJECT);

  const [consultants, setConsultants] = useState<any[]>([]);
  const [showConsultantDropdown, setShowConsultantDropdown] = useState(false);

  // New Filters & Notifications State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid' | 'nofiles'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const hasFiles = (project: any) => {
    const hasValidFiles = project.files && project.files.some((f: any) => f.url && f.url.trim() !== '' && f.url !== '#loading');
    return hasValidFiles || (project.link && project.link.trim() !== '');
  };

  useEffect(() => {
    const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      data.sort((a: any, b: any) => {
        const timeA = parseIndonesianDate(a.client) || (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
        const timeB = parseIndonesianDate(b.client) || (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
        return timeB - timeA; // Descending (newest to oldest)
      });
      
      setProjects(data);
    });

    const getConsultants = async () => {
      const snap = await getDocs(query(collection(db, 'consultants'), orderBy('name', 'asc')));
      setConsultants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    getConsultants();

    // Real-time Activity Logs (Consultant Read Receipts & Downloads)
    const qNotif = query(collection(db, 'activity_logs'), orderBy('createdAt', 'desc'), limit(30));
    const unsubNotif = onSnapshot(qNotif, (snapshot) => {
      const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(items);
    });

    return () => {
      unsubscribe();
      unsubNotif();
    };
  }, []);

  const handleSave = async () => {
    if (!currentProject.title.trim()) return;
    
    let isNowSynced = currentProject.financeSynced;
    
    try {
      if (currentProject.isPaid && !currentProject.financeSynced && currentProject.amountPaid) {
        const amountNum = parseFloat(currentProject.amountPaid);
        if (!isNaN(amountNum) && amountNum > 0) {
          
          let financeDate: any = serverTimestamp();
          if (currentProject.paidAt) {
            financeDate = Timestamp.fromDate(new Date(currentProject.paidAt));
          }

          await addDoc(collection(db, 'finance'), {
            title: `Proyek: ${currentProject.title}`,
            amount: amountNum,
            type: 'income',
            createdAt: financeDate
          });
          isNowSynced = true;
        }
      }

      const payload = {
        title: currentProject.title,
        client: currentProject.client,
        documentType: currentProject.documentType,
        pemrakarsa: currentProject.pemrakarsa,
        consultantName: currentProject.consultantName,
        consultantNumber: currentProject.consultantNumber,
        link: currentProject.files && currentProject.files.length > 0 ? currentProject.files[0].url : '',
        files: currentProject.files || [],
        isPaid: currentProject.isPaid,
        amountPaid: currentProject.amountPaid,
        financeSynced: isNowSynced,
        paidAt: currentProject.paidAt,
        feedback: currentProject.feedback || []
      };

      if (currentProject.id) {
        await updateDoc(doc(db, 'projects', currentProject.id), payload);
      } else {
        await addDoc(collection(db, 'projects'), {
          ...payload,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleCancelPaid = async () => {
    if (!confirm('Batalkan status lunas? Data pemasukan di Keuangan untuk proyek ini akan otomatis dihapus.')) return;
    
    try {
      const qF = query(collection(db, 'finance'), where('title', '==', `Proyek: ${currentProject.title}`));
      const snap = await getDocs(qF);
      snap.forEach(async (d) => {
        await deleteDoc(doc(db, 'finance', d.id));
      });
      
      if (currentProject.id) {
        await updateDoc(doc(db, 'projects', currentProject.id), {
          isPaid: false,
          amountPaid: '',
          financeSynced: false
        });
      }
      
      setCurrentProject({
        ...currentProject,
        isPaid: false,
        amountPaid: '',
        financeSynced: false
      });
    } catch (err: any) {
      alert('Gagal membatalkan lunas: ' + err.message);
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

  const openEditor = (project: any = DEFAULT_PROJECT) => {
    let initialFiles = project.files || [];
    if (initialFiles.length === 0 && project.link && project.link.trim() !== '') {
      initialFiles = [{ title: 'File Proyek Utama', url: project.link }];
    }
    setCurrentProject({
      ...project,
      files: initialFiles,
      amountPaid: project.amountPaid || '',
      financeSynced: project.financeSynced || false,
      paidAt: project.paidAt || '',
      feedback: project.feedback || [],
      documentType: project.documentType || '',
      pemrakarsa: project.pemrakarsa || '',
      consultantName: project.consultantName || '',
      consultantNumber: project.consultantNumber || ''
    });
    setIsEditing(true);
  };

  const handleDocumentTypeChange = (type: string) => {
    let newFiles = [...currentProject.files];
    
    // Only auto-populate if currently empty, or user agrees to reset
    if (newFiles.length === 0 || confirm("Apakah Anda ingin mengatur ulang daftar pustaka file sesuai dengan format dokumen ini?")) {
      if (type === 'SPPL') {
        newFiles = [
          { title: 'Peta Tapak Proyek (PDF)', url: '' },
          { title: 'Peta Pemantauan (PDF)', url: '' },
          { title: 'Peta Pengelolaan (PDF)', url: '' }
        ];
      } else if (type === 'UKL UPL') {
        newFiles = [
          { title: 'Peta Tapak Proyek (ZIP)', url: '' },
          { title: 'Peta Tapak Proyek (PDF)', url: '' },
          { title: 'Area Pemantauan (ZIP)', url: '' },
          { title: 'Titik Pemantauan (ZIP)', url: '' },
          { title: 'Peta Pemantauan (PDF)', url: '' },
          { title: 'Area Pengelolaan (ZIP)', url: '' },
          { title: 'Titik Pengelolaan (ZIP)', url: '' },
          { title: 'Peta Pengelolaan (PDF)', url: '' },
          { title: 'Peta Kawasan Hutan (PDF)', url: '' },
          { title: 'Peta PIPPIB (PDF)', url: '' }
        ];
      } else if (type === 'Lainnya') {
        newFiles = [
          { title: 'Dokumen Proyek', url: '' }
        ];
      }
    }

    setCurrentProject({
      ...currentProject,
      documentType: type,
      files: newFiles
    });
  };

  const getBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://assistenku.vercel.app';
  };

  const formatPhoneNumber = (phone: string) => {
    let cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  };

  const handleShareWa = (project: any) => {
    const publicUrl = `${getBaseUrl()}/p/${project.id}`;
    const text = `Halo! Berkas untuk proyek *${project.title}* sudah siap. Silakan diunduh atau dipratinjau melalui tautan berikut:\n\n👉 ${publicUrl}\n\nTerima kasih.`;
    
    if (project.consultantNumber && project.consultantNumber.trim() !== '') {
      const targetPhone = formatPhoneNumber(project.consultantNumber);
      window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    }
  };

  const handleCopyLink = (project: any) => {
    const publicUrl = `${getBaseUrl()}/p/${project.id}`;
    navigator.clipboard.writeText(publicUrl);
    alert('Link portal proyek berhasil disalin ke clipboard!');
  };

  const uploadFileForSlot = async (file: File, index: number) => {
    try {
      const formData = new FormData();
      
      const fileTitle = currentProject.files[index].title.replace(/[^a-zA-Z0-9 ]/g, '_');
      const renamedFile = new File([file], `${fileTitle}_${file.name}`, { type: file.type });
      const folderName = `Project_${currentProject.title.replace(/[^a-zA-Z0-9 ]/g, '_')}`;
      
      const loadingFiles = [...currentProject.files];
      loadingFiles[index].url = '#loading'; // Temporary marker
      setCurrentProject({...currentProject, files: loadingFiles});
      
      // 1. Get Resumable Upload URL from our backend
      const initRes = await fetch('/api/drive-upload/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: renamedFile.name,
          fileType: renamedFile.type,
          fileSize: renamedFile.size,
          folderName: folderName
        })
      });
      
      if (!initRes.ok) throw new Error('Gagal inisialisasi upload ke Google Drive');
      const { uploadUrl } = await initRes.json();
      
      // 2. Upload file bytes directly to Google Drive (Bypass Vercel entirely!)
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': renamedFile.type
        },
        body: renamedFile
      });
      
      if (!uploadRes.ok) throw new Error('Gagal mengirim data ke Google Drive');
      const driveData = await uploadRes.json();
      
      // 3. Finalize upload (Make public and get web links)
      const finalizeRes = await fetch('/api/drive-upload/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: driveData.id })
      });
      
      if (!finalizeRes.ok) throw new Error('Gagal memproses file di server');
      const data = await finalizeRes.json();
      
      if (data.success) {
        const newFiles = [...currentProject.files];
        newFiles[index].url = data.webViewLink || data.url;
        setCurrentProject({...currentProject, files: newFiles});
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      alert('Gagal mengunggah: ' + err.message);
      const resetFiles = [...currentProject.files];
      resetFiles[index].url = '';
      setCurrentProject({...currentProject, files: resetFiles});
    }
  };

  const unreadNotifs = notifications.filter(n => !n.isRead);

  const handleMarkAllRead = async () => {
    try {
      const unreadList = notifications.filter(n => !n.isRead);
      for (const item of unreadList) {
        await updateDoc(doc(db, 'activity_logs', item.id), { isRead: true });
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const filteredProjects = projects.filter(p => {
    if (statusFilter === 'unpaid' && p.isPaid) return false;
    if (statusFilter === 'paid' && !p.isPaid) return false;
    if (statusFilter === 'nofiles' && hasFiles(p)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchClient = p.client?.toLowerCase().includes(q);
      const matchDocType = p.documentType?.toLowerCase().includes(q);
      const matchCons = p.consultantName?.toLowerCase().includes(q);
      const matchPem = p.pemrakarsa?.toLowerCase().includes(q);
      return matchTitle || matchClient || matchDocType || matchCons || matchPem;
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-500">
      {!isEditing && (
        <div className="space-y-4 relative z-10">
          <header className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <Map className="w-6 h-6 text-accent-blue" />
                Proyek
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">Kelola dan pantau seluruh berkas proyek Anda.</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Activity Notification Bell */}
              <button 
                onClick={() => {
                  setShowNotifModal(true);
                  handleMarkAllRead();
                }}
                className="relative p-2.5 sm:p-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors flex items-center justify-center shadow-lg active:scale-95"
                title="Notifikasi Aktivitas Konsultan"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifs.length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse shadow-md shadow-red-500/50">
                    {unreadNotifs.length > 9 ? '9+' : unreadNotifs.length}
                  </span>
                )}
              </button>

              <Link 
                href="/consultants"
                className="p-2.5 sm:p-3 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-accent-blue transition-colors flex items-center justify-center shadow-lg active:scale-95"
                title="Kelola Konsultan"
              >
                <Users className="w-5 h-5" />
              </Link>

              <button 
                onClick={() => openEditor()}
                className="bg-accent-blue hover:bg-blue-600 text-white p-2.5 sm:p-3 rounded-xl shadow-lg shadow-blue-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline font-bold text-sm">Tambah Proyek</span>
              </button>
            </div>
          </header>

          {/* Quick Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama proyek, konsultan, jenis dokumen..."
              className="w-full bg-[#050608] border border-gray-800 text-gray-200 pl-11 pr-4 py-2.5 rounded-2xl text-xs sm:text-sm outline-none focus:border-accent-blue transition-colors placeholder:text-gray-500 shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide text-xs font-semibold">
            <button 
              onClick={() => setStatusFilter('all')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap", 
                statusFilter === 'all' 
                  ? "bg-accent-blue text-white shadow-md shadow-blue-500/20" 
                  : "bg-[#050608] border border-gray-800 text-gray-400 hover:text-white"
              )}
            >
              Semua ({projects.length})
            </button>
            <button 
              onClick={() => setStatusFilter('unpaid')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap", 
                statusFilter === 'unpaid' 
                  ? "bg-accent-orange text-white shadow-md shadow-orange-500/20" 
                  : "bg-[#050608] border border-gray-800 text-gray-400 hover:text-white"
              )}
            >
              Belum Lunas ({projects.filter(p => !p.isPaid).length})
            </button>
            <button 
              onClick={() => setStatusFilter('nofiles')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap", 
                statusFilter === 'nofiles' 
                  ? "bg-red-500 text-white shadow-md shadow-red-500/20" 
                  : "bg-[#050608] border border-gray-800 text-gray-400 hover:text-white"
              )}
            >
              Perlu Berkas ({projects.filter(p => !hasFiles(p)).length})
            </button>
            <button 
              onClick={() => setStatusFilter('paid')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap", 
                statusFilter === 'paid' 
                  ? "bg-neon text-darkbg font-bold shadow-md shadow-green-500/20" 
                  : "bg-[#050608] border border-gray-800 text-gray-400 hover:text-white"
              )}
            >
              Lunas ({projects.filter(p => p.isPaid).length})
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-300">
          <div className="max-w-4xl mx-auto w-full py-4">
            <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-6">
              <div>
                <button onClick={() => setIsEditing(false)} className="text-accent-blue hover:text-blue-400 mb-2 flex items-center gap-2 text-sm font-medium transition-colors">
                  &larr; Kembali ke Daftar Proyek
                </button>
                <h2 className="text-3xl font-bold text-gray-100">{currentProject.id ? 'Edit Proyek' : 'Buat Proyek Baru'}</h2>
              </div>
            </div>
            
            <div className="bg-darkcard border border-gray-800 rounded-3xl p-6 md:p-10 shadow-2xl mb-20">
              {currentProject.feedback && currentProject.feedback.length > 0 && (
                <div className="mb-8 bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
                  <h3 className="text-red-500 font-bold mb-3 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" /> Catatan Revisi dari Klien
                  </h3>
                  <div className="space-y-3">
                    {currentProject.feedback.map((fb: any, i: number) => (
                      <div key={i} className={cn(
                        "border rounded-xl p-4 flex justify-between items-start transition-all",
                        fb.isResolved ? "bg-gray-900/50 border-gray-800/50 opacity-60" : "bg-[#050608] border-gray-800"
                      )}>
                        <div>
                          <p className={cn("text-sm transition-all", fb.isResolved ? "text-gray-500 line-through" : "text-gray-200")}>{fb.text}</p>
                          <p className="text-xs text-gray-500 mt-2">{new Date(fb.createdAt).toLocaleString('id-ID')}</p>
                        </div>
                        <button 
                          onClick={async () => {
                            const newFeedback = [...currentProject.feedback];
                            newFeedback[i].isResolved = !newFeedback[i].isResolved;
                            setCurrentProject({...currentProject, feedback: newFeedback});
                            if (currentProject.id) {
                              await updateDoc(doc(db, 'projects', currentProject.id), { feedback: newFeedback });
                            }
                          }}
                          className={cn(
                            "transition-colors p-2 rounded-lg flex items-center gap-1 text-xs font-bold",
                            fb.isResolved 
                              ? "bg-gray-800 text-gray-400 hover:text-white" 
                              : "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          )}
                        >
                          <CheckCircle2 className="w-4 h-4" /> {fb.isResolved ? 'Batal' : 'Selesai'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
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
                  <label className="block text-sm font-medium mb-1 text-gray-400">Jenis Dokumen</label>
                  <select
                    value={currentProject.documentType}
                    onChange={e => handleDocumentTypeChange(e.target.value)}
                    className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors appearance-none"
                  >
                    <option value="">Pilih Jenis Dokumen...</option>
                    <option value="SPPL">SPPL</option>
                    <option value="UKL UPL">UKL UPL</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Tanggal Pembuatan</label>
                  <input 
                    type="text"
                    value={currentProject.client}
                    onChange={e => setCurrentProject({...currentProject, client: e.target.value})}
                    className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                    placeholder="Misal: 12 Agustus 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Nama Pemrakarsa</label>
                  <input 
                    type="text"
                    value={currentProject.pemrakarsa}
                    onChange={e => setCurrentProject({...currentProject, pemrakarsa: e.target.value})}
                    className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                    placeholder="Nama Pemrakarsa"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400 flex justify-between items-center">
                    <span>Nama Konsultan</span>
                    <Link href="/consultants" className="text-xs text-accent-blue hover:underline">Kelola</Link>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      value={currentProject.consultantName}
                      onFocus={() => setShowConsultantDropdown(true)}
                      onBlur={() => setTimeout(() => setShowConsultantDropdown(false), 200)}
                      onChange={e => {
                        const val = e.target.value;
                        setShowConsultantDropdown(true);
                        setCurrentProject({...currentProject, consultantName: val});
                      }}
                      className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                      placeholder="Pilih atau Ketik Nama"
                    />
                    <ChevronDown className="absolute right-4 top-3.5 w-5 h-5 text-gray-500 pointer-events-none" />
                    {showConsultantDropdown && consultants.filter(c => c.name.toLowerCase().includes((currentProject.consultantName || '').toLowerCase())).length > 0 && (
                      <div className="absolute z-50 w-full mt-2 bg-[#0a0c10] border border-gray-800 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                        {consultants
                          .filter(c => c.name.toLowerCase().includes((currentProject.consultantName || '').toLowerCase()))
                          .map(c => (
                            <div 
                              key={c.id} 
                              className="px-4 py-3 hover:bg-accent-blue/10 hover:text-accent-blue cursor-pointer transition-colors text-sm"
                              onClick={() => {
                                setCurrentProject({...currentProject, consultantName: c.name, consultantNumber: c.phone || currentProject.consultantNumber});
                                setShowConsultantDropdown(false);
                              }}
                            >
                              {c.name}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1 text-gray-400">Nomor Konsultan</label>
                  <input 
                    type="text"
                    value={currentProject.consultantNumber}
                    onChange={e => setCurrentProject({...currentProject, consultantNumber: e.target.value})}
                    className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-accent-blue transition-colors"
                    placeholder="Misal: 08123456789"
                  />
                </div>
              </div>

                <div className="pt-4 border-t border-gray-800">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-400">Peta yang dibutuhkan / Pustaka File</label>
                  </div>
                  
                  <div className="space-y-3 mb-3">
                    {currentProject.files && currentProject.files.map((file: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 bg-[#050608] p-3 rounded-xl border border-gray-800">
                        <input 
                          type="text" 
                          value={file.title}
                          onChange={(e) => {
                            const newFiles = [...currentProject.files];
                            newFiles[index].title = e.target.value;
                            setCurrentProject({...currentProject, files: newFiles});
                          }}
                          className="flex-1 bg-transparent border-none outline-none text-sm text-gray-100 placeholder-gray-600"
                          placeholder="Nama file (misal: Peta Tapak)"
                        />
                        
                        {file.url === '#loading' ? (
                          <div className="p-2 text-accent-blue"><Loader2 className="w-4 h-4 animate-spin" /></div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {file.url && (
                              <a href={file.url} target="_blank" rel="noreferrer" className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors" title="Lihat File yang Saat Ini Aktif">
                                <CheckCircle2 className="w-4 h-4" />
                              </a>
                            )}
                            <div className="relative overflow-hidden p-2 text-accent-blue bg-accent-blue/10 rounded-lg hover:bg-accent-blue/20 cursor-pointer" title={file.url ? "Upload Revisi / Timpa File" : "Upload File"}>
                              <input 
                                type="file"
                                accept=".zip,.rar,.pdf,.doc,.docx,.ppt,.pptx"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) uploadFileForSlot(f, index);
                                }}
                              />
                              <UploadCloud className="w-4 h-4" />
                            </div>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => {
                            const newFiles = currentProject.files.filter((_, i) => i !== index);
                            setCurrentProject({...currentProject, files: newFiles});
                          }}
                          className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <button 
                    onClick={() => {
                      setCurrentProject({
                        ...currentProject, 
                        files: [...currentProject.files, { title: '', url: '' }]
                      });
                    }}
                    className="w-full py-3 border-2 border-dashed border-gray-800 rounded-xl text-gray-400 text-sm font-medium hover:text-accent-blue hover:border-accent-blue transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Tambah Slot File Ekstra
                  </button>
                </div>

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

                  {currentProject.isPaid && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200 mt-4 relative">
                      <div className="flex justify-between items-end mb-1">
                        <label className="block text-sm font-medium text-neon">Nominal Pembayaran (Rp)</label>
                        {currentProject.financeSynced && (
                          <span className="text-xs text-neon font-bold flex items-center gap-1">✔️ Disinkronisasi</span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative">
                        <div>
                          <input 
                            type="number"
                            value={currentProject.amountPaid}
                            onChange={e => setCurrentProject({...currentProject, amountPaid: e.target.value})}
                            disabled={currentProject.financeSynced}
                            className={cn(
                              "w-full bg-neon/5 border text-gray-100 rounded-xl px-4 py-3 outline-none transition-colors",
                              currentProject.financeSynced ? "border-gray-700/50 text-gray-400 bg-gray-800/30 cursor-not-allowed" : "border-neon/30 focus:border-neon"
                            )}
                            placeholder="Contoh: 1500000"
                          />
                        </div>
                        <div className="relative">
                          <input 
                            type="date"
                            value={currentProject.paidAt}
                            onChange={e => setCurrentProject({...currentProject, paidAt: e.target.value})}
                            disabled={currentProject.financeSynced}
                            className={cn(
                              "w-full bg-neon/5 border text-gray-100 rounded-xl px-4 py-3 outline-none transition-colors",
                              currentProject.financeSynced ? "border-gray-700/50 text-gray-400 bg-gray-800/30 cursor-not-allowed" : "border-neon/30 focus:border-neon"
                            )}
                            title="Tanggal Pembayaran (Kosongkan untuk hari ini)"
                          />
                          {currentProject.financeSynced && (
                            <button 
                              onClick={handleCancelPaid}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-red-500 hover:text-red-400 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Batal Lunas
                            </button>
                          )}
                        </div>
                      </div>
                      {!currentProject.financeSynced && (
                        <p className="text-xs text-gray-500 mt-2">Isi nominal dan pilih tanggal pembayaran (biarkan tanggal kosong untuk hari ini).</p>
                      )}
                    </div>
                  )}
                </>
            </div>
            
            <div className="mt-10 flex justify-between items-center pt-6 border-t border-gray-800">
              {currentProject.id ? (
                <button onClick={() => handleDelete(currentProject.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-2 p-2 transition-colors">
                  <Trash2 className="w-5 h-5" /> Hapus Proyek
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-accent-blue text-white px-8 py-3.5 rounded-xl font-bold hover:bg-blue-600 flex items-center gap-2 transition-colors active:scale-95 shadow-lg shadow-blue-900/20"
              >
                <Save className="w-5 h-5" /> Simpan Proyek
              </button>
            </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 animate-in fade-in duration-300">
          {filteredProjects.length === 0 && (
          <div className="text-center py-12 border border-dashed border-gray-800 rounded-3xl space-y-2">
            <p className="text-gray-400 font-medium">Tidak ada proyek yang sesuai.</p>
            <p className="text-xs text-gray-500">Coba ganti filter atau kata kunci pencarian Anda.</p>
          </div>
        )}
        {filteredProjects.map((project) => (
          <div key={project.id} className="bg-darkcard border border-gray-800 rounded-3xl p-5 hover:border-gray-700 transition-colors group">
            <div className="flex justify-between items-start mb-4">
              <div 
                className="flex-1 cursor-pointer"
                onClick={() => openEditor(project)}
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  {/* Status Tag */}
                  {project.isPaid ? (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-neon/10 text-neon uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Lunas
                    </span>
                  ) : hasFiles(project) ? (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-accent-blue/10 text-accent-blue uppercase tracking-wider flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Berkas Siap
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-accent-orange/10 text-accent-orange uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Perlu Berkas
                    </span>
                  )}
                  {project.documentType && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-gray-800 text-gray-300 uppercase tracking-wider border border-gray-700">
                      {project.documentType}
                    </span>
                  )}
                  {project.feedback && project.feedback.some((f: any) => !f.isResolved) && (
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <MessageCircle className="w-3 h-3" /> Ada Revisi!
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-100 group-hover:text-accent-blue transition-colors">{project.title}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-400 mt-1.5">
                  <span className="flex items-center gap-1 text-gray-300">
                    <Calendar className="w-3.5 h-3.5 text-gray-500" />
                    {project.client || 'Tanpa Tanggal'}
                  </span>
                  {project.consultantName && (
                    <span className="flex items-center gap-1 text-gray-300">
                      <Users className="w-3.5 h-3.5 text-accent-blue" />
                      {project.consultantName}
                    </span>
                  )}
                </div>
              </div>
              
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
            </div>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-800">
              <Link 
                href={hasFiles(project) ? `/p/${project.id}` : '#'} 
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all",
                  hasFiles(project)
                    ? "bg-[#050608] border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white shadow-sm"
                    : "bg-[#050608] border border-transparent text-gray-600 cursor-not-allowed pointer-events-none"
                )}
              >
                <ExternalLink className="w-4 h-4" />
                {hasFiles(project) ? 'Buka Portal Klien' : 'Belum Ada File'}
              </Link>
              {hasFiles(project) && (
                <>
                  <button 
                    onClick={() => handleShareWa(project)}
                    className="px-4 bg-[#25D366]/10 border border-[#25D366]/30 hover:bg-[#25D366]/20 text-[#25D366] rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-sm"
                    title="Kirim ke WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleCopyLink(project)}
                    className="px-4 bg-[#050608] border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-xl transition-colors shrink-0 flex items-center justify-center shadow-sm"
                    title="Copy Link Portal"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
        </div>
      )}

      {/* Activity Notifications Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0E131F] border border-white/10 rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent-blue" />
                <h3 className="font-bold text-white text-base">Aktivitas & Notifikasi Konsultan</h3>
              </div>
              <button 
                onClick={() => setShowNotifModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada riwayat aktivitas.</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-bold text-accent-blue">{n.title || 'Aktivitas Baru'}</p>
                      <span className="text-[10px] text-gray-500 shrink-0">
                        {n.createdAt?.toMillis ? new Date(n.createdAt.toMillis()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : 'Baru saja'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-200 mt-1 leading-relaxed">{n.message}</p>
                    {n.consultantName && (
                      <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-500" /> {n.consultantName}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-white/10 bg-[#0A0D15] flex justify-end">
              <button 
                onClick={() => setShowNotifModal(false)}
                className="px-5 py-2.5 rounded-xl bg-accent-blue text-white text-xs font-bold hover:bg-blue-600 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (+) */}
      {!isEditing && (
        <button 
          onClick={() => openEditor()}
          className="md:hidden fixed right-5 bottom-20 z-40 w-14 h-14 rounded-full bg-accent-blue text-white shadow-xl shadow-blue-600/40 flex items-center justify-center active:scale-90 transition-transform"
          title="Tambah Proyek Cepat"
        >
          <Plus className="w-7 h-7" />
        </button>
      )}
    </div>
  );
}
