import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoService } from '../../../services/video.service';
import { useAuthStore } from '../../../store/authStore';

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
      
      // Si mineur, on le dit, sinon on le dit
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
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Publier une nouvelle vidéo</h2>
        <p className="text-gray-600 mt-1">Montrez votre talent au monde ! 🌟</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-medium">
              {error}
            </div>
          )}
          
          <div 
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${file ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400 bg-gray-50'}`}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              className="hidden" 
              accept="video/mp4,video/quicktime,video/webm" 
              ref={fileInputRef}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="text-purple-700">
                <span className="text-4xl block mb-2">🎥</span>
                <p className="font-semibold">{file.name}</p>
                <p className="text-sm opacity-80">({(file.size / (1024 * 1024)).toFixed(2)} MB)</p>
                <p className="text-sm mt-2 cursor-pointer hover:underline">Cliquez pour changer de fichier</p>
              </div>
            ) : (
              <div className="text-gray-500 cursor-pointer">
                <span className="text-4xl block mb-2">📥</span>
                <p className="font-semibold text-gray-700">Glissez-déposez votre vidéo ici</p>
                <p className="text-sm mt-1">ou cliquez pour parcourir (MP4, MOV, WebM - Max 50MB)</p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titre de la vidéo</label>
            <input
              id="title"
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
              placeholder="Ex: Mon audition de piano"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
            <textarea
              id="desc"
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors outline-none"
              placeholder="Racontez l'histoire de cette vidéo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Envoi en cours...
                </>
              ) : (
                'Publier la vidéo'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
