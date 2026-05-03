'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import BroadcastButton from '@/components/BroadcastButton';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  profile: any | null; // Profil utilisateur courant depuis useCommunityData
};

export default function SidebarMenu({ isOpen, onClose, profile }: Props) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay arrière-plan sombre */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(26,20,16,0.6)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
            }}
          />

          {/* Panneau latéral */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: '85%',
              maxWidth: 360,
              background: 'var(--cream)',
              zIndex: 10000,
              boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Header / Profil */}
            <div style={{ padding: 'calc(env(safe-area-inset-top, 20px) + 20px) 24px 24px', background: 'var(--cream-2)', borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                {profile ? (
                  <Link href="/app/compte" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff', border: '2px solid var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      {profile.avatar_emoji || '👤'}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>{profile.display_name || 'Utilisateur'}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--orange)', textTransform: 'uppercase', letterSpacing: 1 }}>{profile.sub_tier || 'FREE'} EXPLORER</div>
                    </div>
                  </Link>
                ) : (
                  <Link href="/auth" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                     <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 900, color: 'var(--ink)' }}>Connecte-toi</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Rejoins la ville</div>
                    </div>
                  </Link>
                )}
                <button onClick={onClose} className="press" style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.05)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <Ic.X s={18} color="var(--ink)" />
                </button>
              </div>

              {/* Broadcast Button */}
              {profile && (
                <div onClick={onClose}>
                  <BroadcastButton userId={profile.id} currentTier={profile.sub_tier ?? 'free'} isAdmin={profile.is_admin} />
                </div>
              )}
            </div>

            {/* Menu Items */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              
              <Link href="/app/compte" onClick={onClose} className="press" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, background: '#fff', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic.Users s={20} color="var(--orange)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>Mon Profil</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>XP, Badges & Compte</div>
                </div>
                <Ic.Arrow s={16} dir="right" color="var(--line-strong)" />
              </Link>

              <Link href="/app/gbairai" onClick={onClose} className="press" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, background: '#fff', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'color-mix(in oklab, var(--orange) 12%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic.Chat s={20} color="var(--orange)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>Gbairai</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Le pouls d&apos;Abidjan</div>
                </div>
                <Ic.Arrow s={16} dir="right" color="var(--line-strong)" />
              </Link>

              <div className="press" onClick={() => alert('Planificateur d\'itinéraire bientôt disponible !')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, background: '#fff', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--blue-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic.Route s={20} color="var(--blue)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>Itinéraire</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Bientôt disponible</div>
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, background: 'var(--line)', padding: '4px 8px', borderRadius: 8, color: 'var(--ink)' }}>WIP</div>
              </div>

              <div className="press" onClick={() => alert('Mode Découvrir (Bons Plans) bientôt disponible !')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, background: '#fff', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--green-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic.Star s={20} color="var(--green)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>Découvrir</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lieux, Promos & Partenaires</div>
                </div>
                <Ic.Arrow s={16} dir="right" color="var(--line-strong)" />
              </div>

              <div className="press" onClick={() => alert('Heatmap des zones d\'activité bientôt optimisée !')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px', borderRadius: 20, background: '#fff', textDecoration: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', cursor: 'pointer' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,107,107,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic.Bolt s={20} color="#FF6B6B" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--ink)' }}>Activité & Heatmap</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Voir les zones chaudes</div>
                </div>
                <Ic.Arrow s={16} dir="right" color="var(--line-strong)" />
              </div>

            </div>

            <div style={{ marginTop: 'auto', padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--muted)', letterSpacing: 2, marginBottom: 8 }}>BABIMOB</div>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--line-strong)' }}>Version Beta</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
