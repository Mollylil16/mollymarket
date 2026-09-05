import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '../types';

interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string, title?: string, duree?: number) => void;
  removeToast: (id: string) => void;
  toastSuccess: (message: string, title?: string) => void;
  toastError: (message: string, title?: string) => void;
  toastWarning: (message: string, title?: string) => void;
  toastInfo: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((type: ToastMessage['type'], message: string, title?: string, duree: number = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, message, title, duree };

    setToasts((prev) => [...prev, newToast]);

    if (duree > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duree);
    }
  }, [removeToast]);

  const toastSuccess = useCallback((message: string, title?: string) => {
    addToast('success', message, title || 'Succès');
  }, [addToast]);

  const toastError = useCallback((message: string, title?: string) => {
    addToast('error', message, title || 'Erreur');
  }, [addToast]);

  const toastWarning = useCallback((message: string, title?: string) => {
    addToast('warning', message, title || 'Attention');
  }, [addToast]);

  const toastInfo = useCallback((message: string, title?: string) => {
    addToast('info', message, title || 'Information');
  }, [addToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        toastSuccess,
        toastError,
        toastWarning,
        toastInfo
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
