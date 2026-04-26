'use client';

import { useEffect, useState } from 'react';

type Goal = {
  label: string;
  current: number;
  target: number;
  emoji: string;
};

type Props = {
  goals: Goal[];
  remainingPoints: number;
};

export default function ExplorerGoals({ goals, remainingPoints }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-4">
      {goals.map((goal, idx) => {
        const pct = Math.min((goal.current / goal.target) * 100, 100);
        const isDone = pct >= 100;
        return (
          <div key={idx}>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center gap-2">
                <span className={isDone ? '' : 'grayscale opacity-50'}>{goal.emoji}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${isDone ? 'text-abidjan-green' : 'text-beige-text'}`}>
                  {goal.label} {isDone && '✓'}
                </span>
              </div>
              <span className="text-[9px] font-black text-beige-muted">{goal.current} / {goal.target}</span>
            </div>
            <div className="h-1.5 bg-white rounded-full overflow-hidden border border-beige-100">
              <div
                className={`h-full rounded-full ${isDone ? 'bg-abidjan-green' : 'bg-abidjan-orange opacity-60'}`}
                style={{
                  width: mounted ? `${pct}%` : '0%',
                  transition: mounted ? `width 1.4s cubic-bezier(0.22,1,0.36,1) ${idx * 150}ms` : 'none',
                }}
              />
            </div>
          </div>
        );
      })}

      <p className="text-[9px] font-black text-abidjan-orange italic uppercase tracking-wider text-center mt-2">
        Plus que {remainingPoints} points pour y arriver !
      </p>
    </div>
  );
}
