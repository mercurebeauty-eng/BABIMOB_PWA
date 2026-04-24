'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import BeigeMapBackground from '@/components/BeigeMapBackground';

const WA_URL = 'https://wa.me/2250000000000?text=Bonjour+BABIMOB+%F0%9F%91%8B';

export default function SignInPage() {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/app/auth/callback` },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden bg-beige-50 font-sans text-beige-text">
      <BeigeMapBackground />
      
      <header className="sticky top-0 z-20 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center gap-3">
          <Link href="/app" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors" aria-label="Retour à la carte">
            <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-bold uppercase tracking-widest text-beige-muted">Connexion</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-12 relative z-10">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="text-center mb-10">
            <Image src="/icons/icon-192.png" alt="BABIMOB" width={64} height={64} className="rounded-2xl mx-auto mb-6 shadow-lg shadow-abidjan-orange/20" />
            <h1 className="font-display font-black text-3xl mb-3 tracking-tight">Rejoindre la cité</h1>
            <p className="text-base text-beige-muted font-medium px-8">Check-in, explore et demande l&apos;avis des locaux.</p>
          </div>

          <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 shadow-xl shadow-black/5 p-8 space-y-6">
            {/* WhatsApp primary CTA */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 w-full bg-[#25d366] hover:bg-[#1ebe5b] text-white font-bold p-5 rounded-2xl transition-all hover:-translate-y-1 shadow-lg shadow-[#25d366]/20"
            >
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">💬</div>
              <div className="text-left flex-1">
                <div className="text-base">S&apos;inscrire via WhatsApp</div>
                <div className="text-xs opacity-90 font-medium">Rapide, sans mot de passe</div>
              </div>
              <span className="text-xl opacity-70">→</span>
            </a>

            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-beige-100" />
              <span className="text-xs font-bold text-beige-200 uppercase tracking-widest">ou</span>
              <div className="flex-1 h-px bg-beige-100" />
            </div>

            {/* Email secondary */}
            {!showEmail ? (
              <button
                onClick={() => setShowEmail(true)}
                className="w-full text-sm font-bold text-beige-muted hover:text-abidjan-orange py-2 transition-colors uppercase tracking-widest"
              >
                Continuer avec un email →
              </button>
            ) : sent ? (
              <div className="text-center py-6 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 rounded-full bg-abidjan-green/10 text-abidjan-green flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="font-display font-black text-xl mb-2">Lien envoyé !</div>
                <p className="text-sm text-beige-muted font-medium leading-relaxed">
                  Vérifie ton mail <strong className="text-beige-text">{email}</strong>.<br />Regarde aussi dans les spams.
                </p>
                <button onClick={() => setSent(false)} className="mt-6 text-xs font-bold text-abidjan-orange uppercase tracking-widest">Essayer un autre email</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-xs font-bold text-beige-text mb-2 uppercase tracking-widest px-1">Adresse email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full px-5 py-4 rounded-xl border-2 border-beige-100 bg-beige-50/50 focus:outline-none focus:border-abidjan-orange focus:bg-white transition-all text-beige-text font-medium placeholder-beige-200"
                  />
                </div>
                {error && (
                  <div className="text-xs font-bold text-red-600 bg-red-50 border-2 border-red-100 rounded-xl p-4">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-abidjan-orange text-white font-black py-5 rounded-2xl shadow-lg shadow-abidjan-orange/30 hover:shadow-abidjan-orange/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 text-lg tracking-tight"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi...
                    </span>
                  ) : "Recevoir le lien magique"}
                </button>
              </form>
            )}
          </div>
          
          <p className="text-center mt-10 text-xs text-beige-muted font-medium leading-relaxed px-10">
            En continuant, tu acceptes les conditions d&apos;utilisation et la politique de confidentialité de BABIMOB.
          </p>
        </div>
      </div>
    </div>
  );
}
