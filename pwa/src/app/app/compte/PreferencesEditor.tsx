'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export const ALL_TRANSIT_MODES = ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];

const MODE_EMOJI: Record<string, string> = {
  'Gbaka': '🚐',
  'Woro-woro': '🚖',
  'Taxi': '🚕',
  'Saloni': '🛺',
};

type Props = {
  userId: string;
  initialPreferences: string[];
};

export default function PreferencesEditor({ userId, initialPreferences }: Props) {
  const supabase = createClient();
  // Normalise initial prefs — fallback to all enabled if empty
  const [prefs, setPrefs] = useState<string[]>(
    initialPreferences.length > 0 ? initialPreferences : ALL_TRANSIT_MODES
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const toggleMode = async (mode: string) => {
    const isSelected = prefs.includes(mode);
    const newPrefs = isSelected
      ? prefs.filter(p => p !== mode)
      : [...prefs, mode];

    setPrefs(newPrefs);
    setStatus('saving');

    // Use update with authenticated user ID — RLS will enforce ownership server-side
    const { error } = await supabase
      .from('profiles')
      .update({ preferred_transit_modes: newPrefs })
      .eq('id', userId);

    if (error) {
      console.error('PreferencesEditor save error:', error);
      // Revert on error
      setPrefs(prefs);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 flex-1">
        {ALL_TRANSIT_MODES.map((mode) => {
          const active = prefs.includes(mode);
          return (
            <button
              key={mode}
              onClick={() => toggleMode(mode)}
              aria-pressed={active}
              className={`text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-sm border-2 active:scale-95 select-none ${
                active
                  ? 'bg-abidjan-green text-white border-abidjan-green shadow-abidjan-green/20'
                  : 'bg-beige-50 border-beige-200 text-beige-muted line-through opacity-60 hover:opacity-80'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span>{MODE_EMOJI[mode]}</span>
                <span>{mode}</span>
                {active ? (
                  <span className="text-[9px] bg-white/20 rounded px-1 font-black">✓</span>
                ) : (
                  <span className="text-[9px] opacity-70">✗</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className={`mt-6 p-4 rounded-2xl border-2 transition-all duration-300 ${
          status === 'saved'
            ? 'bg-abidjan-green/10 border-abidjan-green/30'
            : status === 'error'
            ? 'bg-red-50 border-red-200'
            : status === 'saving'
            ? 'bg-abidjan-blue/5 border-abidjan-blue/20'
            : 'bg-beige-50 border-dashed border-beige-200'
        }`}
      >
        {status === 'saving' && (
          <p className="text-[10px] text-abidjan-blue font-black uppercase tracking-widest animate-pulse">
            Sauvegarde en cours…
          </p>
        )}
        {status === 'saved' && (
          <p className="text-[10px] text-abidjan-green font-black uppercase tracking-widest">
            ✅ Préférences mises à jour — Babimob te le rappellera sur les trajets
          </p>
        )}
        {status === 'error' && (
          <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">
            ❌ Erreur — Réessaie dans un instant
          </p>
        )}
        {status === 'idle' && (
          <p className="text-[10px] text-beige-muted font-bold uppercase tracking-widest leading-relaxed">
            Coche uniquement les transports que tu acceptes.{' '}
            Babimob affichera un avertissement sur les itinéraires et lignes incompatibles.
          </p>
        )}
      </div>
    </>
  );
}
