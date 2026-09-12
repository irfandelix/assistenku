'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Map as MapIcon, Users, FileText, ArrowRight, FolderOpen, Loader2, Calendar, ChevronDown, ChevronUp, Download, Eye, ShieldCheck, User, Phone, CheckCircle2, MessageCircle } from 'lucide-react';

export default function ConsultantPortalPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [consultant, setConsultant] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
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
          // Sort locally by creation date descending
          projData.sort((a: any, b: any) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
          });
          
          setProjects(projData);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020305] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
          <p className="text-gray-400 font-medium">Memuat data konsultan...</p>
        </div>
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="min-h-screen bg-[#020305] text-white flex items-center justify-center">
        <div className="text-center space-y-3">
          <Users className="w-12 h-12 text-gray-600 mx-auto" />
          <h1 className="text-2xl font-bold">Konsultan Tidak Ditemukan</h1>
          <p className="text-gray-400">Link ini mungkin salah atau sudah tidak aktif.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050608] text-white pb-20 selection:bg-accent-blue/30 relative">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 pt-8 sm:pt-12 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Header Profile */}
        <div className="bg-[#0a0c10] border border-gray-800 rounded-3xl p-6 sm:p-8 mb-8 sm:mb-10 text-center relative overflow-hidden shadow-lg shadow-black/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#050608] rounded-full mx-auto flex items-center justify-center mb-4 sm:mb-5 border border-accent-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-accent-blue" />
          </div>
          <p className="text-accent-blue font-medium text-sm tracking-widest uppercase mb-1">Portal Konsultan</p>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{consultant.name}</h1>
          <p className="text-sm text-gray-400">Berikut adalah daftar seluruh proyek aktif yang Anda tugaskan kepada kami.</p>
        </div>

        {/* Project List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
            <FolderOpen className="w-5 h-5 text-gray-400" /> 
            Daftar Proyek ({projects.length})
          </h2>

          {projects.length === 0 ? (
            <div className="bg-[#050608] border border-gray-800 rounded-2xl p-8 text-center">
              <FileText className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400">Belum ada proyek yang Anda tugaskan kepada kami saat ini.</p>
            </div>
          ) : (
            projects.map((proj) => {
              const isExpanded = expandedIds.includes(proj.id);
              
              return (
              <div 
                key={proj.id}
                className="bg-[#0a0c10] border border-gray-800 rounded-2xl overflow-hidden shadow-sm shadow-black/20 transition-all"
              >
                {/* Header (Click to toggle) */}
                <div 
                  onClick={() => toggleExpand(proj.id)}
                  className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-5 sm:p-6 hover:bg-[#0f1117] transition-all cursor-pointer group"
                >
                  <div>
                    <h3 className="text-lg font-bold text-gray-100 group-hover:text-accent-blue transition-colors mb-1">
                      {proj.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-400 mt-2">
                      {proj.client && (
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" /> {proj.client}
                        </span>
                      )}
                      {proj.documentType && (
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" /> {proj.documentType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-2 sm:p-3 bg-gray-900 rounded-xl group-hover:bg-accent-blue group-hover:text-white text-gray-500 transition-colors shrink-0 self-end sm:self-auto">
                    {isExpanded ? <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" /> : <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                </div>

                {/* Expanded Content (Same as Client Portal) */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 border-t border-gray-800 bg-[#050608] animate-in slide-in-from-top-2 duration-300">
                    
                    {(proj.client || proj.documentType || proj.pemrakarsa || proj.consultantName) && (
                      <div className="bg-[#0a0c10] border border-gray-800 rounded-2xl p-4 mb-6 space-y-3">
                        {proj.client && (
                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Tanggal Pembuatan</p>
                              <p className="text-sm text-gray-200 font-medium">{proj.client}</p>
                            </div>
                          </div>
                        )}
                        {proj.documentType && (
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Jenis Dokumen</p>
                              <p className="text-sm text-gray-200 font-medium">{proj.documentType}</p>
                            </div>
                          </div>
                        )}
                        {proj.pemrakarsa && (
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-xs text-gray-500">Pemrakarsa</p>
                              <p className="text-sm text-gray-200 font-medium">{proj.pemrakarsa}</p>
                            </div>
                          </div>
                        )}
                        {(proj.consultantName || proj.consultantNumber) && (
                          <div className="flex items-start gap-3">
                            <MapIcon className="w-4 h-4 text-gray-500 mt-1" />
                            <div>
                              <p className="text-xs text-gray-500">Konsultan</p>
                              <p className="text-sm text-gray-200 font-medium">{proj.consultantName || '-'}</p>
                              {proj.consultantNumber && (
                                <p className="text-xs text-accent-blue mt-0.5 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {proj.consultantNumber}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="bg-[#0a0c10] border border-gray-800 rounded-2xl p-5 mb-6">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-400 leading-relaxed text-justify">
                          File dan dokumen proyek Anda telah siap. Silakan klik tombol di bawah untuk mengunduhnya.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {proj.files && proj.files.length > 0 ? (
                        proj.files.map((file: any, index: number) => {
                          if (!file.url || file.url.trim() === '' || file.url === '#loading') return null;
                          const fileId = extractDriveId(file.url);
                          
                          return (
                            <div key={index} className="w-full bg-accent-blue/10 border border-accent-blue/20 rounded-xl overflow-hidden flex flex-col mb-3">
                              <div className="px-5 py-4 border-b border-accent-blue/10 flex items-center justify-between">
                                <span className="font-medium text-gray-200 truncate pr-4">{file.title}</span>
                              </div>
                              <div className="flex bg-[#050608]/50">
                                {fileId && (
                                  <button 
                                    onClick={() => setPreviewFileId(previewFileId === fileId ? null : fileId)}
                                    className="flex-1 py-3 text-center text-sm font-medium text-accent-blue hover:bg-accent-blue hover:text-white transition-colors border-r border-accent-blue/10 flex items-center justify-center gap-2"
                                  >
                                    <Eye className="w-4 h-4" /> {previewFileId === fileId ? 'Tutup Preview' : 'Lihat'}
                                  </button>
                                )}
                                <a 
                                  href={fileId ? `https://drive.google.com/uc?export=download&id=${fileId}` : file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-3 text-center text-sm font-medium text-accent-blue hover:bg-accent-blue hover:text-white transition-colors flex items-center justify-center gap-2"
                                >
                                  <Download className="w-4 h-4" /> Unduh
                                </a>
                              </div>
                              
                              {previewFileId === fileId && (
                                <div className="w-full h-[400px] border-t border-accent-blue/20 bg-gray-900 animate-in slide-in-from-top-2 duration-300">
                                  <iframe 
                                    src={`https://drive.google.com/file/d/${fileId}/preview`} 
                                    className="w-full h-full border-0"
                                    allow="autoplay"
                                  ></iframe>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : proj.link ? (
                        <a 
                          href={proj.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-accent-blue text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-600 transition-transform active:scale-95 flex items-center justify-between shadow-[0_0_20px_rgba(37,99,235,0.2)]"
                        >
                          <span>Unduh File Proyek</span>
                          <Download className="w-5 h-5 shrink-0" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            )})
          )}
        </div>

      </div>
    </div>
  );
}
