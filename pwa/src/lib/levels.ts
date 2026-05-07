/**
 * Système de niveaux BABIMOB (v2 - 100 Niveaux)
 * 
 * Max XP: 50,000
 * Niveau 100 atteint à 50,000 XP.
 */

export type LevelInfo = {
  level: number;
  title: string;
  nextTitle: string;
  xp: number;
  xpForNext: number;
  progress: number;
  canPost: boolean;
  canStory: boolean;
};

// Paliers de titres spéciaux (Exemple réajusté pour coller au screenshot Lvl 7 = Garocheur)
const MILESTONE_TITLES: Record<number, string> = {
  1: 'Piéton',
  3: 'Passager',
  5: 'Voyageur',
  7: 'Garocheur',
  8: "Empereur d'Abidjan",
  10: 'Explorateur',
  15: 'Guide',
  20: "Roi d'Abidjan",
  30: 'Vieux Père',
  50: 'Ambassadeur',
  75: 'Légende',
  100: 'Dieu de Babi',
};

/**
 * Calcule les XP nécessaires pour un niveau donné.
 * On utilise une courbe pour atteindre 50,000 à Lvl 100.
 */
function getThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level >= 100) return 50000;
  
  // Courbe pour Lvl 7-8 soit autour de 2500-3000
  const x = level - 1;
  const xp = 4.2 * (x * x) + 380 * x; 
  return Math.round(xp / 10) * 10; 
}

export function getLevel(totalPoints: number): LevelInfo {
  let level = 1;
  
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

  // Titre actuel
  let title = MILESTONE_TITLES[1];
  for (const m of Object.keys(MILESTONE_TITLES).map(Number).sort((a,b) => a-b)) {
    if (level >= m) title = MILESTONE_TITLES[m];
  }

  // Prochain titre (celui du niveau suivant ou le prochain milestone)
  let nextTitle = MILESTONE_TITLES[level + 1] || title;
  if (!MILESTONE_TITLES[level+1]) {
     for (const m of Object.keys(MILESTONE_TITLES).map(Number).sort((a,b) => a-b)) {
       if (m > level) {
         nextTitle = MILESTONE_TITLES[m];
         break;
       }
     }
  }

  return {
    level,
    title,
    nextTitle,
    xp: totalPoints,
    xpForNext: nextThreshold,
    progress,
    canPost: level >= 3,
    canStory: level >= 5,
  };
}

export const MIN_LEVEL_POST = 3;
export const MIN_LEVEL_STORY = 5;
