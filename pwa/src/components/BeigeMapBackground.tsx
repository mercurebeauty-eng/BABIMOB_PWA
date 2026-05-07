export default function BeigeMapBackground() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden bg-beige-50 pointer-events-none">
      {/* Abstract Grid & Topo Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
        {/* Soft Background Grid */}
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#EAE1D0" strokeWidth="1" opacity="0.5" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Topo / Road Paths */}
        <path d="M -100 200 Q 300 400 800 100 T 1600 300" stroke="#EAE1D0" strokeWidth="16" strokeLinecap="round" />
        <path d="M 200 -100 Q 400 300 300 700 T 500 1100" stroke="#EAE1D0" strokeWidth="24" strokeLinecap="round" />
        <path d="M 600 -100 C 800 200 600 500 1000 800 T 1200 1100" stroke="#EAE1D0" strokeWidth="12" strokeLinecap="round" />
        <path d="M -100 600 Q 400 500 700 800 T 1500 700" stroke="#EAE1D0" strokeWidth="20" strokeLinecap="round" />
        <path d="M 800 -100 Q 1000 400 1400 800 T 1600 1100" stroke="#EAE1D0" strokeWidth="14" strokeLinecap="round" />

        {/* Animated Moving Vehicles (represented by dashed strokes moving along the path) */}
        <path d="M -100 200 Q 300 400 800 100 T 1600 300" stroke="#FF7A00" strokeWidth="4" strokeLinecap="round" strokeDasharray="20 400" className="animate-drive-fast" />
        <path d="M 200 -100 Q 400 300 300 700 T 500 1100" stroke="#00A651" strokeWidth="6" strokeLinecap="round" strokeDasharray="30 500" className="animate-drive-slow" />
        <path d="M 600 -100 C 800 200 600 500 1000 800 T 1200 1100" stroke="#0066CC" strokeWidth="4" strokeLinecap="round" strokeDasharray="15 300" className="animate-drive-fast" />
        <path d="M -100 600 Q 400 500 700 800 T 1500 700" stroke="#FF7A00" strokeWidth="8" strokeLinecap="round" strokeDasharray="25 600" className="animate-drive-slow" style={{ animationDirection: 'reverse' }} />
        <path d="M 800 -100 Q 1000 400 1400 800 T 1600 1100" stroke="#00A651" strokeWidth="5" strokeLinecap="round" strokeDasharray="20 450" className="animate-drive-fast" />

        {/* Nodes / Stations */}
        <g opacity="0.8">
          <circle cx="280" cy="310" r="12" fill="#FDFBF7" stroke="#FF7A00" strokeWidth="4" />
          <circle cx="700" cy="180" r="16" fill="#FDFBF7" stroke="#00A651" strokeWidth="5" />
          <circle cx="900" cy="620" r="10" fill="#FDFBF7" stroke="#0066CC" strokeWidth="3" />
          <circle cx="410" cy="560" r="14" fill="#FDFBF7" stroke="#FF7A00" strokeWidth="4" />
          <circle cx="1000" cy="800" r="12" fill="#FDFBF7" stroke="#00A651" strokeWidth="4" />
        </g>
      </svg>
      
      {/* Decorative gradient overlay to soften edges and focus text */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#FDFBF7_80%)] opacity-100" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#FDFBF7]/60 via-transparent to-[#FDFBF7] backdrop-blur-[1px]" />
    </div>
  );
}
