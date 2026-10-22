'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  Users, 
  FileText, 
  FolderOpen, 
  Loader2, 
  Calendar, 
  ChevronDown, 
  Download, 
  Eye, 
  ShieldCheck, 
  User, 
  Phone, 
  Search, 
  MessageCircle, 
  FileCode, 
  ExternalLink,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';

export default function ConsultantPortalPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [consultant, setConsultant] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Accordion & Preview State
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [previewFileId, setPreviewFileId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const extractDriveId = (url: string) => {
    if (!url) return null;
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) return matchD[1];
    const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (matchId) return matchId[1];
    return null;
  };

  const getInitials = (name: string) => {
    if (!name) return 'K';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Activity Logger (for Real-time Notifications)
  const logActivity = async (type: string, title: string, message: string, extra: Record<string, any> = {}) => {
    try {
      await addDoc(collection(db, 'activity_logs'), {
        type,
        consultantId: params.id,
        consultantName: consultant?.name || 'Konsultan',
        title,
        message,
        createdAt: serverTimestamp(),
        isRead: false,
        ...extra
      });
    } catch (err) {
      console.warn('Logging skipped:', err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const docRef = doc(db, 'consultants', params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const consData = docSnap.data();
          setConsultant(consData);
          
          const q = query(
            collection(db, 'projects'), 
            where('consultantName', '==', consData.name)
          );
          
          const projSnap = await getDocs(q);
          const projData = projSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((p: any) => !p.isPaid);

          // Sort descending
          projData.sort((a: any, b: any) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
          });
          
          setProjects(projData);

          // Auto-expand first project if only one
          if (projData.length === 1) {
            setExpandedIds([projData[0].id]);
          }

          // Real-time Read-Receipt: Log visit once per session
          if (typeof window !== 'undefined') {
            const sessionKey = `portal_viewed_${params.id}`;
            if (!sessionStorage.getItem(sessionKey)) {
              sessionStorage.setItem(sessionKey, 'true');
              addDoc(collection(db, 'activity_logs'), {
                type: 'CONSULTANT_VIEW',
                consultantId: params.id,
                consultantName: consData.name,
                title: 'Portal Dibuka oleh Konsultan',
                message: `Konsultan ${consData.name} baru saja membuka link portal berkas.`,
                createdAt: serverTimestamp(),
                isRead: false
              }).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.id]);

  const filteredProjects = projects.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.title?.toLowerCase().includes(q) ||
      p.documentType?.toLowerCase().includes(q) ||
      p.client?.toLowerCase().includes(q) ||
      p.pemrakarsa?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07090E] text-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 bg-[#0E131F] border border-white/10 p-8 rounded-3xl shadow-2xl">
          <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
          <div className="text-center">
            <p className="text-white font-semibold">Memuat Portal Berkas</p>
            <p className="text-xs text-gray-400 mt-1">Menyiapkan dokumen proyek Anda...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen bg-[#07090E] text-white flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-[#0E131F] border border-white/10 p-8 rounded-3xl shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mx-auto border border-red-500/20">
            <Users className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Portal Tidak Ditemukan</h1>
          <p className="text-sm text-gray-400">
            Tautan ini mungkin salah, telah kedaluwarsa, atau data konsultan telah diperbarui. Silakan hubungi admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 pb-28 selection:bg-blue-500/30 selection:text-white">
      {/* Background Glow Accents */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-blue-600/15 via-blue-500/5 to-transparent blur-3xl pointer-events-none -z-0"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 relative z-10 space-y-6">
        
        {/* Top Minimal Brand Bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-500/30">
              A
            </div>
            <div>
              <p className="text-xs font-bold tracking-wider uppercase text-gray-300">ASSISTENKU</p>
              <p className="text-[10px] text-gray-500 font-medium">Sistem Berkas & Dokumen Terpadu</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Portal Resmi
          </div>
        </div>

        {/* Hero Profile Card */}
        <div className="bg-[#0E131F]/90 backdrop-blur-md border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center text-2xl font-black shadow-lg shadow-blue-600/20 shrink-0 border border-white/20">
              {getInitials(consultant.name)}
            </div>
            <div className="space-y-2 flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" /> Portal Konsultan
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight truncate">
                {consultant.name}
              </h1>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xl">
                Selamat datang! Dokumen dan peta proyek yang Anda percayakan kepada kami telah dirangkum di bawah ini dan siap ditinjau atau diunduh kapan saja.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-400">
                <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.08] rounded-lg text-gray-300 font-medium flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
                  {projects.length} Proyek Aktif
                </span>
                {consultant.phone && (
                  <span className="px-3 py-1 bg-white/[0.05] border border-white/[0.08] rounded-lg text-gray-300 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    {consultant.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {projects.length > 2 && (
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari nama proyek, jenis dokumen, atau tanggal..."
              className="w-full bg-[#0E131F] border border-white/[0.08] text-white pl-11 pr-4 py-3 rounded-2xl text-sm outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* Projects List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-base font-bold text-gray-200 flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-blue-400" /> 
              Daftar Proyek Aktif ({filteredProjects.length})
            </h2>
            <span className="text-xs text-gray-500">Klik proyek untuk melihat berkas</span>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-[#0E131F]/60 border border-white/[0.08] rounded-3xl p-10 text-center space-y-3">
              <FolderOpen className="w-12 h-12 text-gray-600 mx-auto" />
              <p className="text-gray-300 font-medium">
                {searchQuery ? 'Tidak ada proyek yang sesuai dengan pencarian.' : 'Belum ada proyek aktif saat ini.'}
              </p>
              <p className="text-xs text-gray-500">Semua proyek yang telah lunas otomatis diarsipkan dari daftar aktif.</p>
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isExpanded = expandedIds.includes(proj.id);
              const validFiles = proj.files?.filter((f: any) => f.url && f.url.trim() !== '' && f.url !== '#loading') || [];
              const totalFilesCount = validFiles.length > 0 ? validFiles.length : (proj.link ? 1 : 0);

              return (
                <div 
                  key={proj.id}
                  className={`bg-[#0E131F] border rounded-2xl overflow-hidden transition-all duration-200 shadow-lg ${
                    isExpanded 
                      ? 'border-blue-500/40 ring-1 ring-blue-500/20' 
                      : 'border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {/* Card Header (Toggle Click) */}
                  <div 
                    onClick={() => toggleExpand(proj.id)}
                    className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors group"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {proj.documentType && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-wide">
                            {proj.documentType}
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.05] text-gray-400 border border-white/[0.06] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          {totalFilesCount} Berkas Tersedia
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-blue-400 transition-colors tracking-tight">
                        {proj.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                        {proj.client && (
                          <span className="flex items-center gap-1.5 text-gray-300">
                            <Calendar className="w-3.5 h-3.5 text-gray-500" /> {proj.client}
                          </span>
                        )}
                        {proj.pemrakarsa && (
                          <span className="flex items-center gap-1.5 text-gray-300">
                            <User className="w-3.5 h-3.5 text-gray-500" /> {proj.pemrakarsa}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.05]">
                      <span className="text-xs font-semibold text-blue-400 sm:hidden">
                        {isExpanded ? 'Tutup Berkas' : 'Buka Berkas'}
                      </span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isExpanded ? 'bg-blue-600 text-white rotate-180' : 'bg-white/[0.06] text-gray-400 group-hover:bg-white/[0.1] group-hover:text-white'
                      }`}>
                        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section */}
                  {isExpanded && (
                    <div className="border-t border-white/[0.08] bg-[#0A0D15] p-5 sm:p-6 space-y-5 animate-in fade-in duration-200">
                      
                      {/* Status Banner */}
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <p className="text-xs sm:text-sm text-gray-300">
                          Berkas resmi proyek telah lengkap dan diverifikasi. Silakan klik tombol <b>Lihat</b> untuk membaca dokumen atau <b>Unduh</b> untuk menyimpan berkas.
                        </p>
                      </div>

                      {/* Files List */}
                      <div className="space-y-3">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          Daftar Berkas Proyek ({totalFilesCount})
                        </p>

                        {validFiles.length > 0 ? (
                          validFiles.map((file: any, index: number) => {
                            const fileId = extractDriveId(file.url);
                            const isPreviewing = previewFileId === fileId;

                            return (
                              <div 
                                key={index} 
                                className="bg-[#0E131F] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm"
                              >
                                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                      <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-semibold text-white truncate">{file.title}</p>
                                      <p className="text-[11px] text-gray-500">Google Drive Document</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {fileId && (
                                      <button 
                                        onClick={() => {
                                          const nextState = isPreviewing ? null : fileId;
                                          setPreviewFileId(nextState);
                                          if (!isPreviewing) {
                                            logActivity('FILE_PREVIEW', `Melihat Pratinjau: ${file.title}`, `${consultant.name} melihat pratinjau berkas "${file.title}" pada proyek "${proj.title}".`);
                                          }
                                        }}
                                        className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                          isPreviewing 
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' 
                                            : 'bg-white/[0.06] text-gray-300 hover:bg-white/[0.1] hover:text-white'
                                        }`}
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        {isPreviewing ? 'Tutup' : 'Lihat'}
                                      </button>
                                    )}

                                    <a 
                                      href={fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : file.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={() => {
                                        logActivity('FILE_DOWNLOAD', `Mengunduh Berkas: ${file.title}`, `${consultant.name} mengunduh berkas "${file.title}" pada proyek "${proj.title}".`);
                                      }}
                                      className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 active:scale-95"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                      Unduh
                                    </a>
                                  </div>
                                </div>

                                {/* Embedded Google Drive Preview */}
                                {isPreviewing && fileId && (
                                  <div className="border-t border-white/[0.08] bg-black/60 p-2 sm:p-4 animate-in slide-in-from-top-2 duration-200">
                                    <div className="w-full h-[450px] sm:h-[550px] rounded-lg overflow-hidden border border-white/10 bg-[#0B0E14]">
                                      <iframe 
                                        src={`https://drive.google.com/file/d/${fileId}/preview`} 
                                        className="w-full h-full border-0"
                                        allow="autoplay"
                                      ></iframe>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : proj.link ? (
                          <div className="bg-[#0E131F] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">Dokumen Proyek</p>
                                <p className="text-[11px] text-gray-500">Tautan Berkas Cloud</p>
                              </div>
                            </div>
                            <a 
                              href={proj.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                logActivity('FILE_DOWNLOAD', `Mengunduh Berkas Utama`, `${consultant.name} membuka tautan berkas utama proyek "${proj.title}".`);
                              }}
                              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
                            >
                              <Download className="w-3.5 h-3.5" /> Unduh File
                            </a>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500 italic py-2">Belum ada file yang diunggah untuk proyek ini.</p>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Support & Contact Help Card */}
        <div className="bg-[#0E131F] border border-white/[0.08] rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-400" /> Butuh Bantuan atau Revisi Berkas?
            </h4>
            <p className="text-xs text-gray-400">
              Jika ada berkas yang perlu disesuaikan atau diperbaiki, Anda dapat langsung mengabari tim kami.
            </p>
          </div>
          <a 
            href={`https://wa.me/?text=${encodeURIComponent(`Halo, saya ${consultant.name}. Saya ingin menanyakan terkait berkas proyek di portal Assistenku.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2 transition-all shrink-0 active:scale-95"
          >
            <MessageCircle className="w-4 h-4" /> Hubungi via WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
