import type { RankDefinition, RankId, ZoneInfo } from '../types/game';

/**
 * Total Rift journey spans 0 to 100 units across 7 questions.
 */
export const RANKS: Record<RankId, RankDefinition> = {
  iron: {
    id: 'iron',
    name: 'Iron',
    tierIndex: 0,
    color: '#7a7672',
    secondaryColor: '#484440',
    glowColor: 'rgba(122, 118, 114, 0.35)',
    travelDistance: 0,
    basePoints: 0,
    shakeLevel: 'none',
    shareSymbol: '⬛',
    announcerLines: [
      'Executed by Krugs. Better luck next wave.',
      'Missed Cannon, missed timer, missed the Rift.',
      'Your lantern sputtered out at the fountain.',
      'Pinged missing by your entire team.',
    ],
  },
  bronze: {
    id: 'bronze',
    name: 'Bronze',
    tierIndex: 1,
    color: '#b87342',
    secondaryColor: '#6d3d1d',
    glowColor: 'rgba(184, 115, 66, 0.4)',
    travelDistance: 5.5,
    basePoints: 100,
    shakeLevel: 'none',
    shareSymbol: '🟫',
    announcerLines: [
      'Everyone and their Yuumi thought of that one.',
      'The most popular pick on the server.',
      'Safe, sturdy, and deeply predictable.',
      'Classic comfort pick. Zero risk taken.',
    ],
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    tierIndex: 2,
    color: '#9aa8b8',
    secondaryColor: '#566473',
    glowColor: 'rgba(154, 168, 184, 0.45)',
    travelDistance: 7.5,
    basePoints: 250,
    shakeLevel: 'none',
    shareSymbol: '⬜',
    announcerLines: [
      'A respectable lane-phase answer.',
      'Clean last-hitting, nothing too fancy.',
      'Solid macro, straight down the middle.',
      'Familiar territory, but it keeps you moving.',
    ],
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    tierIndex: 3,
    color: '#e0b44c',
    secondaryColor: '#916d1c',
    glowColor: 'rgba(224, 180, 76, 0.5)',
    travelDistance: 9.5,
    basePoints: 400,
    shakeLevel: 'none',
    shareSymbol: '🟨',
    announcerLines: [
      'Shining nicely — Victorious territory.',
      'You remembered the ones most players scroll past.',
      'Good ward placement. Crisp map awareness.',
      'Golden instincts on the Rift.',
    ],
  },
  platinum: {
    id: 'platinum',
    name: 'Platinum',
    tierIndex: 4,
    color: '#34b3b8',
    secondaryColor: '#1a666b',
    glowColor: 'rgba(52, 179, 184, 0.55)',
    travelDistance: 11.2,
    basePoints: 600,
    shakeLevel: 'none',
    shareSymbol: '🩵',
    announcerLines: [
      'Now we are digging past the meta picks.',
      'Sharp recall under pressure.',
      'Smart counter-pick from the back of the roster.',
      'You actually read the patch notes, huh?',
    ],
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald',
    tierIndex: 5,
    color: '#22c57e',
    secondaryColor: '#0e6942',
    glowColor: 'rgba(34, 197, 126, 0.55)',
    travelDistance: 12.6,
    basePoints: 850,
    shakeLevel: 'none',
    shareSymbol: '🟩',
    announcerLines: [
      'Clever pull! Most summoners blanked on that.',
      'Cutting cleanly through the jungle fog.',
      'Rarely banned, rarely remembered, nicely played.',
      'Emerald clarity — crisp and unexpected.',
    ],
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond',
    tierIndex: 6,
    color: '#60a5fa',
    secondaryColor: '#1d4ed8',
    glowColor: 'rgba(96, 165, 250, 0.65)',
    travelDistance: 13.8,
    basePoints: 1100,
    shakeLevel: 'medium',
    shareSymbol: '🟦',
    announcerLines: [
      'Sparkling outplay! That deep cut hit hard.',
      'Diamond-sharp memory. Streak flame territory!',
      'Not one in ten players pulls that name in time.',
      'High-elo trivia mechanics on full display.',
    ],
  },
  master: {
    id: 'master',
    name: 'Master',
    tierIndex: 7,
    color: '#c084fc',
    secondaryColor: '#6b21a8',
    glowColor: 'rgba(192, 132, 252, 0.72)',
    travelDistance: 15.0,
    basePoints: 1400,
    shakeLevel: 'medium',
    shareSymbol: '🟪',
    announcerLines: [
      'True Rift scholar. The archives salute you.',
      'An arcane deep cut straight from the Void.',
      'Masterful pull — you rattled the enemy turret.',
      'That answer belongs in a lore encyclopedia.',
    ],
  },
  grandmaster: {
    id: 'grandmaster',
    name: 'Grandmaster',
    tierIndex: 8,
    color: '#f43f5e',
    secondaryColor: '#881337',
    glowColor: 'rgba(244, 63, 94, 0.78)',
    travelDistance: 16.5,
    basePoints: 1750,
    shakeLevel: 'epic',
    shareSymbol: '🟥',
    announcerLines: [
      'Unbelievable! Pure Grandmaster obscurity!',
      'Forgotten by the ladder, unlocked by you.',
      'Shockwave across the Rift — massive stride!',
      'That pull just stole Baron without vision.',
    ],
  },
  challenger: {
    id: 'challenger',
    name: 'Challenger',
    tierIndex: 9,
    color: '#fcd34d',
    secondaryColor: '#0ea5e9',
    glowColor: 'rgba(252, 211, 77, 0.85)',
    travelDistance: 18.0,
    basePoints: 2200,
    shakeLevel: 'epic',
    shareSymbol: '👑',
    announcerLines: [
      'RANK 1 ON THE LADDER! Peak Runeterra mastery!',
      'CHALLENGER PULL! Nobody else even remembered that existed!',
      'Pentakill of pure trivia genius — shattering the Rift!',
      'Crown the summoner! The most obscure gem in the pool!',
    ],
  },
};

export const RANK_ORDER: RankId[] = [
  'iron',
  'bronze',
  'silver',
  'gold',
  'platinum',
  'emerald',
  'diamond',
  'master',
  'grandmaster',
  'challenger',
];

export const RIFT_ZONES: ZoneInfo[] = [
  {
    id: 'fountain',
    name: 'Blue Fountain',
    subtitle: 'Nexus Obelisk Spawn',
    minProgress: 0,
    maxProgress: 9,
    accentColor: '#38bdf8',
  },
  {
    id: 'your_base',
    name: 'Your Base',
    subtitle: 'Allied Inhibitors & Gates',
    minProgress: 9,
    maxProgress: 20,
    accentColor: '#0ea5e9',
  },
  {
    id: 'lane',
    name: 'Mid Lane',
    subtitle: 'The Contested Warpath',
    minProgress: 20,
    maxProgress: 32,
    accentColor: '#c8aa6e',
  },
  {
    id: 'jungle',
    name: 'The Jungle',
    subtitle: 'Ancient Sentinels & Fog',
    minProgress: 32,
    maxProgress: 44,
    accentColor: '#34d399',
  },
  {
    id: 'river',
    name: 'The River',
    subtitle: 'Shifting Currents & Mist',
    minProgress: 44,
    maxProgress: 56,
    accentColor: '#22d3ee',
  },
  {
    id: 'dragon_pit',
    name: 'Dragon Pit',
    subtitle: 'Elemental Volcanic Crater',
    minProgress: 56,
    maxProgress: 68,
    accentColor: '#fb923c',
  },
  {
    id: 'baron_pit',
    name: 'Baron Pit',
    subtitle: 'Void-Scarred Chasm',
    minProgress: 68,
    maxProgress: 80,
    accentColor: '#a855f7',
  },
  {
    id: 'enemy_base',
    name: 'Enemy Base',
    subtitle: 'Crimson Bastion Breach',
    minProgress: 80,
    maxProgress: 92,
    accentColor: '#f43f5e',
  },
  {
    id: 'enemy_nexus',
    name: 'Enemy Nexus',
    subtitle: 'Heart of the Red Citadel',
    minProgress: 92,
    maxProgress: 100,
    accentColor: '#fcd34d',
  },
];

export function getZoneForProgress(progress: number): ZoneInfo {
  const clamped = Math.max(0, Math.min(100, progress));
  for (let i = RIFT_ZONES.length - 1; i >= 0; i--) {
    if (clamped >= RIFT_ZONES[i].minProgress) {
      return RIFT_ZONES[i];
    }
  }
  return RIFT_ZONES[0];
}

export function isDiamondOrBetter(rank: RankId): boolean {
  return RANKS[rank].tierIndex >= RANKS.diamond.tierIndex;
}

export function computeRoundPoints(rank: RankId, secondsRemaining: number): number {
  if (rank === 'iron') return 0;
  const base = RANKS[rank].basePoints;
  const speedBonus = Math.max(0, Math.min(125, Math.round(secondsRemaining * 5)));
  return base + speedBonus;
}

export function computeFinalRank(results: { rank: RankId }[]): RankId {
  if (results.length === 0) return 'iron';
  const totalTier = results.reduce((sum, r) => sum + RANKS[r.rank].tierIndex, 0);
  const avg = totalTier / results.length;
  const rounded = Math.round(avg);
  const clamped = Math.max(0, Math.min(RANK_ORDER.length - 1, rounded));
  return RANK_ORDER[clamped];
}
