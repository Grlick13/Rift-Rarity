import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Flame } from 'lucide-react';
import type { RoundResult } from '../types/game';
import { RANKS, getZoneForProgress } from '../data/ranks';
import { RankCrest } from './RankCrest';
import { RiftImage } from './RiftImage';

interface RevealCardProps {
  result: RoundResult;
  roundIndex: number;
  totalRounds: number;
  diamondStreak: number;
  reducedMotion: boolean;
  onNext: () => void;
}

export const RevealCard: React.FC<RevealCardProps> = ({
  result,
  roundIndex,
  totalRounds,
  diamondStreak,
  reducedMotion,
  onNext,
}) => {
  const rankDef = RANKS[result.rank];
  const zone = getZoneForProgress(result.distanceAfter);
  const isSplash =
    result.imageKind === 'champion_splash' ||
    result.imageKind === 'skin_splash' ||
    result.imageKind === 'region_crest';
  const isEpic = rankDef.tierIndex >= 8;
  const isHigh = rankDef.tierIndex >= 6;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNext]);

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 14, scale: 0.98 }}
      animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reducedMotion ? 0.15 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-xl border bg-[#0c1322]/95 shadow-2xl"
      style={{
        borderColor: isHigh ? rankDef.color : 'rgba(120, 90, 40, 0.5)',
        boxShadow: isEpic ? `0 0 42px -8px ${rankDef.glowColor}` : undefined,
      }}
    >
      {/* Visual Artwork Banner or Icon Showcase */}
      {result.answered && result.imageUrl ? (
        isSplash ? (
          <div className="relative h-44 sm:h-56 w-full overflow-hidden">
            <RiftImage
              src={result.imageUrl}
              fallbackSrc={result.fallbackImageUrl}
              alt={result.answerDisplay}
              className="w-full h-full"
              imgClassName="w-full h-full object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c1322] via-[#0c1322]/45 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#c8aa6e] tracking-wide">
                  {result.answerSubtitle || 'Confirmed Answer'}
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#f0e6d2] truncate">
                  {result.answerDisplay}
                </h3>
              </div>
              <span className="font-mono tabular-nums text-sm font-bold text-[#fcd34d] shrink-0">
                +{result.points.toLocaleString()} pts
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-2">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-lg border-2 overflow-hidden shadow-lg"
                style={{ borderColor: rankDef.color }}
              >
                <RiftImage
                  src={result.imageUrl}
                  fallbackSrc={result.fallbackImageUrl}
                  alt={result.answerDisplay}
                  className="w-full h-full"
                />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-[#c8aa6e] tracking-wide">
                  {result.answerSubtitle || 'Confirmed Answer'}
                </p>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#f0e6d2] truncate">
                  {result.answerDisplay}
                </h3>
              </div>
            </div>
            <span className="font-mono tabular-nums text-sm font-bold text-[#fcd34d] shrink-0">
              +{result.points.toLocaleString()} pts
            </span>
          </div>
        )
      ) : (
        <div className="px-5 pt-5 pb-1 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#a09b8c]">Time Expired</p>
            <h3 className="font-display text-xl font-bold text-[#c8c2b6]">No Answer Locked In</h3>
          </div>
          <span className="font-mono tabular-nums text-sm font-bold text-[#7a7672]">+0 pts</span>
        </div>
      )}

      {/* Rank Crest & Announcer Section */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#785a28]/25">
        <div className="flex items-center gap-4">
          <motion.div
            initial={
              reducedMotion
                ? { opacity: 0 }
                : isEpic
                ? { scale: 0.45, rotate: -10, opacity: 0 }
                : { scale: 0.72, opacity: 0 }
            }
            animate={reducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0.15 }
                : { type: 'spring', stiffness: isEpic ? 280 : 240, damping: 16 }
            }
            className="shrink-0"
            style={{
              filter: isHigh ? `drop-shadow(0 0 14px ${rankDef.glowColor})` : undefined,
            }}
          >
            <RankCrest rank={result.rank} size={64} />
          </motion.div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span
                className="font-display text-lg sm:text-xl font-bold tracking-wide"
                style={{ color: rankDef.color }}
              >
                {rankDef.name}
              </span>
              <span className="text-[#785a28]" aria-hidden="true">
                ·
              </span>
              <span className="text-xs font-medium text-[#a09b8c]">
                Now at <span className="text-[#f0e6d2]">{zone.name}</span>
              </span>
              {diamondStreak >= 2 && (
                <>
                  <span className="text-[#785a28]" aria-hidden="true">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#fb923c]">
                    <Flame className="w-3.5 h-3.5 animate-flame" />
                    Hot Streak ×{diamondStreak}
                  </span>
                </>
              )}
            </div>
            <p className="mt-1 text-sm text-[#d6cebd] leading-snug">{result.announcerLine}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#c8aa6e] hover:bg-[#d8bc82] text-[#090d16] font-semibold text-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c8aa6e] cursor-pointer"
        >
          <span>{roundIndex + 1 >= totalRounds ? 'Finish Journey' : 'Next Question'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
