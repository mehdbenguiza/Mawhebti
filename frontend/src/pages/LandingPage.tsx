import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ─── Animated Counter ─── */
const AnimatedCounter: React.FC<{ target: number; suffix?: string; duration?: number }> = ({
  target, suffix = '', duration = 2000
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        const step = target / (duration / 16);
        let current = 0;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { setCount(target); clearInterval(timer); }
          else setCount(Math.floor(current));
        }, 16);
      }
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{count.toLocaleString('fr-FR')}{suffix}</span>;
};

/* ─── Main Landing Page ─── */
export const LandingPage: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="bg-[#0a0a0f] text-white min-h-screen overflow-x-hidden font-display">

      {/* ══════════ NAVBAR ══════════ */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-xl' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="text-2xl font-black gradient-text tracking-tight">
              Mawhebti
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Accueil</Link>
              <Link to="/feed" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Vidéos populaires</Link>
              <a href="#recruteurs" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">Recruteurs</a>
              <a href="#about" className="text-gray-300 hover:text-white text-sm font-medium transition-colors">À propos</a>
            </div>

            {/* CTA buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white border border-white/20 rounded-lg hover:border-white/40 transition-all">
                Se connecter
              </Link>
              <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all shadow-lg shadow-violet-500/25">
                Rejoindre →
              </Link>
            </div>

            {/* Mobile hamburger */}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-lg text-gray-300 hover:text-white">
              <div className={`w-5 h-0.5 bg-current transition-all mb-1 ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`}/>
              <div className={`w-5 h-0.5 bg-current transition-all mb-1 ${menuOpen ? 'opacity-0' : ''}`}/>
              <div className={`w-5 h-0.5 bg-current transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}/>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-3">
            <Link to="/feed" className="block text-gray-300 hover:text-white py-2">Vidéos populaires</Link>
            <a href="#recruteurs" className="block text-gray-300 hover:text-white py-2">Recruteurs</a>
            <a href="#about" className="block text-gray-300 hover:text-white py-2">À propos</a>
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link to="/login" className="text-center px-4 py-2 border border-white/20 rounded-lg text-sm font-semibold">Se connecter</Link>
              <Link to="/register" className="text-center px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-lg text-sm font-semibold">Rejoindre</Link>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="animate-blob animation-delay-0 absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl"/>
          <div className="animate-blob animation-delay-2000 absolute top-1/3 right-1/4 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl"/>
          <div className="animate-blob animation-delay-4000 absolute bottom-1/4 left-1/3 w-72 h-72 bg-teal-500/15 rounded-full blur-3xl"/>
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '64px 64px'
        }}/>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div className="animate-fadeInUp">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse"/>
                Plateforme sécurisée Zero Trust
              </div>

              <h1 className="font-display font-black text-5xl lg:text-7xl leading-tight mb-6">
                Connectez les{' '}
                <span className="gradient-text">talents</span>{' '}
                de demain
              </h1>

              <p className="text-gray-400 text-lg lg:text-xl leading-relaxed mb-10 max-w-lg">
                La première plateforme qui met en relation les jeunes talents avec des recruteurs professionnels,{' '}
                <span className="text-white font-semibold">en toute sécurité</span>.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/feed" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-bold text-lg hover:from-violet-500 hover:to-blue-500 transition-all shadow-2xl shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-105">
                  🎬 Explorer les talents
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/20 rounded-xl font-bold text-lg hover:border-white/40 hover:bg-white/5 transition-all">
                  Rejoindre la plateforme →
                </Link>
              </div>

              <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">✅ <span>Gratuit pour les talents</span></span>
                <span className="flex items-center gap-1.5">🛡️ <span>Protection mineurs</span></span>
                <span className="flex items-center gap-1.5">🤖 <span>IA intégrée</span></span>
              </div>
            </div>

            {/* Right: Mock video cards */}
            <div className="hidden lg:block relative h-96">
              {/* Main card */}
              <div className="absolute top-0 right-0 w-64 h-40 glass-card rounded-2xl overflow-hidden shadow-2xl glow-purple rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="h-full bg-gradient-to-br from-violet-600/40 to-blue-600/40 flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-400 to-blue-400"/>
                    <span className="text-xs font-semibold">@Sophia.Dance 🟢</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">Danse contemporaine · 14 ans</p>
                </div>
              </div>
              {/* Secondary card */}
              <div className="absolute top-24 right-32 w-52 h-36 glass-card rounded-2xl overflow-hidden shadow-xl -rotate-2 hover:rotate-0 transition-transform duration-500">
                <div className="h-full bg-gradient-to-br from-teal-600/40 to-green-600/40 flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-green-400"/>
                    <span className="text-xs font-semibold">@Karim.Music 🔵</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">Guitare classique · 17 ans</p>
                </div>
              </div>
              {/* Third card */}
              <div className="absolute bottom-4 right-8 w-60 h-36 glass-card rounded-2xl overflow-hidden shadow-xl rotate-1 hover:rotate-0 transition-transform duration-500">
                <div className="h-full bg-gradient-to-br from-orange-600/40 to-pink-600/40 flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-pink-400"/>
                    <span className="text-xs font-semibold">@Amina.Sport 🟢</span>
                  </div>
                  <p className="text-xs text-gray-300 mt-1">Athlétisme · 16 ans</p>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute top-8 left-0 glass-card rounded-xl px-4 py-2 shadow-lg">
                <p className="text-xs text-gray-400">Nouvelle demande</p>
                <p className="text-sm font-bold text-green-400">📩 Recruteur vérifié</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce text-gray-600">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section className="py-20 bg-[#0d0d15] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '🎭', value: 1247, label: 'Talents actifs', glow: 'glow-purple', color: 'from-violet-600/20 to-violet-800/10' },
              { icon: '🏢', value: 389,  label: 'Recruteurs vérifiés', glow: 'glow-blue', color: 'from-blue-600/20 to-blue-800/10' },
              { icon: '🎬', value: 4832, label: 'Vidéos publiées', glow: 'glow-teal', color: 'from-teal-600/20 to-teal-800/10' },
              { icon: '🛡️', value: 100, suffix: '%', label: 'Sécurisé', glow: 'glow-purple', color: 'from-green-600/20 to-green-800/10' },
            ].map((stat) => (
              <div key={stat.label} className={`glass-card ${stat.glow} rounded-2xl p-6 text-center bg-gradient-to-br ${stat.color} hover:scale-105 transition-transform duration-300`}>
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="font-display font-black text-4xl text-white mb-1">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix}/>
                </div>
                <div className="text-gray-400 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="about" className="py-24 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
              Comment ça <span className="gradient-text">fonctionne</span> ?
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              En trois étapes simples, du profil à la découverte par les meilleurs recruteurs.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 opacity-30"/>

            {[
              { step: '01', icon: '👤', title: 'Créez votre profil', desc: 'Inscrivez-vous gratuitement et créez votre profil de talent avec vos compétences et spécialités.', color: 'from-violet-600 to-purple-700' },
              { step: '02', icon: '🎬', title: 'Publiez vos talents', desc: 'Partagez vos meilleures vidéos. Notre IA analyse automatiquement votre contenu et le met en valeur.', color: 'from-blue-600 to-indigo-700' },
              { step: '03', icon: '🚀', title: 'Soyez découvert', desc: 'Les recruteurs professionnels vous contactent directement. Acceptez ou refusez en toute sécurité.', color: 'from-teal-500 to-cyan-600' },
            ].map((item) => (
              <div key={item.step} className="glass-card rounded-2xl p-8 text-center hover:scale-105 transition-transform duration-300 group">
                <div className={`w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                  {item.icon}
                </div>
                <div className="text-xs font-mono text-gray-600 mb-2">ÉTAPE {item.step}</div>
                <h3 className="font-display font-bold text-xl text-white mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ VALUES / FEATURES ══════════ */}
      <section className="py-24 bg-[#0d0d15]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
              Nos <span className="gradient-text">engagements</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Nous avons construit Mawhebti sur des valeurs fondamentales pour protéger tous les utilisateurs.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: '🛡️', title: 'Sécurité Zero Trust', desc: 'Chaque interaction est vérifiée. Les mineurs sont protégés par des systèmes de routage stricts.', glow: 'hover:glow-purple' },
              { icon: '🤖', title: 'Modération IA', desc: 'Chaque message est analysé par notre IA Gemini avant envoi. Aucun contenu inapproprié ne passe.', glow: 'hover:glow-blue' },
              { icon: '🔍', title: 'Transparence totale', desc: 'Toutes les actions critiques sont journalisées dans un AuditLog immuable et consultable.', glow: 'hover:glow-teal' },
              { icon: '👨‍👩‍👧', title: 'Protection parentale', desc: 'Le consentement du parent est obligatoire pour les talents mineurs. Aucun contournement possible.', glow: 'hover:glow-purple' },
              { icon: '🌟', title: 'Talents vérifiés', desc: 'Chaque profil est authentique. Les niveaux de vérification (Email, Téléphone, KYC) rassurent les recruteurs.', glow: 'hover:glow-blue' },
              { icon: '📊', title: 'Pipeline de recrutement', desc: 'Suivez chaque étape : Premier contact → Entretien → Offre. Un suivi structuré et professionnel.', glow: 'hover:glow-teal' },
            ].map((item) => (
              <div key={item.title} className={`glass-card rounded-2xl p-7 transition-all duration-300 hover:scale-105 hover:border-white/20 cursor-default`}>
                <div className="text-3xl mb-4">{item.icon}</div>
                <h3 className="font-display font-bold text-lg text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ POPULAR VIDEOS TEASER ══════════ */}
      <section className="py-24 bg-[#0a0a0f]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
              Découvrez nos <span className="gradient-text">talents</span>
            </h2>
            <p className="text-gray-400 text-lg">Des profils incroyables vous attendent.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {[
              { name: 'Sophia L.', tag: 'Danse · 14 ans', views: '12.4k', color: 'from-violet-600/60 to-pink-600/60', emoji: '💃' },
              { name: 'Karim B.', tag: 'Musique · 17 ans', views: '8.9k', color: 'from-blue-600/60 to-teal-600/60', emoji: '🎸' },
              { name: 'Amina D.', tag: 'Sport · 16 ans', views: '21.1k', color: 'from-orange-600/60 to-red-600/60', emoji: '⚽' },
            ].map((talent) => (
              <div key={talent.name} className="glass-card rounded-2xl overflow-hidden group cursor-pointer hover:scale-105 transition-transform duration-300">
                <div className={`h-48 bg-gradient-to-br ${talent.color} flex items-center justify-center text-6xl relative`}>
                  {talent.emoji}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"/>
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold">
                    👁 {talent.views}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-blue-400 flex items-center justify-center text-xs font-bold">
                      {talent.name[0]}
                    </div>
                    <span className="font-bold text-white">{talent.name}</span>
                    <span className="text-green-400 text-xs">🟢</span>
                  </div>
                  <p className="text-gray-400 text-xs ml-9">{talent.tag}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link to="/feed" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-bold text-lg hover:from-violet-500 hover:to-blue-500 transition-all shadow-2xl shadow-violet-500/30 hover:scale-105">
              Voir tous les talents →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════ CTA BANNER ══════════ */}
      <section id="recruteurs" className="py-24 bg-[#0d0d15] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="glass-card rounded-3xl p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 to-blue-600/10"/>
            <div className="relative z-10">
              <div className="text-5xl mb-6">🤝</div>
              <h2 className="font-display font-black text-4xl lg:text-5xl mb-4">
                Vous êtes <span className="gradient-text">recruteur</span> ?
              </h2>
              <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
                Rejoignez notre plateforme et accédez à des milliers de jeunes talents vérifiés. 
                Contactez-les en toute sécurité, en respectant leur protection.
              </p>
              <Link to="/register" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl font-bold text-lg hover:from-violet-500 hover:to-blue-500 transition-all shadow-2xl shadow-violet-500/30 hover:scale-105">
                Créer un compte recruteur →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="bg-[#070710] border-t border-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="text-2xl font-black gradient-text mb-3">Mawhebti</div>
              <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
                Connecter les talents, créer des opportunités, construire l'avenir — en toute sécurité.
              </p>
              <div className="flex gap-4 mt-6 text-xl">
                <span className="cursor-pointer hover:scale-125 transition-transform" title="Facebook">📘</span>
                <span className="cursor-pointer hover:scale-125 transition-transform" title="Twitter">🐦</span>
                <span className="cursor-pointer hover:scale-125 transition-transform" title="Instagram">📸</span>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Plateforme</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><Link to="/" className="hover:text-white transition-colors">Accueil</Link></li>
                <li><Link to="/feed" className="hover:text-white transition-colors">Explorer les talents</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">S'inscrire</Link></li>
                <li><Link to="/login" className="hover:text-white transition-colors">Se connecter</Link></li>
              </ul>
            </div>

            {/* Legal + contact */}
            <div>
              <h4 className="font-bold text-white mb-4 text-sm uppercase tracking-wider">Légal</h4>
              <ul className="space-y-2 text-gray-500 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">À propos</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Politique de confidentialité</a></li>
                <li><a href="mailto:contact@mawhebti.com" className="hover:text-white transition-colors">📧 contact@mawhebti.com</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-gray-600 text-sm">
            <p>© 2025 Mawhebti. Tous droits réservés.</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"/>
              <span>Tous les systèmes opérationnels</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
