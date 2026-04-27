'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';

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
                  Un lien magique sera envoyé — sans mot de passe.
                </p>
              </>
            ) : sent ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'color-mix(in oklab, var(--green) 15%, transparent)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Ic.Check s={32} />
                </div>
                <h2 className="font-display" style={{ fontSize: 24, color: 'var(--ink)', marginBottom: 8 }}>Lien envoyé !</h2>
                <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
                  Vérifie ton mail <strong style={{ color: 'var(--ink)' }}>{email}</strong>.<br/>Regarde aussi les spams.
                </p>
                <button onClick={() => { setSent(false); setEmail(''); }} style={{ marginTop: 20, fontSize: 12, fontWeight: 800, color: 'var(--orange)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Essayer un autre email
                </button>
              </div>
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
                  {loading ? 'Envoi…' : (<>Recevoir le lien magique <Ic.Arrow s={18} /></>)}
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
