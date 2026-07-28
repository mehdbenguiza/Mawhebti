import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

const CATEGORIES = ['Musique', 'Sport', 'Art', 'Éducation', 'Technologie', 'Culture', 'Santé', 'Autre'];

export const CampaignEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    location: '',
    cover_image: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign-edit', id],
    queryFn: async () => {
      const { data } = await api.get(`/campaigns/${id}`);
      return data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (campaign) {
      setForm({
        title: campaign.title || '',
        description: campaign.description || '',
        category: campaign.category || '',
        location: campaign.location || '',
        cover_image: campaign.cover_image || '',
      });
    }
  }, [campaign]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Le titre est obligatoire.'); return; }
    if (!form.description.trim() || form.description.trim().length < 20) {
      setError('La description doit contenir au moins 20 caractères.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.put(`/campaigns/${id}`, form);
      setSaved(true);
      setTimeout(() => navigate(`/campaigns/${id}`), 1200);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Erreur lors de la modification.');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = campaign?.status === 'ACTIVE';

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white font-sans">

      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0a0a0f]/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors">
            ← Retour
          </button>
          <span className="text-white font-bold text-sm" style={{ fontFamily: "'Outfit', sans-serif" }}>✏️ Modifier la campagne</span>
          <span className="text-xs text-gray-500">ID: {id?.slice(0, 8)}...</span>
        </div>
      </nav>

      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8">

        {/* Note si ACTIVE */}
        {isActive && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <span className="text-blue-400 text-lg shrink-0">ℹ️</span>
            <div>
              <p className="text-blue-300 text-sm font-semibold">Campagne active</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Vous pouvez modifier le titre, la description, la catégorie et la localisation.
                Les montants et informations financières ne peuvent pas être modifiés.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md space-y-6">
          <h1 className="text-xl font-black text-white" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Modifier la campagne
          </h1>

          {/* Titre */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
              Titre de la campagne *
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              maxLength={100}
              required
              placeholder="Ex: Tournée musicale à Tunis 2025"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
            />
            <p className="text-[10px] text-gray-600 mt-1 text-right">{form.title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
              Description *
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Décrivez votre projet en détail : objectifs, utilisation des fonds, impact attendu..."
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none placeholder-gray-600"
            />
            <div className="flex justify-between mt-1">
              <p className="text-[10px] text-gray-600">Minimum 20 caractères</p>
              <p className="text-[10px] text-gray-600">{form.description.length} chars</p>
            </div>
          </div>

          {/* Catégorie + Localisation */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                Catégorie
              </label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
              >
                <option value="">Choisir...</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
                Localisation
              </label>
              <input
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Ex: Tunis, Sfax..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
              />
            </div>
          </div>

          {/* Image de couverture */}
          <div>
            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 block">
              Image de couverture (URL)
            </label>
            <input
              name="cover_image"
              value={form.cover_image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors placeholder-gray-600"
            />
          </div>

          {/* Champs non modifiables si ACTIVE */}
          {isActive && (
            <div className="bg-black/20 border border-white/5 rounded-xl p-4">
              <p className="text-xs text-gray-500 font-bold mb-2">🔒 Champs non modifiables (campagne active)</p>
              <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
                <div>Objectif : <span className="text-gray-400 font-semibold">{campaign?.target_amount?.toLocaleString('fr-TN')} TND</span></div>
                <div>Devise : <span className="text-gray-400 font-semibold">TND</span></div>
                <div>Statut : <span className="text-green-400 font-semibold">ACTIVE</span></div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2">
              <span>⚠️</span><span>{error}</span>
            </div>
          )}

          {saved && (
            <div className="p-3.5 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm flex items-center gap-2">
              <span>✅</span><span>Modifications sauvegardées ! Redirection en cours...</span>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || saved}
              className="flex-1 py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 hover:opacity-90 rounded-xl text-white font-black text-sm transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sauvegarde...
                </span>
              ) : '💾 Sauvegarder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
