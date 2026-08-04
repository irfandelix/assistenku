'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Save, Trash2, Edit3, MapPin, Star, Utensils, DollarSign, ChevronLeft } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function FoodCatalogPage() {
  const [foods, setFoods] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentFood, setCurrentFood] = useState({ id: '', name: '', rating: 5, price: '$$', location: '', review: '', imageUrl: '' });

  useEffect(() => {
    const q = query(collection(db, 'foods'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setFoods(data);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentFood.name.trim()) return;
    
    // Transform GDrive links to direct image links
    let finalImageUrl = currentFood.imageUrl;
    if (finalImageUrl.includes('drive.google.com/file/d/')) {
      const match = finalImageUrl.match(/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        finalImageUrl = `https://drive.google.com/uc?id=${match[1]}`;
      }
    }

    try {
      if (currentFood.id) {
        await updateDoc(doc(db, 'foods', currentFood.id), {
          name: currentFood.name,
          rating: currentFood.rating,
          price: currentFood.price,
          location: currentFood.location,
          review: currentFood.review,
          imageUrl: finalImageUrl
        });
      } else {
        await addDoc(collection(db, 'foods'), {
          name: currentFood.name,
          rating: currentFood.rating,
          price: currentFood.price,
          location: currentFood.location,
          review: currentFood.review,
          imageUrl: finalImageUrl,
          createdAt: serverTimestamp()
        });
      }
      setIsEditing(false);
    } catch (error: any) {
      alert('Gagal menyimpan: ' + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus tempat makan ini dari katalog?')) {
      try {
        await deleteDoc(doc(db, 'foods', id));
        setIsEditing(false);
      } catch (error: any) {
        alert('Gagal menghapus: ' + error.message);
      }
    }
  };

  const openEditor = (food: any = null) => {
    if (food) {
      setCurrentFood({ ...food, imageUrl: food.imageUrl || '' });
    } else {
      setCurrentFood({ id: '', name: '', rating: 5, price: '$$', location: '', review: '', imageUrl: '' });
    }
    setIsEditing(true);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={cn("w-4 h-4", i < rating ? "fill-yellow-500 text-yellow-500" : "fill-gray-800 text-gray-800")} />
    ));
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        <Link href="/more" className="p-2 bg-darkcard border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors">
          <ChevronLeft className="w-5 h-5 text-gray-300" />
        </Link>
        <div className="flex-1">
          <p className="text-orange-500 font-medium text-sm tracking-widest uppercase mb-1">Wisata Kuliner</p>
          <h1 className="text-2xl font-bold text-gray-100">Katalog Tempat Makan</h1>
        </div>
        <button 
          onClick={() => openEditor()}
          className="bg-orange-500 text-[#0B0E14] p-3 rounded-xl shadow-lg hover:bg-orange-600 transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-5 h-5 font-bold" />
        </button>
      </header>

      {isEditing && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-darkcard border border-gray-800 w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-100">{currentFood.id ? 'Edit Tempat Makan' : 'Tambah Tempat Makan'}</h2>
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-500 hover:bg-gray-800 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Nama Tempat Makan</label>
                <input 
                  type="text"
                  value={currentFood.name}
                  onChange={e => setCurrentFood({...currentFood, name: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  placeholder="Misal: Sate Klatak Pak Pong"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Link Foto (Google Drive / URL Bebas)</label>
                <input 
                  type="text"
                  value={currentFood.imageUrl}
                  onChange={e => setCurrentFood({...currentFood, imageUrl: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  placeholder="Paste link foto dari Google Drive di sini..."
                />
                <p className="text-xs text-gray-500 mt-1">Pastikan link Google Drive Anda disetting ke "Anyone with the link".</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Rating (1-5)</label>
                  <input 
                    type="number"
                    min="1" max="5"
                    value={currentFood.rating}
                    onChange={e => setCurrentFood({...currentFood, rating: parseInt(e.target.value) || 1})}
                    className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-400">Harga</label>
                  <select 
                    value={currentFood.price}
                    onChange={e => setCurrentFood({...currentFood, price: e.target.value})}
                    className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors appearance-none"
                  >
                    <option value="$">Murah ($)</option>
                    <option value="$$">Sedang ($$)</option>
                    <option value="$$$">Mahal ($$$)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Lokasi / Alamat</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={currentFood.location}
                    onChange={e => setCurrentFood({...currentFood, location: e.target.value})}
                    className="flex-1 bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors"
                    placeholder="Bisa alamat atau link Google Maps"
                  />
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const lat = position.coords.latitude;
                            const lng = position.coords.longitude;
                            const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
                            setCurrentFood({...currentFood, location: mapsLink});
                          }, 
                          (error) => {
                            alert("Gagal mengambil lokasi. Error: " + error.message + ". Pastikan izin lokasi (GPS) di browser/HP Anda aktif.");
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      } else {
                        alert("Browser Anda tidak mendukung fitur lokasi.");
                      }
                    }}
                    title="Gunakan lokasi saya saat ini"
                    className="bg-gray-800 text-orange-500 hover:bg-gray-700 px-4 rounded-xl transition-colors flex items-center justify-center"
                  >
                    <MapPin className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-400">Review / Menu Wajib Pesan</label>
                <textarea 
                  value={currentFood.review}
                  onChange={e => setCurrentFood({...currentFood, review: e.target.value})}
                  className="w-full bg-[#050608] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 outline-none focus:border-orange-500 transition-colors min-h-[100px] resize-none"
                  placeholder="Kesan makan di sini..."
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              {currentFood.id ? (
                <button onClick={() => handleDelete(currentFood.id)} className="text-red-500 font-medium hover:text-red-400 flex items-center gap-1 p-2">
                  <Trash2 className="w-4 h-4" /> Hapus
                </button>
              ) : <div></div>}
              <button 
                onClick={handleSave}
                className="bg-orange-500 text-[#0B0E14] px-6 py-3 rounded-xl font-bold hover:bg-orange-600 flex items-center gap-2 transition-colors active:scale-95"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid for Foods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {foods.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-12 border border-dashed border-gray-800 rounded-3xl">
            <Utensils className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada tempat makan enak yang dicatat.</p>
          </div>
        )}
        
        {foods.map((food) => (
          <div 
            key={food.id} 
            className="bg-darkcard border border-gray-800 rounded-2xl relative overflow-hidden flex flex-col group hover:border-gray-700 transition-all"
          >
            {food.imageUrl ? (
              <div className="w-full h-40 bg-gray-900 relative">
                <img src={food.imageUrl} alt={food.name} className="w-full h-full object-cover" />
                <button onClick={() => openEditor(food)} className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded-lg text-gray-300 hover:text-white transition-colors">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none -mr-4 -mt-4" />
            )}
            
            <div className="p-5 flex-1 flex flex-col">
              {!food.imageUrl && (
                <div className="flex justify-between items-start mb-3 relative z-10">
                  <h3 className="text-lg font-bold text-gray-100 pr-8 leading-tight">{food.name}</h3>
                  <button onClick={() => openEditor(food)} className="absolute top-0 right-0 p-1 bg-gray-800/50 rounded-lg text-gray-400 hover:text-white transition-colors">
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              )}
              {food.imageUrl && (
                <h3 className="text-lg font-bold text-gray-100 mb-3 leading-tight">{food.name}</h3>
              )}
              
              <div className="flex items-center gap-4 mb-4 relative z-10">
                <div className="flex items-center gap-1">
                  {renderStars(food.rating)}
                </div>
                <div className="flex items-center gap-1 text-green-500 text-sm font-bold bg-green-500/10 px-2 py-0.5 rounded">
                  {food.price}
                </div>
              </div>

              {food.location && (
                <div className="flex items-start gap-2 text-sm text-gray-400 mb-4 bg-[#050608] p-3 rounded-xl border border-gray-800 relative z-10">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  {food.location.startsWith('http') ? (
                    <a href={food.location} target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline line-clamp-2 break-all">
                      Buka di Google Maps
                    </a>
                  ) : (
                    <p className="line-clamp-2">{food.location}</p>
                  )}
                </div>
              )}
              
              {food.review && (
                <div className="text-gray-300 text-sm leading-relaxed border-l-2 border-orange-500/30 pl-3 italic relative z-10">
                  "{food.review}"
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
