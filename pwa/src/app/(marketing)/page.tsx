import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import NavMobile from './NavMobile';
import BeigeMapBackground from '@/components/BeigeMapBackground';

export const metadata: Metadata = {
  title: 'BABIMOB — Bouge à Abidjan comme un local',
  description: 'Le premier assistant intelligent pour le transport informel à Abidjan. Gbaka, Woro-woro, Taxi.',
};

// ── Icons & Config ──────────────────────────────────────────

const TG = 'https://t.me/babimobbot';

const TgIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
  </svg>
);

const TRANSPORTS = [
  { n: 'Gbaka', p: '200F - 500F', d: 'Minicars de 18 à 32 places. Le pilier du transport intercommunal rapide.', e: '🚐' },
  { n: 'Woro-woro', p: '200F - 400F', d: 'Taxis communaux à ligne fixe. La couleur indique la commune d\'opération.', e: '🚖' },
  { n: 'Taxi', p: '1000F - 3000F', d: 'Taxis compteurs intercommunaux rouges. Négociation possible hors compteur.', e: '🚕' },
  { n: 'Saloni', p: '100F - 200F', d: 'Tricycles. Parfaits pour les petites distances dans les quartiers denses.', e: '🛺' },
];

const FEATURES = [
  { t: 'Nouchi supporté', d: 'Demande "Je veux aller à Yop" ou "Zone 4", l\'IA comprend ton langage.', e: '🗣️' },
  { t: 'Tarifs terrain', d: 'Prix réels pratiqués par les apprentis, pas de mauvaises surprises.', e: '💰' },
  { t: 'Points d\'arrêt', d: 'Coordonnées précises des carrefours et gares, ouvrables dans Google Maps.', e: '📍' },
  { t: 'Mode hors-ligne', d: 'Reçois tes itinéraires sur Telegram même avec une connexion faible.', e: '⚡' },
  { t: 'Multimodal', d: 'Combine Gbaka + Woro-woro pour trouver le chemin le plus rapide.', e: '🔄' },
  { t: 'Communautaire', d: 'Un réseau cartographié avec l\'aide des vrais usagers quotidiens.', e: '🤝' },
];

const MARQUEE = [
  { label: 'Yopougon', sub: 'Gare Siporex' },
  { label: 'Adjamé', sub: 'Liberté' },
  { label: 'Cocody', sub: 'Saint-Jean' },
  { label: 'Koumassi', sub: 'Grand Carrefour' },
  { label: 'Marcory', sub: 'Zone 4' },
  { label: 'Abobo', sub: 'Gare' },
  { label: 'Port-Bouët', sub: 'Phare' },
  { label: 'Treichville', sub: 'Gare de Bassam' },
];

// ── Components ──────────────────────────────────────────────

const PhoneMockup = () => {
  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[300px] perspective-1000">
      <div className="relative z-10 rounded-[3rem] border-[8px] border-beige-200 bg-white shadow-2xl overflow-hidden aspect-[9/19] animate-phone-float">
        <div className="absolute top-0 inset-x-0 h-6 bg-beige-200 rounded-b-3xl w-1/2 mx-auto z-20" />
        <div className="absolute inset-0 bg-[#F4F4F5] flex flex-col pt-10 px-4 pb-6">
          <div className="flex-1 flex flex-col justify-end gap-3">
            <div className="self-end bg-abidjan-green text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%] animate-in fade-in slide-in-from-right-4 duration-500 delay-300">
              Je suis à Adjamé Liberté
            </div>
            <div className="self-start flex gap-2 w-full animate-in fade-in slide-in-from-left-4 duration-500 delay-700">
              <div className="w-6 h-6 rounded-full bg-abidjan-orange flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-1 shadow-md">B</div>
              <div className="bg-white text-beige-text px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm border border-beige-100/50">
                <p className="font-semibold mb-1">Gare trouvée ! 📍</p>
                <p className="text-beige-muted text-xs">Où vas-tu ? (ex: "Yopougon")</p>
              </div>
            </div>
            <div className="self-end bg-abidjan-green text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm shadow-sm max-w-[85%] animate-in fade-in slide-in-from-right-4 duration-500 delay-1000">
              Yop
            </div>
            <div className="self-start flex gap-2 w-full animate-in fade-in slide-in-from-left-4 duration-500 delay-[1300ms]">
              <div className="w-6 h-6 rounded-full bg-abidjan-orange flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white mt-1 shadow-md">B</div>
              <div className="bg-white text-beige-text px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm border border-beige-100/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-abidjan-orange/5 rounded-full blur-xl" />
                <p className="font-bold mb-2">🚐 Gbaka (Adjamé ↔ Yop)</p>
                <ul className="text-xs space-y-1.5 text-beige-muted">
                  <li className="flex justify-between border-b border-beige-50 pb-1"><span>Départ:</span> <span className="font-medium text-beige-text">Liberté</span></li>
                  <li className="flex justify-between border-b border-beige-50 pb-1"><span>Tarif:</span> <span className="font-medium text-abidjan-orange">200 FCFA</span></li>
                  <li className="flex justify-between"><span>Durée:</span> <span className="font-medium text-beige-text">~18 min</span></li>
                </ul>
                <button className="mt-3 w-full py-2 bg-beige-50 text-beige-text text-xs font-semibold rounded-lg hover:bg-beige-100 transition-colors">Ouvrir la carte 🗺️</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Decorative shadows */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-black/10 blur-xl rounded-full" />
    </div>
  );
};

// ── Page ───────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-beige-50 text-beige-text font-sans min-h-screen selection:bg-abidjan-orange/20 selection:text-abidjan-orange">
      {/* ══ NAV ══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50">
        <div className="bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50">
          <div className="max-w-6xl mx-auto px-5 h-20 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image src="/icons/icon-192.png" alt="BABIMOB" width={42} height={42} className="rounded-xl flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm" />
              <span className="font-display font-black text-2xl tracking-tight text-beige-text">BABIMOB</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-beige-muted">
              <a href="#comment"    className="hover:text-abidjan-orange transition-colors">Comment ça marche</a>
              <a href="#fonctions"  className="hover:text-abidjan-orange transition-colors">Fonctionnalités</a>
              <a href="#transports" className="hover:text-abidjan-orange transition-colors">Transports</a>
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <a
                href={TG}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold px-5 py-2.5 rounded-full bg-abidjan-blue/10 text-abidjan-blue hover:bg-abidjan-blue/20 transition-colors"
              >
                <TgIcon className="w-4 h-4" /> Telegram
              </a>
              <Link
                href="/app"
                className="text-sm font-bold px-6 py-2.5 rounded-full bg-abidjan-orange text-white hover:bg-abidjan-orange/90 shadow-lg shadow-abidjan-orange/30 hover:shadow-abidjan-orange/40 hover:-translate-y-0.5 transition-all"
              >
                Commencer à se déplacer
              </Link>
            </div>

            <NavMobile tgUrl={TG} />
          </div>
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
        <BeigeMapBackground />

        <div className="max-w-6xl mx-auto px-5 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left */}
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-abidjan-green bg-abidjan-green/10 border border-abidjan-green/20 px-4 py-1.5 rounded-full mb-8 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-abidjan-green animate-pulse" />
                Disponible sur Telegram &amp; le web
              </div>

              <h1 className="font-bm text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight mb-6 text-beige-text">
                Bouge à <span className="text-abidjan-orange-bm">Abidjan</span><br />
                comme un vrai local.
              </h1>

              <p className="text-lg md:text-xl text-beige-muted leading-relaxed max-w-lg mb-10 font-medium">
                Le premier assistant intelligent qui connaît le réseau informel. 
                Gbaka, woro-woro, taxi : trouve ton chemin et le tarif exact en 3 secondes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href={TG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-white border-2 border-abidjan-blue/20 text-abidjan-blue hover:border-abidjan-blue hover:bg-abidjan-blue/5 shadow-xl shadow-abidjan-blue/10 hover:-translate-y-1 transition-all"
                >
                  <TgIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-lg">Tester le Bot</span>
                </a>
                <Link
                  href="/app"
                  className="group flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-abidjan-orange text-white shadow-xl shadow-abidjan-orange/20 hover:shadow-abidjan-orange/40 hover:-translate-y-1 transition-all"
                >
                  <span className="font-bold text-lg">Commencer à se déplacer</span>
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>

              <div className="mt-12 flex items-center gap-6">
                <div className="flex -space-x-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className={`w-10 h-10 rounded-full border-2 border-beige-50 bg-beige-200 flex items-center justify-center text-lg shadow-sm z-[${4-i}]`}>
                      {i === 1 ? '👨🏾‍🦱' : i === 2 ? '👩🏾' : '🧑🏾‍🦱'}
                    </div>
                  ))}
                </div>
                <div className="text-sm font-semibold text-beige-muted">
                  Rejoins <span className="text-beige-text">1,500+</span> explorateurs urbains.
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="relative animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
              {/* Decorative blobs behind phone */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-abidjan-orange/20 to-abidjan-green/20 blur-[80px] rounded-full z-0" />
              <PhoneMockup />
              
              {/* Floating stats card */}
              <div className="absolute top-10 -right-8 md:-right-12 bg-white p-4 rounded-2xl shadow-xl shadow-black/5 border border-beige-100 z-30 animate-bounce-slow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-abidjan-green/10 text-abidjan-green flex items-center justify-center text-xl">✨</div>
                  <div>
                    <div className="text-sm font-black">Tarifs réels</div>
                    <div className="text-xs text-beige-muted">Mis à jour par la commu</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WAX STRIP ════════════════════════════════════════ */}
      <div className="wax-strip wax-strip-orange h-2 w-full" aria-hidden="true" />

      {/* ══ STATS ════════════════════════════════════════════ */}
      <div className="bg-beige-text text-beige-50 py-10">
        <div className="max-w-4xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { v: '38', l: 'Lignes cartographiées' },
            { v: '400+', l: 'Arrêts référencés' },
            { v: '4', l: 'Types de transport' },
            { v: '1 500+', l: 'Explorateurs actifs' },
          ].map((s) => (
            <div key={s.l}>
              <div className="font-bm text-4xl text-abidjan-orange-bm leading-none mb-1">{s.v}</div>
              <div className="text-xs font-semibold uppercase tracking-widest text-beige-200 opacity-70">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="wax-strip wax-strip-green h-2 w-full" aria-hidden="true" />

      {/* ══ MARQUEE ══════════════════════════════════════════ */}
      <div className="border-y border-beige-200 bg-white overflow-hidden py-4 shadow-sm">
        <div className="flex items-center w-max animate-marquee">
          {[...MARQUEE, ...MARQUEE].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2.5 text-base text-beige-muted whitespace-nowrap flex-shrink-0 px-8"
            >
              <span className="w-2 h-2 rounded-full bg-abidjan-orange inline-block shadow-[0_0_8px_rgba(255,122,0,0.5)]" />
              <span className="text-beige-text font-bold">{item.label}</span>
              <span>— {item.sub}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ══ COMMENT ÇA MARCHE ════════════════════════════════ */}
      <section id="comment" className="py-24 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-sm font-bold uppercase tracking-widest text-abidjan-orange mb-4">Simple comme bonjour</div>
            <h2 className="font-bm text-4xl md:text-5xl tracking-tight mb-5">3 étapes. C&apos;est tout.</h2>
            <p className="text-xl text-beige-muted font-medium">Pas de compte. Pas de téléchargement. Juste ta position.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                n: '01', t: 'Envoie ta position',
                d: "Partage ta localisation depuis Telegram ou WhatsApp en un clic.",
                c: 'bg-white', b: 'border-abidjan-orange/20', h: 'hover:border-abidjan-orange',
                icon: '📍', color: 'text-abidjan-orange bg-abidjan-orange/10'
              },
              {
                n: '02', t: 'Dis où tu vas',
                d: "En nouchi ou abréviations (Yop, Zone 4), l'IA comprend ton langage.",
                c: 'bg-white', b: 'border-abidjan-blue/20', h: 'hover:border-abidjan-blue',
                icon: '🗣️', color: 'text-abidjan-blue bg-abidjan-blue/10'
              },
              {
                n: '03', t: 'Pars en confiance',
                d: "Reçois lignes, tarifs et arrêts. Le vrai prix du terrain garanti.",
                c: 'bg-white', b: 'border-abidjan-green/20', h: 'hover:border-abidjan-green',
                icon: '🚶🏾‍♂️', color: 'text-abidjan-green bg-abidjan-green/10'
              },
            ].map((s) => (
              <div key={s.n} className={`group relative rounded-[2rem] p-8 border-2 ${s.c} ${s.b} ${s.h} transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-black/5`}>
                <div className="absolute top-6 right-6 font-display text-6xl font-black text-beige-100 group-hover:scale-110 transition-transform select-none">{s.n}</div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-8 ${s.color}`}>
                  {s.icon}
                </div>
                <h3 className="font-display font-bold text-2xl mb-3">{s.t}</h3>
                <p className="text-beige-muted text-lg font-medium leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FONCTIONNALITÉS / C'COMMENT ══════════════════════ */}
      <section id="fonctions" className="py-24 md:py-32 relative">
        <div className="max-w-6xl mx-auto px-5">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-abidjan-blue bg-abidjan-blue/10 border border-abidjan-blue/20 px-4 py-1.5 rounded-full mb-6">
              ✨ Nouveau
            </div>
            <h2 className="font-bm text-4xl md:text-6xl tracking-tight mb-6">
              C&apos;COMMENT ?<br />
              <span className="text-abidjan-orange-bm">Le cœur social d&apos;Abidjan.</span>
            </h2>
            <p className="text-xl text-beige-muted font-medium leading-relaxed">
              BABIMOB n&apos;est plus seulement une carte. C&apos;est la communauté qui te dit la vérité sur le terrain.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-[2.5rem] p-8 border border-beige-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-abidjan-orange/10 text-abidjan-orange flex items-center justify-center text-3xl mb-8">📍</div>
              <h3 className="font-display font-bold text-2xl mb-4">Check-in Instantané</h3>
              <p className="text-beige-muted font-medium leading-relaxed">
                Un bouton &quot;Je suis ici&quot; pour laisser ta trace horodatée. Maquis, arrêt ou marché : montre que tu explores la ville.
              </p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-beige-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-abidjan-blue/10 text-abidjan-blue flex items-center justify-center text-3xl mb-8">💬</div>
              <h3 className="font-display font-bold text-2xl mb-4">Qui est déjà allé ?</h3>
              <p className="text-beige-muted font-medium leading-relaxed">
                Demande l&apos;avis des autres en un clic. Pas d&apos;algorithmes, juste des vrais Abidjanais qui te répondent en direct.
              </p>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 border border-beige-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-abidjan-green/10 text-abidjan-green flex items-center justify-center text-3xl mb-8">🏅</div>
              <h3 className="font-display font-bold text-2xl mb-4">Badge Explorateur</h3>
              <p className="text-beige-muted font-medium leading-relaxed">
                Plus tu visites, plus tu gagnes de points. Deviens une Légende d&apos;Abidjan et débloque des privilèges dans ton profil.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ TRANSPORTS ═══════════════════════════════════════ */}
      <section id="transports" className="py-24 md:py-32 bg-white border-y border-beige-200/50">
        <div className="max-w-6xl mx-auto px-5">
          <div className="max-w-2xl mb-16">
            <div className="text-sm font-bold uppercase tracking-widest text-abidjan-green mb-4">Réseau cartographié</div>
            <h2 className="font-bm text-4xl md:text-5xl tracking-tight mb-5">Tous les transports</h2>
            <p className="text-xl text-beige-muted font-medium">
              Gbaka bondé ou taxi confort — BABIMOB connaît les tarifs réels pour chaque véhicule.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRANSPORTS.map((t) => (
              <div key={t.n} className="bg-beige-50 rounded-3xl p-6 border border-beige-200 hover:border-abidjan-green/50 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-5xl mb-6">{t.e}</div>
                <h3 className="font-display font-bold text-xl mb-3">{t.n}</h3>
                <div className="inline-block bg-white text-abidjan-green font-bold text-sm px-3 py-1.5 rounded-full border border-beige-200 shadow-sm mb-4">
                  {t.p}
                </div>
                <p className="text-beige-muted text-sm font-medium leading-relaxed">{t.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA FOOTER ═══════════════════════════════════════ */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-abidjan-gradient opacity-10" />
        <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <h2 className="font-bm text-5xl md:text-6xl tracking-tight mb-8">
            Prêt à dompter Abidjan ?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a href={TG} className="px-8 py-4 rounded-full bg-abidjan-blue text-white font-bold text-lg shadow-xl shadow-abidjan-blue/20 hover:scale-105 transition-transform flex items-center justify-center gap-3">
              <TgIcon className="w-5 h-5" /> Lancer sur Telegram
            </a>
            <Link href="/app" className="px-8 py-4 rounded-full bg-white text-beige-text font-bold text-lg shadow-xl shadow-black/5 border-2 border-beige-200 hover:scale-105 transition-transform">
              Ouvrir la Carte Web
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="bg-white border-t border-beige-200 py-12">
        <div className="max-w-6xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <Image src="/icons/icon-192.png" alt="BABIMOB" width={32} height={32} className="rounded-lg grayscale opacity-70" />
            <span className="font-display font-black text-xl text-beige-muted">BABIMOB</span>
          </div>
          <p className="text-sm text-beige-muted font-medium text-center md:text-left">
            © {new Date().getFullYear()} BABIMOB. Fait avec passion à Abidjan 🇨🇮.
          </p>
        </div>
      </footer>
    </div>
  );
}
