'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export const ALL_TRANSIT_MODES = ['Gbaka', 'Woro-woro', 'Taxi', 'Saloni'];

type Props = {
  userId: string;
  initialPreferences: string[];
};

export default function PreferencesEditor({ userId, initialPreferences }: Props) {
  const supabase = createClient();
  const [prefs, setPrefs] = useState<string[]>(
    initialPreferences.length > 0 ? initialPreferences : ALL_TRANSIT_MODES
  );
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Theme logic
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as 'dark') || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleMode = async (mode: string) => {
    const isSelected = prefs.includes(mode);
    const newPrefs = isSelected 
      ? prefs.filter(p => p !== mode)
      : [...prefs, mode];
    
    setPrefs(newPrefs);
    setStatus('saving');

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_transit_modes: newPrefs })
      .eq('id', userId);

    if (error) {
      console.error(error);
      setStatus('error');
      // Revert if error
      setPrefs(prefs);
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 flex-1">
        {ALL_TRANSIT_MODES.map((t) => {
          const active = prefs.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleMode(t)}
              aria-pressed={active}
              className={`text-xs font-black px-4 py-2.5 rounded-2xl transition-all shadow-sm border-2 active:scale-95 ${
                active 
                  ? 'bg-abidjan-green text-white border-abidjan-green shadow-abidjan-green/20' 
                  : 'bg-beige-50 border-beige-100 text-beige-muted hover:border-abidjan-green/30 hover:text-abidjan-green'
              }`}
            >
              <div className="flex items-center gap-2">
                 <span>{t === 'Gbaka' ? '🚐' : t === 'Woro-woro' ? '🚖' : t === 'Taxi' ? '🚕' : '🛺'}</span>
                 <span>{t}</span>
              </div>
            </button>
          );
        })}
      </div>
      
      <div className={`mt-6 p-4 rounded-2xl border-2 transition-all duration-300 ${status === 'saved' ? 'bg-abidjan-green/10 border-abidjan-green/30' : status === 'error' ? 'bg-red-50 border-red-200' : 'bg-beige-50 border-beige-100 border-dashed'}`}>
         {status === 'saving' ? (
            <p className="text-[10px] text-beige-text font-bold uppercase tracking-widest leading-relaxed animate-pulse">Sauvegarde en cours...</p>
         ) : status === 'saved' ? (
            <p className="text-[10px] text-abidjan-green font-black uppercase tracking-widest leading-relaxed">✅ Préférences mises à jour</p>
         ) : status === 'error' ? (
            <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest leading-relaxed">Erreur lors de la sauvegarde.</p>
         ) : (
            <p className="text-[10px] text-beige-muted font-bold uppercase tracking-widest leading-relaxed">
               Désactive les transports que tu refuses d&apos;emprunter. Babimob t&apos;avertira en cas d&apos;incompatibilité.
            </p>
         )}
      </div>

      <div className="mt-8 pt-8 border-t border-beige-100">
         <div className="text-[10px] uppercase tracking-widest text-beige-muted font-black mb-4">Mode Nuit</div>
         <button
           onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
           role="switch"
           aria-checked={theme === 'dark'}
           aria-label="Mode nuit"
           className={`w-full flex items-center justify-between p-4 rounded-[2rem] border-2 transition-all ${
             theme === 'dark' 
               ? 'bg-abidjan-blue text-white border-abidjan-blue shadow-lg shadow-abidjan-blue/20' 
               : 'bg-white border-beige-200 text-beige-text hover:border-abidjan-blue/30 shadow-sm'
           }`}
         >
           <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${theme === 'dark' ? 'bg-white/10' : 'bg-abidjan-blue/10'}`}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </div>
              <div className="flex flex-col items-start">
                 <span className="text-xs font-black uppercase tracking-widest">{theme === 'dark' ? 'Mode Sombre Actif' : 'Mode Clair Actif'}</span>
                 <span className={`text-[9px] font-bold ${theme === 'dark' ? 'text-white/60' : 'text-beige-muted'}`}>Plus reposant pour les yeux</span>
              </div>
           </div>
           <div className={`w-10 h-6 rounded-full flex items-center px-1 transition-all ${theme === 'dark' ? 'bg-white/20' : 'bg-beige-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${theme === 'dark' ? 'translate-x-4' : ''}`} />
           </div>
         </button>
      </div>
    </>
  );
}
