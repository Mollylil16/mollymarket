/**
 * @file src/utils/offlineQueue.ts
 * Gestionnaire de file d'attente hors-ligne (Offline-First) basé sur IndexedDB
 * Permet aux caisses d'enregistrer des ventes localement même sans réseau
 */

export interface VenteHorsLigne {
  idLocal: string;
  dateCreation: string;
  client_id: number;
  client_nom?: string;
  vendeur_id: number;
  vendeur_nom?: string;
  caisse_id: number;
  mode_paiement: string;
  lignes: Array<{
    produit_id: number;
    nom?: string;
    quantite: number;
    prix_unitaire: number;
  }>;
  montant_total: number;
  tentatives: number;
  statutSynchro: 'en_attente' | 'erreur' | 'synchronise';
  erreurDerniereSynchro?: string;
}

const DB_NAME = 'mollymarket_pos_offline';
const DB_VERSION = 1;
const STORE_NAME = 'pending_sales';

function ouvrirDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB non supporté par ce navigateur'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'idLocal' });
        store.createIndex('statutSynchro', 'statutSynchro', { unique: false });
        store.createIndex('dateCreation', 'dateCreation', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Enregistre une vente localement dans IndexedDB en attendant la synchronisation
 */
export async function enregistrerVenteHorsLigne(vente: Omit<VenteHorsLigne, 'idLocal' | 'dateCreation' | 'tentatives' | 'statutSynchro'>): Promise<VenteHorsLigne> {
  const db = await ouvrirDB();
  const idLocal = `OFFLINE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  const venteComplete: VenteHorsLigne = {
    ...vente,
    idLocal,
    dateCreation: new Date().toISOString(),
    tentatives: 0,
    statutSynchro: 'en_attente'
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(venteComplete);

    req.onsuccess = () => resolve(venteComplete);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Récupère toutes les ventes en attente de synchronisation
 */
export async function getVentesEnAttente(): Promise<VenteHorsLigne[]> {
  try {
    const db = await ouvrirDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const results = (req.result as VenteHorsLigne[]) || [];
        resolve(results.filter(v => v.statutSynchro !== 'synchronise'));
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erreur accès IndexedDB:', err);
    return [];
  }
}

/**
 * Supprime une vente synchronisée avec succès
 */
export async function marquerVenteSynchronisee(idLocal: string): Promise<void> {
  const db = await ouvrirDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(idLocal);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Synchronise l'ensemble des ventes hors-ligne vers le backend
 */
export async function synchroniserVentesHorsLigne(apiPostVente: (data: any) => Promise<any>): Promise<{ synchronisees: number; echecs: number }> {
  const enAttente = await getVentesEnAttente();
  if (enAttente.length === 0) return { synchronisees: 0, echecs: 0 };

  let synchronisees = 0;
  let echecs = 0;

  for (const v of enAttente) {
    try {
      await apiPostVente({
        client_id: v.client_id,
        vendeur_id: v.vendeur_id,
        mode_paiement: v.mode_paiement,
        caisse_id: v.caisse_id || 1,
        lignes: v.lignes.map(l => ({
          produit_id: l.produit_id,
          quantite: l.quantite,
          prix_unitaire: l.prix_unitaire
        }))
      });
      await marquerVenteSynchronisee(v.idLocal);
      synchronisees++;
    } catch (err: any) {
      console.error(`Échec synchronisation vente ${v.idLocal}:`, err);
      echecs++;
    }
  }

  return { synchronisees, echecs };
}
