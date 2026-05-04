'use client';

import { Ic } from '@/components/ui/Ic';
import { pickWax } from '@/lib/waxPattern';
import type { Quest, CollectiveQuest } from './page';

function timeLeft(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'terminée';
  const d = Math.floor(ms / 86_400_000);
  if (d >= 1) return `${d}j restant${d > 1 ? 's' : ''}`;
  const h = Math.floor(ms / 3_600_000);
  return `${h}h restantes`;
}

export default function QuetesTab({ quests, collective }: { quests: Quest[]; collective: CollectiveQuest | null }) {
  return (
    <div style={{ padding: '14px 16px 24px' }}>
      {/* Quête collective */}
      {collective && <CollectiveCard q={collective} />}

      {/* Catalogue de quêtes individuelles */}
      <div style={{ marginTop: collective ? 24 : 4 }}>
        <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--orange)', letterSpacing: 0.7, marginBottom: 6 }}>QUÊTES PERSO</div>
        <h2 className="font-display" style={{ fontSize: 22, margin: '0 0 14px' }}>Tes défis Babi</h2>

        {quests.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Aucune quête disponible pour le moment.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {quests.map(q => <QuestRow key={q.id} q={q} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function CollectiveCard({ q }: { q: CollectiveQuest }) {
  const pct = Math.min(100, Math.round((q.current_count / q.target_count) * 100));
  const wax = pickWax(`cq-${q.id}`, { rotate: true });
  return (
    <div style={{
      borderRadius: 24, padding: 20, background: 'linear-gradient(135deg, #1A1410 0%, #2A1F18 100%)',
      color: '#fff', position: 'relative', overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,0.18)'
    }}>
      <div className={wax} style={{ position: 'absolute', inset: 0, color: 'var(--gold)', opacity: 0.18 }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontSize: 10, fontWeight: 900, color: 'var(--gold)', letterSpacing: 0.7 }}>QUÊTE COLLECTIVE</div>
          <div style={{ fontSize: 10, fontWeight: 800, opacity: 0.85 }}>{timeLeft(q.ends_at)}</div>
        </div>
        <h3 className="font-display" style={{ fontSize: 22, margin: '0 0 6px', lineHeight: 1.1 }}>{q.title}</h3>
        {q.description && <p style={{ fontSize: 12, opacity: 0.85, margin: 0 }}>{q.description}</p>}

        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 800, marginBottom: 4 }}>
            <span>{q.current_count.toLocaleString('fr-FR')} / {q.target_count.toLocaleString('fr-FR')}</span>
            <span style={{ color: 'var(--gold)' }}>+{q.reward_xp} XP</span>
          </div>
          <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.15)', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, var(--gold), var(--orange))' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

const ICON_MAP: Record<string, keyof typeof Ic> = {
  Compass: 'Compass', Bus: 'Bus', Wallet: 'Wallet',
  Moon: 'Moon', Star: 'Star', Bolt: 'Bolt',
};

function QuestRow({ q }: { q: Quest }) {
  const Comp: any = Ic[ICON_MAP[q.icon] ?? 'Star'] ?? Ic.Star;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: 14, borderRadius: 18, background: 'var(--cream-2)', border: '1px solid var(--line)'
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, background: q.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
      }}>
        <Comp s={20} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--ink)' }}>{q.title}</div>
        {q.description && <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>{q.description}</div>}
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, color: q.color, flexShrink: 0 }}>+{q.xp_reward} XP</div>
    </div>
  );
}
