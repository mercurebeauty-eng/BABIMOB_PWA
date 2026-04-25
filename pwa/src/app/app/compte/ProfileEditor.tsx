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
};

export default function ProfileEditor({ userId, initialName, initialEmoji }: Props) {
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [emoji, setEmoji] = useState(initialEmoji);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setStatus('saving');
    await supabase
      .from('profiles')
      .upsert({ id: userId, display_name: trimmed, avatar_emoji: emoji }, { onConflict: 'id' });
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

      <div>
        <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-3">Pseudo</div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={30}
          placeholder="Ton pseudo dans le feed"
          className="w-full bg-beige-50 border-2 border-beige-100 focus:border-abidjan-orange rounded-2xl px-5 py-4 text-sm font-black text-beige-text outline-none transition-colors placeholder:text-beige-200"
        />
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
          'Sauvegarder'
        )}
      </button>
    </div>
  );
}
