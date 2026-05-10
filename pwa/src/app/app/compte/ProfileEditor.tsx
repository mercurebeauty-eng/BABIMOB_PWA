'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { validateCIPhone } from '@/lib/phone';

const EMOJIS = [
  '🧭', '🚐', '🚖', '🚕', '🛺', '🦁', '🐘',
  '🌴', '🔥', '⭐', '🏆', '💎', '🦅', '🌊', '🎯', '👑',
];

const ABIDJAN_COMMUNES = [
  'Abobo', 'Adjamé', 'Attécoubé', 'Cocody', 'Koumassi',
  'Marcory', 'Plateau', 'Port-Bouët', 'Treichville', 'Yopougon',
  'Anyama', 'Bingerville', 'Songon',
];

type Props = {
  userId: string;
  initialName: string;
  initialEmoji: string;
  initialPhone?: string;
  initialConsent?: boolean;
  initialVisibility?: boolean;
  initialCommune?: string;
  initialPseudo?: string;
};

export default function ProfileEditor({
  userId, initialName, initialEmoji,
  initialPhone = '', initialConsent = false, initialVisibility = false,
  initialCommune = '', initialPseudo = '',
}: Props) {
  const supabase = createClient();
  const [name, setName] = useState(initialName);
  const [pseudo, setPseudo] = useState(initialPseudo);
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
      setPhoneError('Format invalide (ex: 07 01 02 03 04)');
    } else {
      setPhoneError('');
    }
  }

  async function handleSave() {
    const trimmed = name.trim();
    const trimmedPseudo = pseudo.trim();
    if (!trimmed || !trimmedPseudo || !phone.trim() || !commune) return;
    
    if (phone && !validateCIPhone(phone)) {
      setPhoneError('Numéro invalide.');
      return;
    }
    setStatus('saving');

    const payload: Record<string, unknown> = {
      id: userId,
      display_name: trimmed,
      pseudo: trimmedPseudo,
      avatar_emoji: emoji,
      phone_number: phone || null,
      phone_marketing_consent: consent,
      is_public_visits: visibility,
    };
    if (commune !== undefined) payload.origin_commune = commune || null;

    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Save error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setStatus('saved');
    setTimeout(() => setStatus('idle'), 2500);
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'var(--muted)',
    marginBottom: 8,
    display: 'block'
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--cream-2)',
    border: '2px solid var(--line)',
    borderRadius: 16,
    padding: '12px 16px',
    fontSize: 16,
    fontWeight: 700,
    color: 'var(--ink)',
    outline: 'none',
    transition: 'border-color 0.2s',
  };

  const isFormValid = name.trim().length >= 2 && 
                      pseudo.trim().length >= 3 && 
                      phone.trim().length >= 8 && 
                      !!commune && 
                      !phoneError;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Avatar Selection */}
      <div>
        <label style={labelStyle}>Choisir ton Avatar</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className="press"
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: emoji === e ? 'var(--orange)' : 'var(--cream-2)',
                border: `2px solid ${emoji === e ? 'var(--orange)' : 'var(--line)'}`,
                boxShadow: emoji === e ? '0 4px 12px rgba(242,108,26,0.3)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Nom complet <span style={{ color: 'var(--orange)' }}>*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            placeholder="Prénom et Nom"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--orange)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Pseudo <span style={{ color: 'var(--orange)' }}>*</span></label>
          <input
            type="text"
            value={pseudo}
            onChange={(e) => setPseudo(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            maxLength={15}
            placeholder="ton_pseudo"
            style={inputStyle}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--orange)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={labelStyle}>Téléphone <span style={{ color: 'var(--orange)' }}>*</span></label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="07 01 02 03 04"
            style={{ ...inputStyle, borderColor: phoneError ? '#ff4444' : 'var(--line)' }}
            onFocus={(e) => !phoneError && (e.currentTarget.style.borderColor = 'var(--orange)')}
            onBlur={(e) => !phoneError && (e.currentTarget.style.borderColor = 'var(--line)')}
          />
          {phoneError && <div style={{ fontSize: 10, color: '#ff4444', marginTop: 4, fontWeight: 700 }}>{phoneError}</div>}
        </div>
        <div>
          <label style={labelStyle}>Commune <span style={{ color: 'var(--orange)' }}>*</span></label>
          <select
            value={commune}
            onChange={(e) => setCommune(e.target.value)}
            style={{ ...inputStyle, appearance: 'none' }}
            onFocus={(e) => e.currentTarget.style.borderColor = 'var(--orange)'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'var(--line)'}
          >
            <option value="">Abidjan</option>
            {ABIDJAN_COMMUNES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Switches Style Wax */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <div 
            onClick={() => setVisibility(!visibility)}
            style={{
              width: 44,
              height: 24,
              borderRadius: 20,
              background: visibility ? 'var(--green)' : 'var(--line)',
              position: 'relative',
              transition: 'background 0.3s'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 3,
              left: visibility ? 23 : 3,
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              transition: 'left 0.3s'
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>Rendre mes visites publiques</span>
        </label>

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={consent} 
            onChange={(e) => setConsent(e.target.checked)}
            style={{ marginTop: 3 }}
          />
          <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 500, lineHeight: 1.4 }}>
            J'accepte de recevoir des actus et bons plans Babimob par téléphone.
          </span>
        </label>
      </div>

      <button
        onClick={handleSave}
        disabled={status === 'saving' || !isFormValid}
        className="press font-display"
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 20,
          border: 'none',
          background: status === 'saved' ? 'var(--green)' : (!isFormValid ? 'var(--line)' : 'var(--orange)'),
          color: '#fff',
          fontSize: 16,
          letterSpacing: 0.5,
          cursor: !isFormValid ? 'not-allowed' : 'pointer',
          boxShadow: status === 'saved' ? '0 8px 20px rgba(14,168,91,0.3)' : '0 8px 20px rgba(242,108,26,0.3)',
          transition: 'all 0.3s'
        }}
      >
        {status === 'saving' ? 'SAUVEGARDE...' : status === 'saved' ? '✓ PROFIL MIS À JOUR' : (!isFormValid ? 'REMPLIR TOUT LE PROFIL 🔓' : 'ENREGISTRER ET DÉVERROUILLER')}
      </button>

      {status === 'error' && (
        <div style={{ textAlign: 'center', color: '#ff4444', fontSize: 12, fontWeight: 700 }}>
          Oups, une erreur est survenue lors de l'enregistrement.
        </div>
      )}
    </div>
  );
}
