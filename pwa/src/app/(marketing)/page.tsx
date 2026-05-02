'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── TYPES & CONFIG ──────────────────────────────────────────────────

const THEME = {
  fonts: {
    title: 'var(--font-syne), system-ui, sans-serif',
    body: 'var(--font-lexend), system-ui, sans-serif',
  }
};

const REVIEWS = [
  { id: '1', name: 'Koffi J.', rating: 5, comment: "Enfin une app qui comprend le terrain ! Plus besoin d'attendre 2h un gbaka qui ne vient pas.", initialUpvotes: 42 },
  { id: '2', name: 'Awa D.', rating: 4.5, comment: "Les tarifs sont super précis. Ça m'a sauvé pas mal d'argent sur mes trajets quotidiens.", initialUpvotes: 28 },
  { id: '3', name: 'Moussa S.', rating: 5, comment: "Le système de points XP est addictif. Je suis déjà 'Légende de Yopougon' !", initialUpvotes: 156 },
  { id: '4', name: 'Sery G.', rating: 4, comment: "Top pour voir si les carrefours sont propres avant de sortir. Indispensable à Abidjan.", initialUpvotes: 19 },
  { id: '5', name: 'Esther B.', rating: 5, comment: "L'interface est magnifique. On sent que c'est fait pour nous, par des gens qui connaissent Babi.", initialUpvotes: 84 },
  { id: '6', name: 'Issa K.', rating: 4.5, comment: "Les arrêts favoris me font gagner un temps fou le matin.", initialUpvotes: 37 },
  { id: '7', name: 'Fatou Z.', rating: 5, comment: "Une révolution pour le transport informel. On est enfin organisés.", initialUpvotes: 92 },
];

// ── UTILS ────────────────────────────────────────────────────────────

function useInView() {
  const [inView, setInView] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

// ── COMPONENTS ───────────────────────────────────────────────────────

const ScrollReveal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ref, inView } = useInView();
  return (
    <div 
      ref={ref} 
      style={{ 
        opacity: inView ? 1 : 0, 
        transform: inView ? 'translateY(0)' : 'translateY(30px)', 
        transition: 'opacity 0.8s ease-out, transform 0.8s ease-out' 
      }}
    >
      {children}
    </div>
  );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFull = star <= Math.floor(rating);
        const isHalf = !isFull && star === Math.ceil(rating) && rating % 1 !== 0;
        return (
          <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill={isFull ? 'var(--gold)' : isHalf ? 'url(#halfGrad)' : 'var(--line)'}>
            <defs>
              <linearGradient id="halfGrad">
                <stop offset="50%" stopColor="var(--gold)" />
                <stop offset="50%" stopColor="var(--line)" />
              </linearGradient>
            </defs>
            <path d="M12 1.75l3.09 6.26 6.91 1-5 4.87 1.18 6.88-6.18-3.25-6.18 3.25 1.18-6.88-5-4.87 6.91-1z" />
          </svg>
        );
      })}
    </div>
  );
};

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      window.location.href = '/app';
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  return (
    <button 
      onClick={handleInstall}
      className="btn-primary"
      style={{
        background: 'var(--orange)', color: '#fff', border: 'none',
        padding: '12px 24px', borderRadius: 99, fontWeight: 700, fontSize: 14,
        cursor: deferredPrompt ? 'pointer' : 'default', transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(242, 108, 26, 0.2)'
      }}
    >
      Installer l'App
    </button>
  );
};

const TestimonialCard: React.FC<{ review: typeof REVIEWS[0] }> = ({ review }) => {
  const [upvotes, setUpvotes] = useState(review.initialUpvotes);
  const [hasUpvoted, setHasUpvoted] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('babimob_userId');
    if (!userId) localStorage.setItem('babimob_userId', Math.random().toString(36).substring(7));
    
    const voted = JSON.parse(localStorage.getItem('babimob_voted') || '{}');
    if (voted[review.id]) setHasUpvoted(true);
  }, [review.id]);

  const toggleUpvote = () => {
    const voted = JSON.parse(localStorage.getItem('babimob_voted') || '{}');
    if (hasUpvoted) {
      setUpvotes(v => v - 1);
      delete voted[review.id];
    } else {
      setUpvotes(v => v + 1);
      voted[review.id] = true;
    }
    setHasUpvoted(!hasUpvoted);
    localStorage.setItem('babimob_voted', JSON.stringify(voted));
  };

  return (
    <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 800, fontFamily: THEME.fonts.title }}>{review.name}</div>
        <StarRating rating={review.rating} />
      </div>
      <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6, flex: 1 }}>{review.comment}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button 
          onClick={toggleUpvote}
          style={{ 
            background: hasUpvoted ? 'var(--orange)' : 'var(--muted)', 
            border: 'none', borderRadius: 8, padding: '4px 12px', color: '#fff',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700
          }}
        >
          👍 {upvotes}
        </button>
        <span style={{ color: 'var(--ink-2)', fontSize: 11, fontWeight: 600 }}>Upvotes</span>
      </div>
    </div>
  );
};

const SmartphoneMockup: React.FC = () => {
  return (
    <div className="phone-container">
      <div className="phone-frame">
        <div className="phone-screen">
          <div className="phone-notch" />
          {/* App Preview Content */}
          <div style={{ height: '100%', background: 'var(--cream)', position: 'relative', overflow: 'hidden' }}>
             {/* Map Background Mockup */}
             <div style={{ height: '70%', background: '#e0e0e0', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '30%', left: '20%', width: 100, height: 4, background: 'var(--orange)', borderRadius: 2, transform: 'rotate(20deg)' }} />
                <div style={{ position: 'absolute', top: '40%', left: '40%', width: 120, height: 4, background: 'var(--blue)', borderRadius: 2, transform: 'rotate(-10deg)' }} />
                <div style={{ position: 'absolute', top: '35%', left: '25%', width: 12, height: 12, borderRadius: '50%', background: 'var(--orange)', border: '2px solid #fff' }} />
             </div>
             {/* Bottom Sheet Mockup */}
             <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: '#fff', borderRadius: '24px 24px 0 0', padding: 20, boxShadow: '0 -10px 30px rgba(0,0,0,0.05)' }}>
                <div style={{ width: 40, height: 4, background: 'var(--line)', borderRadius: 2, margin: '0 auto 16px' }} />
                <div style={{ fontSize: 12, fontWeight: 900, marginBottom: 8 }}>LIGNES À PROXIMITÉ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                   {[1,2].map(i => (
                     <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, background: 'var(--muted)', borderRadius: 12 }}>
                        <div style={{ width: 24, height: 24, borderRadius: 6, background: i === 1 ? 'var(--orange)' : 'var(--blue)' }} />
                        <div style={{ height: 10, width: 80, background: 'var(--line)', borderRadius: 5 }} />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .phone-container { perspective: 1000px; }
        .phone-frame {
          width: 280px; height: 580px; background: #1a1a1a; borderRadius: 44px;
          padding: 12px; border: 4px solid #333; position: relative;
          boxShadow: 0 40px 100px rgba(0,0,0,0.15); transform: rotateY(-10deg) rotateX(5deg);
        }
        .phone-screen {
          width: 100%; height: 100%; background: #fff; borderRadius: 32px;
          overflow: hidden; position: relative;
        }
        .phone-notch {
          position: absolute; top: 0; left: 50%; transform: translateX(-50%);
          width: 120px; height: 26px; background: #1a1a1a; borderBottomLeftRadius: 16px; borderBottomRightRadius: 16px;
          zIndex: 10;
        }
      `}</style>
    </div>
  );
};

// ── MAIN LANDING PAGE ────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--cream)', color: 'var(--ink)', fontFamily: THEME.fonts.body, minHeight: '100vh', overflowX: 'hidden' }}>
      
      {/* ── HEADER ── */}
      <header style={{ 
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(247, 241, 230, 0.8)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--line)', padding: '16px 40px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: 'var(--orange)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900 }}>B</div>
          <span style={{ fontSize: 20, fontWeight: 800, fontFamily: THEME.fonts.title, letterSpacing: -1 }}>BABIMOB</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/app" style={{ textDecoration: 'none', color: 'var(--ink)', fontWeight: 700, fontSize: 14 }}>Ouvrir la Map</Link>
          <PWAInstallButton />
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{ 
        paddingTop: 160, paddingBottom: 100, 
        background: 'linear-gradient(180deg, var(--cream) 0%, var(--cream-2) 100%)' 
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 40px', display: 'flex', flexWrap: 'wrap', gap: 60, alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ flex: '1 1 500px' }}>
            <ScrollReveal>
              <h1 style={{ fontSize: 'clamp(40px, 8vw, 72px)', lineHeight: 0.95, fontWeight: 800, fontFamily: THEME.fonts.title, letterSpacing: -3, marginBottom: 24 }}>
                Vos transports, <br/> <span style={{ color: 'var(--orange)' }}>simplifiés.</span>
              </h1>
              <p style={{ fontSize: 20, color: 'var(--ink-2)', lineHeight: 1.5, marginBottom: 40, fontWeight: 500 }}>
                L'assistant intelligent qui guide les <span style={{ fontWeight: 800, color: 'var(--ink)' }}>Mobeurs</span> à travers Abidjan. Gbaka, Wôrô, Taxi — tout est là.
              </p>
              <div style={{ display: 'flex', gap: 16 }}>
                 <Link href="/app/onboarding" className="btn-cta">
                    Devenir un Mobeur
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                 </Link>
              </div>
            </ScrollReveal>
          </div>
          <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
             <ScrollReveal>
                <SmartphoneMockup />
             </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: 40, fontWeight: 800, fontFamily: THEME.fonts.title, marginBottom: 60 }}>Simple comme bonjour</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, justifyContent: 'center' }}>
            {[
              { n: '1', t: 'Envoie ta position', d: 'Ouvre l\'app ou le bot et partage ta localisation en un clic.', i: '📍' },
              { n: '2', t: 'Dis où tu vas', d: 'En nouchi ou français, l\'IA comprend toutes les destinations.', i: '🗣️' },
              { n: '3', t: 'Pars en confiance', d: 'Reçois lignes, tarifs et arrêts. Le vrai prix du terrain.', i: '🚶🏾‍♂️' }
            ].map((s) => (
              <div key={s.n} style={{ flex: '1 1 300px', background: 'var(--muted)', border: '1px solid var(--line)', borderRadius: 24, padding: 32 }}>
                <div style={{ width: 56, height: 56, borderRadius: 28, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 24, color: '#fff', boxShadow: '0 8px 16px rgba(242,108,26,0.2)' }}>{s.i}</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12, fontFamily: THEME.fonts.title }}>{s.t}</h3>
                <p style={{ color: 'var(--ink-2)', lineHeight: 1.6 }}>{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ── */}
      <section style={{ padding: '100px 40px', background: 'var(--cream-2)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: 40, fontWeight: 800, fontFamily: THEME.fonts.title, marginBottom: 60, textAlign: 'center' }}>Tout ce dont un Mobeur a besoin</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { t: 'Suivi en direct', d: 'Suis ta ligne en temps réel sur la carte interactive.', i: '📡' },
              { t: 'Points XP', d: 'Gagne des points à chaque trajet et débloque des récompenses.', i: '🏆' },
              { t: 'Avis multi-catégories', d: 'Consulte les retours de la communauté sur les lignes.', i: '💬' },
              { t: 'Boussole intelligente', d: 'Ne perds jamais le nord, même dans les quartiers complexes.', i: '🧭' }
            ].map((f, i) => (
              <div key={i} className="feature-card" style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 24, padding: 32, transition: 'all 0.3s' }}>
                <div style={{ fontSize: 32, marginBottom: 20 }}>{f.i}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 12, fontFamily: THEME.fonts.title }}>{f.t}</h3>
                <p style={{ color: 'var(--ink-2)', fontSize: 14, lineHeight: 1.6 }}>{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TÉMOIGNAGES ── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--orange)', letterSpacing: 2, marginBottom: 12 }}>LA COMMUNAUTÉ VOUS GUIDE</div>
            <h2 style={{ fontSize: 40, fontWeight: 800, fontFamily: THEME.fonts.title }}>197 000 Mobeurs déjà en ligne</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {REVIEWS.map((r) => (
              <TestimonialCard key={r.id} review={r} />
            ))}
          </div>
        </div>
      </section>

      {/* ── INSTALL PWA ── */}
      <section style={{ padding: '100px 40px', background: 'var(--muted)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 24 }}>📱</div>
          <h2 style={{ fontSize: 32, fontWeight: 800, fontFamily: THEME.fonts.title, marginBottom: 16 }}>Installez l'application</h2>
          <p style={{ color: 'var(--ink-2)', fontSize: 18, marginBottom: 32 }}>L'expérience complète, sans passer par l'App Store. Plus rapide, plus légère, toujours disponible.</p>
          <Link href="/app" className="btn-primary" style={{ padding: '16px 40px', fontSize: 18, background: 'var(--ink)', color: '#fff', textDecoration: 'none', borderRadius: 16, fontWeight: 700, display: 'inline-block' }}>Ouvrir dans le navigateur</Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: 'var(--cream-2)', borderTop: '1px solid var(--line)', padding: '60px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 40 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: THEME.fonts.title, marginBottom: 16 }}>BABIMOB</div>
            <p style={{ color: 'var(--ink-2)', maxWidth: 300, fontSize: 14 }}>Fait avec ❤️ pour les Mobeurs d'Abidjan.</p>
          </div>
          <div style={{ display: 'flex', gap: 40 }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>NAVIGATION</div>
                <Link href="/app" style={{ color: 'var(--blue)', fontSize: 14, textDecoration: 'none' }}>La Map</Link>
                <Link href="/app/chat" style={{ color: 'var(--blue)', fontSize: 14, textDecoration: 'none' }}>Le Chat</Link>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14 }}>LÉGAL</div>
                <Link href="#" style={{ color: 'var(--blue)', fontSize: 14, textDecoration: 'none' }}>Confidentialité</Link>
                <Link href="#" style={{ color: 'var(--blue)', fontSize: 14, textDecoration: 'none' }}>Contact</Link>
             </div>
          </div>
        </div>
        <div style={{ maxWidth: 1200, margin: '40px auto 0', paddingTop: 24, borderTop: '1px solid var(--line)', color: 'var(--ink-2)', fontSize: 12, textAlign: 'center' }}>
          © 2026 BABIMOB · TOUS DROITS RÉSERVÉS
        </div>
      </footer>

      <style jsx global>{`
        .btn-cta {
          background: var(--orange);
          color: #fff;
          padding: 16px 32px;
          borderRadius: 16px;
          fontWeight: 800;
          fontSize: 18;
          textDecoration: none;
          boxShadow: 0 10px 30px rgba(242, 108, 26, 0.25);
          display: flex;
          alignItems: center;
          gap: 12px;
          transition: transform 0.2s, background 0.2s;
        }
        .btn-cta:hover {
          background: var(--orange-deep);
          transform: translateY(-2px);
        }
        .feature-card:hover {
          background: var(--cream-2) !important;
          transform: translateY(-8px);
        }
        @media (max-width: 768px) {
          header { padding: 12px 20px !important; }
          .hero-content { text-align: center; }
        }
      `}</style>
    </div>
  );
}
