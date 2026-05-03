/**
 * Système de niveaux BABIMOB (v2 - 100 Niveaux)
 * 
 * Max XP: 50,000
 * Niveau 100 atteint à 50,000 XP.
 */

export type LevelInfo = {
  level: number;
  title: string;
  xp: number;
  xpForNext: number;
  progress: number;
  canPost: boolean;
  canStory: boolean;
};

// Paliers de titres spéciaux
const MILESTONE_TITLES: Record<number, string> = {
  1: 'Piéton',
  5: 'Passager',
  10: 'Voyageur',
  20: 'Explorateur',
  30: 'Garocheur',
  40: 'Guide',
  50: "Roi d'Abidjan",
  60: 'Vieux Père',
  70: 'Ambassadeur',
  80: 'Empereur',
  90: 'Légende',
  100: 'Dieu de Babi',
};

/**
 * Calcule les XP nécessaires pour un niveau donné.
 * On utilise une courbe pour atteindre 50,000 à Lvl 100.
 */
function getThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= 100) return 50000;
  
  // Courbe quadratique simple: xp = a * (lvl-1)^2 + b * (lvl-1)
  // On ajuste pour que Lvl 10 soit ~4500 et Lvl 100 soit 50000
  const x = level - 1;
  const xp = 4.2 * (x * x) + 85 * x;
  return Math.round(xp / 10) * 10; // Arrondi à la dizaine
}

export function getLevel(totalPoints: number): LevelInfo {
  let level = 1;
  
  // Recherche du niveau actuel
  for (let l = 1; l <= 100; l++) {
    if (totalPoints >= getThresholdForLevel(l)) {
      level = l;
    } else {
      break;
    }
  }

  const currentThreshold = getThresholdForLevel(level);
  const nextThreshold = level < 100 ? getThresholdForLevel(level + 1) : 50000;
  
  const xpInLevel = totalPoints - currentThreshold;
  const xpNeeded = nextThreshold - currentThreshold;
  const progress = level < 100 ? Math.min(1, xpInLevel / xpNeeded) : 1;

  // Déterminer le titre (le dernier milestone atteint)
  let title = MILESTONE_TITLES[1];
  for (const m of Object.keys(MILESTONE_TITLES).map(Number).sort((a,b) => a-b)) {
    if (level >= m) title = MILESTONE_TITLES[m];
  }

  return {
    level,
    title,
    xp: totalPoints,
    xpForNext: nextThreshold,
    progress,
    canPost: level >= 3,
    canStory: level >= 5,
  };
}

export const MIN_LEVEL_POST = 3;
export const MIN_LEVEL_STORY = 5;
