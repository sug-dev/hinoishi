
/**
 * Cumulative XP required to reach a level.
 * Level 1 starts at 0 XP; each level costs 100 more XP
 * than the previous one.
 *
 * Level 2 = 100 XP
 * Level 3 = 300 XP
 * Level 4 = 600 XP
 * Level 5 = 1,000 XP
 */
export const MAX_STAT_LEVEL = 100;

export function totalXpForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.min(MAX_STAT_LEVEL, Math.floor(level)));
  return (100 * (safeLevel - 1) * safeLevel) / 2;
}

export function levelForXp(xp: number): number {
  const safeXp = Math.max(0, Math.floor(xp));
  let level = 1;

  while (
    level < MAX_STAT_LEVEL &&
    safeXp >= totalXpForLevel(level + 1)
  ) {
    level += 1;
  }

  return level;
}

export function progressionForXp(xp: number) {
  const safeXp = Math.max(0, Math.floor(xp));
  const level = levelForXp(safeXp);
  const xpAtLevel = totalXpForLevel(level);
  const xpToNextLevel = level >= MAX_STAT_LEVEL ? 0 : level * 100;

  return {
    level,
    xp: safeXp,
    xpIntoLevel: safeXp - xpAtLevel,
    xpToNextLevel,
    progress: xpToNextLevel === 0
      ? 100
      : Math.min(
          100,
          ((safeXp - xpAtLevel) / xpToNextLevel) * 100
        ),
  };
}


export const STAT_MILESTONES = [
  { id: 'level-5', level: 5, title: 'Getting Started' },
  { id: 'level-10', level: 10, title: 'Dedicated' },
  { id: 'level-25', level: 25, title: 'Specialist' },
  { id: 'level-50', level: 50, title: 'Master' },
  { id: 'level-75', level: 75, title: 'Virtuoso' },
  { id: 'level-100', level: 100, title: 'Legendary' }
];

export function unlockMilestones(stat: any): boolean {
  const unlocked = new Set(
    (stat.unlockedMilestones || []).map((m: any) => m.id)
  );

  const newlyUnlocked = STAT_MILESTONES.filter(
    milestone =>
      stat.level >= milestone.level &&
      !unlocked.has(milestone.id)
  );

  for (const milestone of newlyUnlocked) {
    stat.unlockedMilestones.push({
      id: milestone.id,
      unlockedAt: new Date()
    });
  }

  return newlyUnlocked.length > 0;
}

