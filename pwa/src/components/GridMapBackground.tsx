export default function GridMapBackground() {
  return (
    <div aria-hidden className="fixed inset-0 z-[-1] pointer-events-none bg-[#0c111a] overflow-hidden flex items-center justify-center">
      {/* Base Grid */}
      <div 
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 79px, rgba(200, 215, 240, 0.8) 79px, rgba(200, 215, 240, 0.8) 80px),
            repeating-linear-gradient(90deg, transparent, transparent 79px, rgba(200, 215, 240, 0.8) 79px, rgba(200, 215, 240, 0.8) 80px)
          `
        }}
      />
      
      {/* Diagonal & Curved Road Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.15]" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
        {/* Horizontalish */}
        <path d="M -100 350 L 400 380 L 1100 340" fill="none" stroke="#60a5fa" strokeWidth="8" />
        <path d="M -100 650 Q 400 600 1100 580" fill="none" stroke="#60a5fa" strokeWidth="6" />
        <path d="M -100 200 Q 500 250 1100 150" fill="none" stroke="#60a5fa" strokeWidth="4" />
        
        {/* Verticalish */}
        <path d="M 250 -100 L 300 400 L 150 900" fill="none" stroke="#60a5fa" strokeWidth="5" />
        <path d="M 450 -100 Q 400 300 460 500 L 550 900" fill="none" stroke="#60a5fa" strokeWidth="9" />
        <path d="M 750 -100 L 700 450 L 900 900" fill="none" stroke="#60a5fa" strokeWidth="4" />
        <path d="M 100 -100 L 400 900" fill="none" stroke="#60a5fa" strokeWidth="3" />
      </svg>
      
      {/* Faint UI Elements inside the background to mimic the image */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
        <div className="grid grid-cols-3 gap-x-12 sm:gap-x-24 gap-y-20 sm:gap-y-32 scale-75 sm:scale-100">
           {/* Adjamé */}
           <div className="flex flex-col items-center gap-4">
             <div className="w-28 h-28 rounded-3xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm" />
             <span className="text-[11px] font-bold tracking-[0.25em] text-white/30 uppercase">Adjamé</span>
           </div>
           {/* Yopougon */}
           <div className="flex flex-col items-center gap-4">
             <div className="w-28 h-28 rounded-3xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm" />
             <span className="text-[11px] font-bold tracking-[0.25em] text-white/30 uppercase">Yopougon</span>
           </div>
           {/* Koumassi */}
           <div className="flex flex-col items-center gap-4 translate-y-8">
             <div className="w-28 h-28 rounded-3xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm" />
             <span className="text-[11px] font-bold tracking-[0.25em] text-white/30 uppercase">Koumassi</span>
           </div>
           {/* Abobo */}
           <div className="flex flex-col items-center gap-4">
             <div className="w-28 h-28 rounded-3xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm" />
             <span className="text-[11px] font-bold tracking-[0.25em] text-white/30 uppercase">Abobo</span>
           </div>
           {/* Port-Bouët */}
           <div className="flex flex-col items-center gap-4">
             <div className="w-28 h-28 rounded-3xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm" />
             <span className="text-[11px] font-bold tracking-[0.25em] text-white/30 uppercase">Port-Bouët</span>
           </div>
           {/* Cocody */}
           <div className="flex flex-col items-center gap-4 translate-y-8">
             <div className="w-28 h-28 rounded-3xl bg-white/[0.02] border border-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-sm" />
             <span className="text-[11px] font-bold tracking-[0.25em] text-white/30 uppercase">Cocody</span>
           </div>
        </div>
      </div>
      
      {/* Global gradient overlay so content stands out */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0c111a_80%)] opacity-90" />
    </div>
  );
}
