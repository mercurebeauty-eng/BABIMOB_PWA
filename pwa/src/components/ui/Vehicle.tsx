import React from 'react';

interface VehicleProps {
  kind: 'gbaka' | 'woro' | 'taxi' | 'saloni';
  size?: number;
  color?: string;
}

export default function Vehicle({ kind, size = 36, color }: VehicleProps) {
  const c =
    color ||
    (kind === 'gbaka'
      ? 'var(--orange)'
      : kind === 'woro'
      ? 'var(--green)'
      : kind === 'taxi'
      ? 'var(--gold)'
      : 'var(--blue)');

  if (kind === 'gbaka')
    return (
      <svg width={size} height={size * 0.6} viewBox="0 0 60 36" fill="none">
        <rect x="2" y="8" width="52" height="20" rx="4" fill={c} opacity="0.15" stroke={c} strokeWidth="1.5" />
        <rect x="6" y="10" width="16" height="10" rx="2" fill={c} opacity="0.3" />
        <rect x="26" y="10" width="16" height="10" rx="2" fill={c} opacity="0.3" />
        <rect x="2" y="12" width="6" height="6" rx="1" fill={c} opacity="0.5" />
        <rect x="52" y="12" width="6" height="6" rx="1" fill={c} opacity="0.5" />
        <circle cx="12" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.5" />
        <circle cx="48" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.5" />
      </svg>
    );

  if (kind === 'woro')
    return (
      <svg width={size} height={size * 0.75} viewBox="0 0 48 36" fill="none">
        <path d="M6 22 L10 10 L38 10 L42 22 L42 28 L6 28 Z" fill={c} opacity="0.15" stroke={c} strokeWidth="1.5" />
        <rect x="12" y="12" width="12" height="8" rx="2" fill={c} opacity="0.3" />
        <rect x="27" y="12" width="10" height="8" rx="2" fill={c} opacity="0.3" />
        <circle cx="14" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.5" />
        <circle cx="36" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.5" />
      </svg>
    );

  if (kind === 'taxi')
    return (
      <svg width={size} height={size * 0.75} viewBox="0 0 48 36" fill="none">
        <rect x="4" y="8" width="40" height="20" rx="6" fill={c} opacity="0.15" stroke={c} strokeWidth="1.5" />
        <path d="M14 8 L16 2 L32 2 L34 8Z" fill={c} opacity="0.3" />
        <rect x="10" y="10" width="12" height="10" rx="2" fill={c} opacity="0.4" />
        <rect x="26" y="10" width="12" height="10" rx="2" fill={c} opacity="0.4" />
        <circle cx="12" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.5" />
        <circle cx="36" cy="30" r="5" fill={c} stroke="white" strokeWidth="1.5" />
      </svg>
    );

  return (
    <svg width={size} height={size * 0.85} viewBox="0 0 40 34" fill="none">
      <ellipse cx="20" cy="16" rx="16" ry="10" fill={c} opacity="0.15" stroke={c} strokeWidth="1.5" />
      <rect x="12" y="8" width="16" height="12" rx="4" fill={c} opacity="0.3" />
      <circle cx="10" cy="28" r="5" fill={c} stroke="white" strokeWidth="1.5" />
      <circle cx="30" cy="28" r="5" fill={c} stroke="white" strokeWidth="1.5" />
      <ellipse cx="38" cy="24" rx="4" ry="6" fill={c} opacity="0.25" stroke={c} strokeWidth="1" />
    </svg>
  );
}
