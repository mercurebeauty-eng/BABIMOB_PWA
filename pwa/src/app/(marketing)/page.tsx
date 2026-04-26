'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import NavMobile from './NavMobile';
import ScrollReveal from './ScrollReveal';

// ── Icons & Config ──────────────────────────────────────────
const TG = 'https://t.me/babimobbot';

const TgIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
  </svg>
);

const TRANSPORTS = [
  { n: 'Gbaka', p: '200F - 500F', d: 'Minicars rapides.', e: '🚐' },
  { n: 'Woro-woro', p: '200F - 400F', d: 'Taxis communaux.', e: '🚖' },
  { n: 'Taxi Rouge', p: '1000F+', d: 'Le confort direct.', e: '🚕' },
  { n: 'Saloni', p: '100F - 200F', d: 'Tricycles agiles.', e: '🛺' },
];

const MARQUEE = [
  'Yopougon Gare', 'Adjamé Liberté', 'Cocody Saint-Jean', 'Marcory Zone 4', 'Abobo Gare', 'Koumassi Grand Carrefour', 'Plateau', 'Treichville'
];

// ── Components ──────────────────────────────────────────────

const PhoneMockup = () => (
  <div className="relative mx-auto w-full max-w-[300px] perspective-1000">
    <motion.div 
      initial={{ rotateY: 20, rotateX: 10, y: 20, opacity: 0 }}
      animate={{ rotateY: 0, rotateX: 0, y: 0, opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="relative z-10 rounded-[3.5rem] border-[10px] border-bm-obsidian bg-bm-obsidian shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden aspect-[9/19.5]"
    >
      <div className="absolute top-0 inset-x-0 h-7 bg-bm-obsidian rounded-b-3xl w-1/3 mx-auto z-30" />
      <div className="absolute inset-0 bg-[#0C0E12] flex flex-col">
        {/* Fake App Content */}
        <div className="h-2/3 bg-[url('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json')] bg-cover relative opacity-60">
           <div className="absolute inset-x-4 top-12 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-[10px] text-white">
              📍 Destination : Riviera 2...
           </div>
           {/* Pulsing Avatar */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-bm-orange border-2 border-white flex items-center justify-center text-xs animate-pulse">
              🦁
           </div>
        </div>
        <div className="flex-1 bg-white/95 p-5 flex flex-col gap-3 rounded-t-[2rem] -mt-6 relative z-10">
           <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto mb-2" />
           <div className="text-xs font-black text-bm-obsidian uppercase tracking-wider">Itinéraire suggéré</div>
           <div className="p-3 rounded-xl bg-bm-orange/10 border border-bm-orange/20 flex items-center gap-3">
              <span className="text-xl">🚐</span>
              <div>
                 <div className="text-[10px] font-black text-bm-orange">GBAKA ADJAMÉ</div>
                 <div className="text-[9px] font-bold text-gray-500">200 FCFA • 15 min</div>
              </div>
           </div>
           <button className="mt-auto py-3 bg-bm-obsidian text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Check-in</button>
        </div>
      </div>
    </motion.div>
    {/* Glow background */}
    <div className="absolute -inset-10 bg-bm-orange/20 blur-[100px] rounded-full z-0 opacity-50" />
  </div>
);

export default function LandingPage() {
  return (
    <div className="bg-bm-obsidian text-white font-sans min-h-screen selection:bg-bm-orange/30 selection:text-bm-orange overflow-x-hidden">
      
      {/* ══ NAV ══════════════════════════════════════════════ */}
      <header className="sticky top-0 z-[100] border-b border-white/5 bg-bm-obsidian/80 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-2xl bg-bm-orange flex items-center justify-center shadow-lg shadow-bm-orange/30 group-hover:rotate-6 transition-transform">
               <span className="text-xl">🦁</span>
            </div>
            <span className="font-display font-black text-2xl tracking-tighter uppercase italic">BABIMOB</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
            <a href="#comment"    className="hover:text-bm-orange transition-colors">Comment ça marche</a>
            <a href="#fonctions"  className="hover:text-bm-orange transition-colors">Explorer</a>
            <a href="#transports" className="hover:text-bm-orange transition-colors">Tarifs</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/app"
              className="text-[11px] font-black uppercase tracking-[0.2em] px-8 py-3 rounded-2xl bg-bm-orange text-white hover:bg-bm-orange/90 shadow-2xl shadow-bm-orange/20 hover:-translate-y-1 transition-all"
            >
              Lancer l'App
            </Link>
          </div>

          <NavMobile tgUrl={TG} />
        </div>
      </header>

      {/* ══ HERO ═════════════════════════════════════════════ */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-52 overflow-hidden">
        {/* Dynamic Background */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
           <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] bg-bm-orange/10 blur-[150px] rounded-full" />
           <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-bm-blue/20 blur-[150px] rounded-full opacity-50" />
           <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left */}
            <div>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 text-[10px] font-black text-bm-orange bg-bm-orange/10 border border-bm-orange/20 px-5 py-2 rounded-full mb-10 shadow-xl"
              >
                <span className="w-2 h-2 rounded-full bg-bm-orange animate-pulse" />
                DÉJA 1,500+ EXPLORATEURS À ABIDJAN
              </motion.div>

              <motion.h1 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="font-display font-black text-6xl md:text-8xl leading-[0.95] tracking-tighter mb-8 italic"
              >
                DOMPTE LA VILLE <br />
                <span className="text-bm-orange outline-text">COMME UN LION.</span>
              </motion.h1>

              <motion.p 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="text-lg md:text-xl text-white/50 leading-relaxed max-w-lg mb-12 font-medium"
              >
                Gbaka, woro-woro, taxi : l'IA qui connaît Abidjan par cœur. 
                Finies les négociations inutiles et les gares perdues.
              </motion.p>

              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-5"
              >
                <Link
                  href="/app"
                  className="group flex items-center justify-center gap-4 px-10 py-5 rounded-2xl bg-bm-orange text-white shadow-[0_20px_50px_rgba(255,107,0,0.3)] hover:scale-105 transition-all"
                >
                  <span className="font-black text-lg uppercase tracking-wider">Ouvrir la Carte</span>
                  <svg className="w-6 h-6 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
                <a
                  href={TG}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-center gap-4 px-10 py-5 rounded-2xl bg-white/5 border-2 border-white/10 text-white hover:bg-white/10 transition-all backdrop-blur-xl"
                >
                  <TgIcon className="w-6 h-6" />
                  <span className="font-black text-lg uppercase tracking-wider">Telegram Bot</span>
                </a>
              </motion.div>
            </div>

            {/* Right */}
            <div className="relative">
              <PhoneMockup />
              {/* Floating Element */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -top-10 -right-4 bg-white/10 backdrop-blur-2xl p-5 rounded-3xl border border-white/20 shadow-2xl z-20 hidden md:block"
              >
                 <div className="flex items-center gap-4">
                    <div className="text-3xl">💰</div>
                    <div>
                       <div className="text-[10px] font-black text-bm-orange uppercase">Tarif Temps Réel</div>
                       <div className="text-sm font-bold">Adjamé → Yop : 200F</div>
                    </div>
                 </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MARQUEE ══════════════════════════════════════════ */}
      <div className="border-y border-white/5 bg-bm-obsidian py-8">
        <div className="bg-bm-orange h-px w-full opacity-20 mb-8" />
        <div className="flex overflow-hidden group">
           <div className="flex animate-marquee whitespace-nowrap">
              {[...MARQUEE, ...MARQUEE].map((name, i) => (
                 <span key={i} className="mx-8 text-4xl md:text-6xl font-black italic text-white/5 uppercase tracking-tighter">
                    {name} <span className="text-bm-orange">•</span>
                 </span>
              ))}
           </div>
        </div>
        <div className="bg-bm-orange h-px w-full opacity-20 mt-8" />
      </div>

      {/* ══ FEATURES ════════════════════════════════════════ */}
      <section id="fonctions" className="py-32 relative">
         <div className="max-w-7xl mx-auto px-6">
            <ScrollReveal direction="up" className="text-center mb-24">
               <h2 className="font-display font-black text-5xl md:text-7xl italic leading-tight mb-6 uppercase tracking-tighter">
                  L'URBANISME <br /> <span className="text-bm-orange">RÉINVENTÉ.</span>
               </h2>
               <p className="text-white/40 text-xl max-w-2xl mx-auto font-medium">BABI n'est pas qu'une ville, c'est un rythme. On te donne la partition.</p>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-10">
               {[
                 { t: 'Live Tracking', d: 'Vois les zones de chaleur social en temps réel sur une map 3D immersive.', e: '🔥' },
                 { t: 'Check-in Social', d: 'Gagne des points, débloque des badges et deviens une légende locale.', e: '🏅' },
                 { t: 'Intelligence Nouchi', d: 'Notre IA comprend le langage de la rue pour des trajets précis.', e: '💬' },
               ].map((f, i) => (
                 <ScrollReveal key={i} direction="up" delay={i * 100}>
                    <div className="bg-white/5 p-10 rounded-[3rem] border border-white/10 hover:border-bm-orange/40 transition-all hover:-translate-y-2 group">
                       <div className="text-6xl mb-8 group-hover:scale-125 transition-transform">{f.e}</div>
                       <h3 className="text-2xl font-black uppercase italic mb-4 tracking-tight">{f.t}</h3>
                       <p className="text-white/40 leading-relaxed font-medium">{f.d}</p>
                    </div>
                 </ScrollReveal>
               ))}
            </div>
         </div>
      </section>

      {/* ══ CTA ══════════════════════════════════════════════ */}
      <section className="py-52 relative text-center overflow-hidden">
         <div className="absolute inset-0 bg-bm-orange opacity-[0.03] z-0" />
         <motion.div 
            whileInView={{ scale: [0.9, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto px-6 relative z-10"
         >
            <h2 className="font-display font-black text-6xl md:text-9xl italic uppercase tracking-tighter mb-12">
               REJOINS <br /> <span className="text-bm-orange">LA MEUTE.</span>
            </h2>
            <div className="flex flex-col sm:flex-row justify-center gap-6">
               <Link href="/app" className="px-12 py-6 rounded-3xl bg-bm-orange text-white font-black text-xl uppercase tracking-widest hover:scale-105 transition-all shadow-[0_30px_60px_rgba(255,107,0,0.4)]">
                  Ouvrir l'App Web
               </Link>
               <a href={TG} className="px-12 py-6 rounded-3xl bg-white text-bm-obsidian font-black text-xl uppercase tracking-widest hover:scale-105 transition-all">
                  Telegram Bot
               </a>
            </div>
         </motion.div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════ */}
      <footer className="py-20 border-t border-white/5">
         <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center gap-4">
               <span className="text-2xl font-black italic tracking-tighter">BABIMOB</span>
            </div>
            <p className="text-white/20 text-sm font-black uppercase tracking-widest">
               FAIT AVEC PASSION À ABIDJAN 🇨🇮 © {new Date().getFullYear()}
            </p>
         </div>
      </footer>
      
      {/* Global CSS for outline text effect */}
      <style jsx global>{`
        .outline-text {
          -webkit-text-stroke: 1px #FF6B00;
          color: transparent;
        }
        @media (min-width: 768px) {
          .outline-text {
            -webkit-text-stroke: 2px #FF6B00;
          }
        }
      `}</style>
    </div>
  );
}
