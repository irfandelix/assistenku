'use client';

import { useEffect, useState, use } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Map as MapIcon, Users, FileText, ArrowRight, FolderOpen, Loader2 } from 'lucide-react';

export default function ConsultantPortalPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [consultant, setConsultant] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          const projData = projSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          
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
        <div className="bg-[#0a0c10] border border-gray-800 rounded-3xl p-8 mb-10 text-center relative overflow-hidden shadow-lg shadow-black/50">
          <div className="absolute top-0 left-0 w-full h-1 bg-accent-blue shadow-[0_0_10px_rgba(59,130,246,0.8)]"></div>
          <div className="w-20 h-20 bg-[#050608] rounded-full mx-auto flex items-center justify-center mb-5 border border-accent-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
            <Users className="w-10 h-10 text-accent-blue" />
          </div>
          <p className="text-accent-blue font-medium text-sm tracking-widest uppercase mb-1">Portal Konsultan</p>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">{consultant.name}</h1>
          <p className="text-sm text-gray-400">Berikut adalah daftar seluruh proyek yang Anda tugaskan kepada kami.</p>
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
            projects.map((proj) => (
              <a 
                key={proj.id}
                href={`/p/${proj.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-[#0a0c10] border border-gray-800 rounded-2xl p-6 hover:border-accent-blue/50 hover:bg-[#0f1117] transition-all group shadow-sm shadow-black/20"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-100 group-hover:text-accent-blue transition-colors mb-1">
                      {proj.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mt-2">
                      {proj.client && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-gray-500" /> {proj.client}
                        </span>
                      )}
                      {proj.documentType && (
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-gray-500" /> {proj.documentType}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-xl group-hover:bg-accent-blue group-hover:text-white text-gray-500 transition-colors shrink-0">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </a>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
