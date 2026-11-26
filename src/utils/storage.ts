import type { AnswerPickCounts, LeaderboardEntry, RoundResult } from '../types/game';
import { getTodayUtcKey } from '../data/questions';

const KEYS = {
  muted: 'rift_rarity_muted',
  reducedMotion: 'rift_rarity_reduced_motion',
  dailyStreak: 'rift_rarity_daily_streak',
  dailyLastDate: 'rift_rarity_daily_last_date',
  dailyCompletedPrefix: 'rift_rarity_daily_run_',
  localLeaderboard: 'rift_rarity_local_leaderboard',
  localAnswerCounts: 'rift_rarity_local_answer_counts',
  summonerName: 'rift_rarity_summoner_name',
};

export interface DailyProgress {
  streak: number;
  lastCompletedDate: string | null;
  todayResults: RoundResult[] | null;
}

function addDaysUtc(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
}

export function loadMutedPreference(): boolean {
  try {
    return localStorage.getItem(KEYS.muted) === '1';
  } catch {
    return false;
  }
}

export function saveMutedPreference(muted: boolean): void {
  try {
    localStorage.setItem(KEYS.muted, muted ? '1' : '0');
  } catch {
    // Ignore
  }
}

export function loadReducedMotionPreference(): boolean {
  try {
    const saved = localStorage.getItem(KEYS.reducedMotion);
    if (saved !== null) return saved === '1';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
  } catch {
    // Ignore
  }
  return false;
}

export function saveReducedMotionPreference(reduced: boolean): void {
  try {
    localStorage.setItem(KEYS.reducedMotion, reduced ? '1' : '0');
  } catch {
    // Ignore
  }
}

export function loadSavedSummonerName(): string {
  try {
    return localStorage.getItem(KEYS.summonerName) || '';
  } catch {
    return '';
  }
}

export function saveSummonerName(name: string): void {
  try {
    localStorage.setItem(KEYS.summonerName, name.slice(0, 32));
  } catch {
    // Ignore
  }
}

export function loadDailyProgress(): DailyProgress {
  const today = getTodayUtcKey();
  try {
    const lastDate = localStorage.getItem(KEYS.dailyLastDate);
    let streak = Number(localStorage.getItem(KEYS.dailyStreak) || '0') || 0;

    if (lastDate && lastDate !== today && lastDate !== addDaysUtc(today, -1)) {
      streak = 0;
    }

    const rawToday = localStorage.getItem(`${KEYS.dailyCompletedPrefix}${today}`);
    const todayResults = rawToday ? (JSON.parse(rawToday) as RoundResult[]) : null;
    return { streak, lastCompletedDate: lastDate, todayResults };
  } catch {
    return { streak: 0, lastCompletedDate: null, todayResults: null };
  }
}

export function saveDailyRunCompleted(results: RoundResult[]): DailyProgress {
  const today = getTodayUtcKey();
  try {
    const lastDate = localStorage.getItem(KEYS.dailyLastDate);
    const prevStreak = Number(localStorage.getItem(KEYS.dailyStreak) || '0') || 0;

    let newStreak = prevStreak;
    if (lastDate === today) {
      newStreak = Math.max(1, prevStreak);
    } else if (lastDate === addDaysUtc(today, -1)) {
      newStreak = prevStreak + 1;
    } else {
      newStreak = 1;
    }

    localStorage.setItem(KEYS.dailyStreak, String(newStreak));
    localStorage.setItem(KEYS.dailyLastDate, today);
    localStorage.setItem(`${KEYS.dailyCompletedPrefix}${today}`, JSON.stringify(results));

    return {
      streak: newStreak,
      lastCompletedDate: today,
      todayResults: results,
    };
  } catch {
    return { streak: 1, lastCompletedDate: today, todayResults: results };
  }
}

export function loadLocalAnswerCounts(questionId: string): AnswerPickCounts {
  try {
    const raw = localStorage.getItem(KEYS.localAnswerCounts);
    if (!raw) return {};
    const all = JSON.parse(raw) as Record<string, AnswerPickCounts>;
    return all[questionId] ?? {};
  } catch {
    return {};
  }
}

export function recordLocalAnswerPick(questionId: string, answerId: string): void {
  try {
    const raw = localStorage.getItem(KEYS.localAnswerCounts);
    const all: Record<string, AnswerPickCounts> = raw ? JSON.parse(raw) : {};
    if (!all[questionId]) all[questionId] = {};
    all[questionId][answerId] = (all[questionId][answerId] ?? 0) + 1;
    localStorage.setItem(KEYS.localAnswerCounts, JSON.stringify(all));
  } catch {
    // Ignore
  }
}

export function loadLocalLeaderboardEntries(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(KEYS.localLeaderboard);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function saveLocalLeaderboardEntry(entry: LeaderboardEntry): void {
  try {
    const existing = loadLocalLeaderboardEntries();
    const filtered = existing.filter((e) => e.id !== entry.id);
    filtered.push(entry);
    filtered.sort((a, b) => b.score - a.score);
    localStorage.setItem(KEYS.localLeaderboard, JSON.stringify(filtered.slice(0, 50)));
  } catch {
    // Ignore
  }
}
