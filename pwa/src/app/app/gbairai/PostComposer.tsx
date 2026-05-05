'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Ic } from '@/components/ui/Ic';
import { toast } from 'sonner';
import { useXP } from '@/components/providers/XPProvider';

const POST_TYPES = [
  { id: 'vibe', label: 'Vibe', emoji: '💬', color: 'var(--blue)' },
  { id: 'tarif', label: 'Tarif', emoji: '💰', color: 'var(--green)' },
  { id: 'alerte', label: 'Alerte', emoji: '⚠️', color: '#FF3B30' },
  { id: 'bouffe', label: 'Bouffe', emoji: '🍛', color: 'var(--gold)' },
  { id: 'evenement', label: 'Event', emoji: '🎉', color: '#E5337A' },
  { id: 'bon_plan', label: 'Bon plan', emoji: '✨', color: 'var(--orange)' },
] as const;

type Props = {
  userId: string;
  displayName: string;
  avatarEmoji: string;
  commune: string | null;
  onClose: () => void;
};

function extractHashtags(text: string): string[] {
  const matches = text.match(/#(\w+)/g);
  if (!matches) return [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

export default function PostComposer({ userId, displayName, avatarEmoji, commune, onClose }: Props) {
  const [type, setType] = useState<string>('vibe');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { addXP } = useXP();

  // Tarif fields
  const [tarifFrom, setTarifFrom] = useState('');
  const [tarifTo, setTarifTo] = useState('');
  const [tarifPrix, setTarifPrix] = useState('');

  // Event fields
  const [eventDate, setEventDate] = useState('');
  const [eventHeure, setEventHeure] = useState('');
  const [eventPrix, setEventPrix] = useState('');
  const [eventLieu, setEventLieu] = useState('');

  const supabase = createClient();

  async function handleSubmit() {
    if (!content.trim()) { setError('Dis quelque chose !'); return; }
    setLoading(true);
    setError('');

    const hashtags = extractHashtags(content);
    let metadata: Record<string, any> = {};

    if (type === 'tarif') {
      metadata = { from: tarifFrom, to: tarifTo, prix: parseInt(tarifPrix) || 0 };
    } else if (type === 'evenement') {
      metadata = { date: eventDate, heure: eventHeure, prix: eventPrix, lieu: eventLieu };
    }

    const { error: err } = await supabase.from('gbairai_posts').insert({
      user_id: userId,
      display_name: displayName,
      avatar_emoji: avatarEmoji,
      post_type: type,
      content: content.trim(),
      hashtags,
      commune,
      place_name: type === 'evenement' ? eventLieu : null,
      metadata,
    });

    setLoading(false);
    if (err) {
      setError(err.message);
      toast.error("Échec de la publication");
    } else {
      addXP(30); // Bonus standard pour un post
      toast.success("Publié sur le Gbairai !", {
        description: "+30 XP gagnés"
      });
      onClose();
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: '1.5px solid var(--line)', background: 'var(--cream)',
    fontSize: 14, color: 'var(--ink)', outline: 'none', fontFamily: 'Inter, sans-serif',
  } as const;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

      <div style={{ position: 'relative', background: 'var(--cream)', borderRadius: '24px 24px 0 0', padding: '16px 16px 32px', maxHeight: '85vh', overflowY: 'auto' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 12px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="font-display" style={{ fontSize: 20 }}>Publier</div>
          <button onClick={onClose} className="press" style={{ width: 32, height: 32, borderRadius: 10, border: 'none', background: 'var(--cream-2)', color: 'var(--ink)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Ic.X s={16} />
          </button>
        </div>

        {/* Type selector */}
        <div className="no-scrollbar" style={{ display: 'flex', gap: 6, overflowX: 'auto', marginBottom: 16 }}>
          {POST_TYPES.map(t => (
            <button key={t.id} onClick={() => setType(t.id)} className="press" style={{
              flexShrink: 0, padding: '8px 14px', borderRadius: 12,
              border: type === t.id ? `2px solid ${t.color}` : '2px solid var(--line)',
              background: type === t.id ? `color-mix(in oklab, ${t.color} 10%, var(--cream-2))` : 'var(--cream-2)',
              color: type === t.id ? t.color : 'var(--ink)',
              fontSize: 12, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={type === 'tarif' ? 'Décris le trajet...' : type === 'alerte' ? 'Que se passe-t-il ?' : type === 'bouffe' ? 'Où manger quoi ?' : 'C\'comment Abidjan ?'}
          style={{ ...inputStyle, minHeight: 100, resize: 'none', marginBottom: 12 }}
          maxLength={500}
        />

        {/* Type-specific fields */}
        {type === 'tarif' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <input value={tarifFrom} onChange={e => setTarifFrom(e.target.value)} placeholder="Départ (ex: Adjamé)" style={inputStyle} />
            <input value={tarifTo} onChange={e => setTarifTo(e.target.value)} placeholder="Arrivée (ex: Yop Selmer)" style={inputStyle} />
            <input value={tarifPrix} onChange={e => setTarifPrix(e.target.value)} placeholder="Prix en FCFA (ex: 200)" type="number" style={inputStyle} />
          </div>
        )}

        {type === 'evenement' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
            <input value={eventLieu} onChange={e => setEventLieu(e.target.value)} placeholder="Lieu (ex: Maquis du Val)" style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={eventDate} onChange={e => setEventDate(e.target.value)} placeholder="Date (ex: SAM 8)" style={{ ...inputStyle, flex: 1 }} />
              <input value={eventHeure} onChange={e => setEventHeure(e.target.value)} placeholder="Heure (ex: 22h)" style={{ ...inputStyle, flex: 1 }} />
            </div>
            <input value={eventPrix} onChange={e => setEventPrix(e.target.value)} placeholder="Prix (ex: 5 000F)" style={inputStyle} />
          </div>
        )}

        {/* Hashtag hint */}
        <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
          💡 Utilise <b style={{ color: 'var(--orange)' }}>#hashtags</b> dans ton texte pour être visible !
        </div>

        {error && <div style={{ fontSize: 12, color: '#FF3B30', marginBottom: 10, fontWeight: 700 }}>{error}</div>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={loading || !content.trim()}
          className="press"
          style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: loading ? 'var(--muted)' : 'var(--orange)',
            color: '#fff', fontSize: 15, fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(242,108,26,0.3)',
          }}
        >
          {loading ? 'Publication...' : 'Publier 🚀'}
        </button>
      </div>
    </div>
  );
}
