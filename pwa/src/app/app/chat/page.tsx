import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import BeigeMapBackground from '@/components/BeigeMapBackground';

export default async function ChatListPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/app/auth/signin');

  // Fetch unique conversations: messages where user is sender or receiver
  // We'll group by the "other" user
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, sender_id, receiver_id, content, created_at, sender:sender_id(display_name, avatar_emoji), receiver:receiver_id(display_name, avatar_emoji)')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });

  if (error) console.error(error);

  // grouping logic
  const conversationsMap = new Map();
  messages?.forEach(msg => {
    const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
    if (!conversationsMap.has(otherId)) {
        const otherProfile = msg.sender_id === user.id ? msg.receiver : msg.sender;
        conversationsMap.set(otherId, {
            otherId,
            otherProfile,
            lastMessage: msg.content,
            date: msg.created_at
        });
    }
  });

  const conversations = Array.from(conversationsMap.values());

  return (
    <div className="flex-1 flex flex-col overflow-y-auto relative bg-beige-50 text-beige-text font-sans">
      <BeigeMapBackground />
      
      <div className="sticky top-0 z-30 bg-beige-50/80 backdrop-blur-xl border-b border-beige-200/50 px-4 py-3 flex items-center gap-3">
        <Link href="/app/compte" className="p-2 -ml-2 rounded-full hover:bg-beige-100 transition-colors">
          <svg className="w-5 h-5 text-beige-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-beige-muted flex-1 text-center pr-8">Messagerie</span>
      </div>

      <div className="max-w-xl mx-auto w-full px-5 py-8 space-y-4 relative z-10">
        <div className="bg-white rounded-[2.5rem] border-2 border-beige-200 overflow-hidden shadow-xl shadow-black/5">
           <div className="p-6 border-b border-beige-100 bg-abidjan-blue/5">
              <h2 className="text-sm font-black uppercase tracking-widest text-abidjan-blue flex items-center gap-2">
                 <span>💬</span> Discussions Récentes
              </h2>
           </div>
           
           <div className="divide-y divide-beige-100">
              {conversations.length > 0 ? (
                conversations.map((conv) => (
                  <Link 
                    key={conv.otherId} 
                    href={`/app/chat/${conv.otherId}`}
                    className="flex items-center gap-4 p-5 hover:bg-beige-50 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-beige-50 border-2 border-beige-100 flex items-center justify-center text-2xl group-hover:bg-white group-hover:border-abidjan-orange/30 transition-all">
                      {(conv.otherProfile as any)?.avatar_emoji || '👤'}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-center mb-0.5">
                          <span className="text-sm font-black text-beige-text truncate">{(conv.otherProfile as any)?.display_name || 'Anonyme'}</span>
                          <span className="text-[9px] font-bold text-beige-muted uppercase">{new Date(conv.date).toLocaleDateString()}</span>
                       </div>
                       <p className="text-xs text-beige-muted truncate font-medium">{conv.lastMessage}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="py-16 text-center">
                   <div className="text-4xl mb-4 opacity-30 grayscale saturate-0">🏜️</div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-beige-muted px-10 leading-loose">
                      Aucune conversation pour le moment.<br/> 
                      <Link href="/app" className="text-abidjan-orange underline">Trouve quelqu&apos;un sur la carte</Link>
                   </p>
                </div>
              )}
           </div>
        </div>

        {/* Suggestion block */}
        <div className="p-6 bg-abidjan-orange/5 rounded-[2rem] border-2 border-abidjan-orange/20 border-dashed">
            <p className="text-[10px] font-bold text-abidjan-orange uppercase tracking-widest text-center leading-relaxed">
               Pssst... Tu peux envoyer des messages temporaires qui s&apos;effacent après lecture ! 🔥
            </p>
        </div>
      </div>
    </div>
  );
}
