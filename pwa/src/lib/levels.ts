/**
 * Système de niveaux BABIMOB
 * 
 * Basé sur total_points du profil.
 * Niveau 3 minimum pour poster sur Gbairai.
 * Niveau 5 minimum pour poster des stories.
 */

export type LevelInfo = {
  level: number;
  title: string;
  xp: number;
  xpForNext: number;
  progress: number; // 0-1
  canPost: boolean;  // level >= 3
  canStory: boolean; // level >= 5
};

const LEVEL_THRESHOLDS = [
  { level: 1, xp: 0,    title: 'Piéton' },
  { level: 2, xp: 100,  title: 'Passager' },
  { level: 3, xp: 300,  title: 'Voyageur' },
  { level: 4, xp: 600,  title: 'Explorateur' },
  { level: 5, xp: 1000, title: 'Garocheur' },
  { level: 6, xp: 1500, title: 'Guide' },
  { level: 7, xp: 2100, title: "Roi d'Abidjan" },
  { level: 8, xp: 2800, title: 'Empereur' },
  { level: 9, xp: 3600, title: 'Légende' },
  { level: 10, xp: 4500, title: 'Dieu de Babi' },
];

export function getLevel(totalPoints: number): LevelInfo {
  let current = LEVEL_THRESHOLDS[0];
  let nextIdx = 1;

  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalPoints >= LEVEL_THRESHOLDS[i].xp) {
      current = LEVEL_THRESHOLDS[i];
      nextIdx = i + 1;
      break;
    }
  }

  const next = LEVEL_THRESHOLDS[nextIdx] ?? null;
  const xpInLevel = totalPoints - current.xp;
  const xpNeeded = next ? next.xp - current.xp : 1;
  const progress = next ? Math.min(1, xpInLevel / xpNeeded) : 1;

  return {
    level: current.level,
    title: current.title,
    xp: totalPoints,
    xpForNext: next ? next.xp : current.xp,
    progress,
    canPost: current.level >= 3,
    canStory: current.level >= 5,
  };
}

export const MIN_LEVEL_POST = 3;
export const MIN_LEVEL_STORY = 5;
