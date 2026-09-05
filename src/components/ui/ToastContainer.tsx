import React from 'react';
import { useToast } from '../../context/ToastContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-lg border backdrop-blur-md transition-all duration-200 transform translate-y-0 ${
              isSuccess
                ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950'
                : isError
                ? 'bg-rose-50/95 border-rose-300 text-rose-950'
                : isWarning
                ? 'bg-amber-50/95 border-amber-300 text-amber-950'
                : 'bg-sky-50/95 border-sky-300 text-sky-950'
            }`}
          >
            <div className="mt-0.5 flex-shrink-0">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-[#2E7D32]" />}
              {isError && <AlertCircle className="w-5 h-5 text-[#E53935]" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-[#FB8C00]" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-sky-600" />}
            </div>

            <div className="flex-1 min-w-0">
              {toast.title && (
                <h4 className="text-sm font-semibold tracking-tight">{toast.title}</h4>
              )}
              <p className="text-xs leading-relaxed opacity-90 mt-0.5">{toast.message}</p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md opacity-60 hover:opacity-100 hover:bg-black/5 transition-opacity"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
