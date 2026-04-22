import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BABIMOB — Gbaka, woro-woro et itinéraires à Abidjan',
  description:
    'BABIMOB t\'aide à trouver ton gbaka, ton woro-woro et tes itinéraires à Abidjan. Sur Telegram pour les notifs temps réel, ou direct sur le web.'
};

const TELEGRAM_URL = 'https://t.me/babimobbot';

export default function LandingPage() {
  return (
    <>
      {/* ====== NAV ====== */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-bm-bg/70 border-b border-bm-border">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-bm-gradient text-black font-display font-bold text-lg">
              B
            </span>
            <span className="font-display font-bold text-lg tracking-tight">babimob</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-bm-muted">
            <a href="#comment" className="hover:text-bm-text transition">Comment ça marche</a>
            <a href="#transports" className="hover:text-bm-text transition">Transports</a>
            <a href="#fonctions" className="hover:text-bm-text transition">Fonctionnalités</a>
            <a href="#tarifs" className="hover:text-bm-text transition">Tarifs</a>
          </nav>
          <Link
            href="/app"
            className="text-sm font-medium px-4 py-2 rounded-full bg-bm-surface border border-bm-border hover:border-bm-amber/60 transition"
          >
            Ouvrir la carte →
          </Link>
        </div>
      </header>

      {/* ====== HERO ====== */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 opacity-40"
          style={{
            background:
              'radial-gradient(600px 400px at 20% 10%, rgba(245,166,35,0.18), transparent 60%), radial-gradient(500px 400px at 85% 30%, rgba(255,107,74,0.15), transparent 60%)'
          }}
        />
        <div className="max-w-6xl mx-auto px-5 py-20 md:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-medium text-bm-amber bg-bm-amber/10 border border-bm-amber/30 px-3 py-1 rounded-full mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-bm-amber animate-pulse" />
              Abidjan — en bêta publique
            </div>
            <h1 className="font-display font-bold text-4xl md:text-6xl leading-[1.05] tracking-tight">
              Ton gbaka. Ton woro-woro.{' '}
              <span className="bg-bm-gradient bg-clip-text text-transparent">
                Ton itinéraire.
              </span>
            </h1>
            <p className="mt-6 text-lg text-bm-muted max-w-2xl">
              BABIMOB te dit où prendre, combien ça coûte et quand ça passe — sans demander à trois
              personnes sous la pluie.
            </p>

            {/* Double CTA */}
            <div className="mt-10 grid sm:grid-cols-2 gap-4 max-w-2xl">
              {/* Telegram */}
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-bm-border bg-bm-surface hover:border-bm-telegram/60 transition p-5 flex items-start gap-4"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-bm-telegram/15 text-bm-telegram flex items-center justify-center">
                  {/* Telegram glyph */}
                  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor" aria-hidden>
                    <path d="M9.04 15.47 8.9 19.3c.38 0 .55-.16.75-.36l1.8-1.72 3.73 2.72c.68.38 1.17.18 1.35-.63l2.45-11.47c.22-1.02-.37-1.42-1.03-1.18L2.77 11.03c-1 .39-.98.95-.17 1.2l3.88 1.21 9-5.67c.42-.28.81-.12.49.16" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-semibold text-base">Sur Telegram</h3>
                    <span className="text-[10px] uppercase tracking-wide bg-bm-telegram/15 text-bm-telegram px-2 py-0.5 rounded-full font-medium">
                      recommandé
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-bm-muted">
                    Notifs temps réel, bons plans, nouveautés — rien ne t'échappe.
                  </p>
                  <div className="mt-3 text-sm text-bm-telegram font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    @babimobbot <span>→</span>
                  </div>
                </div>
              </a>

              {/* Web app */}
              <Link
                href="/app"
                className="group relative overflow-hidden rounded-2xl border border-bm-border bg-bm-surface hover:border-bm-amber/60 transition p-5 flex items-start gap-4"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-bm-amber/15 text-bm-amber flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 22s-8-4.5-8-11.5a8 8 0 1 1 16 0C20 17.5 12 22 12 22Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-base">Sur le web</h3>
                  <p className="mt-1 text-sm text-bm-muted">
                    Pas de Telegram ? Direct la carte. Recherche d'arrêts, lignes, tarifs.
                  </p>
                  <div className="mt-3 text-sm text-bm-amber font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                    Ouvrir la carte <span>→</span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Petite ligne de confiance */}
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-bm-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-bm-green" /> Gratuit pour commencer
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-bm-green" /> Aucune installation
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-bm-green" /> Données Abidjan mises à jour
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ====== COMMENT ÇA MARCHE ====== */}
      <section id="comment" className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-medium uppercase tracking-widest text-bm-amber mb-3">
              Comment ça marche
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
              Trois étapes. Pas de chichi.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: '01',
                t: 'Tu choisis ton arrêt',
                d: 'Tape le nom d\'un quartier, d\'un marché, d\'un carrefour. BABIMOB connaît Abidjan.'
              },
              {
                n: '02',
                t: 'Tu vois tes options',
                d: 'Gbaka, woro-woro, taxi compteur, kéké. Avec les lignes qui passent et le tarif.'
              },
              {
                n: '03',
                t: 'Tu prends la route',
                d: 'Itinéraire point-à-point en plusieurs étapes. Sur Telegram, tu reçois les alertes.'
              }
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl bg-bm-surface border border-bm-border p-6 hover:border-bm-amber/40 transition"
              >
                <div className="font-display text-3xl font-bold bg-bm-gradient bg-clip-text text-transparent">
                  {s.n}
                </div>
                <h3 className="mt-3 font-display font-semibold text-lg">{s.t}</h3>
                <p className="mt-2 text-sm text-bm-muted leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TRANSPORTS ====== */}
      <section id="transports" className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-medium uppercase tracking-widest text-bm-amber mb-3">
              Tous tes transports
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
              Le vrai Abidjan, pas juste les bus.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { e: '🚐', n: 'Gbaka', d: 'Minibus jaunes, lignes fixes.' },
              { e: '🚕', n: 'Woro-woro', d: 'Taxis collectifs de commune.' },
              { e: '🏍️', n: 'Kéké', d: 'Tricycles pour le dernier km.' },
              { e: '🚖', n: 'Taxi compteur', d: 'Course directe, porte-à-porte.' }
            ].map((x) => (
              <div
                key={x.n}
                className="rounded-2xl bg-bm-surface-2 border border-bm-border p-5 hover:border-bm-coral/40 transition"
              >
                <div className="text-3xl">{x.e}</div>
                <h3 className="mt-3 font-display font-semibold">{x.n}</h3>
                <p className="mt-1 text-sm text-bm-muted">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FONCTIONNALITÉS ====== */}
      <section id="fonctions" className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-medium uppercase tracking-widest text-bm-amber mb-3">
              Ce que tu peux faire
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
              Conçu pour la vraie vie abidjanaise.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { t: 'Recherche d\'arrêts', d: 'Trouve un arrêt par nom, quartier ou carrefour.', c: 'amber' },
              { t: 'Lignes & fréquences', d: 'Quelles lignes passent ici, et à quelle cadence.', c: 'coral' },
              { t: 'Itinéraire multi-étapes', d: 'A → B en combinant gbaka, woro et marche.', c: 'green' },
              { t: 'Tarifs indicatifs', d: 'Les prix qu\'on connaît, pour éviter les surprises.', c: 'amber' },
              { t: 'Notifs Telegram', d: 'Perturbations, nouveaux arrêts, bons plans.', c: 'coral' },
              { t: 'Hors-ligne léger', d: 'La carte de base continue à répondre en 2G.', c: 'green' }
            ].map((f) => (
              <div
                key={f.t}
                className="rounded-2xl bg-bm-surface border border-bm-border p-6 hover:bg-bm-surface-2 transition"
              >
                <div
                  className={
                    'w-9 h-9 rounded-lg flex items-center justify-center font-display font-bold ' +
                    (f.c === 'amber'
                      ? 'bg-bm-amber/15 text-bm-amber'
                      : f.c === 'coral'
                      ? 'bg-bm-coral/15 text-bm-coral'
                      : 'bg-bm-green/15 text-bm-green')
                  }
                >
                  ✓
                </div>
                <h3 className="mt-4 font-display font-semibold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-bm-muted leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TARIFS ====== */}
      <section id="tarifs" className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="max-w-2xl mb-14">
            <div className="text-xs font-medium uppercase tracking-widest text-bm-amber mb-3">
              Tarifs
            </div>
            <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
              Gratuit pour commencer. Premium quand tu veux plus.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                n: 'Gratuit',
                p: '0 FCFA',
                f: ['Recherche d\'arrêts', 'Lignes & tarifs indicatifs', 'Carte interactive'],
                cta: 'Commencer',
                href: '/app',
                hl: false
              },
              {
                n: 'Starter',
                p: '1 000 FCFA/mois',
                f: ['Tout du Gratuit', 'Itinéraires illimités', 'Notifs Telegram'],
                cta: 'Bientôt',
                href: '#',
                hl: true
              },
              {
                n: 'Premium',
                p: '2 500 FCFA/mois',
                f: ['Tout du Starter', 'Alertes personnalisées', 'Support prioritaire'],
                cta: 'Bientôt',
                href: '#',
                hl: false
              }
            ].map((p) => (
              <div
                key={p.n}
                className={
                  'rounded-2xl p-6 border transition ' +
                  (p.hl
                    ? 'bg-bm-surface-2 border-bm-amber/60 shadow-[0_0_40px_-10px_rgba(245,166,35,0.35)]'
                    : 'bg-bm-surface border-bm-border')
                }
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg">{p.n}</h3>
                  {p.hl && (
                    <span className="text-[10px] uppercase tracking-wide bg-bm-amber text-black px-2 py-0.5 rounded-full font-bold">
                      populaire
                    </span>
                  )}
                </div>
                <div className="mt-3 font-display text-3xl font-bold">{p.p}</div>
                <ul className="mt-5 space-y-2 text-sm text-bm-muted">
                  {p.f.map((line) => (
                    <li key={line} className="flex items-start gap-2">
                      <span className="text-bm-green mt-0.5">✓</span>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={
                    'mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition ' +
                    (p.hl
                      ? 'bg-bm-gradient text-black hover:opacity-90'
                      : 'bg-bm-surface-2 text-bm-text border border-bm-border hover:border-bm-amber/40')
                  }
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== CTA FINAL ====== */}
      <section className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-20">
          <div className="rounded-3xl border border-bm-border bg-bm-surface p-10 md:p-14 text-center relative overflow-hidden">
            <div
              aria-hidden
              className="absolute inset-0 opacity-30 -z-0"
              style={{
                background:
                  'radial-gradient(400px 300px at 30% 20%, rgba(245,166,35,0.25), transparent 60%), radial-gradient(400px 300px at 80% 80%, rgba(255,107,74,0.2), transparent 60%)'
              }}
            />
            <div className="relative">
              <h2 className="font-display font-bold text-3xl md:text-4xl tracking-tight">
                Prêt à circuler plus futé ?
              </h2>
              <p className="mt-4 text-bm-muted max-w-xl mx-auto">
                Choisis ton canal. Tu peux changer d'avis. Les deux marchent ensemble.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 justify-center">
                <a
                  href={TELEGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-bm-telegram text-white font-medium hover:opacity-90 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden>
                    <path d="M9.04 15.47 8.9 19.3c.38 0 .55-.16.75-.36l1.8-1.72 3.73 2.72c.68.38 1.17.18 1.35-.63l2.45-11.47c.22-1.02-.37-1.42-1.03-1.18L2.77 11.03c-1 .39-.98.95-.17 1.2l3.88 1.21 9-5.67c.42-.28.81-.12.49.16" />
                  </svg>
                  Ouvrir sur Telegram
                </a>
                <Link
                  href="/app"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-bm-gradient text-black font-medium hover:opacity-90 transition"
                >
                  Ouvrir la carte →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="border-t border-bm-border">
        <div className="max-w-6xl mx-auto px-5 py-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-bm-gradient text-black font-display font-bold">
              B
            </span>
            <span className="font-display font-semibold">babimob</span>
            <span className="text-xs text-bm-muted ml-2">Abidjan, Côte d'Ivoire</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-sm text-bm-muted">
            <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover:text-bm-text transition">
              Telegram
            </a>
            <Link href="/app" className="hover:text-bm-text transition">Carte</Link>
            <a href="#tarifs" className="hover:text-bm-text transition">Tarifs</a>
            <span className="text-xs">© {new Date().getFullYear()} babimob</span>
          </div>
        </div>
      </footer>
    </>
  );
}
