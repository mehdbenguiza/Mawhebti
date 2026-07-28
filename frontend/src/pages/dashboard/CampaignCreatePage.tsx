import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const CATEGORIES = [
  { value: 'musique', label: '🎵 Musique', desc: 'Albums, concerts, instruments' },
  { value: 'sport', label: '⚽ Sport', desc: 'Équipements, compétitions, entraînements' },
  { value: 'art', label: '🎨 Art & Design', desc: 'Expositions, matériel, formations' },
  { value: 'education', label: '📚 Éducation', desc: 'Études, livres, formations' },
  { value: 'technologie', label: '💻 Technologie', desc: 'Projets tech, startups' },
  { value: 'culture', label: '🎭 Culture', desc: 'Théâtre, cinéma, patrimoine' },
  { value: 'sante', label: '🏥 Santé', desc: 'Traitements, bien-être' },
  { value: 'autre', label: '✨ Autre', desc: 'Projets divers' },
];

export function CampaignCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    target_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    currency: 'TND',
    visibility: 'PUBLIC',
    location: 'Tunisie',
  });

  const set = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const totalSteps = 3;

  const isStep1Valid = form.title.trim().length >= 5 && form.category !== '';
  const isStep2Valid =
    form.description.trim().length >= 20 &&
    parseFloat(form.target_amount) >= 50 &&
    parseFloat(form.target_amount) <= 300000 &&
    form.end_date !== '';
  const isStep3Valid = true;

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...form,
        target_amount: parseFloat(form.target_amount),
        beneficiary_id: 'self',
        owner_type: 'TALENT',
        beneficiary_type: 'PERSON',
      };
      await api.post('/campaigns/', payload);
      navigate('../overview', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erreur lors de la création de la campagne.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 max-w-3xl mx-auto text-white font-sans">

      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-4 transition-colors"
        >
          ← Retour
        </button>
        <h1 className="text-3xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
          💰 Créer une Campagne
        </h1>
        <p className="text-gray-400 mt-1">Lancez votre collecte de fonds en quelques étapes</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                step > s
                  ? 'bg-purple-600 border-purple-600 text-white'
                  : step === s
                  ? 'border-purple-500 text-purple-400 bg-purple-500/20'
                  : 'border-white/20 text-gray-600'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step >= s ? 'text-white' : 'text-gray-600'}`}>
                {s === 1 ? 'Informations' : s === 2 ? 'Objectifs & Dates' : 'Vérification'}
              </span>
              {s < totalSteps && <div className={`flex-1 h-0.5 mx-3 ${step > s ? 'bg-purple-600' : 'bg-white/10'}`} style={{ width: '60px' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl">

        {/* STEP 1 : Infos de base */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
              📝 Informations de base
            </h2>

            {/* Titre */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Titre de la campagne *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="Ex: Achat d'un guitare pour mes concerts..."
                maxLength={255}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: form.title.length > 0 && form.title.length < 5
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p className="text-xs text-gray-600 mt-1">{form.title.length}/255 caractères (min. 5)</p>
            </div>

            {/* Catégorie */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">
                Catégorie *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => set('category', cat.value)}
                    className="p-3 rounded-xl border text-left transition-all"
                    style={{
                      background: form.category === cat.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      border: form.category === cat.value ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="text-lg mb-1">{cat.label.split(' ')[0]}</div>
                    <div className="text-xs font-semibold text-white">{cat.label.split(' ').slice(1).join(' ')}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 leading-tight">{cat.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Localisation */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                📍 Localisation
              </label>
              <input
                type="text"
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="Ex: Tunis, Sfax, Sousse..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        )}

        {/* STEP 2 : Objectifs & Dates */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
              🎯 Objectifs & Dates
            </h2>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Description de votre projet *
              </label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={5}
                placeholder="Décrivez votre projet, pourquoi vous avez besoin de financement, comment les fonds seront utilisés..."
                className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all resize-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: form.description.length > 0 && form.description.length < 20
                    ? '1px solid rgba(239,68,68,0.5)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => { e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
              />
              <p className="text-xs text-gray-600 mt-1">{form.description.length} caractères (min. 20)</p>
            </div>

            {/* Objectif financier */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                💵 Objectif financier (TND) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={form.target_amount}
                  onChange={e => set('target_amount', e.target.value)}
                  placeholder="Ex: 5000"
                  min={50}
                  max={300000}
                  className="w-full pl-4 pr-16 py-3 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                  onFocus={e => { e.currentTarget.style.border = '1px solid rgba(124,58,237,0.6)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                  onBlur={e => { e.currentTarget.style.border = '1px solid rgba(255,255,255,0.1)'; e.currentTarget.style.boxShadow = 'none'; }}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 font-bold text-sm">TND</span>
              </div>
              <div className="flex gap-3 mt-2">
                {[500, 2000, 5000, 10000].map(amount => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => set('target_amount', String(amount))}
                    className="text-xs px-3 py-1 rounded-lg border border-white/10 text-gray-400 hover:border-purple-500/40 hover:text-purple-400 transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  >
                    {amount.toLocaleString()} TND
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-1">Min : 50 TND — Max : 300 000 TND</p>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">📅 Date de début *</label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={e => set('start_date', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">📅 Date de fin *</label>
                <input
                  type="date"
                  value={form.end_date}
                  onChange={e => set('end_date', e.target.value)}
                  min={form.start_date}
                  className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: form.end_date === '' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.1)', colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Visibilité */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-3">👁️ Visibilité</label>
              <div className="flex gap-3">
                {[
                  { value: 'PUBLIC', label: '🌍 Publique', desc: 'Visible par tous' },
                  { value: 'PRIVATE', label: '🔒 Privée', desc: 'Lien uniquement' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('visibility', opt.value)}
                    className="flex-1 p-4 rounded-xl border text-left transition-all"
                    style={{
                      background: form.visibility === opt.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                      border: form.visibility === opt.value ? '1px solid rgba(124,58,237,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                  >
                    <div className="text-sm font-bold text-white">{opt.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 : Vérification */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black" style={{ fontFamily: "'Outfit', sans-serif" }}>
              ✅ Vérification avant publication
            </h2>

            <div className="space-y-4">
              {[
                { label: 'Titre', value: form.title },
                { label: 'Catégorie', value: CATEGORIES.find(c => c.value === form.category)?.label || '' },
                { label: 'Localisation', value: form.location || 'Non spécifiée' },
                { label: 'Objectif', value: `${parseFloat(form.target_amount || '0').toLocaleString()} TND` },
                { label: 'Devise', value: '🇹🇳 Dinar Tunisien (TND)' },
                { label: 'Période', value: `Du ${form.start_date} au ${form.end_date}` },
                { label: 'Visibilité', value: form.visibility === 'PUBLIC' ? '🌍 Publique' : '🔒 Privée' },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center py-3 border-b border-white/5">
                  <span className="text-gray-400 text-sm">{item.label}</span>
                  <span className="text-white font-medium text-sm">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex gap-3">
              <span className="text-purple-400 text-lg shrink-0">ℹ️</span>
              <div>
                <p className="text-purple-300 font-bold text-sm">Processus de validation</p>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Votre campagne sera soumise en statut <strong className="text-white">BROUILLON</strong>. 
                  Vous devrez ensuite demander une révision pour qu'un administrateur l'approuve et la rende publique.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:border-white/30 hover:text-white transition-all text-sm font-medium"
          >
            {step === 1 ? 'Annuler' : '← Précédent'}
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={(step === 1 && !isStep1Valid) || (step === 2 && !isStep2Valid)}
              className="px-8 py-2.5 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
            >
              Suivant →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-8 py-2.5 rounded-xl text-white font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Création...
                </>
              ) : (
                '🚀 Créer ma campagne'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
