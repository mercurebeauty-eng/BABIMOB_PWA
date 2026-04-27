import Link from 'next/link';
import type { Metadata } from 'next';
import { Pill } from '@/components/ui/Pill';
import { WaxStrip } from '@/components/ui/WaxStrip';

export const metadata: Metadata = {
  title: 'BABIMOB — Bouge à Abidjan comme un local',
  description: 'Le premier assistant intelligent pour le transport informel à Abidjan. Gbaka, Woro-woro, Taxi.',
};

const TG = 'https://t.me/babimobbot';

const FEATURES = [
  {
    icon: '🗺️',
    kicker: 'CARTE QUI PARLE',
    title: 'Une carte vivante',
    text: "Chaque arrêt, chaque carrefour s'anime en temps réel. La ville parle, tu écoutes.",
  },
  {
    icon: '💰',
    kicker: 'TARIFS RÉELS',
    title: 'Le vrai prix du terrain',
    text: 'Les tarifs pratiqués par les apprentis, mis à jour par la communauté chaque jour.',
  },
  {
    icon: '📡',
    kicker: 'LIGNE EN DIRECT',
    title: 'Infos en temps réel',
    text: 'Grève, embouteillage, nouvelle ligne — sois le premier informé avant de partir.',
  },
  {
    icon: '💬',
    kicker: 'C\'COMMENT ?',
    title: 'Demande à la ville',
    text: 'La communauté te répond en nouchi. Vrai, local, immédiat.',
  },
];

const STATS = [
  { value: '247K', label: 'Babis actifs' },
  { value: '4 200', label: 'Arrêts' },
  { value: '17', label: 'Communes' },
  { value: '38K', label: 'Tarifs/jour' },
];

const SOCIAL_DOTS = [
  'var(--orange)',
  'var(--green)',
  'var(--gold)',
  'var(--blue)',
  'var(--orange)',
];

export default function LandingPage() {
  return (
    <div style={{ background: 'var(--cream)', color: 'var(--ink)', fontFamily: 'sans-serif', minHeight: '100vh' }}>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section
        className="wax-bg"
        style={{
          background: 'var(--ink)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 72,
          paddingBottom: 96,
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ marginBottom: 20 }}>
            <Pill color="var(--orange)" size="md">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--orange)', display: 'inline-block', marginRight: 6, animation: 'pulse 2s infinite' }} />
              ABIDJAN · LIVE
            </Pill>
          </div>

          <h1
            className="font-display"
            style={{ fontSize: 'clamp(36px, 7vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em', marginBottom: 20, color: '#fff' }}
          >
            Le premier plan de ville vivant.
          </h1>

          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 480, margin: '0 auto 36px' }}>
            Abidjan sur le bout des doigts. Gbaka, Woro-woro, Taxi — trouve ton chemin et le tarif exact en 3 secondes.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            <Link
              href="/app/onboarding"
              className="press"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'var(--orange)', color: '#fff',
                padding: '14px 28px', borderRadius: 999,
                fontWeight: 800, fontSize: 15, textDecoration: 'none',
              }}
            >
              Entrer dans Babi
              <span style={{ fontSize: 18 }}>→</span>
            </Link>
            <Link
              href="/app"
              className="press"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.10)', color: '#fff',
                border: '1.5px solid rgba(255,255,255,0.20)',
                padding: '14px 28px', borderRadius: 999,
                fontWeight: 800, fontSize: 15, textDecoration: 'none',
              }}
            >
              Voir la map
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ display: 'flex', gap: -6 }}>
              {SOCIAL_DOTS.map((c, i) => (
                <span
                  key={i}
                  style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: c, border: '2px solid var(--ink)',
                    display: 'inline-block',
                    marginLeft: i === 0 ? 0 : -8,
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', fontWeight: 600 }}>
              247 000 Babis déjà en ligne
            </span>
          </div>
        </div>
      </section>

      {/* ── WAX DIVIDER ────────────────────────────────────── */}
      <WaxStrip color="var(--orange)" height={8} />

      {/* ── WHY SECTION ────────────────────────────────────── */}
      <section style={{ background: 'var(--cream-2)', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto 56px' }}>
          <div style={{ marginBottom: 16 }}>
            <Pill color="var(--orange)">POURQUOI BABIMOB ?</Pill>
          </div>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.1, color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            Tout Ivoirien peut enfin lire sa ville...
          </h2>
          <p style={{ marginTop: 16, fontSize: 17, color: 'var(--muted)', lineHeight: 1.6 }}>
            ...et se déplacer sans se faire avoir sur les tarifs.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            maxWidth: 960,
            margin: '0 auto',
          }}
        >
          {FEATURES.map((f) => (
            <div
              key={f.kicker}
              style={{
                background: '#fff',
                borderRadius: 20,
                padding: '28px 24px',
                border: '1.5px solid var(--line)',
                textAlign: 'left',
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
              <div style={{ marginBottom: 8 }}>
                <Pill color="var(--orange)">{f.kicker}</Pill>
              </div>
              <h3
                className="font-display"
                style={{ fontSize: 18, color: 'var(--ink)', marginBottom: 8, lineHeight: 1.2 }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: 0 }}>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── STATS GRID ─────────────────────────────────────── */}
      <section style={{ background: 'var(--ink)', padding: '72px 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 2,
            maxWidth: 560,
            margin: '0 auto',
            borderRadius: 24,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{
                background: 'rgba(255,255,255,0.04)',
                padding: '36px 28px',
                textAlign: 'center',
              }}
            >
              <div
                className="font-display"
                style={{ fontSize: 42, color: 'var(--orange)', lineHeight: 1, marginBottom: 8 }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA FOOTER ─────────────────────────────────────── */}
      <section
        className="wax-zigzag"
        style={{
          background: 'var(--orange)',
          color: '#fff',
          padding: '80px 24px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 560, margin: '0 auto' }}>
          <h2
            className="font-display"
            style={{ fontSize: 'clamp(28px, 5vw, 40px)', lineHeight: 1.1, marginBottom: 32, letterSpacing: '-0.02em' }}
          >
            Babi se partage. Rejoins.
          </h2>
          <Link
            href="/app/onboarding"
            className="press"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: '#fff', color: 'var(--orange)',
              padding: '16px 36px', borderRadius: 999,
              fontWeight: 900, fontSize: 16, textDecoration: 'none',
            }}
          >
            Entrer dans Babi
            <span style={{ fontSize: 18 }}>→</span>
          </Link>

          <div style={{ marginTop: 24 }}>
            <a
              href={TG}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: 700, textDecoration: 'none' }}
            >
              Ou essaie le bot Telegram →
            </a>
          </div>
        </div>
      </section>

    </div>
  );
}
