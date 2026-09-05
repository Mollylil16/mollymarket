import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { PointDeCaisse, StatutPointCaisse } from '../types';
import { apiClient } from '../services/api';

export type StatutCycleCaisse =
  | 'fermee'
  | 'ouverte'
  | 'soumise_directeur'
  | 'validee_directeur'
  | 'rejetee_directeur';

export interface ComptageCaisseInput {
  especes: number;
  wave: number;
  orange_money: number;
  mtn_money: number;
  carte_bancaire: number;
  cheque: number;
}

export interface CaisseState {
  // État
  sessionActive: PointDeCaisse | null;
  statutSession: StatutCycleCaisse;
  isOuverte: boolean;
  isVerrouillee: boolean;
  fondDeCaisseInitial: number;
  historique: PointDeCaisse[];
  isLoading: boolean;
  error: string | null;

  // Actions du cycle de vie
  chargerEtatCaisse: (vendeurId?: number, vendeurNom?: string) => Promise<void>;
  ouvrirSession: (fondDeCaisse: number, vendeurId: number, vendeurNom: string) => Promise<PointDeCaisse>;
  fermerSessionManuellement: () => void;
  soumettreAuDirecteur: (params: {
    comptages: ComptageCaisseInput;
    observations?: string;
    vendeurNom: string;
  }) => Promise<PointDeCaisse>;
  validerParDirecteur: (directeurNom: string) => Promise<PointDeCaisse>;
  rejeterParDirecteur: (motif: string, directeurNom: string) => Promise<PointDeCaisse>;
  deverrouillerUrgence: () => Promise<void>;
}

export const useCaisseStore = create<CaisseState>()(
  persist(
    (set, get) => ({
      sessionActive: null,
      statutSession: 'fermee',
      isOuverte: false,
      isVerrouillee: false,
      fondDeCaisseInitial: 50000,
      historique: [],
      isLoading: false,
      error: null,

      // Initialisation et chargement de la session active depuis l'API / backend
      chargerEtatCaisse: async (vendeurId = 3, vendeurNom = 'Noam Koffi') => {
        set({ isLoading: true, error: null });
        try {
          const [session, points, verrouillee] = await Promise.all([
            apiClient.getPointCaisseSessionActive(vendeurId, vendeurNom),
            apiClient.getPointsCaisse(),
            apiClient.getCaisseVerrouillee()
          ]);

          const isLocked = verrouillee || session.statut === 'soumise_directeur' || session.statut === 'validee_directeur' || session.statut === 'soumise_verrouillee';
          const isSessionOpen = !isLocked && session.statut === 'ouverte';

          set({
            sessionActive: session,
            historique: points,
            isVerrouillee: isLocked,
            isOuverte: isSessionOpen,
            statutSession: (session.statut as StatutCycleCaisse) || (isSessionOpen ? 'ouverte' : 'fermee'),
            fondDeCaisseInitial: session.fond_caisse_initial || 50000,
            isLoading: false
          });
        } catch (err: any) {
          set({
            error: err.message || 'Impossible de synchroniser la session de caisse',
            isLoading: false
          });
        }
      },

      // 1. Ouverture d'une session de caisse
      ouvrirSession: async (fondDeCaisse: number, vendeurId: number, vendeurNom: string) => {
        set({ isLoading: true, error: null });
        try {
          const nouvelleSession = await apiClient.ouvrirNouvelleSession(fondDeCaisse, vendeurId, vendeurNom);
          const points = await apiClient.getPointsCaisse();

          set({
            sessionActive: nouvelleSession,
            statutSession: 'ouverte',
            isOuverte: true,
            isVerrouillee: false,
            fondDeCaisseInitial: fondDeCaisse,
            historique: points,
            isLoading: false
          });

          return nouvelleSession;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      // Clôture manuelle sans soumission
      fermerSessionManuellement: () => {
        set({
          isOuverte: false,
          isVerrouillee: true,
          statutSession: 'fermee'
        });
      },

      // 2. Soumission au Directeur avec VERROUILLAGE AUTOMATIQUE immédiat
      soumettreAuDirecteur: async ({ comptages, observations = '', vendeurNom }) => {
        const currentSession = get().sessionActive;
        if (!currentSession) {
          throw new Error('Aucune session active à soumettre');
        }

        set({ isLoading: true, error: null });
        try {
          // Appel API backend
          const sessionMiseAJour = await apiClient.soumettrePointCaisse({
            sessionId: currentSession.id,
            comptages,
            observations,
            vendeurNom
          });

          const points = await apiClient.getPointsCaisse();

          // Règle métier : Verrouillage automatique de la caisse à la soumission
          set({
            sessionActive: sessionMiseAJour,
            statutSession: 'soumise_directeur',
            isOuverte: false,
            isVerrouillee: true, // Verrouillage automatique strict
            historique: points,
            isLoading: false
          });

          return sessionMiseAJour;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      // 3. Validation par le Directeur (archivage et confirmation)
      validerParDirecteur: async (directeurNom: string) => {
        const currentSession = get().sessionActive;
        if (!currentSession) {
          throw new Error('Aucune session active à valider');
        }

        set({ isLoading: true, error: null });
        try {
          const sessionValidee = await apiClient.validerPointCaisse(currentSession.id, directeurNom);
          const points = await apiClient.getPointsCaisse();

          set({
            sessionActive: sessionValidee,
            statutSession: 'validee_directeur',
            isOuverte: false,
            isVerrouillee: true,
            historique: points,
            isLoading: false
          });

          return sessionValidee;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      // 4. Rejet par le Directeur (déverrouille la caisse pour correction par le vendeur)
      rejeterParDirecteur: async (motif: string, directeurNom: string) => {
        const currentSession = get().sessionActive;
        if (!currentSession) {
          throw new Error('Aucune session active à rejeter');
        }

        set({ isLoading: true, error: null });
        try {
          const sessionRejetee = await apiClient.rejeterPointCaisse(currentSession.id, motif, directeurNom);
          const points = await apiClient.getPointsCaisse();

          // En cas de rejet, la caisse est ré-ouverte et déverrouillée pour correction
          set({
            sessionActive: sessionRejetee,
            statutSession: 'rejetee_directeur',
            isOuverte: true,
            isVerrouillee: false,
            historique: points,
            isLoading: false
          });

          return sessionRejetee;
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      },

      // Déverrouillage d'urgence manuel par l'administrateur
      deverrouillerUrgence: async () => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.deverrouillerCaisseManuellement();
          const current = get().sessionActive;
          const points = await apiClient.getPointsCaisse();

          set({
            isVerrouillee: false,
            isOuverte: current ? current.statut === 'ouverte' || current.statut === 'rejetee_directeur' : false,
            historique: points,
            isLoading: false
          });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
          throw err;
        }
      }
    }),
    {
      name: 'molly_market_caisse_zustand_store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        statutSession: state.statutSession,
        isOuverte: state.isOuverte,
        isVerrouillee: state.isVerrouillee,
        fondDeCaisseInitial: state.fondDeCaisseInitial
      })
    }
  )
);
