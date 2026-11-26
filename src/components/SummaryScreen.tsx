import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Flame, LogIn, RotateCcw, Send, Share2 } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { GameMode, RankId, RoundResult } from '../types/game';
import { RANKS, RIFT_ZONES, computeFinalRank, getZoneForProgress } from '../data/ranks';
import { RankCrest } from './RankCrest';
import { RiftJourneyCanvas } from './RiftJourneyCanvas';
import { RiftImage } from './RiftImage';
import { ScoreboardPanel } from './ScoreboardPanel';
import { getTodayUtcKey } from '../data/questions';
import { signInWithGoogle, submitLeaderboardEntry } from '../services/firebase';
import {
  loadSavedSummonerName,
  saveLocalLeaderboardEntry,
  saveSummonerName,
} from '../utils/storage';

interface SummaryScreenProps {
  mode: GameMode;
  results: RoundResult[];
  finalProgress: number;
  dailyStreak: number;
  reducedMotion: boolean;
  user: User | null;
  onPlayUnlimited: () => void;
  onReturnTitle: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({
  mode,
  results,
  finalProgress,
  dailyStreak,
  reducedMotion,
  user,
  onPlayUnlimited,
  onReturnTitle,
}) => {
  const [copied, setCopied] = useState(false);
  const [summonerName, setSummonerName] = useState<string>(
    () => loadSavedSummonerName() || user?.displayName?.split(' ')[0] || ''
  );
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const finalRank: RankId = computeFinalRank(results);
  const finalRankDef = RANKS[finalRank];
  const reachedZone = getZoneForProgress(finalProgress);
  const reachedNexus = finalProgress >= 92;
  const totalScore = results.reduce((sum, r) => sum + (r.points ?? 0), 0);
  const todayKey = getTodayUtcKey();

  const handlePublishScore = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = summonerName.trim().slice(0, 32) || user?.displayName?.slice(0, 32) || 'Summoner';
    saveSummonerName(cleanName);
    setPublishError(null);
    setPublishing(true);

    try {
      let activeUser = user;
      if (!activeUser) {
        activeUser = await signInWithGoogle();
      }
      await submitLeaderboardEntry({
        summonerName: cleanName,
        mode,
        dateKey: todayKey,
        score: totalScore,
        finalRank,
        reachedZone: reachedZone.name,
        progress: finalProgress,
      });
      setPublished(true);
    } catch (err) {
      // Save locally so the player still sees their score on the local board
      saveLocalLeaderboardEntry({
        id: `local_${mode}_${todayKey}_${Date.now()}`,
        uid: user?.uid || 'local',
        summonerName: cleanName,
        mode,
        dateKey: todayKey,
        score: totalScore,
        finalRank,
        reachedZone: reachedZone.name,
        progress: finalProgress,
        isPublic: true,
        createdAtMs: Date.now(),
      });
      setPublishError(
        err instanceof Error
          ? err.message
          : 'Could not publish to global board; saved to your local board.'
      );
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = async () => {
    const header =
      mode === 'daily'
        ? `Rift Rarity · Daily (${todayKey})`
        : 'Rift Rarity · Unlimited Run';
    const crests = results.map((r) => RANKS[r.rank].shareSymbol).join('');
    const text = `${header}\nFinal Rank: ${finalRankDef.name} (${totalScore.toLocaleString()} pts)\nReached: ${reachedZone.name}\n${crests}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    }
  };

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Final Journey Map View */}
      <RiftJourneyCanvas
        progress={finalProgress}
        lastRank={finalRank}
        reducedMotion={reducedMotion}
        heightClass="h-44 sm:h-52"
      />

      {/* Final Rank & Score Card */}
      <div
        className="rounded-xl border bg-[#0c1322]/95 p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-6"
        style={{
          borderColor: finalRankDef.tierIndex >= 6 ? finalRankDef.color : 'rgba(120, 90, 40, 0.5)',
          boxShadow:
            finalRankDef.tierIndex >= 7 ? `0 0 48px -12px ${finalRankDef.glowColor}` : undefined,
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <div
            style={{
              filter:
                finalRankDef.tierIndex >= 5
                  ? `drop-shadow(0 0 18px ${finalRankDef.glowColor})`
                  : undefined,
            }}
          >
            <RankCrest rank={finalRank} size={84} />
          </div>
          <div>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs font-medium text-[#c8aa6e] tracking-wide">
              <span>{mode === 'daily' ? `Daily Challenge · ${todayKey}` : 'Unlimited Run'}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums font-bold text-[#fcd34d]">
                {totalScore.toLocaleString()} pts
              </span>
            </div>
            <h2
              className="font-display text-2xl sm:text-3xl font-bold mt-0.5"
              style={{ color: finalRankDef.color }}
            >
              {finalRankDef.name} Finish
            </h2>
            <p className="mt-1.5 text-sm text-[#d6cebd]">
              {reachedNexus
                ? 'Victory! You breached all defences and reached the Enemy Nexus.'
                : `Journey ended at ${reachedZone.name} — ${reachedZone.subtitle}.`}
            </p>
            {mode === 'daily' && dailyStreak > 0 && (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#fb923c]">
                <Flame className="w-3.5 h-3.5" />
                Daily Streak: {dailyStreak} {dailyStreak === 1 ? 'day' : 'days'}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#c8aa6e]/50 bg-[#141e33] hover:bg-[#1c2944] text-[#f0e6d2] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-[#22c57e]" /> : <Share2 className="w-4 h-4 text-[#c8aa6e]" />}
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={onPlayUnlimited}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#c8aa6e] hover:bg-[#d8bc82] text-[#090d16] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Unlimited</span>
          </button>

          <button
            type="button"
            onClick={onReturnTitle}
            className="inline-flex items-center px-3 py-2.5 text-sm font-medium text-[#a09b8c] hover:text-[#f0e6d2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Home
          </button>
        </div>
      </div>

      {/* Post Score to Global Scoreboard */}
      <div className="rounded-xl border border-[#785a28]/45 bg-[#0c1322]/90 p-4 sm:p-5">
        {published ? (
          <div className="flex items-center gap-2.5 text-sm font-semibold text-[#22c57e]">
            <Check className="w-5 h-5" />
            <span>Score published to the Summoner Scoreboard!</span>
          </div>
        ) : (
          <form onSubmit={handlePublishScore} className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <label htmlFor="summoner-name-input" className="block text-xs font-semibold text-[#c8aa6e] mb-1">
                Post Your Score ({totalScore.toLocaleString()} pts) to the Scoreboard
              </label>
              <input
                id="summoner-name-input"
                type="text"
                maxLength={32}
                value={summonerName}
                onChange={(e) => setSummonerName(e.target.value)}
                placeholder="Enter Summoner Name..."
                className="w-full rounded-lg border border-[#785a28]/55 bg-[#070b14] px-3.5 py-2 text-sm text-[#f0e6d2] placeholder:text-[#68645c] focus:outline-none focus:border-[#0ac8b9]"
              />
            </div>
            <button
              type="submit"
              disabled={publishing}
              className="sm:self-end inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0ac8b9] hover:bg-[#19dfd0] disabled:opacity-60 text-[#070b14] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {user ? <Send className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              <span>
                {publishing
                  ? 'Posting...'
                  : user
                  ? 'Save to Scoreboard'
                  : 'Sign in & Save Score'}
              </span>
            </button>
          </form>
        )}
        {publishError && <p className="mt-2 text-xs text-[#fb923c]">{publishError}</p>}
      </div>

      {/* Zone Path Checkpoints Strip */}
      <div className="rounded-xl border border-[#785a28]/35 bg-[#0c1322]/80 p-4">
        <p className="text-xs font-medium text-[#a09b8c] mb-3">Rift Map Progress</p>
        <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
          {RIFT_ZONES.map((z) => {
            const reached = finalProgress >= z.minProgress;
            const isCurrent = reachedZone.id === z.id;
            return (
              <div
                key={z.id}
                className={`rounded-lg px-2 py-2 text-center border transition-colors ${
                  isCurrent
                    ? 'bg-[#17233a] border-[#c8aa6e]/70'
                    : reached
                    ? 'bg-[#11192b] border-[#785a28]/35'
                    : 'bg-[#0a0f1a]/60 border-white/5 opacity-45'
                }`}
              >
                <div
                  className="mx-auto mb-1.5 h-1.5 w-6 rounded-full"
                  style={{ backgroundColor: reached ? z.accentColor : '#334155' }}
                />
                <p className="text-[11px] font-medium text-[#e5dcc9] truncate">{z.name}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7 Answers Breakdown */}
      <div className="rounded-xl border border-[#785a28]/35 bg-[#0c1322]/90 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#785a28]/25">
          <h3 className="font-display text-base font-bold text-[#f0e6d2]">Run Breakdown</h3>
        </div>
        <ul className="divide-y divide-[#785a28]/20">
          {results.map((r, idx) => {
            const def = RANKS[r.rank];
            return (
              <li
                key={`${r.questionId}-${idx}`}
                className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 hover:bg-[#131d32]/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-md border border-[#785a28]/40 overflow-hidden shrink-0 bg-[#090d16]">
                    {r.answered && r.imageUrl ? (
                      <RiftImage
                        src={r.imageUrl}
                        fallbackSrc={r.fallbackImageUrl}
                        alt={r.answerDisplay}
                        className="w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-[#7a7672]">
                        —
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[#a09b8c] truncate">{r.prompt}</p>
                    <p className="text-sm sm:text-base font-semibold text-[#f0e6d2] truncate">
                      {r.answered ? r.answerDisplay : 'No answer in time'}
                      {r.answerSubtitle && r.answered ? (
                        <span className="ml-2 text-xs font-normal text-[#a09b8c]">
                          {r.answerSubtitle}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono tabular-nums text-xs text-[#fcd34d] hidden sm:inline">
                    +{(r.points ?? 0).toLocaleString()}
                  </span>
                  <span
                    className="hidden sm:inline text-xs font-display font-bold tracking-wide"
                    style={{ color: def.color }}
                  >
                    {def.name}
                  </span>
                  <RankCrest rank={r.rank} size={36} />
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Live Scoreboard Showcase */}
      <ScoreboardPanel user={user} compact />
    </motion.div>
  );
};
