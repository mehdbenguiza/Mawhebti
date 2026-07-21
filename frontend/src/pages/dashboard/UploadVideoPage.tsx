import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoService } from '../../services/video.service';
import { useAuthStore } from '../../store/authStore';

export const UploadVideoPage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner une vidéo.');
      return;
    }
    
    setIsUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);
      
      await videoService.uploadVideo(formData);
      
      if (user?.role === 'TALENT_MINOR') {
        alert('Vidéo envoyée avec succès ! En attente de la validation de votre parent.');
      } else {
        alert('Vidéo envoyée avec succès ! Elle est en cours de traitement IA.');
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors du téléchargement.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 text-white font-sans">
      <div>
        <h2 className="text-3xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>Publier une vidéo</h2>
        <p className="text-gray-400 mt-2 text-sm">Montrez votre talent au monde ! 🌟</p>
      </div>

      <div className="bg-white/5 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-xl border border-white/10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm font-medium flex items-center gap-3">
              <span>⚠️</span> {error}
            </div>
          )}
          
          <div 
            className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 group cursor-pointer overflow-hidden ${file ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_30px_rgba(124,58,237,0.15)]' : 'border-white/20 hover:border-purple-400 bg-white/5 hover:bg-white/10'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {/* Background glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/0 to-blue-600/0 group-hover:from-purple-600/10 group-hover:to-blue-600/10 transition-colors pointer-events-none" />
            
            <input 
              type="file" 
              className="hidden" 
              accept="video/mp4,video/quicktime,video/webm" 
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="text-purple-300 relative z-10">
                <span className="text-5xl block mb-4 filter drop-shadow-lg">🎥</span>
                <p className="font-bold text-lg text-white mb-1">{file.name}</p>
                <p className="text-xs text-purple-200/60 uppercase tracking-wider">({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                <p className="text-xs mt-4 text-purple-400 group-hover:underline">Cliquez pour changer de fichier</p>
              </div>
            ) : (
              <div className="text-gray-400 relative z-10">
                <span className="text-5xl block mb-4 filter drop-shadow-md group-hover:scale-110 transition-transform">📥</span>
                <p className="font-bold text-white text-lg mb-1">Glissez-déposez votre vidéo ici</p>
                <p className="text-xs text-gray-500 mt-2">ou cliquez pour parcourir (MP4, MOV, WebM - Max 50MB)</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-gray-300 mb-2">Titre de la vidéo</label>
            <input
              id="title"
              type="text"
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm"
              placeholder="Ex: Mon audition de piano"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="desc" className="block text-sm font-semibold text-gray-300 mb-2">Description (Optionnel)</label>
            <textarea
              id="desc"
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all outline-none text-white placeholder-gray-600 text-sm resize-y"
              placeholder="Racontez l'histoire de cette vidéo, le contexte de votre performance..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-white/10 bg-white/5 text-gray-300 rounded-xl font-semibold hover:bg-white/10 hover:text-white transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 shadow-[0_0_20px_rgba(124,58,237,0.3)] text-white rounded-xl font-bold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm hover:scale-[1.02] active:scale-95"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                <>
                  Publier la vidéo 🚀
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
