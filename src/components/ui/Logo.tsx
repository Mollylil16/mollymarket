import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '' }) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const titleSizes = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-black'
  };

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Icone SVG Chariot + Feuille de Fraîcheur + Badge MM */}
      <div
        className={`${iconSizes[size]} relative flex items-center justify-center rounded-xl bg-[#2E7D32] text-white shadow-sm flex-shrink-0 transition-transform hover:scale-105`}
        title="Molly Market - Gestion Supermarché"
      >
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Panier / Chariot de courses */}
          <path
            d="M6 8H9L12.5 21H27L30 11H12"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Roulettes */}
          <circle cx="14" cy="26" r="2.2" fill="#FB8C00" />
          <circle cx="25" cy="26" r="2.2" fill="#FB8C00" />
          {/* Feuille verte de fraîcheur émergeant du panier */}
          <path
            d="M18 15C18 10 24 8 26 7C26 11 23 15 18 15Z"
            fill="#66BB6A"
          />
          <path
            d="M18 15C20.5 12.5 23 11 25.5 8"
            stroke="#1B5E20"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Accent rouge pomme / fraîcheur */}
          <circle cx="17" cy="11" r="2" fill="#E53935" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-tight">
          <div className="flex items-center gap-1.5">
            <span className={`${titleSizes[size]} tracking-tight text-[#212121]`}>
              Molly<span className="text-[#2E7D32]">Market</span>
            </span>
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider text-neutral-500">
            Supermarché • Back-Office
          </span>
        </div>
      )}
    </div>
  );
};
