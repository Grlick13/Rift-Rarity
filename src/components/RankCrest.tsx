import React from 'react';
import type { RankId } from '../types/game';
import { RANKS } from '../data/ranks';

interface RankCrestProps {
  rank: RankId;
  size?: number;
  className?: string;
}

export const RankCrest: React.FC<RankCrestProps> = ({ rank, size = 48, className = '' }) => {
  const def = RANKS[rank];
  const uid = `crest-${rank}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label={`${def.name} rank crest`}
      role="img"
    >
      <defs>
        <linearGradient id={`${uid}-metal`} x1="12" y1="6" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={def.color} />
          <stop offset="55%" stopColor={def.secondaryColor} />
          <stop offset="100%" stopColor={def.color} />
        </linearGradient>
        <linearGradient id={`${uid}-core`} x1="32" y1="14" x2="32" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="35%" stopColor={def.color} />
          <stop offset="100%" stopColor={def.secondaryColor} />
        </linearGradient>
      </defs>

      {/* Outer aura wings for higher tiers */}
      {def.tierIndex >= 6 && (
        <path
          d="M8 22L18 14L22 26L12 34L8 22ZM56 22L46 14L42 26L52 34L56 22Z"
          fill={def.color}
          fillOpacity="0.32"
          stroke={def.color}
          strokeWidth="1.2"
        />
      )}

      {/* Crown spikes for Master+ */}
      {def.tierIndex >= 7 && (
        <path
          d="M19 15L24 6L32 13L40 6L45 15"
          stroke={def.color}
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill={def.secondaryColor}
          fillOpacity="0.65"
        />
      )}

      {/* Celestial halo horns for Grandmaster & Challenger */}
      {def.tierIndex >= 8 && (
        <path
          d="M10 16C14 8 22 4 32 4C42 4 50 8 54 16"
          stroke={def.tierIndex === 9 ? '#fcd34d' : def.color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={def.tierIndex === 9 ? 'none' : '4 3'}
        />
      )}

      {/* Main shield silhouette */}
      {rank === 'iron' && (
        <>
          <path
            d="M16 14L32 10L48 14L46 39L32 54L18 39L16 14Z"
            fill="#2b2927"
            stroke="#7a7672"
            strokeWidth="2.2"
          />
          {/* Cracked line for Iron */}
          <path d="M26 14L31 27L25 35L32 49" stroke="#151413" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="32" cy="30" r="5" fill="#484440" stroke="#7a7672" strokeWidth="1.4" />
        </>
      )}

      {rank === 'bronze' && (
        <>
          <path
            d="M15 14L32 9L49 14L46 40L32 55L18 40L15 14Z"
            fill={`url(#${uid}-metal)`}
            stroke="#e4a272"
            strokeWidth="2"
          />
          <path d="M23 21H41L38 38L32 45L26 38L23 21Z" fill="#3a200f" stroke="#b87342" strokeWidth="1.5" />
          <path d="M32 24V40" stroke="#e4a272" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {rank === 'silver' && (
        <>
          <path
            d="M14 15L32 8L50 15L47 40L32 56L17 40L14 15Z"
            fill={`url(#${uid}-metal)`}
            stroke="#dbe5f0"
            strokeWidth="2"
          />
          <path d="M22 22L32 16L42 22L39 38L32 46L25 38L22 22Z" fill="#1e293b" stroke="#9aa8b8" strokeWidth="1.5" />
          <path d="M25 28L32 22L39 28L32 38L25 28Z" fill={`url(#${uid}-core)`} />
        </>
      )}

      {rank === 'gold' && (
        <>
          <path
            d="M13 15L32 7L51 15L47 41L32 57L17 41L13 15Z"
            fill={`url(#${uid}-metal)`}
            stroke="#fde68a"
            strokeWidth="2.2"
          />
          <path d="M18 19L32 13L46 19L42 39L32 49L22 39L18 19Z" fill="#2a1f08" stroke="#e0b44c" strokeWidth="1.5" />
          <polygon points="32,19 39,30 32,42 25,30" fill={`url(#${uid}-core)`} />
          <path d="M12 24L20 28M52 24L44 28" stroke="#fde68a" strokeWidth="2" strokeLinecap="round" />
        </>
      )}

      {rank === 'platinum' && (
        <>
          <path
            d="M12 16L32 7L52 16L48 41L32 57L16 41L12 16Z"
            fill={`url(#${uid}-metal)`}
            stroke="#99f6e4"
            strokeWidth="2.2"
          />
          <polygon points="32,15 44,29 32,47 20,29" fill="#0d2629" stroke="#5eead4" strokeWidth="1.6" />
          <polygon points="32,20 39,29 32,41 25,29" fill={`url(#${uid}-core)`} />
          <path d="M14 16L22 26M50 16L42 26" stroke="#99f6e4" strokeWidth="1.6" />
        </>
      )}

      {rank === 'emerald' && (
        <>
          <path
            d="M13 15L32 7L51 15L48 40L32 57L16 40L13 15Z"
            fill={`url(#${uid}-metal)`}
            stroke="#86efac"
            strokeWidth="2.2"
          />
          <polygon points="32,14 45,25 41,42 32,49 23,42 19,25" fill="#082418" stroke="#4ade80" strokeWidth="1.6" />
          <polygon points="32,19 40,28 32,43 24,28" fill={`url(#${uid}-core)`} />
          <path d="M24 28H40" stroke="#dcfce7" strokeWidth="1.2" strokeOpacity="0.7" />
        </>
      )}

      {rank === 'diamond' && (
        <>
          <path
            d="M13 17L32 8L51 17L47 42L32 57L17 42L13 17Z"
            fill={`url(#${uid}-metal)`}
            stroke="#bfdbfe"
            strokeWidth="2.2"
          />
          <polygon points="32,14 46,27 32,48 18,27" fill="#0f1f44" stroke="#93c5fd" strokeWidth="1.8" />
          <polygon points="32,18 41,27 32,43 23,27" fill={`url(#${uid}-core)`} />
          <path d="M23 27H41M32 18V43" stroke="#eff6ff" strokeWidth="1.2" strokeOpacity="0.85" />
        </>
      )}

      {rank === 'master' && (
        <>
          <path
            d="M13 17L32 9L51 17L47 42L32 57L17 42L13 17Z"
            fill={`url(#${uid}-metal)`}
            stroke="#e9d5ff"
            strokeWidth="2.2"
          />
          <polygon points="32,15 44,28 32,47 20,28" fill="#230c3d" stroke="#d8b4fe" strokeWidth="1.8" />
          <polygon points="32,20 39,28 32,41 25,28" fill={`url(#${uid}-core)`} />
          <circle cx="32" cy="28" r="3" fill="#faf5ff" />
        </>
      )}

      {rank === 'grandmaster' && (
        <>
          <path
            d="M12 17L32 9L52 17L48 42L32 58L16 42L12 17Z"
            fill={`url(#${uid}-metal)`}
            stroke="#fecdd3"
            strokeWidth="2.4"
          />
          <polygon points="32,14 45,28 32,48 19,28" fill="#320915" stroke="#fb7185" strokeWidth="1.8" />
          <polygon points="32,19 40,28 32,42 24,28" fill={`url(#${uid}-core)`} />
          <path d="M26 22L32 28L38 22" stroke="#ffe4e6" strokeWidth="1.6" strokeLinecap="round" />
        </>
      )}

      {rank === 'challenger' && (
        <>
          <path
            d="M12 17L32 8L52 17L48 42L32 59L16 42L12 17Z"
            fill={`url(#${uid}-metal)`}
            stroke="#fef08a"
            strokeWidth="2.6"
          />
          <polygon points="32,14 46,28 32,50 18,28" fill="#091d36" stroke="#38bdf8" strokeWidth="1.8" />
          <polygon points="32,19 41,28 32,44 23,28" fill={`url(#${uid}-core)`} />
          <path d="M32 19V44M23 28H41" stroke="#fef9c3" strokeWidth="1.5" />
          <circle cx="32" cy="28" r="3.4" fill="#ffffff" />
        </>
      )}
    </svg>
  );
};
