import React from 'react';
import { X } from 'lucide-react';
import { RANK_ORDER, RANKS } from '../data/ranks';
import { RankCrest } from './RankCrest';

interface HowToPlayModalProps {
  open: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="how-to-play-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-[#785a28]/60 bg-[#0d1424] p-5 sm:p-6 shadow-2xl max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#785a28]/25">
          <h2 id="how-to-play-title" className="font-display text-xl font-bold text-[#f0e6d2]">
            How to Play Rift Rarity
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#a09b8c] hover:text-[#f0e6d2] hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close rules"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5 text-sm text-[#d6cebd] leading-relaxed">
          <p>
            Answer <strong className="text-[#f0e6d2]">7 League of Legends trivia prompts</strong> with
            25 seconds on the clock for each round.
          </p>
          <p>
            <strong className="text-[#c8aa6e]">Obscurity is power:</strong> Any valid answer counts,
            but obvious picks earn <span className="text-[#b87342]">Bronze</span> or{' '}
            <span className="text-[#9aa8b8]">Silver</span>, while forgotten deep cuts soar to{' '}
            <span className="text-[#c084fc]">Master</span>,{' '}
            <span className="text-[#f43f5e]">Grandmaster</span>, and{' '}
            <span className="text-[#fcd34d]">Challenger</span>.
          </p>
          <p>
            Higher ranks propel your lantern much further across Summoner&apos;s Rift — from the{' '}
            <strong className="text-[#f0e6d2]">Blue Fountain</strong> through the Jungle, River,
            Dragon Pit, and Baron Pit. Only a near-perfect run reaches the{' '}
            <strong className="text-[#fcd34d]">Enemy Nexus</strong>.
          </p>
          <p className="text-[#a09b8c] text-xs">
            Forgiving typing: apostrophes, hyphens, and spaces are optional. Common nicknames like{' '}
            MF, TF, J4, Asol, IE, BoRK, and Zhonya&apos;s are accepted, and mistyped answers can be
            retried until the timer hits zero.
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-[#785a28]/25">
          <p className="text-xs font-medium text-[#a09b8c] mb-3">Rarity Ladder</p>
          <div className="grid grid-cols-5 gap-2">
            {RANK_ORDER.map((r) => (
              <div key={r} className="flex flex-col items-center gap-1 py-1.5 rounded-lg bg-[#090d16]/70">
                <RankCrest rank={r} size={30} />
                <span className="text-[11px] font-medium" style={{ color: RANKS[r].color }}>
                  {RANKS[r].name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
