'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const EMOJIS = [
  '🧭', '🚐', '🚖', '🚕', '🛺', '🦁', '🐘',
  '🌴', '🔥', '⭐', '🏆', '💎', '🦅', '🌊', '🎯', '👑',
];

const ABIDJAN_COMMUNES = [
  'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
  'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon',
  'Anyama', 'Bingerville', 'Songon',
];

// CI phone: 10 digits, optional +225 prefix, optional spaces/dashes
function validateCIPhone(val: string): boolean {
  const cleaned = val.replace(/[\s\-().]/g, '');
  return /^(\+225)?0[0-9]{9}$/.test(cleaned);
}

type Props = {
  userId: string;
  initialName: string;
  initialEmoji: string;
  initialPhone?: string;
  initialConsent?: boolean;
  initialVisibility?: boolean;
  initialCommune?: string;
};

export default function ProfileEditor({
  userId, initialName, initialEmoji,
  initialPhone = '', initialConsent = false, initialVisibility = false,
  initialCommune = '',
}: Props) {
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [phone, setPhone] = useState(initialPhone);
  const [commune, setCommune] = useState(initialCommune);
  const [consent, setConsent] = useState(initialConsent);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [phoneError, setPhoneError] = useState('');

  function handlePhoneChange(val: string) {
    setPhone(val);
    if (val && !validateCIPhone(val)) {
      setPhoneError('Format invalide — ex: 07 12 34 56 78 ou +225 07 12 34 56 78');
    } else {
      setPhoneError('');
    }
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (phone && !validateCIPhone(phone)) {
      setPhoneError('Numéro invalide — corrige avant de sauvegarder.');
      return;
    }
    setStatus('saving');

    // Save core fields first (guaranteed columns)
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: trimmed,
        avatar_emoji: emoji,
        phone_number: phone || null,
        phone_marketing_consent: consent,
        is_public_visits: visibility,
      }, { onConflict: 'id' });

    if (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    // Try origin_commune separately — graceful if column doesn't exist yet
    if (commune !== undefined) {
      await supabase
        .from('profiles')
        .update({ origin_commune: commune || null })
        .eq('id', userId);
    }

    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2500);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-beige-muted font-bold mb-3">Avatar</div>
        <div className="flex flex-wrap gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-11 h-11 rounded-xl text-2xl transition-all active:scale-95 ${
                emoji === e
                  ? 'bg-abidjan-orange/15 border-2 border-abidjan-orange scale-110 shadow-md'
                  : 'bg-beige-50 border-2 border-beige-100 hover:border-abidjan-orange/40'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-beige-muted font-bold mb-2">Pseudo</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="w-full bg-beige-50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-5 py-3 text-sm font-black text-beige-text outline-none transition-colors"
          />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-beige-muted font-bold mb-2">Commune d&apos;origine</div>
          <select
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            className="w-full bg-beige-50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-5 py-3 text-sm font-black text-beige-text outline-none transition-colors appearance-none"
          >
            <option value="">— Sélectionner —</option>
            {ABIDJAN_COMMUNES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-widest text-beige-muted font-bold mb-2">Téléphone</div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => handlePhoneChange(e.target.value)}
          placeholder="07 12 34 56 78"
          className={`w-full bg-beige-50 border-2 rounded-2xl px-5 py-3 text-sm font-black text-beige-text outline-none transition-colors ${
            phoneError ? 'border-red-400 focus:border-red-500' : 'border-beige-100 focus:border-abidjan-orange'
          }`}
        />
        {phoneError && <p className="text-[10px] text-red-500 font-bold mt-1.5">{phoneError}</p>}
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={visibility}
            onChange={e => setVisibility(e.target.checked)}
            className="sr-only"
          />
          <div
            role="switch"
            aria-checked={visibility}
            aria-hidden="true"
            className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${visibility ? 'bg-abidjan-orange' : 'bg-beige-200'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${visibility ? 'translate-x-4' : ''}`} />
          </div>
          <span className="text-xs font-bold text-beige-muted">Rendre mes visites publiques</span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={e => setConsent(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-beige-200 text-abidjan-orange focus:ring-abidjan-orange"
          />
          <span className="text-[10px] font-bold text-beige-muted leading-tight">
            J&apos;accepte de recevoir des offres promotionnelles des partenaires Babimob par téléphone.
          </span>
        </label>
      </div>

      {status === 'error' && (
        <p className="text-xs text-red-500 font-bold text-center">
          Une erreur est survenue. Réessaie.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={status === 'saving' || !name.trim() || !!phoneError}
        className={`w-full text-white font-black py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50 uppercase tracking-tight ${
          status === 'saved'
            ? 'bg-abidjan-green shadow-abidjan-green/20'
            : 'bg-abidjan-orange shadow-abidjan-orange/20 hover:shadow-abidjan-orange/40 hover:-translate-y-0.5'
        }`}
      >
        {status === 'saving' ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sauvegarde…
          </span>
        ) : status === 'saved' ? (
          '✓ Profil mis à jour !'
        ) : (
          'Enregistrer les modifications'
        )}
      </button>
    </div>
  );
}
