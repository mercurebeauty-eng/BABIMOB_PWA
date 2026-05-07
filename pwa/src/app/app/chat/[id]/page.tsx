export const dynamic = 'force-dynamic';

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import ChatRoom from '@/components/ChatRoom';
import BeigeMapBackground from '@/components/BeigeMapBackground';

type Props = { params: Promise<{ id: string }> };

export default async function ChatPage({ params }: Props) {
  const supabase = await createClient();
  const { id: otherId } = await params;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/app/auth/signin');

  // Fetch both profiles
  const [{ data: me }, { data: other }] = await Promise.all([
    supabase.from('profiles').select('id, display_name, avatar_emoji').eq('id', user.id).single(),
    supabase.from('profiles').select('id, display_name, avatar_emoji').eq('id', otherId).maybeSingle()
  ]);

  if (!other || !me) notFound();

  return (
    <div className="flex-1 flex flex-col h-full bg-beige-50 relative overflow-hidden">
      <BeigeMapBackground />
      
      {/* Chat Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-beige-200 px-4 py-3 flex items-center gap-3">
        <Link href="/app/chat" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors">
           <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
        <div className="w-10 h-10 rounded-xl bg-beige-50 border border-beige-200 flex items-center justify-center text-xl shadow-sm">
           {other.avatar_emoji}
        </div>
        <div className="flex-1 min-w-0">
           <h1 className="text-sm font-black text-beige-text truncate">{other.display_name}</h1>
           <div className="flex items-center gap-1.5 mt-0.5">
             <span className="w-1.5 h-1.5 rounded-full bg-abidjan-green animate-pulse" />
             <span className="text-[9px] font-black uppercase text-beige-muted tracking-widest text-abidjan-green">Discussion Éphémère</span>
           </div>
        </div>
      </div>

      {/* Social Room */}
      <div className="flex-1 relative z-20 overflow-hidden">
        <ChatRoom 
          me={{ id: me.id, display_name: me.display_name, avatar_emoji: me.avatar_emoji }}
          other={{ id: other.id, display_name: other.display_name, avatar_emoji: other.avatar_emoji }}
        />
      </div>
    </div>
  );
}
