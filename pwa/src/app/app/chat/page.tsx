import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Ic } from '@/components/ui/Ic';
import { Pill } from '@/components/ui/Pill';

export default async function ChatListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, sender:sender_id(display_name, avatar_emoji), receiver:receiver_id(display_name, avatar_emoji)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  const conversationsMap = new Map<string, { otherId: string; otherProfile: any; lastMessage: string; date: string }>();
  messages?.forEach(msg => {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!conversationsMap.has(otherId)) {
      const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
      conversationsMap.set(otherId, { otherId, otherProfile, lastMessage: msg.content, date: msg.created_at });
    }
  });
  const conversations = Array.from(conversationsMap.values());

  function timeAgo(iso: string) {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h`;
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--cream)', color: 'var(--ink)', display: 'flex', flexDirection: 'column' }}>

      {/* HEADER */}
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'rgba(247,241,230,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)', padding: '14px 16px', paddingTop: 'max(14px, env(safe-area-inset-top))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/app" style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', background: 'var(--cream-2)', border: '1px solid var(--line)', textDecoration: 'none' }}>
            <Ic.Back s={20} />
          </Link>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="font-display" style={{ fontSize: 18 }}>Babi IA</div>
              <Pill color="var(--green)">EN LIGNE</Pill>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600 }}>Comprend nouchi · 17 langues locales</div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 100px' }}>

        {/* AI CTA */}
        <div style={{ padding: 18, borderRadius: 18, background: 'linear-gradient(135deg, var(--orange) 0%, var(--orange-deep) 100%)', color: '#fff', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div className="wax-bg" style={{ position: 'absolute', inset: 0, color: '#fff', opacity: 0.15 }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 0.6, opacity: 0.85, marginBottom: 6 }}>ASSISTANT IA</div>
            <div className="font-display" style={{ fontSize: 20, marginBottom: 8 }}>Où vas-tu, Babi ?</div>
            <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.5, marginBottom: 14 }}>
              Dis-moi d'où tu pars et où tu veux aller. Je trouve le meilleur chemin avec les vrais tarifs.
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['Adjamé → Yop', 'Cocody → Plateau', 'Abobo → Marcory'].map((s, i) => (
                <span key={i} style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700 }}>{s}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Conversations */}
        {conversations.length > 0 ? (
          <>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--muted)', letterSpacing: 0.7, textTransform: 'uppercase', marginBottom: 10 }}>MESSAGES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {conversations.map((conv) => (
                <Link key={conv.otherId} href={`/app/chat/${conv.otherId}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'var(--cream-2)', border: '1px solid var(--line)', textDecoration: 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--orange)', color: '#fff', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {(conv.otherProfile as any)?.avatar_emoji ?? '👤'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{(conv.otherProfile as any)?.display_name ?? 'Anonyme'}</span>
                      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>{timeAgo(conv.date)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{conv.lastMessage}</div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: '32px 20px', textAlign: 'center', borderRadius: 18, background: 'var(--cream-2)', border: '1.5px dashed var(--line)' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
            <div className="font-display" style={{ fontSize: 18, marginBottom: 8 }}>Aucune conversation</div>
            <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 16 }}>Trouve quelqu'un sur la carte et engage la conversation.</p>
            <Link href="/app" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--orange)', color: '#fff', padding: '11px 22px', borderRadius: 999, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
              Explorer la carte <Ic.Arrow s={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
