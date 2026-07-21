import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ─────────────────────────────────────────────────────────────
   ANIMATED COUNTER HOOK
───────────────────────────────────────────────────────────── */
function useCounter(end: number, duration: number = 2000, start: boolean = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, end, duration]);
  return count;
}

/* ─────────────────────────────────────────────────────────────
   INTERSECTION OBSERVER HOOK
───────────────────────────────────────────────────────────── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD COMPONENT
───────────────────────────────────────────────────────────── */
interface StatCardProps {
  icon: string;
  value: number;
  suffix: string;
  label: string;
  color: string;
  glowColor: string;
  started: boolean;
}

function StatCard({ icon, value, suffix, label, color, glowColor, started }: StatCardProps) {
  const count = useCounter(value, 2200, started);
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-500"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered ? color : 'rgba(255,255,255,0.08)'}`,
        backdropFilter: 'blur(12px)',
        boxShadow: hovered ? `0 0 40px 6px ${glowColor}` : '0 0 0 0 transparent',
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <div
        className="text-4xl font-black mb-1"
        style={{ color, fontFamily: "'Outfit', sans-serif" }}
      >
        {count.toLocaleString('fr-FR')}{suffix}
      </div>
      <div className="text-gray-400 text-sm font-medium">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   VIDEO CARD COMPONENT
───────────────────────────────────────────────────────────── */
interface VideoCardProps {
  gradient: string;
  name: string;
  talent: string;
  views: string;
  emoji: string;
  delay: number;
  inView: boolean;
}

function VideoCard({ gradient, name, talent, views, emoji, delay, inView }: VideoCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        backdropFilter: 'blur(12px)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `all 0.7s ease ${delay}ms`,
        boxShadow: hovered ? '0 20px 60px rgba(124,58,237,0.25)' : '0 0 0 transparent',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div
        className="relative h-52 flex items-center justify-center overflow-hidden"
        style={{ background: gradient }}
      >
        <div
          className="text-8xl transition-transform duration-500"
          style={{ transform: hovered ? 'scale(1.12)' : 'scale(1)', opacity: 0.85 }}
        >
          {emoji}
        </div>
        {/* Play overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center bg-black/25 transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center border border-white/30"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
          >
            <svg className="w-7 h-7 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* Talent badge */}
        <div
          className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold text-white"
          style={{ background: 'rgba(124,58,237,0.85)', backdropFilter: 'blur(8px)' }}
        >
          {talent}
        </div>
        {/* Views badge */}
        <div
          className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
        >
          👁 {views}
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <h3 className="text-white font-semibold text-sm mb-2">{name}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-gray-400 text-xs">En ligne</span>
          </div>
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'rgba(20,184,166,0.15)', color: '#14b8a6' }}
          >
            Vérifié ✓
          </span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   FEATURE CARD COMPONENT
───────────────────────────────────────────────────────────── */
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  color: string;
  delay: number;
  inView: boolean;
}

function FeatureCard({ icon, title, description, color, delay, inView }: FeatureCardProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden"
      style={{
        background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)',
        border: `1px solid ${hovered ? `${color}50` : 'rgba(255,255,255,0.07)'}`,
        backdropFilter: 'blur(8px)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms, background 0.3s, border 0.3s`,
        boxShadow: hovered ? `0 10px 40px ${color}20` : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Corner glow */}
      <div
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full transition-opacity duration-500"
        style={{
          background: color,
          filter: 'blur(30px)',
          opacity: hovered ? 0.15 : 0,
        }}
      />
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 relative z-10"
        style={{ background: `${color}20`, border: `1px solid ${color}40` }}
      >
        {icon}
      </div>
      <h3 className="text-white font-bold text-base mb-2 relative z-10">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed relative z-10">{description}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN LANDING PAGE
───────────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const statsRef = useInView(0.2);
  const howItWorksRef = useInView(0.1);
  const featuresRef = useInView(0.1);
  const videosRef = useInView(0.1);
  const ctaRef = useInView(0.2);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const stats = [
    { icon: '🎭', value: 1247, suffix: '', label: 'Talents actifs', color: '#7c3aed', glowColor: 'rgba(124,58,237,0.35)' },
    { icon: '🏢', value: 389, suffix: '', label: 'Recruteurs vérifiés', color: '#2563eb', glowColor: 'rgba(37,99,235,0.35)' },
    { icon: '🎬', value: 4832, suffix: '', label: 'Vidéos publiées', color: '#14b8a6', glowColor: 'rgba(20,184,166,0.35)' },
    { icon: '🛡️', value: 100, suffix: '%', label: 'Sécurisé', color: '#f59e0b', glowColor: 'rgba(245,158,11,0.35)' },
  ];

  const features = [
    {
      icon: '🛡️',
      title: 'Sécurité Zero Trust',
      description: 'Architecture Zero Trust garantissant la protection des mineurs à chaque étape du parcours. Aucune exception.',
      color: '#7c3aed',
    },
    {
      icon: '🤖',
      title: 'Modération IA',
      description: "Chaque message et contenu est analysé par notre IA avant publication pour éliminer tout risque de contenu inapproprié.",
      color: '#2563eb',
    },
    {
      icon: '🔍',
      title: 'Transparence totale',
      description: "Audit complet de chaque action sur la plateforme. Un journal immuable garantit que rien n'est caché.",
      color: '#14b8a6',
    },
    {
      icon: '👨‍👩‍👧',
      title: 'Protection parentale',
      description: 'Le consentement parental est obligatoire pour les mineurs. Les parents restent maîtres du processus de bout en bout.',
      color: '#f59e0b',
    },
    {
      icon: '🌟',
      title: 'Talents vérifiés',
      description: "Chaque profil est authentifié par email, téléphone et KYC. Fini les faux comptes — seulement de vrais talents.",
      color: '#ec4899',
    },
    {
      icon: '📊',
      title: 'Pipeline de recrutement',
      description: 'Suivi complet : premier contact, entretien, offre, contrat. Tout est structuré et tracé en temps réel.',
      color: '#06b6d4',
    },
  ];

  const videos = [
    {
      gradient: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 100%)',
      name: 'Sofia Benali – Chant lyrique',
      talent: 'Chant',
      views: '12,4k',
      emoji: '🎤',
    },
    {
      gradient: 'linear-gradient(135deg,#0ea5e9 0%,#14b8a6 100%)',
      name: 'Karim Ouali – Danse contemporaine',
      talent: 'Danse',
      views: '8,7k',
      emoji: '💃',
    },
    {
      gradient: 'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)',
      name: 'Lina Meziani – Football féminin',
      talent: 'Sport',
      views: '21,2k',
      emoji: '⚽',
    },
  ];

  const steps = [
    {
      number: '01',
      title: 'Créez votre profil',
      desc: "Inscrivez-vous gratuitement en quelques minutes. Partagez vos informations, vos spécialités et obtenez votre badge de talent vérifié.",
      icon: '✨',
      color: '#7c3aed',
    },
    {
      number: '02',
      title: 'Publiez vos talents',
      desc: "Uploadez vos meilleures vidéos. Notre IA modère automatiquement le contenu pour garantir un environnement sain et sécurisé.",
      icon: '🎬',
      color: '#2563eb',
    },
    {
      number: '03',
      title: 'Soyez découvert',
      desc: "Les recruteurs professionnels parcourent les profils et vous contactent directement. Votre carrière commence ici.",
      icon: '🚀',
      color: '#14b8a6',
    },
  ];

  return (
    <div
      className="min-h-screen overflow-x-hidden"
      style={{ backgroundColor: '#0a0a0f', fontFamily: "'Inter', sans-serif", color: '#ffffff' }}
    >

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'rgba(10,10,15,0.9)' : 'rgba(10,10,15,0.3)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
          boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="flex-shrink-0 group flex items-center gap-2">
              <img
                src="/logo.png"
                alt="Mawhebti"
                className="h-9 w-9 object-contain transition-transform duration-200 group-hover:scale-110"
                style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.4))' }}
              />
              <span
                className="text-xl font-black tracking-tight transition-opacity duration-200 group-hover:opacity-80 hidden sm:block"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Mawhebti
              </span>
            </Link>


            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Accueil', to: '/' },
                { label: 'Vidéos Populaires', to: '/feed' },
                { label: 'Recruteurs', to: '/register' },
                { label: 'À propos', to: '#about' },
              ].map(({ label, to }) => (
                <Link
                  key={label}
                  to={to}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200 relative group"
                >
                  {label}
                  <span
                    className="absolute -bottom-0.5 left-0 w-0 h-0.5 group-hover:w-full transition-all duration-300 rounded-full"
                    style={{ background: 'linear-gradient(90deg,#7c3aed,#2563eb)' }}
                  />
                </Link>
              ))}
            </div>

            {/* Desktop CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all duration-200"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                className="px-5 py-2 text-sm font-semibold text-white rounded-xl transition-all duration-300 hover:opacity-90 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  boxShadow: '0 0 20px rgba(124,58,237,0.35)',
                }}
              >
                Rejoindre →
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Ouvrir le menu"
            >
              <div
                className="w-5 h-0.5 bg-current mb-1 transition-all duration-300 origin-center"
                style={{ transform: menuOpen ? 'rotate(45deg) translate(2px,5px)' : 'none' }}
              />
              <div
                className="w-5 h-0.5 bg-current mb-1 transition-all duration-300"
                style={{ opacity: menuOpen ? 0 : 1 }}
              />
              <div
                className="w-5 h-0.5 bg-current transition-all duration-300 origin-center"
                style={{ transform: menuOpen ? 'rotate(-45deg) translate(2px,-5px)' : 'none' }}
              />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className="md:hidden overflow-hidden transition-all duration-400"
          style={{
            maxHeight: menuOpen ? '380px' : '0',
            background: 'rgba(10,10,15,0.97)',
            backdropFilter: 'blur(24px)',
          }}
        >
          <div className="px-4 pb-5 pt-3 space-y-1.5 border-t border-white/5">
            {[
              { label: 'Accueil', to: '/' },
              { label: 'Vidéos Populaires', to: '/feed' },
              { label: 'Recruteurs', to: '/register' },
              { label: 'À propos', to: '#about' },
            ].map(({ label, to }) => (
              <Link
                key={label}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                {label}
              </Link>
            ))}
            <div className="pt-3 flex flex-col gap-2 border-t border-white/5">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-semibold text-gray-200 text-center rounded-xl border border-white/12 hover:bg-white/5 transition-all"
              >
                Se connecter
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-sm font-bold text-white text-center rounded-xl transition-all"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
              >
                Rejoindre →
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ═══════════════ HERO SECTION ═══════════════ */}
      <section
        className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
        style={{ backgroundColor: '#0a0a0f' }}
      >
        {/* Animated gradient blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute rounded-full animate-blob"
            style={{
              width: '700px',
              height: '700px',
              top: '-200px',
              left: '-200px',
              background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 65%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            className="absolute rounded-full animate-blob animation-delay-2000"
            style={{
              width: '580px',
              height: '580px',
              top: '150px',
              right: '-150px',
              background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 65%)',
              filter: 'blur(50px)',
            }}
          />
          <div
            className="absolute rounded-full animate-blob animation-delay-4000"
            style={{
              width: '450px',
              height: '450px',
              bottom: '0',
              left: '35%',
              background: 'radial-gradient(circle, rgba(20,184,166,0.15) 0%, transparent 65%)',
              filter: 'blur(50px)',
            }}
          />
        </div>

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`,
            backgroundSize: '64px 64px',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* ── Left: Headline + CTAs ── */}
            <div className="animate-fadeInUp">
              {/* Platform badge */}
              <div
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-semibold mb-8"
                style={{
                  background: 'rgba(124,58,237,0.12)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  color: '#a78bfa',
                }}
              >
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                🇹🇳 Plateforme #1 des jeunes talents en Tunisie
              </div>

              {/* Main headline */}
              <h1
                className="font-black leading-tight mb-6"
                style={{ fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(2.8rem, 6vw, 4.5rem)' }}
              >
                <span className="text-white">Connectez les</span>
                <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg,#7c3aed 0%,#2563eb 55%,#14b8a6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  talents de demain
                </span>
              </h1>

              <p className="text-gray-400 text-lg leading-relaxed mb-10 max-w-lg">
                La première plateforme qui met en relation les jeunes talents avec des recruteurs
                professionnels,{' '}
                <span className="text-white font-semibold">en toute sécurité</span>.
                Chanteurs, danseurs, sportifs, musiciens — votre scène vous attend.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/feed"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white rounded-xl transition-all duration-300 hover:opacity-90 hover:-translate-y-1"
                  style={{
                    background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                    boxShadow: '0 0 35px rgba(124,58,237,0.45)',
                  }}
                >
                  🎬 Explorer les talents
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white rounded-xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-1"
                  style={{
                    border: '1px solid rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.04)',
                  }}
                >
                  Rejoindre la plateforme →
                </Link>
              </div>

              {/* Trust row */}
              <div className="flex flex-wrap items-center gap-6 mt-10">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="text-green-400">✅</span> Gratuit pour les talents
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>🛡️</span> Protection mineurs
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span>🤖</span> IA intégrée
                </div>
              </div>
            </div>

            {/* ── Right: Floating mockup cards ── */}
            <div
              className="hidden lg:block relative"
              style={{ height: '520px' }}
            >
              {/* Main talent card */}
              <div
                className="absolute"
                style={{
                  width: '270px',
                  top: '30px',
                  left: '50%',
                  marginLeft: '-135px',
                  animation: 'floatCenter 6s ease-in-out infinite',
                  zIndex: 3,
                }}
              >
                <div
                  className="rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(24px)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.6), 0 0 60px rgba(124,58,237,0.15)',
                  }}
                >
                  <div
                    className="h-40 flex items-center justify-center text-7xl"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                  >
                    🎤
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)' }}
                      >
                        S
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-bold truncate">Sofia Benali</p>
                        <p className="text-gray-400 text-xs">Chanteuse • Tunis</p>
                      </div>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style={{ background: 'rgba(20,184,166,0.2)', color: '#14b8a6' }}
                      >
                        ✓ Vérifié
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>👁 12,4k vues</span>
                      <span>❤️ 847 likes</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Left secondary card */}
              <div
                className="absolute"
                style={{
                  width: '200px',
                  top: '195px',
                  left: '10px',
                  animation: 'floatLeft 8s ease-in-out infinite 1.2s',
                  zIndex: 2,
                }}
              >
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div
                    className="h-28 flex items-center justify-center text-5xl"
                    style={{ background: 'linear-gradient(135deg,#0ea5e9,#14b8a6)' }}
                  >
                    💃
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-bold">Karim Ouali</p>
                    <p className="text-gray-400 text-xs">Danseur • Sfax</p>
                  </div>
                </div>
              </div>

              {/* Right secondary card */}
              <div
                className="absolute"
                style={{
                  width: '200px',
                  top: '195px',
                  right: '10px',
                  animation: 'floatRight 9s ease-in-out infinite 2.5s',
                  zIndex: 2,
                }}
              >
                <div
                  className="rounded-xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <div
                    className="h-28 flex items-center justify-center text-5xl"
                    style={{ background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }}
                  >
                    ⚽
                  </div>
                  <div className="p-3">
                    <p className="text-white text-xs font-bold">Lina Meziani</p>
                    <p className="text-gray-400 text-xs">Footballeuse • Sousse</p>
                  </div>
                </div>
              </div>

              {/* Recruiter notification badge */}
              <div
                className="absolute"
                style={{
                  bottom: '24px',
                  left: '50%',
                  marginLeft: '-160px',
                  animation: 'floatCenter 7s ease-in-out infinite 0.8s',
                  zIndex: 4,
                }}
              >
                <div
                  className="flex items-center gap-3 px-5 py-3 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <span className="text-2xl">🏢</span>
                  <div>
                    <p className="text-white text-xs font-bold">Nouveau recruteur</p>
                    <p className="text-gray-400 text-xs">TalentAgency Pro vous contacte…</p>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse ml-1 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-600 animate-bounce">
          <span className="text-xs font-medium">Défiler</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ═══════════════ STATS SECTION ═══════════════ */}
      <section style={{ backgroundColor: '#0d0d14' }} className="py-24 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={statsRef.ref}>
            <div className="text-center mb-14">
              <h2
                className="text-3xl sm:text-4xl font-black text-white mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                La plateforme en chiffres
              </h2>
              <p className="text-gray-400 text-base max-w-lg mx-auto">
                Des milliers de talents ont déjà fait confiance à Mawhebti pour lancer leur carrière.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} started={statsRef.inView} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section style={{ backgroundColor: '#0a0a0f' }} className="py-24 relative overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div ref={howItWorksRef.ref}>
            <div className="text-center mb-16">
              <span
                className="inline-block text-xs font-bold tracking-widest uppercase mb-5 px-3 py-1.5 rounded-full"
                style={{ color: '#14b8a6', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)' }}
              >
                Comment ça marche
              </span>
              <h2
                className="text-3xl sm:text-4xl font-black text-white mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Trois étapes vers le succès
              </h2>
              <p className="text-gray-400 text-base max-w-lg mx-auto">
                De votre inscription à votre premier contrat, nous vous accompagnons à chaque étape.
              </p>
            </div>

            <div className="relative grid lg:grid-cols-3 gap-10">
              {/* Desktop connector line */}
              <div
                className="hidden lg:block absolute top-14 left-[16.66%] right-[16.66%] h-px"
                style={{ background: 'linear-gradient(90deg,#7c3aed,#2563eb,#14b8a6)', opacity: 0.25 }}
              />

              {steps.map((step, i) => (
                <div
                  key={step.number}
                  className="text-center"
                  style={{
                    opacity: howItWorksRef.inView ? 1 : 0,
                    transform: howItWorksRef.inView ? 'translateY(0)' : 'translateY(40px)',
                    transition: `all 0.75s ease ${i * 200}ms`,
                  }}
                >
                  {/* Step number circle */}
                  <div className="inline-flex items-center justify-center mb-6 relative">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black border-2"
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        background: `${step.color}18`,
                        borderColor: step.color,
                        color: step.color,
                        boxShadow: `0 0 35px ${step.color}35`,
                      }}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-5"
                    style={{ background: `${step.color}15`, border: `1px solid ${step.color}30` }}
                  >
                    {step.icon}
                  </div>

                  <h3
                    className="text-white text-xl font-bold mb-3"
                    style={{ fontFamily: "'Outfit', sans-serif" }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES GRID ═══════════════ */}
      <section style={{ backgroundColor: '#0d0d14' }} className="py-24" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div ref={featuresRef.ref}>
            <div className="text-center mb-16">
              <span
                className="inline-block text-xs font-bold tracking-widest uppercase mb-5 px-3 py-1.5 rounded-full"
                style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}
              >
                Nos engagements
              </span>
              <h2
                className="text-3xl sm:text-4xl font-black text-white mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Sécurité & Excellence
              </h2>
              <p className="text-gray-400 text-base max-w-xl mx-auto">
                Chaque fonctionnalité de Mawhebti est conçue avec la protection des mineurs comme priorité absolue.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((feat, i) => (
                <FeatureCard
                  key={feat.title}
                  {...feat}
                  delay={i * 90}
                  inView={featuresRef.inView}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ POPULAR VIDEOS TEASER ═══════════════ */}
      <section style={{ backgroundColor: '#0a0a0f' }} className="py-24 relative overflow-hidden">
        {/* Top line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.6),transparent)' }}
        />
        {/* Bottom radial */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: '-80px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '600px',
            height: '300px',
            background: 'radial-gradient(ellipse, rgba(124,58,237,0.07) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div ref={videosRef.ref}>
            <div className="text-center mb-16">
              <span
                className="inline-block text-xs font-bold tracking-widest uppercase mb-5 px-3 py-1.5 rounded-full"
                style={{ color: '#14b8a6', background: 'rgba(20,184,166,0.1)', border: '1px solid rgba(20,184,166,0.25)' }}
              >
                À la une
              </span>
              <h2
                className="text-3xl sm:text-4xl font-black text-white mb-4"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Découvrez nos talents
              </h2>
              <p className="text-gray-400 text-base max-w-lg mx-auto">
                Des milliers de vidéos de jeunes talents qui n'attendent qu'à être découverts.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {videos.map((video, i) => (
                <VideoCard
                  key={video.name}
                  {...video}
                  delay={i * 150}
                  inView={videosRef.inView}
                />
              ))}
            </div>

            <div className="text-center mt-14">
              <Link
                to="/feed"
                className="inline-flex items-center gap-3 px-10 py-4 text-base font-bold text-white rounded-xl transition-all duration-300 hover:opacity-90 hover:-translate-y-1"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  boxShadow: '0 0 40px rgba(124,58,237,0.4)',
                }}
              >
                Voir tous les talents
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ CTA BANNER ═══════════════ */}
      <section className="py-24 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg,rgba(124,58,237,0.12) 0%,rgba(37,99,235,0.12) 50%,rgba(20,184,166,0.08) 100%)',
          }}
        />
        <div className="absolute inset-0" style={{ background: 'rgba(10,10,15,0.55)' }} />
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(124,58,237,0.4),transparent)' }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(90deg,transparent,rgba(37,99,235,0.4),transparent)' }}
        />

        <div
          ref={ctaRef.ref}
          className="relative max-w-4xl mx-auto px-4 text-center"
          style={{
            opacity: ctaRef.inView ? 1 : 0,
            transform: ctaRef.inView ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 0.8s ease',
          }}
        >
          <div className="text-5xl mb-6">🤝</div>
          <h2
            className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Prêt à révéler votre talent ?
          </h2>
          <p className="text-gray-300 text-lg mb-10 max-w-2xl mx-auto">
            Rejoignez Mawhebti aujourd'hui. Créez votre profil gratuitement et commencez à être
            découvert par des recruteurs professionnels dès maintenant.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-10 py-4 text-base font-bold text-white rounded-xl transition-all duration-300 hover:opacity-90 hover:-translate-y-1"
              style={{
                background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                boxShadow: '0 0 40px rgba(124,58,237,0.45)',
              }}
            >
              Commencer gratuitement →
            </Link>
            <Link
              to="/feed"
              className="px-10 py-4 text-base font-bold text-white rounded-xl transition-all duration-300 hover:bg-white/10 hover:-translate-y-1"
              style={{
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              Explorer les talents
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer
        className="py-16"
        style={{ backgroundColor: '#060609', borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">

            {/* Brand column */}
            <div className="lg:col-span-2">
              <span
                className="text-3xl font-black tracking-tight block mb-4"
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Mawhebti
              </span>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs mb-6">
                La première plateforme sécurisée qui connecte les jeunes talents avec des recruteurs
                professionnels. Protéger, Révéler, Réussir.
              </p>
              <div className="flex items-center gap-3">
                {[
                  { emoji: '📘', label: 'Facebook' },
                  { emoji: '🐦', label: 'Twitter' },
                  { emoji: '📸', label: 'Instagram' },
                ].map(({ emoji, label }) => (
                  <button
                    key={label}
                    aria-label={label}
                    title={label}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      const btn = e.currentTarget;
                      btn.style.background = 'rgba(124,58,237,0.15)';
                      btn.style.borderColor = 'rgba(124,58,237,0.35)';
                    }}
                    onMouseLeave={(e) => {
                      const btn = e.currentTarget;
                      btn.style.background = 'rgba(255,255,255,0.04)';
                      btn.style.borderColor = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Navigation column */}
            <div>
              <h4
                className="text-white font-semibold text-xs uppercase tracking-widest mb-5"
              >
                Navigation
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Accueil', to: '/' },
                  { label: 'À propos', to: '#about' },
                  { label: 'Vidéos populaires', to: '/feed' },
                  { label: "S'inscrire", to: '/register' },
                ].map(({ label, to }) => (
                  <li key={label}>
                    <Link
                      to={to}
                      className="text-gray-500 hover:text-gray-200 text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full transition-colors duration-200 group-hover:bg-purple-500"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                      />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal column */}
            <div>
              <h4 className="text-white font-semibold text-xs uppercase tracking-widest mb-5">
                Légal & Contact
              </h4>
              <ul className="space-y-3 mb-6">
                {[
                  { label: "Conditions d'utilisation", href: '#' },
                  { label: 'Politique de confidentialité', href: '#' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <a
                      href={href}
                      className="text-gray-500 hover:text-gray-200 text-sm transition-colors duration-200 flex items-center gap-2 group"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full transition-colors duration-200 group-hover:bg-blue-500"
                        style={{ background: 'rgba(255,255,255,0.15)' }}
                      />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
              <div
                className="p-3.5 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <p className="text-gray-600 text-xs mb-1 font-medium">Contact</p>
                <a
                  href="mailto:contact@mawhebti.com"
                  className="text-purple-400 hover:text-purple-300 text-sm font-semibold transition-colors"
                >
                  contact@mawhebti.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div
            className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-gray-600 text-sm">
              © 2025{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 600,
                }}
              >
                Mawhebti
              </span>
              . Tous droits réservés.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-gray-600 text-xs">Tous les systèmes opérationnels</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ─────── Floating animation keyframes ─────── */}
      <style>{`
        @keyframes floatCenter {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }
        @keyframes floatLeft {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-14px); }
        }
        @keyframes floatRight {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px); }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
