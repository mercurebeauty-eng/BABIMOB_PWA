'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const EMOJIS = [
  '🧭', '🚐', '🚖', '🚕', '🛺', '🦁', '🐘',
  '🌴', '🔥', '⭐', '🏆', '💎', '🦅', '🌊', '🎯', '👑',
];

type Props = {
  userId: string;
  initialName: string;
  initialEmoji: string;
  initialPhone?: string;
  initialConsent?: boolean;
  initialVisibility?: boolean;
};

export default function ProfileEditor({ 
  userId, initialName, initialEmoji, 
  initialPhone = '', initialConsent = false, initialVisibility = false 
}: Props) {
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [phone, setPhone] = useState(initialPhone);
  const [consent, setConsent] = useState(initialConsent);
  const [visibility, setVisibility] = useState(initialVisibility);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStatus('saving');
    await supabase
      .from('profiles')
      .upsert({ 
        id: userId, 
        display_name: trimmed, 
        avatar_emoji: emoji,
        phone_number: phone,
        phone_marketing_consent: consent,
        is_public_visits: visibility
      }, { onConflict: 'id' });
    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2500);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-3">Avatar</div>
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
          <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-2">Pseudo</div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            className="w-full bg-beige-50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-5 py-3 text-sm font-black text-beige-text outline-none transition-colors"
          />
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-2">Téléphone</div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="07 00 00 00 00"
            className="w-full bg-beige-50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-5 py-3 text-sm font-black text-beige-text outline-none transition-colors"
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox" 
            checked={visibility} 
            onChange={e => setVisibility(e.target.checked)}
            className="hidden" 
          />
          <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${visibility ? 'bg-abidjan-orange' : 'bg-beige-200'}`}>
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

      <button
        onClick={handleSave}
        disabled={status === 'saving' || !name.trim()}
        className="w-full bg-abidjan-orange text-white font-black py-4 rounded-2xl shadow-lg shadow-abidjan-orange/20 hover:shadow-abidjan-orange/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 uppercase tracking-tight"
      >
        {status === 'saving' ? (
          <span className="flex items-center justify-center gap-3">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Sauvegarde…
          </span>
        ) : status === 'saved' ? (
          '✅ Profil mis à jour !'
        ) : (
          'Enregistrer les modifications'
        )}
      </button>
    </div>
  );
}
