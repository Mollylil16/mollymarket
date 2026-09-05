import React from 'react';

export type BadgeTone = 'green' | 'orange' | 'red' | 'neutral' | 'blue';

interface StatusBadgeProps {
  label: string;
  tone?: BadgeTone;
  variant?: 'stock' | 'paiement' | 'actif' | 'achat' | 'vente' | 'custom';
  statusKey?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone,
  variant,
  statusKey,
  className = '',
  icon
}) => {
  // Détermination automatique du ton si non fourni
  let resolvedTone: BadgeTone = tone || 'neutral';

  if (!tone && (variant || statusKey)) {
    const key = (statusKey || label).toLowerCase();

    if (
      key.includes('en_stock') ||
      key.includes('en stock') ||
      key.includes('paye') ||
      key.includes('payé') ||
      key.includes('recu') ||
      key.includes('reçu') ||
      key.includes('terminee') ||
      key.includes('terminée') ||
      key.includes('actif') ||
      key.includes('succès')
    ) {
      resolvedTone = 'green';
    } else if (
      key.includes('faible') ||
      key.includes('partiel') ||
      key.includes('attente') ||
      key.includes('alerte')
    ) {
      resolvedTone = 'orange';
    } else if (
      key.includes('rupture') ||
      key.includes('impaye') ||
      key.includes('impayé') ||
      key.includes('annule') ||
      key.includes('annulée') ||
      key.includes('inactif') ||
      key.includes('erreur')
    ) {
      resolvedTone = 'red';
    }
  }

  const toneClasses: Record<BadgeTone, string> = {
    green: 'bg-emerald-50 text-[#2E7D32] border border-emerald-200/80',
    orange: 'bg-amber-50 text-[#B25E00] border border-amber-200/80',
    red: 'bg-rose-50 text-[#C62828] border border-rose-200/80',
    blue: 'bg-sky-50 text-sky-700 border border-sky-200/80',
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200'
  };

  const dotClasses: Record<BadgeTone, string> = {
    green: 'bg-[#2E7D32]',
    orange: 'bg-[#FB8C00]',
    red: 'bg-[#E53935]',
    blue: 'bg-sky-500',
    neutral: 'bg-neutral-400'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shadow-xs ${toneClasses[resolvedTone]} ${className}`}
    >
      {icon ? (
        icon
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${dotClasses[resolvedTone]}`} />
      )}
      {label}
    </span>
  );
};
