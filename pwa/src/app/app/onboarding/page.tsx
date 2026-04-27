'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Vehicle } from '@/components/ui/Vehicle';
import { Ic } from '@/components/ui/Ic';

const SLIDES = [
  {
    color: 'var(--orange)',
    title: 'Abidjan,\nen ta poche.',
    sub: 'Le premier plan de ville vivant. Pas une carte. Une voix.',
    illust: 'map' as const,
  },
  {
    color: 'var(--green)',
    title: 'Gbaka, Woro,\nSaloni-saloni.',
    sub: 'Les vrais arrêts, les vrais tarifs, les vrais noms — comme un Babi te dirait.',
    illust: 'transport' as const,
  },
  {
    color: 'var(--blue)',
    title: "C'comment ?\nDemande à la ville.",
    sub: 'Avis, bons plans, tarifs : 250 000 Babis te répondent en direct.',
    illust: 'community' as const,
  },
];

export default function OnboardingPage() {
  const [slide, setSlide] = useState(0);
  const s = SLIDES[slide];

  return (
    <div style={{ minHeight: '100dvh', background: s.color, color: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', transition: 'background 0.5s' }}>
      <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.1, pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ padding: '56px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 2 }}>
        <span className="font-display" style={{ fontSize: 20, letterSpacing: 1 }}>BABIMOB</span>
        <Link href="/app" style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)', textDecoration: 'none' }}>Passer</Link>
      </div>

      {/* Illustration */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', zIndex: 2 }}>
        {s.illust === 'map' && (
          <div style={{ width: 280, height: 280, position: 'relative' }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: 28, background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(255,255,255,0.3)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="240" height="240" viewBox="0 0 240 240" fill="none">
                <ellipse cx="120" cy="140" rx="80" ry="50" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
                <path d="M60 140 Q80 100 120 90 Q160 100 180 140" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeDasharray="4 4"/>
                <path d="M40 160 Q60 130 100 120 Q140 115 170 130 Q195 145 200 165" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5"/>
                <circle cx="120" cy="90" r="12" fill="rgba(255,255,255,0.9)"/>
                <circle cx="120" cy="90" r="5" fill="var(--orange)"/>
                <circle cx="70" cy="130" r="8" fill="rgba(255,255,255,0.4)"/>
                <circle cx="175" cy="120" r="8" fill="rgba(255,255,255,0.4)"/>
              </svg>
            </div>
            <div className="slide-up" style={{ position: 'absolute', top: -12, right: -12, background: 'var(--ink)', color: '#fff', padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 800, letterSpacing: 0.5, transform: 'rotate(8deg)' }}>VIVANT</div>
          </div>
        )}
        {s.illust === 'transport' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: 280 }}>
            {([
              { k: 'gbaka', n: 'Gbaka', d: 'Adjamé ↔ Yop · 200F' },
              { k: 'woro', n: 'Woro-woro', d: 'Cocody · 150F' },
              { k: 'taxi', n: 'Taxi', d: 'porte à porte' },
              { k: 'saloni', n: 'Saloni-saloni', d: 'le quartier' },
            ] as { k: 'gbaka'|'woro'|'taxi'|'saloni'; n: string; d: string }[]).map((v, i) => (
              <div key={i} className="slide-up" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.25)', animationDelay: `${i * 0.1}s` }}>
                <Vehicle kind={v.k} size={36} color="#fff" />
                <div>
                  <div className="font-display" style={{ fontSize: 15 }}>{v.n}</div>
                  <div style={{ fontSize: 11, opacity: 0.8 }}>{v.d}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {s.illust === 'community' && (
          <div style={{ position: 'relative', width: 280, height: 280 }}>
            {[
              { x: 50, y: 50, sz: 80, c: 'var(--orange)', l: 'M' },
              { x: 10, y: 18, sz: 56, c: 'var(--gold)', l: 'A' },
              { x: 72, y: 12, sz: 48, c: 'var(--green)', l: 'D' },
              { x: 4, y: 68, sz: 44, c: 'var(--ink)', l: 'K' },
              { x: 78, y: 72, sz: 52, c: 'rgba(255,255,255,0.9)', l: 'I', dark: true },
            ].map((b, i) => (
              <div key={i} className="slide-up" style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: b.sz, height: b.sz, borderRadius: '50%', background: b.c, color: b.dark ? 'var(--ink)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: b.sz * 0.35, fontWeight: 900, fontFamily: 'var(--font-archivo-black)', border: '3px solid rgba(255,255,255,0.6)', boxShadow: '0 6px 16px rgba(0,0,0,0.2)', animationDelay: `${i * 0.1}s` }}>
                {b.l}
              </div>
            ))}
            <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} viewBox="0 0 280 280">
              <path d="M140 140 L40 60 M140 140 L210 50 M140 140 L40 220 M140 140 L220 220" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeDasharray="4 4"/>
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <div style={{ padding: '0 24px', position: 'relative', zIndex: 2 }}>
        <h1 className="font-display" style={{ fontSize: 44, lineHeight: 0.95, margin: 0, whiteSpace: 'pre-line' }}>{s.title}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.45, margin: '14px 0 0', opacity: 0.9, maxWidth: 320 }}>{s.sub}</p>
      </div>

      {/* Progress + CTA */}
      <div style={{ padding: '24px 24px 48px', position: 'relative', zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          {SLIDES.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === slide ? 32 : 12, background: i === slide ? '#fff' : 'rgba(255,255,255,0.35)', transition: 'all 0.3s' }} />
          ))}
        </div>
        {slide < SLIDES.length - 1 ? (
          <button onClick={() => setSlide(slide + 1)} className="press" style={{ width: '100%', height: 56, borderRadius: 18, border: 'none', background: 'var(--ink)', color: 'var(--cream)', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            Continuer <Ic.Arrow s={20} />
          </button>
        ) : (
          <Link href="/app" className="press" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', height: 56, borderRadius: 18, background: 'var(--ink)', color: 'var(--cream)', fontSize: 16, fontWeight: 800, textDecoration: 'none', boxSizing: 'border-box' }}>
            Entrer dans Babi <Ic.Arrow s={20} />
          </Link>
        )}
      </div>
    </div>
  );
}
