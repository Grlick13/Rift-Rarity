import React from 'react';

export const HextechCrestIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
    <path
      d="M16 2L27 9V23L16 30L5 23V9L16 2Z"
      stroke="#c8aa6e"
      strokeWidth="1.8"
      fill="#0d1729"
    />
    <path
      d="M16 6L23 11V21L16 26L9 21V11L16 6Z"
      stroke="#0ac8b9"
      strokeWidth="1.3"
      fill="#0ac8b9"
      fillOpacity="0.16"
    />
    <path d="M16 9L20 16L16 23L12 16L16 9Z" fill="#fcd34d" />
  </svg>
);

export const NexusDiamondIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M12 2L20 12L12 22L4 12L12 2Z"
      stroke="currentColor"
      strokeWidth="1.8"
      fill="currentColor"
      fillOpacity="0.2"
    />
    <path d="M12 6.5L16 12L12 17.5L8 12L12 6.5Z" fill="currentColor" />
  </svg>
);

export const SummonerSwordIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
    <path
      d="M19 3L14 4L6.5 11.5L9.5 14.5L17 7L19 3Z"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.18"
    />
    <path
      d="M5 13L11 19M4 20L7.5 16.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const RuneterraDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#785a28]/60 to-[#c8aa6e]/70" />
    <svg viewBox="0 0 20 20" className="w-4 h-4 text-[#c8aa6e]" fill="none">
      <path d="M10 2L17 10L10 18L3 10L10 2Z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="2.2" fill="#0ac8b9" />
    </svg>
    <div className="h-px flex-1 bg-gradient-to-l from-transparent via-[#785a28]/60 to-[#c8aa6e]/70" />
  </div>
);
