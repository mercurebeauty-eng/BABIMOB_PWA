import React from 'react';

interface VehicleProps {
  kind: 'gbaka' | 'taxi' | 'woro' | 'saloni';
  size?: number;
  color?: string;
}

const Vehicle: React.FC<VehicleProps> = ({ kind = 'gbaka', size = 40, color }) => {
  const c = color || 'var(--ink)';
  if (kind === 'gbaka') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="6" y="14" width="36" height="20" rx="3" fill={c} fillOpacity="0.1" stroke={c} strokeWidth="2"/>
      <rect x="9" y="18" width="8" height="6" fill="var(--orange)" opacity="0.8"/>
      <rect x="20" y="18" width="8" height="6" fill={c} fillOpacity="0.2"/>
      <rect x="31" y="18" width="8" height="6" fill={c} fillOpacity="0.2"/>
      <circle cx="14" cy="36" r="4" fill={c}/>
      <circle cx="34" cy="36" r="4" fill={c}/>
      <path d="M6 14l4-6h28l4 6" stroke={c} strokeWidth="2" fill="none"/>
    </svg>
  );
  if (kind === 'taxi') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M4 32V22l4-8h32l4 8v10" stroke={c} strokeWidth="2" fill="var(--gold)" fillOpacity="0.6"/>
      <rect x="14" y="14" width="20" height="6" fill={c} fillOpacity="0.15"/>
      <rect x="2" y="32" width="44" height="3" fill={c}/>
      <circle cx="12" cy="36" r="3.5" fill={c}/>
      <circle cx="36" cy="36" r="3.5" fill={c}/>
      <rect x="20" y="9" width="8" height="4" fill="var(--gold)" stroke={c} strokeWidth="1.5"/>
    </svg>
  );
  if (kind === 'woro') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M6 30V20l3-6h30l3 6v10" stroke={c} strokeWidth="2" fill="var(--orange)" fillOpacity="0.7"/>
      <rect x="14" y="14" width="20" height="6" fill={c} fillOpacity="0.15"/>
      <rect x="4" y="30" width="40" height="3" fill={c}/>
      <circle cx="13" cy="34" r="3.5" fill={c}/>
      <circle cx="35" cy="34" r="3.5" fill={c}/>
    </svg>
  );
  if (kind === 'saloni') return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M10 32l4-12h16l6 8h6v4" stroke={c} strokeWidth="2" fill="var(--green)" fillOpacity="0.5" strokeLinejoin="round"/>
      <circle cx="14" cy="34" r="4" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.15"/>
      <circle cx="34" cy="34" r="4" stroke={c} strokeWidth="2" fill={c} fillOpacity="0.15"/>
    </svg>
  );
  return null;
};

export default Vehicle;
