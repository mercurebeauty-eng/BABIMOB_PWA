'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import Vehicle from '@/components/ui/Vehicle';
import { Ic } from '@/components/ui/Ic';
import ConfirmTarifModal from '@/components/ConfirmTarifModal';

type TarifRow = {
  stop_id_arrivee: string;
  stop_name_arrivee: string;
  prix: number;
};

type TarifGroup = {
  stop_id_arrivee: string;
  stop_name_arrivee: string;
  minPrix: number;
  maxPrix: number;
  count: number;
  isHot: boolean;
};

type Props = {
  stopId: string;
  stopName: string;
  userId: string | null;
};

function groupTarifs(rows: TarifRow[]): TarifGroup[] {
  const map = new Map<string, { min: number; max: number; count: number; name: string }>();

  for (const row of rows) {
    const existing = map.get(row.stop_id_arrivee);
    if (existing) {
      existing.min = Math.min(existing.min, row.prix);
      existing.max = Math.max(existing.max, row.prix);
      existing.count++;
    } else {
      map.set(row.stop_id_arrivee, { min: row.prix, max: row.prix, count: 1, name: row.stop_name_arrivee });
    }
  }

  const groups: TarifGroup[] = [...map.entries()].map(([id, data]) => ({
    stop_id_arrivee: id,
    stop_name_arrivee: data.name,
    minPrix: data.min,
    maxPrix: data.max,
    count: data.count,
    isHot: false,
  }));

  groups.sort((a, b) => a.minPrix - b.minPrix);
  if (groups.length > 0) groups[0].isHot = true;

  return groups;
}

export default function TarifsSection({ stopId, stopName, userId }: Props) {
  const supabase = useRef(createClient()).current;
  const [groups, setGroups] = useState<TarifGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    const since = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from('tarif_confirmations')
      .select('stop_id_arrivee, stop_name_arrivee, prix')
      .eq('stop_id_depart', stopId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    setGroups(groupTarifs(data ?? []));
    setLoading(false);
  }, [supabase, stopId]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <h3 className="font-display" style={{ fontSize: 18, margin: 0 }}>Tarifs réels aujourd&apos;hui</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--green)', fontWeight: 800 }}>
            <div className="shimmer" style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
            EN DIRECT
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 13, fontWeight: 600 }}>
              Chargement...
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div style={{ padding: '20px 16px', borderRadius: 14, background: 'var(--cream-2)', border: '1px solid var(--line)', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>💸</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Aucun tarif confirmé</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>Sois le premier à confirmer un tarif !</div>
            </div>
          )}

          {groups.map(g => (
            <div
              key={g.stop_id_arrivee}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: 14, borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)',
              }}
            >
              <Vehicle kind="gbaka" size={32} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {g.stop_name_arrivee}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, marginTop: 2 }}>
                  Confirmé par {g.count} Babi{g.count > 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="font-display" style={{ fontSize: 18, color: 'var(--orange)', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                  {g.minPrix}F {g.isHot && <span style={{ fontSize: 16 }}>🔥</span>}
                </div>
                {g.maxPrix > g.minPrix ? (
                  <div style={{ fontSize: 10, color: 'var(--orange-deep)', fontWeight: 800 }}>
                    ↗ +{g.maxPrix - g.minPrix}F
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 600 }}>— stable</div>
                )}
              </div>
            </div>
          ))}

          <button
            onClick={() => setShowModal(true)}
            className="press"
            style={{
              width: '100%', padding: 14, borderRadius: 16, border: '2px dashed var(--line-strong)',
              background: 'transparent', color: 'var(--muted)', fontSize: 12, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: groups.length > 0 ? 4 : 0, cursor: 'pointer',
            }}
          >
            <Ic.Plus s={16} />
            CONFIRMER UN TARIF
          </button>
        </div>
      </div>

      {showModal && (
        <ConfirmTarifModal
          stopIdDepart={stopId}
          stopNameDepart={stopName}
          userId={userId}
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); load(); }}
        />
      )}
    </>
  );
}
