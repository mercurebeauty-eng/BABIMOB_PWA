'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

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
    <div className="flex-1 flex flex-col overflow-y-auto bg-gray-50">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/app" className="p-1.5 -ml-1 rounded-xl hover:bg-gray-100 transition" aria-label="Retour à la carte">
          <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-sm font-medium text-gray-600">Connexion</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-bm-gradient flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗺️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Rejoindre BABIMOB</h1>
            <p className="text-sm text-gray-500 mt-2">Check-in, explore, partage — 100% gratuit.</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            {/* WhatsApp primary CTA */}
            <a
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 w-full bg-[#25d366] hover:bg-[#1ebe5b] text-white font-semibold px-5 py-4 rounded-2xl transition"
            >
              <span className="text-xl">💬</span>
              <div className="text-left flex-1">
                <div className="text-sm font-bold">S&apos;inscrire via WhatsApp</div>
                <div className="text-xs opacity-80">Rapide, sécurisé, sans mot de passe</div>
              </div>
              <span className="opacity-70">→</span>
            </a>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-xs text-gray-400">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>

            {/* Email secondary */}
            {!showEmail ? (
              <button
                onClick={() => setShowEmail(true)}
                className="w-full text-sm font-medium text-gray-500 hover:text-gray-700 py-2 transition"
              >
                Continuer avec un email →
              </button>
            ) : sent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="font-semibold text-gray-900 mb-1">Lien envoyé !</div>
                <p className="text-sm text-gray-500">
                  Vérifie ta boîte mail <strong className="text-gray-700">{email}</strong>. Pense aux spams.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Adresse email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-bm-amber focus:ring-2 focus:ring-bm-amber/20 transition text-gray-900 placeholder-gray-400"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{error}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-bm-gradient text-black font-semibold py-3 rounded-xl transition disabled:opacity-60"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                      Envoi en cours…
                    </span>
                  ) : "Recevoir le lien de connexion"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
