type IconProps = { s?: number; fill?: boolean; dir?: 'right'|'left'|'up'|'down'; color?: string };

const P = (props: React.SVGProps<SVGSVGElement> & { s?: number; color?: string }) => {
  const { s = 20, color, style, ...rest } = props;
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ color, ...style }} {...rest} />;
};

export const Ic = {
  Pin: ({ s = 20, fill = false, color }: IconProps) => (
    <P s={s} color={color}><path d="M12 22s7-7.5 7-13a7 7 0 10-14 0c0 5.5 7 13 7 13z" stroke="currentColor" strokeWidth="2" fill={fill ? 'currentColor' : 'none'} strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2" fill={fill ? 'white' : 'none'}/></P>
  ),
  Compass: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M16 8l-2 6-6 2 2-6 6-2z" fill="currentColor"/></P>
  ),
  Search: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></P>
  ),
  Mic: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><rect x="9" y="3" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></P>
  ),
  Send: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M3 12l18-9-7 18-3-7-8-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15"/></P>
  ),
  Back: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></P>
  ),
  Arrow: ({ s = 20, dir = 'right', color }: IconProps) => (
    <P s={s} color={color} style={{ transform: dir === 'down' ? 'rotate(90deg)' : dir === 'up' ? 'rotate(-90deg)' : dir === 'left' ? 'rotate(180deg)' : 'none' }}>
      <path d="M5 12h14M14 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </P>
  ),
  Heart: ({ s = 20, fill = false, color }: IconProps) => (
    <P s={s} color={color}><path d="M12 21s-8-5-8-11a5 5 0 019-3 5 5 0 019 3c0 6-8 11-8 11h-2z" stroke="currentColor" strokeWidth="2" fill={fill ? 'currentColor' : 'none'} strokeLinejoin="round"/></P>
  ),
  Chat: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></P>
  ),
  Share: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M9 12H5a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2h-4M12 3v12M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></P>
  ),
  Star: ({ s = 20, fill = false, color }: IconProps) => (
    <P s={s} color={color}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z" stroke="currentColor" strokeWidth="2" fill={fill ? 'currentColor' : 'none'} strokeLinejoin="round"/></P>
  ),
  Bolt: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M13 3L5 14h7l-1 7 8-11h-7l1-7z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.15" strokeLinejoin="round"/></P>
  ),
  Wallet: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M16 13a1 1 0 100 2 1 1 0 000-2zM2 10h20" stroke="currentColor" strokeWidth="2"/></P>
  ),
  Users: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="2"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M16 11a3 3 0 100-6M21 20c0-2.5-2-4.5-4-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></P>
  ),
  Map: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></P>
  ),
  Layers: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></P>
  ),
  Locate: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></P>
  ),
  Route: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="2"/><circle cx="18" cy="19" r="2.5" stroke="currentColor" strokeWidth="2"/><path d="M6 8v3a4 4 0 004 4h4a4 4 0 014 4" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></P>
  ),
  Menu: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></P>
  ),
  Plus: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></P>
  ),
  Check: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M5 12l5 5 9-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></P>
  ),
  X: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></P>
  ),
  Bus: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><rect x="4" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M4 12h16M8 4v3M16 4v3" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="20" r="1.5" fill="currentColor"/><circle cx="16" cy="20" r="1.5" fill="currentColor"/></P>
  ),
  History: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></P>
  ),
  Alert: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></P>
  ),
  Settings: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></P>
  ),
  Flame: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M12 2C9 7 6 10 6 14a6 6 0 0012 0c0-2-1-4-2-5.5C15 10 14 12 12 12c0-2 1-6 0-10z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.2" strokeLinejoin="round"/></P>
  ),
  Trophy: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M8 3H5v5c0 3 2 5 4 6v2H7v2h10v-2h-2v-2c2-1 4-3 4-6V3h-3M8 3h8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></P>
  ),
  Moon: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></P>
  ),
  Card: ({ s = 20, color }: IconProps) => (
    <P s={s} color={color}><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/><path d="M2 10h20M7 15h3" stroke="currentColor" strokeWidth="2"/></P>
  ),
};
