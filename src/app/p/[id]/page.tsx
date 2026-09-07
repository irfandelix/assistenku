'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Download, FileBox, ShieldCheck, Loader2, Map as MapIcon, User, Phone, FileText, Eye } from 'lucide-react';

export default function PublicProjectPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const docRef = doc(db, 'projects', params.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProject({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0B0E14]">
        <Loader2 className="w-8 h-8 text-accent-blue animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0E14] p-4 text-center">
        <FileBox className="w-16 h-16 text-gray-700 mb-4" />
        <h1 className="text-xl font-bold text-gray-200">Proyek Tidak Ditemukan</h1>
        <p className="text-gray-500 mt-2">Link ini mungkin sudah kadaluarsa atau salah.</p>
      </div>
    );
  }

  const extractDriveId = (url: string) => {
    if (!url) return null;
    const matchD = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchD) return matchD[1];
    const matchId = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (matchId) return matchId[1];
    return null;
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
      <div className="w-full max-w-md bg-darkcard border border-gray-800 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex justify-center mb-6 relative z-10">
          <div className="w-16 h-16 bg-accent-blue/10 rounded-2xl flex items-center justify-center border border-accent-blue/20">
            <FileBox className="w-8 h-8 text-accent-blue" />
          </div>
        </div>

        <div className="text-center relative z-10 mb-8">
          <p className="text-accent-blue font-medium text-xs tracking-widest uppercase mb-2">Penyerahan Proyek</p>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{project.title}</h1>
          <p className="text-gray-400 text-sm">Tanggal Pembuatan: <strong className="text-gray-200">{project.client || '-'}</strong></p>
        </div>

        {/* Project Metadata Section */}
        {(project.documentType || project.pemrakarsa || project.consultantName) && (
          <div className="bg-[#050608] border border-gray-800 rounded-2xl p-4 mb-6 relative z-10 space-y-3">
            {project.documentType && (
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Jenis Dokumen</p>
                  <p className="text-sm text-gray-200 font-medium">{project.documentType}</p>
                </div>
              </div>
            )}
            {project.pemrakarsa && (
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Pemrakarsa</p>
                  <p className="text-sm text-gray-200 font-medium">{project.pemrakarsa}</p>
                </div>
              </div>
            )}
            {(project.consultantName || project.consultantNumber) && (
              <div className="flex items-start gap-3">
                <MapIcon className="w-4 h-4 text-gray-500 mt-1" />
                <div>
                  <p className="text-xs text-gray-500">Konsultan</p>
                  <p className="text-sm text-gray-200 font-medium">{project.consultantName || '-'}</p>
                  {project.consultantNumber && (
                    <p className="text-xs text-accent-blue mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {project.consultantNumber}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-[#050608] border border-gray-800 rounded-2xl p-5 mb-8 relative z-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400 leading-relaxed">
              File dan dokumen proyek Anda telah siap. Silakan klik tombol di bawah untuk mengunduhnya.
            </p>
          </div>
        </div>

        <div className="space-y-3 relative z-10">
          {project.files && project.files.length > 0 ? (
            project.files.map((file: any, index: number) => {
              if (!file.url || file.url.trim() === '' || file.url === '#loading') return null; // Skip empty placeholders
              const fileId = extractDriveId(file.url);
              
              return (
                <div key={index} className="w-full bg-accent-blue/10 border border-accent-blue/20 rounded-xl overflow-hidden flex flex-col mb-3">
                  <div className="px-5 py-4 border-b border-accent-blue/10 flex items-center justify-between">
                    <span className="font-medium text-gray-200 truncate pr-4">{file.title}</span>
                  </div>
                  <div className="flex bg-[#050608]/50">
                    {fileId && (
                      <a 
                        href={`https://drive.google.com/uc?export=view&id=${fileId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-3 text-center text-sm font-medium text-accent-blue hover:bg-accent-blue hover:text-white transition-colors border-r border-accent-blue/10 flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" /> Lihat
                      </a>
                    )}
                    <a 
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3 text-center text-sm font-medium text-accent-blue hover:bg-accent-blue hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Unduh
                    </a>
                  </div>
                </div>
              );
            })
          ) : project.link ? (
            <a 
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-accent-blue text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-600 transition-transform active:scale-95 flex items-center justify-between shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              <span>Unduh File Proyek</span>
              <Download className="w-5 h-5 shrink-0" />
            </a>
          ) : null}
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-xs text-gray-600">Dikirim secara otomatis melalui sistem manajemen proyek cerdas.</p>
        </div>
      </div>
    </div>
  );
}
