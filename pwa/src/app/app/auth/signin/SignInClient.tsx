'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

export default function SignInClient() {
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [sent, setSent] = useState(false);
  const [verifyMode, setVerifyMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { 
        // We still provide a redirect URL in case they click the link,
        // but we'll prioritize the OTP code in the UI.
        emailRedirectTo: `${window.location.origin}/app/auth/callback` 
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSent(true);
      setVerifyMode(true);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: verifyErr } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'magiclink'
    });
    setLoading(false);
    if (verifyErr) setError(verifyErr.message);
    else {
      router.push('/app');
      router.refresh();
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--ink)', color: 'var(--cream)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: 'var(--orange)', opacity: 0.12, pointerEvents: 'none' }} />

      <div style={{ padding: '56px 16px 16px', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cream)', background: 'rgba(255,255,255,0.1)', textDecoration: 'none' }}>
          <Ic.Back s={20} />
        </Link>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 20px 40px', position: 'relative', zIndex: 2 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 24px rgba(242,108,26,0.4)', fontSize: 32 }}>🗺️</div>
            <h1 className="font-display" style={{ fontSize: 36, lineHeight: 1, color: '#fff', marginBottom: 10 }}>Babi t'attend.</h1>
            <p style={{ fontSize: 15, color: 'rgba(247,241,230,0.6)', lineHeight: 1.5 }}>Rejoins 247 000 Babis en ligne.</p>
          </div>

          <div style={{ background: 'var(--cream-2)', borderRadius: 24, padding: 24, border: '1px solid rgba(247,241,230,0.12)' }}>
            {!showEmail ? (
              <>
                <button
                  onClick={() => setShowEmail(true)}
                  className="press"
                  style={{ width: '100%', padding: '16px 20px', borderRadius: 16, border: 'none', background: 'var(--orange)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 }}
                >
                  <span style={{ fontSize: 20 }}>📧</span>
                  Continuer avec un email
                  <Ic.Arrow s={18} />
                </button>
                <p style={{ fontSize: 11, color: 'var(--muted)', textAlign: 'center', lineHeight: 1.5, fontWeight: 600, letterSpacing: 0.3 }}>
                  Une vérification rapide — sans mot de passe.
                </p>
              </>
            ) : verifyMode ? (
              <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ textAlign: 'center', marginBottom: 10 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'color-mix(in oklab, var(--orange) 15%, transparent)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <span style={{ fontSize: 20 }}>✉️</span>
                  </div>
                  <h2 className="font-display" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>Vérifie ton email</h2>
                  <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
                    On a envoyé un code à 6 chiffres à <br/><strong style={{ color: 'var(--ink)' }}>{email}</strong>
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8, textAlign: 'center' }}>Code de vérification</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    inputMode="numeric"
                    autoFocus
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    style={{ 
                      width: '100%', padding: '16px', borderRadius: 14, border: '2px solid var(--orange)', 
                      background: 'var(--cream)', color: 'var(--ink)', fontSize: 24, fontWeight: 900, 
                      outline: 'none', textAlign: 'center', letterSpacing: 8, fontFamily: 'monospace'
                    }}
                  />
                </div>

                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'color-mix(in oklab, #e53e3e 10%, transparent)', border: '1px solid #e53e3e', fontSize: 13, color: '#c53030', fontWeight: 600 }}>{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading || token.length < 6}
                  className="w-full bg-abidjan-orange text-white font-black py-5 rounded-2xl shadow-lg shadow-abidjan-orange/30 hover:shadow-abidjan-orange/40 transition-all disabled:opacity-50 text-lg tracking-tight"
                >
                  {loading ? 'Vérification…' : 'Valider le code'}
                </button>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  <button 
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Renvoyer le code
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setVerifyMode(false); setToken(''); setSent(false); }} 
                    style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Modifier l'email
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 8 }}>Adresse email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ton@email.com"
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--cream)', color: 'var(--ink)', fontSize: 15, fontWeight: 500, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>
                {error && (
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'color-mix(in oklab, #e53e3e 10%, transparent)', border: '1px solid #e53e3e', fontSize: 13, color: '#c53030', fontWeight: 600 }}>{error}</div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-abidjan-orange text-white font-black py-5 rounded-2xl shadow-lg shadow-abidjan-orange/30 hover:shadow-abidjan-orange/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 text-lg tracking-tight flex items-center justify-center gap-2"
                >
                  {loading ? 'Envoi…' : (<>Recevoir le code <Ic.Arrow s={18} /></>)}
                </button>

              </form>
            )}
          </div>

          <p style={{ fontSize: 11, color: 'rgba(247,241,230,0.4)', textAlign: 'center', marginTop: 24, lineHeight: 1.6, fontWeight: 500 }}>
            En continuant, tu acceptes les conditions d'utilisation et la politique de confidentialité de BABIMOB.
          </p>
        </div>
      </div>
    </div>
  );
}
