export type RankId =
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'emerald'
  | 'diamond'
  | 'master'
  | 'grandmaster'
  | 'challenger';

export interface RankDefinition {
  id: RankId;
  name: string;
  tierIndex: number; // 0 (Iron) .. 9 (Challenger)
  color: string;
  secondaryColor: string;
  glowColor: string;
  travelDistance: number; // Distance added along the 0..100 Rift map
  basePoints: number;
  shakeLevel: 'none' | 'medium' | 'epic';
  announcerLines: string[];
  shareSymbol: string;
}

export type QuestionCategory = 'champions' | 'abilities' | 'items' | 'skins' | 'lore';

export type AnswerKind = 'champion' | 'item' | 'ability' | 'skin_champion' | 'skin_name' | 'region';

export interface RiftSkin {
  id: string;
  num: number;
  name: string;
}

export interface RiftSpell {
  id: string;
  name: string;
  description: string;
  tooltip: string;
  cooldown: number[];
  cost: number[];
  range: number[];
  resource: string;
  imageFull: string;
  slot: 'P' | 'Q' | 'W' | 'E' | 'R';
  championId: string;
  championName: string;
}

export interface RiftChampion {
  id: string;
  key: string;
  name: string;
  title: string;
  tags: string[];
  partype: string;
  lore: string;
  imageFull: string;
  skins: RiftSkin[];
  passive: RiftSpell;
  spells: RiftSpell[];
  stats: Record<string, number>;
}

export interface RiftItem {
  id: string;
  name: string;
  plaintext: string;
  description: string;
  goldTotal: number;
  goldBase: number;
  purchasable: boolean;
  tags: string[];
  from: string[];
  into: string[];
  imageFull: string;
  depth: number;
}

export interface RiftData {
  version: string;
  champions: RiftChampion[];
  championsById: Record<string, RiftChampion>;
  items: RiftItem[];
  itemsById: Record<string, RiftItem>;
}

export interface ValidAnswerEntry {
  id: string; // canonical id (champion.id, item.id, spell.id, or region key)
  displayName: string;
  subtitle?: string;
  popularity: number; // 1 (very common/obvious) .. 100 (extremely obscure)
  imageKind: 'champion_splash' | 'skin_splash' | 'item_icon' | 'ability_icon' | 'region_crest';
  imageUrl: string;
  fallbackImageUrl?: string;
  aliases: string[];
}

export interface TriviaQuestion {
  id: string;
  category: QuestionCategory;
  subType?: string;
  answerKind: AnswerKind;
  prompt: string;
  hint: string;
  resolveAnswers: (data: RiftData) => ValidAnswerEntry[];
}

export interface RoundResult {
  questionId: string;
  category: QuestionCategory;
  prompt: string;
  answered: boolean;
  answerDisplay: string;
  answerSubtitle?: string;
  imageUrl?: string;
  fallbackImageUrl?: string;
  imageKind?: ValidAnswerEntry['imageKind'];
  rank: RankId;
  points: number;
  announcerLine: string;
  distanceGained: number;
  distanceAfter: number;
}

export type GameMode = 'daily' | 'unlimited';

export type GameScreen = 'title' | 'playing' | 'summary' | 'scoreboard';

export interface ZoneInfo {
  id: string;
  name: string;
  subtitle: string;
  minProgress: number;
  maxProgress: number;
  accentColor: string;
}

export interface LeaderboardEntry {
  id: string;
  uid: string;
  summonerName: string;
  mode: GameMode;
  dateKey: string;
  score: number;
  finalRank: RankId;
  reachedZone: string;
  progress: number;
  isPublic: boolean;
  createdAtMs?: number;
}

export type AnswerPickCounts = Record<string, number>;
