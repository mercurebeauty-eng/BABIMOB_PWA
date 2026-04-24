import Link from 'next/link';
import type { Metadata } from 'next';
import NavMobile from './NavMobile';

export const metadata: Metadata = {
  title: 'BABIMOB — Bouge à Abidjan comme un local',
  description:
    "Le premier assistant de mobilité sociale d'Abidjan. Gbaka, woro-woro, taxi intercommunal, saloni — trouve ton chemin, le vrai tarif et les bons plans de ta commune.",
};

const TG = 'https://t.me/babimobbot';

// ── Data ───────────────────────────────────────────────────

const MARQUEE = [
  { label: 'Gbaka',              sub: '100–300 FCFA' },
  { label: 'Woro-woro',          sub: '200–500 FCFA' },
  { label: 'Taxi intercommunal', sub: "jusqu'à 3 000 FCFA" },
  { label: 'Saloni',             sub: "jusqu'à 300 FCFA" },
  { label: '4 834 arrêts',       sub: 'référencés' },
  { label: '13 communes',        sub: 'couvertes' },
  { label: 'Zéro install',       sub: 'requis' },
  { label: '100 % gratuit',      sub: 'pour toujours' },
];

const TRANSPORTS = [
  {
    n: 'Gbaka',
    p: '100–300 FCFA',
    d: "Minibus roi d'Abidjan. Rapide, présent partout, lignes fixes.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="1" y="6" width="22" height="13" rx="2" />
        <path d="M5 19v2M19 19v2M1 10h22" />
        <circle cx="6.5" cy="16" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="17.5" cy="16" r="1.5" fill="currentColor" stroke="none" />
        <path d="M5 6V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v2" />
      </svg>
    ),
    color: 'text-bm-amber',
    bg: 'bg-bm-amber/10',
  },
  {
    n: 'Woro-woro',
    p: '200–500 FCFA',
    d: 'Taxi collectif aux couleurs de ta commune. Le réseau invisible d\'Abidjan.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h13l4 4v4a2 2 0 0 1-2 2h-2" />
        <path d="M8 7v10" strokeDasharray="2 2" />
        <circle cx="7.5" cy="17" r="2" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="17" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
    color: 'text-bm-coral',
    bg: 'bg-bm-coral/10',
  },
  {
    n: 'Taxi intercommunal',
    p: "jusqu'à 3 000 FCFA",
    d: 'Tarif fixe négocié. Confort garanti entre communes éloignées.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M19 17H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h11l3 4v4a2 2 0 0 1-2 2Z" />
        <circle cx="7.5" cy="17" r="2" fill="currentColor" stroke="none" />
        <circle cx="16.5" cy="17" r="2" fill="currentColor" stroke="none" />
        <path d="M9 7V5" />
      </svg>
    ),
    color: 'text-bm-green',
    bg: 'bg-bm-green/10',
  },
  {
    n: 'Saloni',
    p: "jusqu'à 300 FCFA",
    d: 'Tricycle idéal pour le dernier kilomètre dans les quartiers.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="5" cy="17" r="3" />
        <circle cx="19" cy="17" r="3" />
        <path d="M5 17h14" />
        <path d="M12 17V7l-4 4" />
        <path d="M12 7h5" />
      </svg>
    ),
    color: 'text-[#00b4d8]',
    bg: 'bg-[#00b4d8]/10',
  },
];

const FEATURES = [
  {
    t: 'Nouchi compris',
    d: 'Dis "je veux aller à Yop" — BABIMOB traduit le langage local en requête transport sans friction.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    c: 'text-bm-amber bg-bm-amber/10',
  },
  {
    t: 'GPS à chaque arrêt',
    d: 'Coordonnées cliquables pour chaque arrêt. Ouvre directement dans Google Maps ou partage.',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 22s-8-4.5-8-11.5a8 8 0 1 1 16 0C20 17.5 12 22 12 22Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
    c: 'text-bm-coral bg-bm-coral/10',
  },
  {
    t: 'Tarifs terrain validés',
    d: "Pas de prix officiels fictifs. Nos tarifs sont collectés et vérifiés sur le terrain.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    c: 'text-bm-green bg-bm-green/10',
  },
  {
    t: 'Zéro friction',
    d: "Telegram est déjà installé. Pas de compte, pas d'app store. Tu commences en 10 secondes.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    c: 'text-bm-amber bg-bm-amber/10',
  },
  {
    t: 'Alertes trafic',
    d: "Bouchon sur le pont HKB, pluie sur Cocody — reçois les alertes avant de partir.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    c: 'text-bm-coral bg-bm-coral/10',
  },
  {
    t: 'Règle du dernier km',
    d: "Arrêt à +800m de ta destination ? BABIMOB te suggère automatiquement un saloni.",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
    c: 'text-bm-green bg-bm-green/10',
  },
];

const TESTI = [
  {
    q: '"Avant j\'arrivais en retard à l\'université parce que je prenais le mauvais gbaka. Maintenant en 30 secondes je sais exactement où aller."',
    name: 'Adjoua K.',
    role: 'Étudiante, UFHB Cocody',
    grad: 'from-bm-amber to-bm-coral',
  },
  {
    q: '"Je revenais de France après 4 ans. J\'avais peur de me faire avoir sur les prix. BABIMOB m\'a sauvé la vie — je paie le même prix que les locaux."',
    name: 'Moussa D.',
    role: 'Diaspora, de retour à Abidjan',
    grad: 'from-bm-green to-[#00b4d8]',
  },
  {
    q: '"En tant que commercial, je fais 6–8 déplacements par jour. BABIMOB me fait gagner du temps et de l\'argent chaque semaine."',
    name: 'Koffi A.',
    role: 'Commercial itinérant, Yopougon',
    grad: 'from-bm-coral to-bm-amber',
  },
];

// ── Icons ──────────────────────────────────────────────────

function TgIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M9.04 15.47 8.9 19.3c.38 0 .55-.16.75-.36l1.8-1.72 3.73 2.72c.68.38 1.17.18 1.35-.63l2.45-11.47c.22-1.02-.37-1.42-1.03-1.18L2.77 11.03c-1 .39-.98.95-.17 1.2l3.88 1.21 9-5.67c.42-.28.81-.12.49.16" />
    </svg>
  );
}

function MapPinIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s-8-4.5-8-11.5a8 8 0 1 1 16 0C20 17.5 12 22 12 22Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

// ── Phone mockup ───────────────────────────────────────────

function PhoneMockup() {
  return (
    <div className="hidden md:flex relative justify-center items-center py-12">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(300px 300px at 50% 50%, rgba(245,166,35,0.1), transparent 70%)' }}
      />

      {/* Floating card — fare */}
      <div className="absolute top-6 -right-2 z-20 animate-float" style={{ animationDelay: '-2s' }}>
        <div className="bg-bm-surface border border-bm-border rounded-xl px-3 py-2 shadow-2xl">
          <div className="text-[10px] text-bm-muted mb-0.5">Trajet trouvé</div>
          <div className="font-display font-bold text-sm text-bm-amber">200 FCFA</div>
        </div>
      </div>

      {/* Floating card — C'comment teaser */}
      <div className="absolute bottom-10 -left-6 z-20 animate-float" style={{ animationDelay: '-4.5s' }}>
        <div className="bg-bm-surface border border-bm-border rounded-xl px-3 py-2 shadow-2xl max-w-[130px]">
          <div className="text-[10px] text-bm-muted mb-0.5">Maquis Le Wafou</div>
          <div className="font-display font-bold text-sm text-bm-green">C'comment ? 👀</div>
        </div>
      </div>

      {/* Phone frame */}
      <div className="relative w-[260px] animate-phone-float">
        <div className="bg-bm-surface border border-white/[0.07] rounded-[36px] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)]">
          <div className="p-4">
            {/* Chat header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-bm-gradient flex items-center justify-center font-display font-bold text-[10px] text-black flex-shrink-0">
                  BB
                </div>
                <div>
                  <div className="font-display font-bold text-[11px] leading-tight">BABIMOB</div>
                  <div className="text-[9px] text-bm-green leading-tight">● En ligne</div>
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-bm-telegram/15 text-bm-telegram flex items-center justify-center">
                <TgIcon className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Mini map */}
            <div className="relative bg-bm-surface-2 rounded-2xl overflow-hidden h-[88px] mb-3">
              <div
                aria-hidden
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg,transparent,transparent 14px,rgba(255,255,255,0.025) 14px,rgba(255,255,255,0.025) 15px),' +
                    'repeating-linear-gradient(90deg,transparent,transparent 14px,rgba(255,255,255,0.025) 14px,rgba(255,255,255,0.025) 15px)',
                }}
              />
              <span className="absolute top-2 left-2 text-[9px] text-bm-amber font-semibold z-10">Ta position</span>
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-[#4a9eff] shadow-[0_0_8px_#4a9eff]"
                style={{ top: '42%', left: '36%', transform: 'translate(-50%,-50%)' }}
              >
                <div className="absolute inset-[-5px] rounded-full border border-[rgba(74,158,255,0.3)] animate-ping" style={{ animationDuration: '2s' }} />
              </div>
              <div
                className="absolute w-2.5 h-2.5 rounded-full bg-bm-green"
                style={{ bottom: '26%', right: '20%', boxShadow: '0 0 8px #2edd8b' }}
              />
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 260 88" preserveAspectRatio="xMidYMid slice" aria-hidden>
                <path d="M 93 42 Q 150 18 208 60" fill="none" stroke="rgba(46,221,139,0.55)" strokeWidth="1.5" strokeDasharray="5 3" />
              </svg>
            </div>

            {/* Chat bubbles */}
            <div className="space-y-2">
              <div className="flex items-start gap-1.5">
                <div className="w-5 h-5 rounded-full bg-bm-gradient flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-black mt-0.5">B</div>
                <div className="bg-bm-surface-2 rounded-2xl rounded-tl-sm px-2.5 py-1.5 text-[10px] leading-relaxed">
                  3 arrêts à proximité de toi.
                </div>
              </div>
              <div className="flex justify-end">
                <div className="bg-bm-gradient rounded-2xl rounded-tr-sm px-2.5 py-1.5 text-[10px] text-black font-medium max-w-[80%]">
                  Je veux aller à Yopougon
                </div>
              </div>
              <div className="flex items-start gap-1.5">
                <div className="w-5 h-5 rounded-full bg-bm-gradient flex-shrink-0 flex items-center justify-center text-[8px] font-bold text-black mt-0.5">B</div>
                <div className="bg-bm-surface-2 rounded-2xl rounded-tl-sm px-2.5 py-1.5 text-[10px] leading-[1.6] max-w-[85%]">
                  Gbaka Adjamé ↔ Yop<br />
                  Arrêt Liberté — 87m<br />
                  200 FCFA · ~18 min
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      {/* ══ NAV ══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50">
        <div className="bg-bm-bg/80 backdrop-blur-xl border-b border-bm-border">
          <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-bm-gradient text-black font-display font-bold text-xs flex-shrink-0">
                BB
              </span>
              <span className="font-display font-bold text-lg tracking-tight">BABIMOB</span>
            </Link>

            <nav className="hidden md:flex items-center gap-7 text-sm text-bm-muted">
              <a href="#comment"    className="hover:text-bm-text transition-colors">Comment ça marche</a>
              <a href="#transports" className="hover:text-bm-text transition-colors">Transports</a>
              <a href="#fonctions"  className="hover:text-bm-text transition-colors">Fonctionnalités</a>
              <a href="#ccomment"   className="hover:text-bm-amber transition-colors font-medium">C'comment</a>
            </nav>

            <div className="hidden md:flex items-center gap-2.5">
              <a
                href={TG}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl bg-bm-telegram/10 text-bm-telegram border border-bm-telegram/25 hover:bg-bm-telegram/20 transition"
              >
                <TgIcon className="w-4 h-4" /> Telegram
              </a>
              <Link
                href="/app"
                className="text-sm font-bold px-4 py-2 rounded-xl bg-bm-gradient text-black hover:opacity-90 transition"
              >
                Ouvrir la carte →
              </Link>
            </div>

            <NavMobile tgUrl={TG} />
          </div>
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Dark map background */}
        <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #0a0e14 0%, #0d1219 40%, #091018 100%)' }} />
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg,transparent,transparent 59px,rgba(180,200,255,0.6) 59px,rgba(180,200,255,0.6) 60px),' +
                'repeating-linear-gradient(90deg,transparent,transparent 59px,rgba(180,200,255,0.6) 59px,rgba(180,200,255,0.6) 60px)',
            }}
          />
          <svg className="absolute inset-0 w-full h-full opacity-[0.12]" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice" fill="none">
            <path d="M 0 320 Q 200 280 400 310 Q 600 340 800 300 Q 1000 260 1200 290" stroke="rgba(180,200,255,0.8)" strokeWidth="1.5" />
            <path d="M 0 420 Q 150 380 350 400 Q 550 420 750 390 Q 950 360 1200 380" stroke="rgba(180,200,255,0.8)" strokeWidth="1.2" />
            <path d="M 300 0 Q 350 150 320 300 Q 290 450 310 600" stroke="rgba(180,200,255,0.8)" strokeWidth="1" />
            <path d="M 650 0 Q 680 120 660 280 Q 640 440 670 600" stroke="rgba(180,200,255,0.8)" strokeWidth="1" />
            <path d="M 900 0 Q 920 100 890 260 Q 860 420 880 600" stroke="rgba(180,200,255,0.8)" strokeWidth="0.8" />
            <path d="M 0 480 Q 300 510 600 490 Q 900 470 1200 500" stroke="rgba(42,171,238,0.25)" strokeWidth="4" />
            <path d="M 0 490 Q 300 520 600 500 Q 900 480 1200 510" stroke="rgba(42,171,238,0.1)" strokeWidth="12" />
          </svg>
          <svg className="absolute inset-0 w-full h-full opacity-90" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
            <circle cx="480" cy="240" r="3" fill="#f5a623" opacity="0.9" />
            <circle cx="480" cy="240" r="12" fill="rgba(245,166,35,0.08)" />
            <text x="492" y="238" fontSize="10" fill="rgba(180,190,210,0.5)" fontFamily="system-ui,sans-serif" fontWeight="500">Adjamé</text>
            <circle cx="180" cy="280" r="3.5" fill="#f5a623" opacity="0.9" />
            <circle cx="180" cy="280" r="16" fill="rgba(245,166,35,0.07)" />
            <text x="196" y="278" fontSize="10" fill="rgba(180,190,210,0.5)" fontFamily="system-ui,sans-serif" fontWeight="500">Yopougon</text>
            <circle cx="760" cy="200" r="3" fill="#2edd8b" opacity="0.8" />
            <circle cx="760" cy="200" r="10" fill="rgba(46,221,139,0.07)" />
            <text x="772" y="198" fontSize="10" fill="rgba(180,190,210,0.5)" fontFamily="system-ui,sans-serif" fontWeight="500">Cocody</text>
            <circle cx="400" cy="150" r="2.5" fill="#f5a623" opacity="0.7" />
            <text x="412" y="148" fontSize="9" fill="rgba(180,190,210,0.4)" fontFamily="system-ui,sans-serif">Abobo</text>
            <circle cx="560" cy="310" r="3" fill="#2aabee" opacity="0.85" />
            <circle cx="560" cy="310" r="11" fill="rgba(42,171,238,0.07)" />
            <text x="572" y="308" fontSize="10" fill="rgba(180,190,210,0.5)" fontFamily="system-ui,sans-serif" fontWeight="500">Plateau</text>
            <circle cx="680" cy="420" r="2.5" fill="#f5a623" opacity="0.7" />
            <text x="692" y="418" fontSize="9" fill="rgba(180,190,210,0.4)" fontFamily="system-ui,sans-serif">Koumassi</text>
            <circle cx="820" cy="490" r="2.5" fill="#2edd8b" opacity="0.6" />
            <text x="832" y="488" fontSize="9" fill="rgba(180,190,210,0.35)" fontFamily="system-ui,sans-serif">Port-Bouët</text>
            <circle cx="620" cy="380" r="2" fill="#f5a623" opacity="0.6" />
            <text x="632" y="378" fontSize="9" fill="rgba(180,190,210,0.35)" fontFamily="system-ui,sans-serif">Marcory</text>
          </svg>
          <div
            className="absolute -top-32 right-0 w-[700px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.09), transparent 65%)' }}
          />
          <div
            className="absolute bottom-0 -left-20 w-[500px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(46,221,139,0.07), transparent 65%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: 'linear-gradient(to bottom, transparent, #0a0c0f)' }} />
        </div>

        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-bm-amber bg-bm-amber/10 border border-bm-amber/25 px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-bm-green animate-pulse" />
                Disponible sur Telegram &amp; le web
              </div>

              <h1 className="font-display font-bold text-5xl md:text-6xl leading-[1.03] tracking-tight">
                Bouge à<br />
                <span className="bg-bm-gradient bg-clip-text text-transparent">Abidjan</span><br />
                comme un local
              </h1>

              <p className="mt-5 text-lg text-bm-muted leading-relaxed max-w-md">
                Le premier assistant qui cartographie le transport informel d&apos;Abidjan.
                Gbaka, woro-woro, taxi intercommunal — ton chemin et le vrai tarif en quelques secondes.
              </p>

              {/* Dual CTA */}
              <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-lg">
                <a
                  href={TG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-2xl border border-bm-border bg-bm-surface p-4 hover:border-bm-telegram/50 hover:bg-bm-telegram/[0.04] transition"
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-bm-telegram/15 text-bm-telegram flex items-center justify-center">
                    <TgIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-display font-semibold text-sm">Sur Telegram</span>
                      <span className="text-[9px] bg-bm-telegram/15 text-bm-telegram px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                        recommandé
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-bm-muted">Notifs temps réel · bons plans</p>
                    <span className="mt-2 flex text-xs text-bm-telegram font-medium items-center gap-1 group-hover:gap-2 transition-all">
                      @babimobbot <span>→</span>
                    </span>
                  </div>
                </a>

                <Link
                  href="/app"
                  className="group flex items-start gap-3 rounded-2xl border border-bm-border bg-bm-surface p-4 hover:border-bm-amber/50 hover:bg-bm-amber/[0.04] transition"
                >
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-bm-amber/15 text-bm-amber flex items-center justify-center">
                    <MapPinIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-display font-semibold text-sm">Sur le web</span>
                    <p className="mt-0.5 text-xs text-bm-muted">Carte interactive · zéro install</p>
                    <span className="mt-2 flex text-xs text-bm-amber font-medium items-center gap-1 group-hover:gap-2 transition-all">
                      Ouvrir la carte <span>→</span>
                    </span>
                  </div>
                </Link>
              </div>

              {/* Stats strip */}
              <div className="mt-8 pt-8 border-t border-bm-border flex flex-wrap gap-x-8 gap-y-3">
                {[
                  ['4 800+', 'Arrêts référencés'],
                  ['490',    'Lignes actives'],
                  ['13',     'Communes'],
                  ['100%',   'Gratuit'],
                ].map(([n, l]) => (
                  <div key={l}>
                    <div className="font-display font-bold text-xl">{n}</div>
                    <div className="text-xs text-bm-muted mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — phone */}
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ══════════════════════════════════════════ */}
      <div className="border-y border-bm-border bg-bm-surface overflow-hidden py-3.5">
        <div className="flex items-center w-max animate-marquee">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 text-sm text-bm-muted whitespace-nowrap flex-shrink-0 px-7"
            >
              <span className="w-1 h-1 rounded-full bg-bm-amber inline-block" />
              <span className="text-bm-text font-medium">{item.label}</span>
              <span>{item.sub}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ COMMENT ÇA MARCHE ════════════════════════════════ */}
      <section id="comment" className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-semibold uppercase tracking-widest text-bm-amber mb-3">Simple comme bonjour</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">3 étapes. C&apos;est tout.</h2>
            <p className="mt-3 text-bm-muted">Pas de compte. Pas de téléchargement. Juste ta position GPS.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                t: 'Envoie ta position',
                d: "Partage ta localisation GPS depuis Telegram en un tap, ou colle tes coordonnées Google Maps.",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 22s-8-4.5-8-11.5a8 8 0 1 1 16 0C20 17.5 12 22 12 22Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
              },
              {
                n: '02',
                t: 'Dis où tu veux aller',
                d: "En français, en nouchi, ou avec des abréviations — \"Yop\", \"Zone 4\", \"220 logements\" — BABIMOB te comprend.",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                ),
              },
              {
                n: '03',
                t: 'Pars en confiance',
                d: "Tu reçois les arrêts, les lignes, le tarif terrain validé, et les coordonnées GPS cliquables.",
                icon: (
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                ),
              },
            ].map((s) => (
              <div
                key={s.n}
                className="group rounded-2xl bg-bm-surface border border-bm-border p-6 hover:border-bm-amber/40 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="font-display text-5xl font-bold bg-bm-gradient bg-clip-text text-transparent opacity-20 leading-none mb-3 select-none">
                  {s.n}
                </div>
                <div className="w-11 h-11 rounded-xl bg-bm-amber/10 text-bm-amber flex items-center justify-center mb-4">
                  {s.icon}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{s.t}</h3>
                <p className="text-sm text-bm-muted leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRANSPORTS ═══════════════════════════════════════ */}
      <section id="transports" className="border-t border-bm-border bg-bm-surface-2">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-24">
          <div className="max-w-2xl mb-12">
            <div className="text-xs font-semibold uppercase tracking-widest text-bm-amber mb-3">Réseau cartographié</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">Tous les transports d&apos;Abidjan</h2>
            <p className="mt-3 text-bm-muted">
              Gbaka bondé ou taxi confort — BABIMOB connaît les tarifs réels du terrain pour chaque véhicule.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TRANSPORTS.map((t) => (
              <div
                key={t.n}
                className="rounded-2xl bg-bm-surface border border-bm-border p-5 hover:border-bm-amber/35 hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-14 h-14 rounded-2xl ${t.bg} ${t.color} flex items-center justify-center mb-4`}>
                  {t.icon}
                </div>
                <div className="font-display font-bold text-base mb-2">{t.n}</div>
                <div className="inline-block bg-bm-green/10 text-bm-green text-xs font-semibold px-2.5 py-1 rounded-full mb-3">
                  {t.p}
                </div>
                <p className="text-xs text-bm-muted leading-relaxed">{t.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FONCTIONNALITÉS ══════════════════════════════════ */}
      <section id="fonctions" className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-semibold uppercase tracking-widest text-bm-amber mb-3">Ce qui nous différencie</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">Conçu pour les vrais Abidjanais</h2>
            <p className="mt-3 text-bm-muted">
              Chaque détail est pensé pour la réalité du terrain — pas pour un bureau à San Francisco.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div
                key={f.t}
                className="flex gap-4 rounded-2xl bg-bm-surface border border-bm-border p-5 hover:border-bm-green/30 hover:bg-bm-green/[0.02] transition-all duration-300"
              >
                <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${f.c}`}>
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-display font-semibold text-sm mb-1">{f.t}</h3>
                  <p className="text-xs text-bm-muted leading-relaxed">{f.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ C'COMMENT ════════════════════════════════════════ */}
      <section id="ccomment" className="border-t border-bm-border bg-bm-surface-2">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">

            {/* Left — pitch */}
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold bg-bm-green/10 text-bm-green border border-bm-green/25 px-3.5 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-bm-green animate-pulse" />
                Bientôt disponible
              </div>
              <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
                C&apos;comment ?<br />
                <span className="bg-bm-gradient bg-clip-text text-transparent">La découverte sociale</span><br />
                d&apos;Abidjan
              </h2>
              <p className="text-bm-muted leading-relaxed mb-8">
                BABIMOB ne t&apos;aide pas seulement à te déplacer. Il te connecte aux gens qui connaissent les bons coins.
                Check-in dans les maquis, restaurants, marchés — demande l&apos;avis de ceux qui y sont déjà allés.
              </p>

              <div className="space-y-4">
                {[
                  {
                    t: 'Check-in lieux',
                    d: '"Je suis au Maquis La Terrasse à Cocody" — laisse une trace, construis ton profil explorateur.',
                    c: 'text-bm-amber bg-bm-amber/10',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 22s-8-4.5-8-11.5a8 8 0 1 1 16 0C20 17.5 12 22 12 22Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    ),
                  },
                  {
                    t: 'Demande & réponds',
                    d: '"Qui est déjà allé au Wafou ? C\'était comment ?" — les locaux répondent, pas les algos.',
                    c: 'text-bm-coral bg-bm-coral/10',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    ),
                  },
                  {
                    t: 'Badge Explorateur',
                    d: 'Communes visitées, lieux découverts, avis donnés — ton profil de vrai Abidjanais.',
                    c: 'text-bm-green bg-bm-green/10',
                    icon: (
                      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div key={item.t} className="flex gap-3 items-start">
                    <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 ${item.c}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-display font-semibold text-sm mb-0.5">{item.t}</div>
                      <p className="text-xs text-bm-muted leading-relaxed">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <a
                  href={TG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-bm-telegram/10 border border-bm-telegram/30 text-bm-telegram font-display font-semibold text-sm hover:bg-bm-telegram/20 transition"
                >
                  <TgIcon className="w-4 h-4" />
                  Rejoindre la bêta sur Telegram
                </a>
              </div>
            </div>

            {/* Right — mockup conversation */}
            <div className="relative">
              <div
                aria-hidden
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(400px 300px at 50% 30%, rgba(46,221,139,0.08), transparent 70%)' }}
              />
              <div className="bg-bm-surface border border-bm-border rounded-3xl p-6 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-widest text-bm-muted mb-4">
                  Aperçu — C&apos;comment
                </div>

                {/* Messages */}
                {[
                  { from: 'user', text: 'Qui est déjà allé au Maquis Moobest à Bingerville ?' },
                  { from: 'bot',  text: '👤 Serge y était il y a 2 jours · 👤 Aya y était la semaine dernière', sub: '2 personnes ont répondu' },
                  { from: 'user', text: 'C\'était comment le cadre ?' },
                  { from: 'reply', author: 'Serge', text: 'Cadre très sympa, musique cool le soir. Portions généreuses. 9/10 pour moi 🔥' },
                ].map((m, i) => (
                  <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {m.from === 'reply' && (
                      <div className="w-6 h-6 rounded-full bg-bm-green/20 text-bm-green text-[9px] font-bold flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                        {(m.author ?? 'U')[0]}
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                      m.from === 'user'
                        ? 'bg-bm-gradient text-black font-medium rounded-tr-sm'
                        : m.from === 'reply'
                          ? 'bg-bm-green/10 border border-bm-green/20 text-bm-text rounded-tl-sm'
                          : 'bg-bm-surface-2 text-bm-text rounded-tl-sm'
                    }`}>
                      {m.from === 'reply' && (
                        <div className="text-bm-green font-semibold text-[10px] mb-0.5">{m.author}</div>
                      )}
                      {m.text}
                      {m.sub && <div className="text-[10px] text-bm-muted mt-1">{m.sub}</div>}
                    </div>
                  </div>
                ))}

                {/* Coming soon label */}
                <div className="pt-3 border-t border-bm-border text-center">
                  <span className="text-xs text-bm-muted">
                    Inscription sur{' '}
                    <a href={TG} target="_blank" rel="noopener noreferrer" className="text-bm-telegram hover:underline font-medium">
                      Telegram
                    </a>{' '}
                    pour accès anticipé
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TÉMOIGNAGES ══════════════════════════════════════ */}
      <section className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs font-semibold uppercase tracking-widest text-bm-amber mb-3">Ils en parlent</div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">Abidjan dit merci</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {TESTI.map((t, i) => (
              <div
                key={i}
                className="rounded-2xl bg-bm-surface border border-bm-border p-6 hover:border-white/[0.12] transition flex flex-col"
              >
                <div className="text-bm-amber text-sm tracking-widest mb-4">★★★★★</div>
                <p className="text-sm text-bm-muted leading-relaxed italic flex-1 mb-5">{t.q}</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center font-display font-bold text-sm text-black flex-shrink-0`}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-bm-muted">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FINAL ════════════════════════════════════════ */}
      <section className="border-t border-bm-border bg-bm-surface-2">
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-24">
          <div className="relative rounded-3xl border border-bm-border bg-bm-surface overflow-hidden text-center p-10 md:p-16">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(600px 280px at 50% 0%, rgba(245,166,35,0.07), transparent 60%)' }}
            />
            <div className="relative">
              <div className="text-xs font-semibold uppercase tracking-widest text-bm-amber mb-4">Rejoins la communauté</div>
              <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-4">
                Abidjan n&apos;attend pas.<br />Toi non plus.
              </h2>
              <p className="text-bm-muted max-w-lg mx-auto mb-8 text-base">
                Gratuit. Zéro téléchargement. Fonctionne sur tout téléphone.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a
                  href={TG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-white font-display font-bold hover:opacity-90 transition shadow-[0_8px_24px_rgba(42,171,238,0.2)]"
                  style={{ background: '#0a6fa8' }}
                >
                  <TgIcon className="w-5 h-5" /> Démarrer sur Telegram
                </a>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-bm-gradient text-black font-display font-bold hover:opacity-90 transition shadow-[0_8px_24px_rgba(245,166,35,0.2)]"
                >
                  <MapPinIcon className="w-5 h-5" /> Ouvrir la carte
                </Link>
              </div>
              <p className="mt-5 text-xs text-bm-muted">
                Questions ? Écris à{' '}
                <a href="https://t.me/momochicky7" target="_blank" rel="noopener noreferrer" className="text-bm-amber hover:underline">
                  @momochicky7
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-10">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-bm-gradient text-black font-display font-bold text-xs">BB</span>
                <span className="font-display font-bold">BABIMOB</span>
              </Link>
              <p className="text-sm text-bm-muted max-w-xs leading-relaxed">
                Le transport informel d&apos;Abidjan, enfin navigable. Mobilité + découverte sociale. Sur Telegram ou sur le web.
              </p>
            </div>

            <div>
              <div className="font-display font-semibold text-xs uppercase tracking-widest mb-4 text-bm-muted">Produit</div>
              <ul className="space-y-2.5">
                {[
                  ['#comment',    'Comment ça marche'],
                  ['#transports', 'Transports'],
                  ['#fonctions',  'Fonctionnalités'],
                  ['#ccomment',   "C'comment"],
                ].map(([h, l]) => (
                  <li key={l}>
                    <a href={h} className="text-sm text-bm-muted hover:text-bm-amber transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-display font-semibold text-xs uppercase tracking-widest mb-4 text-bm-muted">Contact</div>
              <ul className="space-y-2.5">
                <li>
                  <a href={TG} target="_blank" rel="noopener noreferrer" className="text-sm text-bm-muted hover:text-bm-amber transition-colors">
                    Bot Telegram
                  </a>
                </li>
                <li>
                  <a href="https://t.me/momochicky7" target="_blank" rel="noopener noreferrer" className="text-sm text-bm-muted hover:text-bm-amber transition-colors">
                    @momochicky7
                  </a>
                </li>
                <li>
                  <span className="text-sm text-bm-muted">Abidjan, Côte d&apos;Ivoire</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-bm-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-bm-muted">
              © {new Date().getFullYear()} BABIMOB · Tous droits réservés · Abidjan, Côte d&apos;Ivoire
            </span>
            <div className="flex gap-2">
              <span className="bg-bm-surface border border-bm-border rounded-md px-2 py-1 text-[11px] text-bm-muted inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-bm-amber flex-shrink-0" fill="currentColor" aria-hidden><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                Powered by Claude AI
              </span>
              <span className="bg-bm-surface border border-bm-border rounded-md px-2 py-1 text-[11px] text-bm-muted inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-bm-green flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                Données sécurisées
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
