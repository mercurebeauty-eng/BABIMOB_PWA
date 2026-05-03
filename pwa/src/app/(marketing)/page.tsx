'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── DESIGN TOKENS (référence uniquement, appliqués via var(--x)) ─────
const fT = 'var(--font-syne), system-ui, sans-serif';      // Syne - titres
const fB = 'var(--font-lexend), system-ui, sans-serif';     // Lexend - corps

// ── DATA ─────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: '01',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    title: 'Ouvre l\'app',
    desc: 'Lance BABIMOB, partage ta position en un tap. L\'app détecte ta commune et les lignes autour de toi instantanément.',
  },
  {
    n: '02',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    title: 'Cherche ta ligne',
    desc: 'Gbaka, wôrô-wôrô, bus — cherche par numéro, quartier ou terminus. Les tarifs réels du terrain, pas des estimations.',
  },
  {
    n: '03',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    title: 'Pars en confiance',
    desc: 'Lis les avis de la communauté, gagne des XP, deviens une référence dans ton quartier. Le transport, enfin social.',
  },
];

const FEATURES = [
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    color: 'var(--orange)',
    title: 'Suivi en temps réel',
    desc: 'Carte interactive avec les lignes, arrêts et segments dynamiques. Sais exactement où tu en es.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    color: 'var(--gold)',
    title: 'Points XP & Récompenses',
    desc: 'Chaque check-in, chaque avis, chaque confirmation de tarif te rapporte des XP. Débloque des cadeaux et des statuts.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    color: 'var(--blue)',
    title: 'Avis multi-catégories',
    desc: 'Propreté, ponctualité, sécurité — les Gbairais notent tout. Lis les retours vrais avant de monter.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    color: 'var(--green)',
    title: 'Arrêts favoris',
    desc: 'Enregistre tes arrêts du quotidien. Accès direct, infos actualisées, zéro temps perdu chaque matin.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="2" x2="12" y2="12"/><path d="m4.93 4.93 2.83 2.83"/>
      </svg>
    ),
    color: 'var(--orange)',
    title: 'Boussole intelligente',
    desc: 'Orientation GPS temps réel. Trouve le bon côté de la route même dans les quartiers que tu ne connais pas.',
  },
  {
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="3" width="15" height="13" rx="2"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
      </svg>
    ),
    color: 'var(--blue)',
    title: 'Segmentation dynamique',
    desc: 'Visualise les segments de ta ligne, sélectionne ton tronçon et paie exactement le bon prix, jamais plus.',
  },
];

const REVIEWS = [
  { id: 'r1', name: 'Koffi J.', city: 'Yopougon', avatar: 'KJ', rating: 5,   comment: "Enfin une app qui comprend le terrain ! Plus besoin d'attendre 2h un gbaka qui ne vient pas.", upvotes: 42  },
  { id: 'r2', name: 'Awa D.',   city: 'Cocody',    avatar: 'AD', rating: 4.5, comment: "Les tarifs sont super précis. Ça m'a sauvé pas mal d'argent sur mes trajets du quotidien.", upvotes: 28  },
  { id: 'r3', name: 'Moussa S.',city: 'Adjamé',    avatar: 'MS', rating: 5,   comment: "Le système de points XP est addictif. Je suis déjà « Légende de Yopougon » !", upvotes: 156 },
  { id: 'r4', name: 'Sery G.',  city: 'Plateau',   avatar: 'SG', rating: 4,   comment: "Top pour voir si les carrefours sont propres avant de sortir. Indispensable à Abidjan.", upvotes: 19  },
  { id: 'r5', name: 'Esther B.',city: 'Marcory',   avatar: 'EB', rating: 5,   comment: "L'interface est magnifique. On sent que c'est fait pour nous, par des gens qui connaissent Babi.", upvotes: 84  },
  { id: 'r6', name: 'Issa K.',  city: 'Abobo',     avatar: 'IK', rating: 4.5, comment: "Les arrêts favoris me font gagner un temps fou le matin. Je ne peux plus m'en passer.", upvotes: 37  },
  { id: 'r7', name: 'Fatou Z.', city: 'Treichville',avatar:'FZ', rating: 5,   comment: "Une révolution pour le transport informel. On est enfin organisés, c'est historique.", upvotes: 92  },
];

const STATS = [
  { value: '197 000', label: 'Mobeurs actifs', suffix: '+' },
  { value: '340',     label: 'Lignes couvertes', suffix: '+' },
  { value: '8 200',   label: 'Arrêts répertoriés', suffix: '+' },
  { value: '4.8',     label: 'Note moyenne', suffix: '/5' },
];

// ── HOOKS ─────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// ── SUB-COMPONENTS ────────────────────────────────────────────────────

/** Fade + slide-up au scroll */
function Reveal({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, inView } = useInView();
  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(36px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Étoiles 0-5, demi-étoile supportée */
function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }} aria-label={`Note ${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((s) => {
        const full = s <= Math.floor(rating);
        const half = !full && s === Math.ceil(rating) && rating % 1 !== 0;
        const id = `hg-${s}-${rating}`;
        return (
          <svg key={s} width={size} height={size} viewBox="0 0 24 24">
            <defs>
              <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
                <stop offset="50%" stopColor="var(--gold)" />
                <stop offset="50%" stopColor="var(--line)" />
              </linearGradient>
            </defs>
            <path
              d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1L12 2z"
              fill={full ? 'var(--gold)' : half ? `url(#${id})` : 'none'}
              stroke={full || half ? 'var(--gold)' : 'var(--line)'}
              strokeWidth="1.5"
            />
          </svg>
        );
      })}
    </div>
  );
}

/** Bouton d'installation PWA — disparaît si pas disponible, redirige vers /app sinon */
function PWAInstallButton({ size = 'md', dark = false }: { size?: 'sm' | 'md' | 'lg'; dark?: boolean }) {
  const [prompt, setPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => { window.removeEventListener('beforeinstallprompt', handler); };
  }, []);

  const install = async () => {
    if (!prompt) { window.location.href = '/app'; return; }
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') { setPrompt(null); setInstalled(true); }
  };

  const pad = size === 'lg' ? '18px 40px' : size === 'sm' ? '10px 20px' : '13px 28px';
  const fs  = size === 'lg' ? 18 : size === 'sm' ? 13 : 15;

  return (
    <button
      onClick={install}
      aria-label="Installer l'application BABIMOB"
      className={dark ? 'pwa-btn-dark' : 'pwa-btn'}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 10,
        background: dark ? '#fff' : 'var(--orange)',
        color: dark ? 'var(--orange)' : '#fff',
        border: 'none', borderRadius: 99, padding: pad, fontSize: fs,
        fontWeight: 800, fontFamily: fB, cursor: 'pointer',
        boxShadow: dark ? '0 4px 20px rgba(0,0,0,0.15)' : '0 6px 20px rgba(242,108,26,0.3)',
        transition: 'all 0.22s ease', whiteSpace: 'nowrap',
      }}
    >
      <svg width={fs + 2} height={fs + 2} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      {installed ? 'Application installée ✓' : 'Installer l\'app'}
    </button>
  );
}

/** Avatar coloré avec initiales */
function Avatar({ initials, seed }: { initials: string; seed: number }) {
  const colors = ['var(--orange)', 'var(--blue)', 'var(--green)', 'var(--gold)'];
  const bg = colors[seed % colors.length];
  return (
    <div style={{
      width: 42, height: 42, borderRadius: '50%', background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: 14, fontFamily: fT, flexShrink: 0,
    }}>
      {initials}
    </div>
  );
}

/** Carte témoignage avec upvote persisté en localStorage */
function TestimonialCard({ review, idx }: { review: typeof REVIEWS[0]; idx: number }) {
  const [upvotes, setUpvotes]       = useState(review.upvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    // Assure un userId stable par session
    if (!localStorage.getItem('bm_uid')) {
      localStorage.setItem('bm_uid', Math.random().toString(36).slice(2));
    }
    const voted = JSON.parse(localStorage.getItem('bm_votes') || '{}');
    if (voted[review.id]) setHasUpvoted(true);
  }, [review.id]);

  const toggle = () => {
    const voted = JSON.parse(localStorage.getItem('bm_votes') || '{}');
    if (hasUpvoted) {
      setUpvotes((v) => v - 1);
      delete voted[review.id];
    } else {
      setUpvotes((v) => v + 1);
      voted[review.id] = true;
    }
    setHasUpvoted((h) => !h);
    localStorage.setItem('bm_votes', JSON.stringify(voted));
  };

  return (
    <div className="tcard" style={{
      background: 'var(--cream)', border: '1.5px solid var(--line)',
      borderRadius: 24, padding: '28px 28px 22px', display: 'flex',
      flexDirection: 'column', gap: 16,
    }}>
      {/* En-tête auteur */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Avatar initials={review.avatar} seed={idx} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15, fontFamily: fT, color: 'var(--ink)' }}>
            {review.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>
            Mobeur · {review.city}
          </div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <StarRating rating={review.rating} />
        </div>
      </div>

      {/* Contenu */}
      <p style={{
        color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.7,
        fontFamily: fB, flex: 1, margin: 0,
      }}>
        &ldquo;{review.comment}&rdquo;
      </p>

      {/* Upvote */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <button
          onClick={toggle}
          aria-label={hasUpvoted ? 'Retirer mon vote' : 'Voter pour cet avis'}
          aria-pressed={hasUpvoted}
          className="upvote-btn"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: hasUpvoted ? 'var(--orange)' : 'rgba(139,126,110,0.12)',
            border: hasUpvoted ? '1.5px solid var(--orange)' : '1.5px solid var(--line)',
            borderRadius: 99, padding: '6px 14px',
            color: hasUpvoted ? '#fff' : 'var(--ink-2)',
            fontWeight: 700, fontSize: 13, fontFamily: fB, cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: 15 }}>👍</span>
          <span>{upvotes}</span>
        </button>
        <span style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500 }}>
          Utile
        </span>
      </div>
    </div>
  );
}

/** Illustration hero — carte stylisée avec lignes de transport */
function HeroIllustration() {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '4/3' }}>
      {/* Fond carte */}
      <svg viewBox="0 0 480 360" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        {/* Fond */}
        <rect width="480" height="360" rx="32" fill="var(--cream-2)" />
        <rect width="480" height="360" rx="32" fill="none" stroke="var(--line)" strokeWidth="1.5" />

        {/* Grille de rues */}
        <g opacity="0.25" stroke="var(--ink)" strokeWidth="1">
          <line x1="0" y1="90" x2="480" y2="90"/>
          <line x1="0" y1="180" x2="480" y2="180"/>
          <line x1="0" y1="270" x2="480" y2="270"/>
          <line x1="120" y1="0" x2="120" y2="360"/>
          <line x1="240" y1="0" x2="240" y2="360"/>
          <line x1="360" y1="0" x2="360" y2="360"/>
        </g>

        {/* Ligne orange principale (gbaka) */}
        <path d="M 40 270 C 100 270 120 220 180 200 S 280 160 360 130 L 440 110"
          fill="none" stroke="var(--orange)" strokeWidth="5" strokeLinecap="round"
          opacity="0.9" />
        {/* Ligne bleue (wôrô) */}
        <path d="M 40 180 C 100 200 160 180 240 160 S 360 140 440 200"
          fill="none" stroke="var(--blue)" strokeWidth="5" strokeLinecap="round"
          opacity="0.7" />
        {/* Ligne verte */}
        <path d="M 120 40 C 140 100 160 130 180 180 S 200 240 220 300"
          fill="none" stroke="var(--green)" strokeWidth="4" strokeLinecap="round"
          opacity="0.6" />

        {/* Arrêts ligne orange */}
        {[[40,270],[180,200],[300,145],[440,110]].map(([x,y], i) => (
          <g key={`o${i}`}>
            <circle cx={x} cy={y} r="9" fill="white" stroke="var(--orange)" strokeWidth="3"/>
            <circle cx={x} cy={y} r="4" fill="var(--orange)"/>
          </g>
        ))}
        {/* Arrêts ligne bleue */}
        {[[40,180],[240,160],[440,200]].map(([x,y], i) => (
          <g key={`b${i}`}>
            <circle cx={x} cy={y} r="7" fill="white" stroke="var(--blue)" strokeWidth="2.5"/>
            <circle cx={x} cy={y} r="3" fill="var(--blue)"/>
          </g>
        ))}

        {/* Pin localisation utilisateur */}
        <g transform="translate(240,160)">
          <circle r="22" fill="rgba(242,108,26,0.15)" />
          <circle r="12" fill="var(--orange)" />
          <circle r="5" fill="white" />
        </g>

        {/* Bus SVG simplifié */}
        <g transform="translate(300,145) rotate(-20) scale(0.9)">
          <rect x="-28" y="-14" width="56" height="28" rx="6" fill="var(--orange)"/>
          <rect x="-22" y="-10" width="12" height="9" rx="2" fill="rgba(255,255,255,0.6)"/>
          <rect x="-6" y="-10" width="12" height="9" rx="2" fill="rgba(255,255,255,0.6)"/>
          <rect x="10" y="-10" width="12" height="9" rx="2" fill="rgba(255,255,255,0.6)"/>
          <circle cx="-16" cy="16" r="6" fill="var(--ink-2)"/>
          <circle cx="-16" cy="16" r="3" fill="white"/>
          <circle cx="16" cy="16" r="6" fill="var(--ink-2)"/>
          <circle cx="16" cy="16" r="3" fill="white"/>
        </g>

        {/* Taxi wôrô-wôrô */}
        <g transform="translate(120,200) rotate(8) scale(0.8)">
          <rect x="-24" y="-11" width="48" height="22" rx="5" fill="var(--gold)"/>
          <rect x="-8" y="-16" width="20" height="10" rx="3" fill="var(--gold)" opacity="0.7"/>
          <rect x="-18" y="-8" width="10" height="7" rx="2" fill="rgba(255,255,255,0.5)"/>
          <rect x="-4" y="-8" width="10" height="7" rx="2" fill="rgba(255,255,255,0.5)"/>
          <circle cx="-14" cy="12" r="5" fill="var(--ink)"/>
          <circle cx="-14" cy="12" r="2.5" fill="white"/>
          <circle cx="14" cy="12" r="5" fill="var(--ink)"/>
          <circle cx="14" cy="12" r="2.5" fill="white"/>
        </g>
      </svg>

      {/* Badge flottant — ligne */}
      <div className="bm-float" style={{
        position: 'absolute', top: '8%', right: '-4%',
        background: 'var(--orange)', color: '#fff', borderRadius: 16,
        padding: '10px 18px', fontFamily: fT, fontWeight: 800, fontSize: 14,
        boxShadow: '0 8px 24px rgba(242,108,26,0.35)', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>🚌</span> Ligne 47 — Adjamé
      </div>

      {/* Badge flottant — tarif */}
      <div className="bm-float" style={{
        position: 'absolute', bottom: '14%', left: '-4%',
        background: 'var(--cream)', border: '1.5px solid var(--line)',
        borderRadius: 16, padding: '10px 18px',
        fontFamily: fB, fontWeight: 700, fontSize: 13,
        boxShadow: '0 8px 24px rgba(26,20,16,0.10)', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink)',
        animationDelay: '0.8s',
      }}>
        <span>💰</span> Tarif confirmé · <strong style={{ color: 'var(--green)' }}>200 FCFA</strong>
      </div>

      {/* Badge flottant — XP */}
      <div className="bm-float" style={{
        position: 'absolute', bottom: '36%', right: '-2%',
        background: 'var(--gold)', color: '#fff', borderRadius: 16,
        padding: '10px 18px', fontFamily: fT, fontWeight: 800, fontSize: 13,
        boxShadow: '0 8px 20px rgba(232,178,60,0.35)', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 8, animationDelay: '1.4s',
      }}>
        <span>⭐</span> +15 XP gagnés
      </div>
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────────────────────────────

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ background: 'var(--cream)', color: 'var(--ink)', fontFamily: fB, overflowX: 'hidden', minHeight: '100vh' }}>

      {/* ══ HEADER ════════════════════════════════════════════════════ */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
        background: scrolled ? 'rgba(247,241,230,0.88)' : 'transparent',
        backdropFilter: scrolled ? 'blur(14px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--line)' : '1px solid transparent',
        padding: '0 40px', height: 68,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.35s ease, border-color 0.35s ease, backdrop-filter 0.35s ease',
      }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, background: 'var(--orange)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(242,108,26,0.3)',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: fT, letterSpacing: -0.5, color: 'var(--ink)' }}>
            BABIMOB
          </span>
        </Link>

        {/* Nav */}
        <nav aria-label="Navigation principale" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link href="/app" className="nav-link" style={{ color: 'var(--ink-2)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            La Map
          </Link>
          <Link href="/app/gbairai" className="nav-link" style={{ color: 'var(--ink-2)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>
            Gbairai
          </Link>
          <PWAInstallButton size="sm" />
        </nav>
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh', paddingTop: 100, paddingBottom: 80, padding: '120px 40px 80px',
        background: 'linear-gradient(160deg, var(--cream) 0%, var(--cream-2) 60%, rgba(242,108,26,0.06) 100%)',
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto', width: '100%',
          display: 'flex', flexWrap: 'wrap', gap: 60,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          {/* Texte hero */}
          <div style={{ flex: '1 1 460px', maxWidth: 560 }}>
            {/* Badge accrocheur */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(242,108,26,0.1)', border: '1px solid rgba(242,108,26,0.25)',
              borderRadius: 99, padding: '7px 16px', marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block' }} className="pulse-dot" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', fontFamily: fB }}>
                197 000 Mobeurs déjà en route
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(42px, 6.5vw, 76px)', lineHeight: 1.0, fontWeight: 800,
              fontFamily: fT, letterSpacing: -2.5, marginBottom: 28, color: 'var(--ink)',
            }}>
              Vos transports,{' '}
              <span style={{
                color: 'var(--orange)',
                background: 'linear-gradient(135deg, var(--orange) 0%, #F8963A 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                simplifiés.
              </span>
            </h1>

            <p style={{
              fontSize: 18, color: 'var(--ink-2)', lineHeight: 1.65, marginBottom: 42,
              fontWeight: 400, maxWidth: 480,
            }}>
              L'assistant de mobilité qui guide les{' '}
              <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>Mobeurs</strong>{' '}
              à travers Abidjan. Gbaka, wôrô-wôrô, bus — tarifs réels, avis de la
              communauté, carte en temps réel. Tout en un.
            </p>

            {/* CTA */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
              <Link
                href="/app/onboarding"
                className="btn-cta"
                aria-label="Rejoindre la communauté BABIMOB"
              >
                Devenir un Mobeur
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
              <Link
                href="/app"
                style={{ color: 'var(--ink-2)', fontWeight: 700, fontSize: 15, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}
                className="nav-link"
              >
                Voir la carte
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>

            {/* Preuves sociales rapides */}
            <div style={{ display: 'flex', gap: 28, marginTop: 40, flexWrap: 'wrap' }}>
              {[
                { icon: '🚌', text: '340+ lignes' },
                { icon: '⭐', text: 'Note 4.8/5' },
                { icon: '🎁', text: 'XP & cadeaux' },
              ].map((b) => (
                <div key={b.text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{b.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink-2)' }}>{b.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Illustration hero */}
          <div style={{ flex: '1 1 380px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <HeroIllustration />
          </div>
        </div>
      </section>

      {/* ══ BANDE DE STATS ════════════════════════════════════════════ */}
      <div style={{
        background: 'var(--ink)', padding: '0 40px', overflow: 'hidden',
        borderTop: '3px solid var(--orange)',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around',
        }}>
          {STATS.map((s) => (
            <div key={s.label} style={{
              padding: '36px 20px', textAlign: 'center', flex: '1 1 160px',
              borderRight: '1px solid rgba(247,241,230,0.08)',
            }}>
              <div style={{
                fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, fontFamily: fT,
                color: 'var(--orange)', letterSpacing: -1, lineHeight: 1,
              }}>
                {s.value}<span style={{ fontSize: '0.55em', color: 'var(--gold)' }}>{s.suffix}</span>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(247,241,230,0.55)', fontWeight: 500, marginTop: 8 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ COMMENT ÇA MARCHE ═════════════════════════════════════════ */}
      <section style={{ padding: '100px 40px', background: 'var(--cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{
                fontSize: 11, fontWeight: 900, letterSpacing: 3, color: 'var(--orange)',
                textTransform: 'uppercase', marginBottom: 16,
              }}>
                Aussi simple que bonjour
              </div>
              <h2 style={{
                fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, fontFamily: fT,
                letterSpacing: -1.5, color: 'var(--ink)', marginBottom: 16,
              }}>
                Comment ça marche ?
              </h2>
              <p style={{ color: 'var(--ink-2)', fontSize: 17, maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>
                Trois gestes. Zéro prise de tête. Abidjan s'ouvre devant toi.
              </p>
            </div>
          </Reveal>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 120}>
                <div className="step-card" style={{
                  flex: '1 1 300px', maxWidth: 360,
                  background: 'rgba(139,126,110,0.07)',
                  border: '1.5px solid var(--line)', borderRadius: 28,
                  padding: '40px 36px', position: 'relative', overflow: 'hidden',
                }}>
                  {/* Numéro décoratif en fond */}
                  <div style={{
                    position: 'absolute', right: 20, top: -10,
                    fontSize: 96, fontWeight: 900, fontFamily: fT,
                    color: 'var(--orange)', opacity: 0.06, lineHeight: 1, pointerEvents: 'none',
                    userSelect: 'none',
                  }}>
                    {step.n}
                  </div>

                  {/* Icône */}
                  <div style={{
                    width: 60, height: 60, borderRadius: 18, background: 'var(--orange)',
                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 28, boxShadow: '0 8px 20px rgba(242,108,26,0.25)',
                  }}>
                    {step.icon}
                  </div>

                  <div style={{
                    fontSize: 11, fontWeight: 900, letterSpacing: 2, color: 'var(--orange)',
                    textTransform: 'uppercase', marginBottom: 12,
                  }}>
                    Étape {step.n}
                  </div>
                  <h3 style={{
                    fontSize: 22, fontWeight: 800, fontFamily: fT, color: 'var(--ink)',
                    marginBottom: 14, letterSpacing: -0.5,
                  }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--ink-2)', lineHeight: 1.7, fontSize: 15 }}>
                    {step.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FONCTIONNALITÉS ═══════════════════════════════════════════ */}
      <section style={{ padding: '100px 40px', background: 'var(--cream-2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{
                fontSize: 11, fontWeight: 900, letterSpacing: 3, color: 'var(--orange)',
                textTransform: 'uppercase', marginBottom: 16,
              }}>
                L'app de transport la plus complète d'Abidjan
              </div>
              <h2 style={{
                fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, fontFamily: fT,
                letterSpacing: -1.5, color: 'var(--ink)',
              }}>
                Tout ce dont un Mobeur a besoin
              </h2>
            </div>
          </Reveal>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 80}>
                <div className="feat-card" style={{
                  background: 'var(--cream)', border: '1.5px solid var(--line)',
                  borderRadius: 24, padding: '32px 28px',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
                  cursor: 'default',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 16,
                    background: `color-mix(in srgb, ${f.color} 12%, transparent)`,
                    color: f.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: 20, border: `1.5px solid color-mix(in srgb, ${f.color} 25%, transparent)`,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{
                    fontSize: 17, fontWeight: 800, fontFamily: fT,
                    color: 'var(--ink)', marginBottom: 10, letterSpacing: -0.3,
                  }}>
                    {f.title}
                  </h3>
                  <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.7 }}>
                    {f.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA INTERMÉDIAIRE ═════════════════════════════════════════ */}
      <Reveal>
        <div style={{
          margin: '0 40px', borderRadius: 32, overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--orange) 0%, #F8963A 50%, var(--orange-deep) 100%)',
          padding: '64px 60px', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(242,108,26,0.25)',
        }}>
          <div style={{
            fontSize: 'clamp(26px, 4vw, 44px)', fontWeight: 800, fontFamily: fT,
            color: '#fff', letterSpacing: -1, marginBottom: 16,
          }}>
            La communauté vous guide.
          </div>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 17, marginBottom: 36, fontWeight: 400 }}>
            Rejoins 197 000 Mobeurs qui partagent, notent et s'entraident chaque jour.
          </p>
          <Link
            href="/app/onboarding"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#fff', color: 'var(--orange)',
              padding: '16px 36px', borderRadius: 99, fontWeight: 800, fontSize: 16,
              textDecoration: 'none', fontFamily: fB,
              boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
            }}
            className="cta-inv"
          >
            Je rejoins maintenant
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </Reveal>

      {/* ══ TÉMOIGNAGES ═══════════════════════════════════════════════ */}
      <section style={{ padding: '100px 40px', background: 'var(--cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <div style={{
                fontSize: 11, fontWeight: 900, letterSpacing: 3, color: 'var(--orange)',
                textTransform: 'uppercase', marginBottom: 16,
              }}>
                La communauté vous guide
              </div>
              <h2 style={{
                fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, fontFamily: fT,
                letterSpacing: -1.5, color: 'var(--ink)', marginBottom: 16,
              }}>
                197 000 Mobeurs déjà en ligne
              </h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                <StarRating rating={4.8} size={22} />
                <span style={{ color: 'var(--ink-2)', fontSize: 15, fontWeight: 600, marginLeft: 8 }}>
                  4.8 · Note moyenne sur les avis
                </span>
              </div>
            </div>
          </Reveal>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 20,
          }}>
            {REVIEWS.map((r, i) => (
              <Reveal key={r.id} delay={i * 70}>
                <TestimonialCard review={r} idx={i} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INSTALL PWA ═══════════════════════════════════════════════ */}
      <section style={{
        padding: '100px 40px',
        background: 'rgba(139,126,110,0.08)',
        borderTop: '1px solid var(--line)',
        borderBottom: '1px solid var(--line)',
      }}>
        <Reveal>
          <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
            {/* Icône smartphone */}
            <div style={{
              width: 80, height: 80, borderRadius: 24, background: 'var(--orange)',
              margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 12px 32px rgba(242,108,26,0.3)',
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>

            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, fontFamily: fT,
              letterSpacing: -1.5, color: 'var(--ink)', marginBottom: 18,
            }}>
              Installez l'application
            </h2>
            <p style={{
              color: 'var(--ink-2)', fontSize: 17, lineHeight: 1.65, marginBottom: 36, fontWeight: 400,
            }}>
              L'expérience complète, sans passer par l'App Store. Plus rapide, plus
              légère, toujours disponible hors ligne. Installez la PWA en un clic.
            </p>

            {/* Avantages PWA */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginBottom: 40,
            }}>
              {[
                '📶 Fonctionne hors ligne',
                '⚡ Ultra rapide',
                '🔒 Sécurisé',
                '🆓 Gratuit',
              ].map((item) => (
                <span key={item} style={{
                  background: 'var(--cream)', border: '1.5px solid var(--line)',
                  borderRadius: 99, padding: '8px 18px',
                  fontSize: 13, fontWeight: 700, color: 'var(--ink)',
                }}>
                  {item}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
              <PWAInstallButton size="lg" />
              <Link
                href="/app"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  border: '2px solid var(--ink)', color: 'var(--ink)',
                  padding: '18px 36px', borderRadius: 99, fontWeight: 800, fontSize: 16,
                  textDecoration: 'none', fontFamily: fB,
                  transition: 'all 0.2s ease',
                }}
                className="btn-outline"
              >
                Ouvrir dans le navigateur
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════ */}
      <footer style={{
        background: 'var(--cream-2)', borderTop: '1px solid var(--line)',
        padding: '64px 40px 40px',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'flex', flexWrap: 'wrap', gap: 48, justifyContent: 'space-between',
        }}>
          {/* Brand */}
          <div style={{ flex: '1 1 260px', maxWidth: 320 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: 'var(--orange)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(242,108,26,0.25)',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, fontFamily: fT, letterSpacing: -0.5 }}>BABIMOB</span>
            </div>
            <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
              La mobilité urbaine d'Abidjan, réinventée par et pour les Mobeurs.
              Fait avec ❤️ à Yopougon.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              {['🚌', '🚕', '🛵'].map((e, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 10, background: 'rgba(139,126,110,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                }}>
                  {e}
                </div>
              ))}
            </div>
          </div>

          {/* Liens */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 48 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--ink)', marginBottom: 4 }}>
                Application
              </div>
              {[
                { href: '/app', label: 'La Carte' },
                { href: '/app/gbairai', label: 'Gbairai' },
                { href: '/app/boussole', label: 'Boussole' },
                { href: '/app/compte', label: 'Mon compte' },
              ].map((l) => (
                <Link key={l.href} href={l.href} className="footer-link" style={{
                  color: 'var(--blue)', fontSize: 14, textDecoration: 'none', fontWeight: 500,
                }}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--ink)', marginBottom: 4 }}>
                Légal & Contact
              </div>
              {[
                { href: '#', label: 'À propos' },
                { href: '#', label: 'Confidentialité' },
                { href: '#', label: 'Contact' },
                { href: '#', label: 'Signaler un bug' },
              ].map((l) => (
                <Link key={l.label} href={l.href} className="footer-link" style={{
                  color: 'var(--blue)', fontSize: 14, textDecoration: 'none', fontWeight: 500,
                }}>
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div style={{
          maxWidth: 1200, margin: '40px auto 0',
          paddingTop: 24, borderTop: '1px solid var(--line)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>
            © 2026 BABIMOB · Tous droits réservés
          </span>
          <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>
            Fait pour les Mobeurs d'Abidjan 🇨🇮
          </span>
        </div>
      </footer>

      {/* ══ STYLES GLOBAUX (hover, media queries, animations) ═════════ */}
      <style jsx global>{`
        /* CTA principal */
        .btn-cta {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          background: var(--orange);
          color: #fff;
          padding: 16px 32px;
          border-radius: 99px;
          font-weight: 800;
          font-size: 16px;
          font-family: var(--font-lexend), system-ui, sans-serif;
          text-decoration: none;
          box-shadow: 0 8px 28px rgba(242, 108, 26, 0.32);
          transition: background 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
        }
        .btn-cta:hover {
          background: var(--orange-deep);
          transform: translateY(-3px);
          box-shadow: 0 14px 36px rgba(242, 108, 26, 0.4);
        }

        /* Bouton inversé */
        .cta-inv:hover { transform: scale(1.03); }

        /* Bouton outline */
        .btn-outline:hover {
          background: var(--ink);
          color: var(--cream);
        }

        /* Bouton PWA */
        .pwa-btn:hover {
          background: var(--orange-deep) !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(242, 108, 26, 0.4) !important;
        }
        .pwa-btn-dark:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.2) !important;
        }

        /* Nav links */
        .nav-link:hover { color: var(--orange) !important; }

        /* Cartes features */
        .feat-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(26,20,16,0.1) !important;
          background: var(--cream-2) !important;
        }

        /* Cartes steps */
        .step-card:hover {
          border-color: rgba(242, 108, 26, 0.3) !important;
          box-shadow: 0 16px 40px rgba(242,108,26,0.08);
        }

        /* Cartes témoignages */
        .tcard:hover {
          border-color: rgba(242, 108, 26, 0.25) !important;
          box-shadow: 0 12px 32px rgba(26,20,16,0.08);
          transform: translateY(-4px);
          transition: all 0.3s ease;
        }

        /* Footer links */
        .footer-link:hover { color: var(--orange) !important; text-decoration: underline; }

        /* Upvote button */
        .upvote-btn:hover { opacity: 0.85; transform: scale(0.97); }

        /* ── RESPONSIVE ── */
        @media (max-width: 768px) {
          header { padding: 0 20px !important; }
          section { padding-left: 20px !important; padding-right: 20px !important; }
          .hero-text { text-align: center; }
        }

        @media (max-width: 640px) {
          nav a:not(:last-child) { display: none; }
        }
      `}</style>
    </div>
  );
}
