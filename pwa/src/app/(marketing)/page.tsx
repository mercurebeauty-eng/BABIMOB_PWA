import Link from 'next/link';
import type { Metadata } from 'next';
import NavMobile from './NavMobile';
import BeigeMapBackground from '@/components/BeigeMapBackground';
import ScrollReveal from './ScrollReveal';
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

const TRANSPORTS = [
  { n: 'Gbaka', e: '🚐', p: 'Très populaire', d: 'Le bus de quartier par excellence. Rapide et partout.' },
  { n: 'Woro-Woro', e: '🚕', p: 'Collectif', d: 'Taxis communaux à trajet fixe. Économique et convivial.' },
  { n: 'Taxi Compteur', e: '🚖', p: 'Sur mesure', d: 'Pour vos trajets directs. Négociez le prix si pas de compteur.' },
  { n: 'Sotra', e: '🚌', p: 'Réseau bus', d: 'Le réseau de bus officiel reliant toutes les communes.' },
];

function IconArrowRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function IconX({ size = 'w-6 h-6' }: { size?: string }) {
  return (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"></line>
      <line x1="8" y1="12" x2="21" y2="12"></line>
      <line x1="8" y1="18" x2="21" y2="18"></line>
      <line x1="3" y1="6" x2="3.01" y2="6"></line>
      <line x1="3" y1="12" x2="3.01" y2="12"></line>
      <line x1="3" y1="18" x2="3.01" y2="18"></line>
    </svg>
  );
}


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

      {/* ══ COMMENT ÇA MARCHE ════════════════════════════════ */}
      <section id="comment" className="py-24 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-5">
          <ScrollReveal direction="up" className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-sm font-bold uppercase tracking-widest text-abidjan-orange mb-4">Simple comme bonjour</div>
            <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-5">3 étapes. C&apos;est tout.</h2>
            <p className="text-xl text-beige-muted font-medium">Pas de compte. Pas de téléchargement. Juste ta position.</p>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01', t: 'Envoie ta position',
                d: "Partage ta localisation depuis Telegram ou WhatsApp en un clic.",
                c: 'bg-white', b: 'border-abidjan-orange/20', h: 'hover:border-abidjan-orange',
                icon: '📍', color: 'text-abidjan-orange bg-abidjan-orange/10', delay: 0
              },
              {
                n: '02', t: 'Dis où tu vas',
                d: "En nouchi ou abréviations (Yop, Zone 4), l'IA comprend ton langage.",
                c: 'bg-white', b: 'border-abidjan-blue/20', h: 'hover:border-abidjan-blue',
                icon: '🗣️', color: 'text-abidjan-blue bg-abidjan-blue/10', delay: 120
              },
              {
                n: '03', t: 'Pars en confiance',
                d: "Reçois lignes, tarifs et arrêts. Le vrai prix du terrain garanti.",
                c: 'bg-white', b: 'border-abidjan-green/20', h: 'hover:border-abidjan-green',
                icon: '🚶🏾‍♂️', color: 'text-abidjan-green bg-abidjan-green/10', delay: 240
              },
            ].map((s) => (
              <ScrollReveal key={s.n} direction="up" delay={s.delay}>
                <div className={`group relative rounded-[2rem] p-8 border-2 h-full ${s.c} ${s.b} ${s.h} transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/5`}>
                  <div className="absolute top-6 right-6 font-display text-6xl font-black text-beige-100 group-hover:scale-110 transition-transform select-none">{s.n}</div>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-8 ${s.color}`}>
                    {s.icon}
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-3">{s.t}</h3>
                  <p className="text-beige-muted text-lg font-medium leading-relaxed">{s.d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
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
      </section>

      {/* ══ FONCTIONNALITÉS / C'COMMENT ══════════════════════ */}
      <section id="fonctions" className="py-24 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-5">
          <ScrollReveal direction="up" className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-abidjan-blue bg-abidjan-blue/10 border border-abidjan-blue/20 px-4 py-1.5 rounded-full mb-6">
              ✨ Nouveau
            </div>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight mb-6">
              C&apos;COMMENT ?<br />
              <span className="text-abidjan-orange">Le cœur social d&apos;Abidjan.</span>
            </h2>
            <p className="text-xl text-beige-muted font-medium leading-relaxed">
              BABIMOB n&apos;est plus seulement une carte. C&apos;est la communauté qui te dit la vérité sur le terrain.
            </p>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: '📍', color: 'bg-abidjan-orange/10 text-abidjan-orange', title: 'Check-in Instantané', desc: 'Un bouton "Je suis ici" pour laisser ta trace horodatée. Maquis, arrêt ou marché : montre que tu explores la ville.', delay: 0 },
              { icon: '💬', color: 'bg-abidjan-blue/10 text-abidjan-blue', title: 'Qui est déjà allé ?', desc: "Demande l'avis des autres en un clic. Pas d'algorithmes, juste des vrais Abidjanais qui te répondent en direct.", delay: 120 },
              { icon: '🏅', color: 'bg-abidjan-green/10 text-abidjan-green', title: 'Badge Explorateur', desc: "Plus tu visites, plus tu gagnes de points. Deviens une Légende d'Abidjan et débloque des privilèges dans ton profil.", delay: 240 },
            ].map((f) => (
              <ScrollReveal key={f.title} direction="up" delay={f.delay}>
                <div className="bg-white rounded-[2.5rem] p-8 border border-beige-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all h-full">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-8 ${f.color}`}>{f.icon}</div>
                  <h3 className="font-display font-bold text-2xl mb-4">{f.title}</h3>
                  <p className="text-beige-muted font-medium leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRANSPORTS ═══════════════════════════════════════ */}
      <section id="transports" className="py-24 md:py-32 bg-white border-y border-beige-200/50">
        <div className="max-w-6xl mx-auto px-5">
          <ScrollReveal direction="left" className="max-w-2xl mb-16">
            <div className="text-sm font-bold uppercase tracking-widest text-abidjan-green mb-4">Réseau cartographié</div>
            <h2 className="font-display font-black text-4xl md:text-5xl tracking-tight mb-5">Tous les transports</h2>
            <p className="text-xl text-beige-muted font-medium">
              Gbaka bondé ou taxi confort — BABIMOB connaît les tarifs réels pour chaque véhicule.
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRANSPORTS.map((t, i) => (
              <ScrollReveal key={t.n} direction="up" delay={i * 100}>
                <div className="bg-beige-50 rounded-3xl p-6 border border-beige-200 hover:border-abidjan-green/50 hover:shadow-lg hover:-translate-y-1 transition-all h-full">
                  <div className="text-5xl mb-6">{t.e}</div>
                  <h3 className="font-display font-bold text-xl mb-3">{t.n}</h3>
                  <div className="inline-block bg-white text-abidjan-green font-bold text-sm px-3 py-1.5 rounded-full border border-beige-200 shadow-sm mb-4">
                    {t.p}
                  </div>
                  <p className="text-beige-muted text-sm font-medium leading-relaxed">{t.d}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FOOTER ═══════════════════════════════════════ */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-abidjan-gradient opacity-10" />
        <ScrollReveal direction="up" className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <h2 className="font-display font-black text-5xl md:text-6xl tracking-tight mb-8">
            Prêt à dompter Abidjan ?
          </h2>
          <Link
            href="/app/onboarding"
            className="inline-flex items-center justify-center gap-3 bg-abidjan-orange text-white text-lg font-black px-10 py-5 rounded-full shadow-xl shadow-abidjan-orange/20 hover:bg-orange-600 hover:-translate-y-1 transition-all"
          >
            ENTRER DANS BABI
            <IconArrowRight />
          </Link>
          <div className="mt-8">
            <a
              href="https://t.me/Babimob_bot"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-beige-muted hover:text-abidjan-blue transition-colors"
            >
              Ou essaie d'abord le bot Telegram →
            </a>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
