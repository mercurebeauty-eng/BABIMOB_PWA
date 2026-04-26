'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

type Props = {
  me: { id: string; display_name: string; avatar_emoji: string };
  other: { id: string; display_name: string; avatar_emoji: string };
};

export default function ChatRoom({ me, other }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isFocused, setIsFocused] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchMsgs = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${me.id},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${me.id})`)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMsgs();

    // 2. Realtime Subscription
    const channel = supabase
      .channel(`chat-${[me.id, other.id].sort().join('-')}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${me.id}`
      }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.sender_id === other.id) {
          setMessages(prev => [...prev, newMsg]);
        }
      })
      .subscribe();

    // 3. Privacy Guard (Blur on focus loss)
    const handleVis = () => setIsFocused(!document.hidden);
    document.addEventListener('visibilitychange', handleVis);
    window.addEventListener('blur', () => setIsFocused(false));
    window.addEventListener('focus', () => setIsFocused(true));

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVis);
    };
  }, [me.id, other.id, supabase]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!inputText.trim()) return;
    const content = inputText.trim();
    setInputText('');

    const { data: newMsg, error } = await supabase
      .from('messages')
      .insert({
        sender_id: me.id,
        receiver_id: other.id,
        content
      })
      .select()
      .single();

    if (newMsg) {
      setMessages(prev => [...prev, newMsg]);
      // Auto-cleanup old messages (30 days)
      await supabase.from('messages').delete().lt('expires_at', new Date().toISOString());
    }
  }

  return (
    <div className={`flex flex-col h-full bg-beige-50 transition-all duration-300 ${!isFocused ? 'blur-sm brightness-75' : ''}`}>
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((m) => {
          const isMe = m.sender_id === me.id;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm text-sm font-medium ${
                isMe 
                ? 'bg-abidjan-orange text-white rounded-br-none' 
                : 'bg-white border border-beige-200 text-beige-text rounded-bl-none'
              }`}>
                {m.content}
                <div className={`text-[9px] mt-1 opacity-60 font-black uppercase text-right ${isMe ? 'text-white' : 'text-beige-muted'}`}>
                  {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-beige-200">
        <div className="max-w-2xl mx-auto flex items-center gap-2 bg-beige-50 rounded-2xl border-2 border-beige-100 p-1.5 focus-within:border-abidjan-orange transition-all">
           <input 
             type="text" 
             value={inputText}
             onChange={e => setInputText(e.target.value)}
             onKeyDown={e => e.key === 'Enter' && handleSend()}
             placeholder="Écris ton message éphémère..."
             className="flex-1 bg-transparent px-3 py-2 text-sm font-medium outline-none placeholder:text-beige-muted/60"
           />
           <button 
             onClick={handleSend}
             className="w-10 h-10 bg-abidjan-orange text-white rounded-xl flex items-center justify-center shadow-lg shadow-abidjan-orange/20 active:scale-90 transition-all"
           >
             <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
           </button>
        </div>
        <p className="text-[10px] text-center text-beige-muted font-black uppercase tracking-widest mt-3 opacity-50">
          Messages auto-supprimés après 30 jours
        </p>
      </div>

      {!isFocused && (
        <div className="absolute inset-0 flex items-center justify-center bg-beige-50/20 backdrop-blur-sm z-50 pointer-events-none">
           <div className="bg-white/80 px-6 py-3 rounded-full border border-beige-200 shadow-xl text-[10px] font-black uppercase tracking-[0.2em] text-beige-muted">
             Contenu Masqué pour ta sécurité
           </div>
        </div>
      )}
    </div>
  );
}
