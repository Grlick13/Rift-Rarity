import React, { useEffect, useState } from 'react';
import { Calendar, LogIn, Trophy } from 'lucide-react';
import type { User } from 'firebase/auth';
import type { GameMode, LeaderboardEntry } from '../types/game';
import { RANKS } from '../data/ranks';
import { getTodayUtcKey } from '../data/questions';
import { RankCrest } from './RankCrest';
import { NexusDiamondIcon, SummonerSwordIcon } from './LoLSymbols';
import { signInWithGoogle, subscribeLeaderboard } from '../services/firebase';
import { loadLocalLeaderboardEntries } from '../utils/storage';

interface ScoreboardPanelProps {
  user: User | null;
  compact?: boolean;
}

export const ScoreboardPanel: React.FC<ScoreboardPanelProps> = ({ user, compact = false }) => {
  const [tab, setTab] = useState<GameMode>('daily');
  const [remoteEntries, setRemoteEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = getTodayUtcKey();

  useEffect(() => {
    setLoading(true);
    setErrorMsg(null);
    const unsub = subscribeLeaderboard(
      tab,
      today,
      (entries) => {
        setRemoteEntries(entries);
        setLoading(false);
      },
      (err) => {
        setErrorMsg(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [tab, today]);

  // Merge remote verified entries with any local guest runs not yet synced
  const localEntries = loadLocalLeaderboardEntries().filter((e) =>
    tab === 'daily' ? e.mode === 'daily' && e.dateKey === today : e.mode === 'unlimited'
  );
  const remoteIds = new Set(remoteEntries.map((e) => e.id));
  const combined = [...remoteEntries, ...localEntries.filter((l) => !remoteIds.has(l.id))].sort(
    (a, b) => b.score - a.score
  );
  const displayed = compact ? combined.slice(0, 6) : combined.slice(0, 25);

  return (
    <section className="rounded-xl border border-[#785a28]/50 bg-[#0c1322]/95 overflow-hidden shadow-2xl">
      <div className="px-4 sm:px-5 py-3.5 border-b border-[#785a28]/30 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-[#111b30] via-[#0e1525] to-[#111b30]">
        <div className="flex items-center gap-2.5">
          <Trophy className="w-5 h-5 text-[#c8aa6e]" />
          <h3 className="font-display text-base sm:text-lg font-bold text-[#f0e6d2] tracking-wide">
            Summoner Scoreboard
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg bg-[#080c15] p-1 border border-[#785a28]/35">
            <button
              type="button"
              onClick={() => setTab('daily')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'daily'
                  ? 'bg-[#c8aa6e] text-[#090d16]'
                  : 'text-[#a09b8c] hover:text-[#f0e6d2]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Today&apos;s Daily</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('unlimited')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                tab === 'unlimited'
                  ? 'bg-[#0ac8b9] text-[#090d16]'
                  : 'text-[#a09b8c] hover:text-[#f0e6d2]'
              }`}
            >
              <SummonerSwordIcon className="w-3.5 h-3.5" />
              <span>Unlimited Top</span>
            </button>
          </div>
        </div>
      </div>

      {!user && (
        <div className="px-4 sm:px-5 py-2.5 border-b border-[#785a28]/20 bg-[#090e1a] flex flex-wrap items-center justify-between gap-2 text-xs text-[#b9b2a3]">
          <span>Sign in with Google to publish your scores to the global ladder.</span>
          <button
            type="button"
            onClick={() => void signInWithGoogle()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#c8aa6e]/50 bg-[#141e33] hover:bg-[#1c2a46] text-[#f0e6d2] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-[#c8aa6e]" />
            <span>Sign in with Google</span>
          </button>
        </div>
      )}

      {loading && displayed.length === 0 ? (
        <div className="py-10 text-center text-sm text-[#a09b8c]">Loading Rift standings...</div>
      ) : errorMsg && displayed.length === 0 ? (
        <div className="py-8 px-4 text-center text-xs text-[#f43f5e]">
          Unable to load remote scoreboard right now. Local runs still appear after you play.
        </div>
      ) : displayed.length === 0 ? (
        <div className="py-10 px-4 text-center space-y-1.5">
          <NexusDiamondIcon className="w-7 h-7 mx-auto text-[#c8aa6e]/60" />
          <p className="text-sm font-medium text-[#d6cebd]">
            No summoners on {tab === 'daily' ? "today's" : 'the Unlimited'} board yet.
          </p>
          <p className="text-xs text-[#8d887d]">Complete a run to claim Rank 1.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#785a28]/20 text-[11px] font-semibold text-[#8d887d]">
                <th className="py-2.5 pl-4 pr-2 w-12">#</th>
                <th className="py-2.5 px-2">Summoner</th>
                <th className="py-2.5 px-2 hidden sm:table-cell">Reached</th>
                <th className="py-2.5 px-2 text-center">Rank</th>
                <th className="py-2.5 pl-2 pr-4 text-right">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#785a28]/15 text-sm">
              {displayed.map((entry, idx) => {
                const rankDef = RANKS[entry.finalRank] ?? RANKS.iron;
                const isSelf = user && entry.uid === user.uid;
                return (
                  <tr
                    key={entry.id}
                    className={`transition-colors ${
                      isSelf ? 'bg-[#c8aa6e]/10' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-2.5 pl-4 pr-2 font-mono tabular-nums text-xs text-[#a09b8c]">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-[#f0e6d2] max-w-[160px] truncate">
                      {entry.summonerName}
                      {entry.id.startsWith('local_') && (
                        <span className="ml-2 text-[10px] font-normal text-[#8d887d]">(local)</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-[#a09b8c] hidden sm:table-cell">
                      {entry.reachedZone}
                    </td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <RankCrest rank={entry.finalRank} size={26} />
                        <span
                          className="hidden md:inline text-xs font-display font-bold"
                          style={{ color: rankDef.color }}
                        >
                          {rankDef.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-2 pr-4 text-right font-mono tabular-nums font-bold text-[#fcd34d]">
                      {entry.score.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
