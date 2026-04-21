'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
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
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      }
    });

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-babimob-blue mb-2">Se connecter</h1>
        <p className="text-sm text-gray-500 mb-6">
          Entre ton adresse email, on t'envoie un lien magique pour te connecter sans mot de passe.
        </p>

        {sent ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
            ✅ Lien envoyé. Vérifie ta boîte mail <strong>{email}</strong> (pense à regarder les spams).
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ton@email.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-babimob-blue transition"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-babimob-blue hover:bg-babimob-blue-dark text-white font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            >
              {loading ? 'Envoi…' : 'Recevoir le lien de connexion'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
