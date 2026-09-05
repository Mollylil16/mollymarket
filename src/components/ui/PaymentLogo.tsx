import React from 'react';
import { ModePaiement } from '../../types';
import { Banknote, CreditCard, Smartphone, FileText } from 'lucide-react';

interface PaymentLogoProps {
  mode: ModePaiement | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const PaymentLogo: React.FC<PaymentLogoProps> = ({
  mode,
  size = 'md',
  showLabel = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-7 h-7'
  };

  const imgSizeClasses = {
    sm: 'w-4 h-4 object-contain rounded-xs',
    md: 'w-5 h-5 object-contain rounded-xs',
    lg: 'w-7 h-7 object-contain rounded-sm'
  };

  const renderIcon = () => {
    switch (mode) {
      case 'wave':
        return (
          <img
            src="/images/wave_logo.png"
            alt="Wave"
            className={`${imgSizeClasses[size]} shrink-0`}
          />
        );
      case 'orange_money':
        return (
          <img
            src="/images/orange.png"
            alt="Orange Money"
            className={`${imgSizeClasses[size]} shrink-0`}
          />
        );
      case 'mtn_money':
        return (
          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 font-black text-[9px] flex items-center justify-center shrink-0">
            MTN
          </span>
        );
      case 'moov_money':
        return (
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[9px] flex items-center justify-center shrink-0">
            Moov
          </span>
        );
      case 'especes':
        return <Banknote className={`${sizeClasses[size]} text-emerald-600 shrink-0`} />;
      case 'carte_bancaire':
        return <CreditCard className={`${sizeClasses[size]} text-blue-600 shrink-0`} />;
      case 'cheque':
        return <FileText className={`${sizeClasses[size]} text-slate-600 shrink-0`} />;
      default:
        return <Smartphone className={`${sizeClasses[size]} text-slate-500 shrink-0`} />;
    }
  };

  const getLabel = () => {
    switch (mode) {
      case 'wave':
        return 'Wave';
      case 'orange_money':
        return 'Orange Money';
      case 'mtn_money':
        return 'MTN MoMo';
      case 'moov_money':
        return 'Moov Money';
      case 'especes':
        return 'Espèces (Cash)';
      case 'carte_bancaire':
        return 'Carte Bancaire';
      case 'cheque':
        return 'Chèque';
      default:
        return mode;
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      {renderIcon()}
      {showLabel && <span className="font-medium">{getLabel()}</span>}
    </div>
  );
};
