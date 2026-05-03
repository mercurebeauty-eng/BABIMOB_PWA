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
      setTimeout(() => setStatus('idle'), 3000);
    } else {
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 2500);
    }
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'var(--muted)',
    marginBottom: 12,
    display: 'block'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
      {/* Transports Préférés */}
      <div>
        <label style={labelStyle}>Modes de Transport</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {ALL_TRANSIT_MODES.map((t) => {
            const active = prefs.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleMode(t)}
                className="press"
                style={{
                  padding: '10px 16px',
                  borderRadius: 14,
                  fontSize: 12,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: active ? 'var(--green)' : 'var(--cream-2)',
                  border: `2px solid ${active ? 'var(--green)' : 'var(--line)'}`,
                  color: active ? '#fff' : 'var(--ink)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: active ? '0 4px 12px rgba(14,168,91,0.2)' : 'none'
                }}
              >
                <span>{t === 'Gbaka' ? '🚐' : t === 'Woro-woro' ? '🚖' : t === 'Taxi' ? '🚕' : '🛺'}</span>
                {t}
              </button>
            );
          })}
        </div>
        
        <div style={{ 
          marginTop: 14, 
          padding: '12px 16px', 
          borderRadius: 12, 
          background: status === 'saved' ? 'rgba(14,168,91,0.08)' : 'var(--cream-2)',
          border: `1px dashed ${status === 'saved' ? 'var(--green)' : 'var(--line)'}`,
          transition: 'all 0.3s'
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: status === 'saved' ? 'var(--green)' : 'var(--muted)', margin: 0, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {status === 'saving' ? 'Sauvegarde...' : status === 'saved' ? '✓ Préférences à jour' : 'Désactive les transports que tu n\'utilises pas.'}
          </p>
        </div>
      </div>

      {/* Mode Nuit Style Wax */}
      <div style={{ paddingTop: 16, borderTop: '1px solid var(--line)' }}>
        <label style={labelStyle}>Ambiance</label>
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="press"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            borderRadius: 20,
            background: theme === 'dark' ? 'var(--ink)' : 'var(--cream-2)',
            border: `2px solid ${theme === 'dark' ? 'var(--orange)' : 'var(--line)'}`,
            color: theme === 'dark' ? 'var(--cream)' : 'var(--ink)',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              borderRadius: 12, 
              background: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'var(--orange)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              fontSize: 20
            }}>
              {theme === 'dark' ? '🌙' : '☀️'}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div className="font-display" style={{ fontSize: 12, textTransform: 'uppercase' }}>
                {theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}
              </div>
              <div style={{ fontSize: 9, opacity: 0.6, fontWeight: 700 }}>
                {theme === 'dark' ? 'Plus reposant pour les yeux' : 'Style classique Babimob'}
              </div>
            </div>
          </div>
          
          <div style={{
            width: 44,
            height: 24,
            borderRadius: 20,
            background: theme === 'dark' ? 'var(--orange)' : 'var(--line)',
            position: 'relative',
            transition: 'background 0.3s'
          }}>
            <div style={{
              position: 'absolute',
              top: 3,
              left: theme === 'dark' ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.3s'
            }} />
          </div>
        </button>
      </div>
    </div>
  );
}
