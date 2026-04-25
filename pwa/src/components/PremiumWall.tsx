'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';

type Tier = 'messenger' | 'social' | 'pro';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: Tier;
};

const PLANS = [
  { 
    id: 'messenger', 
    name: 'Pack Messenger', 
    price: '1 800 FCFA', 
    desc: 'Discute en privé avec tous les explorateurs.',
    benefits: ['DM Illimités', 'Messages éphémères', 'Audio/Photo chat'],
    color: 'abidjan-green'
  },
  { 
    id: 'social', 
    name: 'Pack Social', 
    price: '2 800 FCFA', 
    desc: 'Construis ton réseau et retrouve tes proches.',
    benefits: ['Ajout d\'Amis', 'Visibilité géoloc (amis)', 'Inclus Pack Messenger'],
    color: 'abidjan-blue'
  },
  { 
    id: 'pro', 
    name: 'Pack Pro / Influence', 
    price: '9 900 FCFA', 
    desc: 'Le statut ultime pour dominer la ville.',
    benefits: ['Broadcast "Je suis ici"', 'Badge Élite Profil', 'Inclus Pack Social'],
    color: 'abidjan-orange'
  }
];

export default function PremiumWall({ isOpen, onClose, requiredTier }: Props) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  if (!isOpen) return null;

  async function handleMockPayment(tier: string) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ sub_tier: tier }).eq('id', user.id);
      alert(`Félicitations ! Tu es maintenant abonné au ${tier}. (Simulation de paiement réussie)`);
      window.location.reload();
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-beige-text/40 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-beige-50 rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-10 duration-500">
        {/* Header */}
        <div className="bg-white p-8 border-b border-beige-200 text-center">
           <div className="w-16 h-16 bg-abidjan-orange/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-sm border border-abidjan-orange/20">💎</div>
           <h2 className="text-2xl font-black text-beige-text mb-2">Passe au niveau supérieur</h2>
           <p className="text-sm text-beige-muted font-medium">Débloque cette fonctionnalité et bien plus encore.</p>
        </div>

        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
           {PLANS.map((plan) => (
             <div 
               key={plan.id}
               className={`p-6 rounded-3xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 group ${
                 requiredTier === plan.id ? 'border-abidjan-orange bg-white shadow-xl' : 'border-beige-200 bg-white/50'
               }`}
               onClick={() => handleMockPayment(plan.id)}
             >
                <div className="flex justify-between items-start mb-4">
                   <div>
                      <div className="text-xs font-black uppercase tracking-widest text-beige-muted mb-1">{plan.name}</div>
                      <div className="text-xl font-black text-beige-text">{plan.price} <span className="text-[10px] text-beige-muted">/ mois</span></div>
                   </div>
                   {requiredTier === plan.id && (
                      <span className="bg-abidjan-orange text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Recommandé</span>
                   )}
                </div>
                <p className="text-xs text-beige-muted font-bold mb-4 leading-relaxed">{plan.desc}</p>
                <div className="flex flex-wrap gap-2">
                   {plan.benefits.map((b, i) => (
                      <span key={i} className="text-[9px] font-black uppercase tracking-tight bg-beige-50 px-2 py-1 rounded-md border border-beige-100 text-beige-muted">✓ {b}</span>
                   ))}
                </div>
             </div>
           ))}
        </div>

        <div className="p-8 bg-white border-t border-beige-200">
           <button 
             onClick={onClose}
             className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-beige-muted hover:text-beige-text transition-colors"
           >
             Continuer en mode gratuit
           </button>
        </div>
      </div>
    </div>
  );
}
