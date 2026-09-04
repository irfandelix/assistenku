'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Download, FileBox, ShieldCheck, Loader2 } from 'lucide-react';

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
          <p className="text-gray-400 text-sm">Disiapkan khusus untuk <strong className="text-gray-200">{project.client}</strong></p>
        </div>

        <div className="bg-[#050608] border border-gray-800 rounded-2xl p-5 mb-8 relative z-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-gray-400 leading-relaxed">
              File proyek Anda telah siap dan tersimpan dengan aman. Silakan klik tombol di bawah untuk mengunduh atau meninjau file melalui Google Drive.
            </p>
          </div>
        </div>

        <a 
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-accent-blue text-white py-4 px-6 rounded-xl font-bold hover:bg-blue-600 transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.3)] relative z-10"
        >
          <Download className="w-5 h-5" />
          Unduh File Proyek
        </a>

        <div className="mt-8 text-center relative z-10">
          <p className="text-xs text-gray-600">Dikirim secara otomatis melalui sistem manajemen proyek cerdas.</p>
        </div>
      </div>
    </div>
  );
}
