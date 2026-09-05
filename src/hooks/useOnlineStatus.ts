/**
 * @file src/hooks/useOnlineStatus.ts
 * Hook React pour surveiller l'état de la connexion réseau et la joignabilité du serveur
 */
import { useState, useEffect, useCallback } from 'react';
import { getVentesEnAttente, synchroniserVentesHorsLigne } from '../utils/offlineQueue';

export function useOnlineStatus(onSynchroSuccess?: (nb: number) => void) {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [nbEnAttente, setNbEnAttente] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const verifierEnAttente = useCallback(async () => {
    try {
      const ventes = await getVentesEnAttente();
      setNbEnAttente(ventes.length);
    } catch {
      setNbEnAttente(0);
    }
  }, []);

  const lancerSynchro = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      // Tester ping serveur
      const pingRes = await fetch('http://localhost:3001/api/ping', { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (!pingRes.ok) {
        setIsOnline(false);
        setIsSyncing(false);
        return;
      }
      setIsOnline(true);

      const res = await synchroniserVentesHorsLigne(async (data) => {
        const token = localStorage.getItem('molly_token');
        const r = await fetch('http://localhost:3001/api/ventes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(data)
        });
        if (!r.ok) throw new Error('Erreur API');
        return r.json();
      });

      await verifierEnAttente();
      if (res.synchronisees > 0 && onSynchroSuccess) {
        onSynchroSuccess(res.synchronisees);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onSynchroSuccess, verifierEnAttente]);

  useEffect(() => {
    verifierEnAttente();

    const handleOnline = () => {
      setIsOnline(true);
      lancerSynchro();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Intervalle régulier de vérification et synchro si ventes en attente
    const interval = setInterval(() => {
      verifierEnAttente();
      if (navigator.onLine) {
        lancerSynchro();
      }
    }, 15000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [lancerSynchro, verifierEnAttente]);

  return {
    isOnline,
    nbEnAttente,
    isSyncing,
    lancerSynchro,
    rafraichirCompteur: verifierEnAttente
  };
}
