/**
 * @file api.ts
 * @description Couche d'appel API centralisée pour l'application Molly Market.
 * 
 * Chaque fonction appelle le serveur Express qui délègue à PostgreSQL.
 * AUCUNE logique métier dans le frontend.
 */

import {
  User,
  Client,
  Employe,
  Fournisseur,
  Categorie,
  Produit,
  Achat,
  Vente,
  Paiement,
  MouvementStock,
  VueStatistiques,
  ChiffreAffaires,
  TopClient,
  TopProduit,
  LigneVente,
  LigneAchat,
  ModePaiement,
  PointDeCaisse,
  MouvementCaisse,
  TypeMouvementCaisse,
  SensMouvementCaisse
} from '../types';

// Helper pour les appels API avec support JWT
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('molly_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const res = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string> || {})
    }
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Erreur serveur (${res.status})`);
  }
  return data as T;
}

// =========================================================================
// SERVICES API (connectés au backend PostgreSQL via Express)
// =========================================================================

export const apiClient = {
  // -------------------------------------------------------------
  // AUTHENTIFICATION & DIAGNOSTIC
  // -------------------------------------------------------------
  async ping(): Promise<{ status: string; timestamp: string }> {
    return apiFetch<{ status: string; timestamp: string }>('/api/ping');
  },

  async login(email: string, motDePasse: string): Promise<User> {
    const data = await apiFetch<any>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, mot_de_passe: motDePasse }),
    });
    if (data.token) {
      localStorage.setItem('molly_token', data.token);
    }
    const user = data.user || data;
    return user as User;
  },

  async logout(): Promise<{ success: boolean }> {
    localStorage.removeItem('molly_token');
    return { success: true };
  },

  // -------------------------------------------------------------
  // VUES STATISTIQUES & TABLEAUX DE BORD
  // -------------------------------------------------------------
  async getChiffreAffaires(): Promise<ChiffreAffaires> {
    return apiFetch<ChiffreAffaires>('/api/dashboard/ca');
  },

  async getVueTopClients(): Promise<TopClient[]> {
    return apiFetch<TopClient[]>('/api/dashboard/top-clients');
  },

  async getMeilleurClient(): Promise<TopClient> {
    return apiFetch<TopClient>('/api/fonctions/meilleur-client');
  },

  async getVueTopProduits(): Promise<TopProduit[]> {
    return apiFetch<TopProduit[]>('/api/dashboard/top-produits');
  },

  async getMeilleurProduit(): Promise<TopProduit> {
    return apiFetch<TopProduit>('/api/fonctions/meilleur-produit');
  },

  async getVueStatistiques(periode: 'jour' | 'mois' | 'annee' = 'mois'): Promise<VueStatistiques> {
    return apiFetch<VueStatistiques>(`/api/dashboard/statistiques?periode=${periode}`);
  },

  // -------------------------------------------------------------
  // CLIENTS
  // -------------------------------------------------------------
  async getVueClients(): Promise<Client[]> {
    return apiFetch<Client[]>('/api/clients');
  },

  async ajouterClient(payload: {
    nom: string; prenom: string; telephone: string; email: string; adresse: string;
  }): Promise<Client> {
    return apiFetch<Client>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async modifierClient(id: number, payload: Partial<Client>): Promise<Client> {
    return apiFetch<Client>(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async desactiverClient(id: number, actif: boolean): Promise<Client> {
    return apiFetch<Client>(`/api/clients/${id}/statut`, {
      method: 'PATCH',
      body: JSON.stringify({ actif }),
    });
  },

  // -------------------------------------------------------------
  // EMPLOYÉS
  // -------------------------------------------------------------
  async getVueEmployes(): Promise<Employe[]> {
    return apiFetch<Employe[]>('/api/employes');
  },

  async ajouterEmploye(payload: Omit<Employe, 'id' | 'matricule' | 'actif'>): Promise<Employe> {
    return apiFetch<Employe>('/api/employes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async modifierEmploye(id: number, payload: Partial<Employe>): Promise<Employe> {
    return apiFetch<Employe>(`/api/employes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // -------------------------------------------------------------
  // FOURNISSEURS
  // -------------------------------------------------------------
  async getVueFournisseurs(): Promise<Fournisseur[]> {
    return apiFetch<Fournisseur[]>('/api/fournisseurs');
  },

  async ajouterFournisseur(payload: Omit<Fournisseur, 'id' | 'code_fournisseur' | 'actif'>): Promise<Fournisseur> {
    return apiFetch<Fournisseur>('/api/fournisseurs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async modifierFournisseur(id: number, payload: Partial<Fournisseur>): Promise<Fournisseur> {
    return apiFetch<Fournisseur>(`/api/fournisseurs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // -------------------------------------------------------------
  // CATÉGORIES
  // -------------------------------------------------------------
  async getVueCategories(): Promise<Categorie[]> {
    return apiFetch<Categorie[]>('/api/categories');
  },

  async ajouterCategorie(payload: Omit<Categorie, 'id' | 'nombre_produits'>): Promise<Categorie> {
    return apiFetch<Categorie>('/api/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async modifierCategorie(id: number, payload: Partial<Categorie>): Promise<Categorie> {
    return apiFetch<Categorie>(`/api/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async supprimerCategorie(id: number): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>(`/api/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // -------------------------------------------------------------
  // PRODUITS & STOCK
  // -------------------------------------------------------------
  async getVueStock(): Promise<Produit[]> {
    return apiFetch<Produit[]>('/api/produits');
  },

  async getStockDisponible(produitId: number): Promise<number> {
    const result = await apiFetch<{ stock: number }>(`/api/stocks/disponible/${produitId}`);
    return result.stock;
  },

  async ajouterProduit(payload: {
    code_barre: string; nom: string; categorie_id: number;
    prix_vente: number; prix_achat: number; seuil_alerte: number;
    unite_mesure: string; stock_initial?: number;
  }): Promise<Produit> {
    return apiFetch<Produit>('/api/produits', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async modifierProduit(id: number, payload: Partial<Produit>): Promise<Produit> {
    return apiFetch<Produit>(`/api/produits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  async getMouvementsStock(): Promise<MouvementStock[]> {
    return apiFetch<MouvementStock[]>('/api/stocks/mouvements');
  },

  async getVueHistoriqueStock(): Promise<MouvementStock[]> {
    return apiFetch<MouvementStock[]>('/api/stocks/mouvements');
  },

  async ajusterStock(
    produitId: number,
    nouvelleQuantite: number,
    motif: string,
    _operateurNom: string,
    utilisateurId?: number
  ): Promise<Produit> {
    return apiFetch<Produit>('/api/stocks/ajuster', {
      method: 'POST',
      body: JSON.stringify({
        produit_id: produitId,
        nouvelle_quantite: nouvelleQuantite,
        motif,
        utilisateur_id: utilisateurId || 4, // Magasinier par défaut
      }),
    });
  },

  // -------------------------------------------------------------
  // ACHATS & RÉCEPTION DE STOCK FOURNISSEUR
  // -------------------------------------------------------------
  async getVueAchats(): Promise<Achat[]> {
    return apiFetch<Achat[]>('/api/achats');
  },

  async simulerCalculAchat(lignes: { produit_id: number; quantite: number; prix_unitaire: number }[]): Promise<{
    montant_ht: number; tva: number; montant_total: number; lignes_calculees: LigneAchat[];
  }> {
    // Calcul côté frontend pour l'aperçu (le calcul réel est fait dans PostgreSQL lors de l'enregistrement)
    let total = 0;
    const lignes_calculees: LigneAchat[] = lignes.map((l) => {
      const st = Number((l.quantite * l.prix_unitaire).toFixed(2));
      total += st;
      return {
        produit_id: l.produit_id,
        quantite: l.quantite,
        prix_unitaire: l.prix_unitaire,
        sous_total: st
      };
    });
    return {
      montant_ht: Number((total * 0.8).toFixed(2)),
      tva: Number((total * 0.2).toFixed(2)),
      montant_total: Number(total.toFixed(2)),
      lignes_calculees
    };
  },

  async effectuerAchat(payload: {
    fournisseur_id: number;
    lignes: { produit_id: number; quantite: number; prix_unitaire: number }[];
    cree_par_nom: string;
    cree_par_id?: number;
  }): Promise<Achat> {
    return apiFetch<Achat>('/api/achats', {
      method: 'POST',
      body: JSON.stringify({
        fournisseur_id: payload.fournisseur_id,
        lignes: payload.lignes,
        cree_par_id: payload.cree_par_id || 4,
      }),
    });
  },

  async transmettreFactureDirecteur(achatId: number, _factureRef?: string): Promise<Achat> {
    // Le statut par défaut est déjà 'en_attente_paiement_directeur'
    const achats = await this.getVueAchats();
    return achats.find(a => a.id === achatId) as Achat;
  },

  async payerFactureFournisseur(achatId: number, _payeParNom: string, _modePaiement: string = 'virement', payeParId?: number): Promise<Achat> {
    return apiFetch<Achat>(`/api/achats/${achatId}/payer`, {
      method: 'POST',
      body: JSON.stringify({ paye_par_id: payeParId || 2 }),
    });
  },

  async receptionStock(achatId: number, _utilisateurNom: string, utilisateurId?: number): Promise<Achat> {
    return apiFetch<Achat>(`/api/achats/${achatId}/reception`, {
      method: 'POST',
      body: JSON.stringify({ utilisateur_id: utilisateurId || 4 }),
    });
  },

  // -------------------------------------------------------------
  // VENTES CLIENTS & COMMANDES
  // -------------------------------------------------------------
  async getVueCommandes(): Promise<Vente[]> {
    return apiFetch<Vente[]>('/api/ventes');
  },

  async simulerCalculVente(lignes: { produit_id: number; quantite: number }[]): Promise<{
    montant_ht: number; tva: number; montant_total: number; lignes_calculees: LigneVente[];
  }> {
    // Pré-calcul pour l'aperçu (le total réel est calculé par PostgreSQL)
    const produits = await this.getVueStock();
    let total = 0;
    const lignes_calculees: LigneVente[] = lignes.map((l) => {
      const prod = produits.find((p: Produit) => p.id === l.produit_id);
      const pu = prod ? Number(prod.prix_vente) : 0;
      const st = Number((l.quantite * pu).toFixed(2));
      total += st;
      return {
        produit_id: l.produit_id,
        produit_nom: prod ? prod.nom : 'Produit',
        quantite: l.quantite,
        prix_unitaire: pu,
        sous_total: st
      };
    });
    return {
      montant_ht: Number((total * 0.8).toFixed(2)),
      tva: Number((total * 0.2).toFixed(2)),
      montant_total: Number(total.toFixed(2)),
      lignes_calculees
    };
  },

  async effectuerVente(payload: {
    client_id?: number | null;
    lignes: { produit_id: number; quantite: number }[];
    vendeur_id: number;
    vendeur_nom: string;
    mode_paiement?: ModePaiement;
    caisse_id?: number;
  }): Promise<{ vente: Vente; paiement?: Paiement }> {
    return apiFetch<{ vente: Vente; paiement?: Paiement }>('/api/ventes', {
      method: 'POST',
      body: JSON.stringify({
        client_id: payload.client_id,
        lignes: payload.lignes,
        vendeur_id: payload.vendeur_id,
        mode_paiement: payload.mode_paiement || 'especes',
        caisse_id: payload.caisse_id || 1,
      }),
    });
  },

  async annulerVente(venteId: number, motif: string, _utilisateurNom: string, utilisateurId?: number): Promise<Vente> {
    return apiFetch<Vente>(`/api/ventes/${venteId}/annuler`, {
      method: 'POST',
      body: JSON.stringify({ motif, utilisateur_id: utilisateurId || 1 }),
    });
  },

  // -------------------------------------------------------------
  // PAIEMENTS
  // -------------------------------------------------------------
  async getVuePaiements(modeFiltre?: ModePaiement | 'tous'): Promise<Paiement[]> {
    const query = modeFiltre && modeFiltre !== 'tous' ? `?mode=${modeFiltre}` : '';
    return apiFetch<Paiement[]>(`/api/paiements${query}`);
  },

  async enregistrerPaiement(payload: {
    vente_id: number; montant: number; mode_paiement: ModePaiement;
  }): Promise<Paiement> {
    return apiFetch<Paiement>('/api/paiements', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // -------------------------------------------------------------
  // POINT DE CAISSE
  // -------------------------------------------------------------
  async getPointsCaisse(): Promise<PointDeCaisse[]> {
    return apiFetch<PointDeCaisse[]>('/api/caisse/sessions');
  },

  async getCaisseVerrouillee(): Promise<boolean> {
    // Vérifier si la session du jour est soumise
    try {
      const session = await this.getPointCaisseSessionActive();
      return session.statut === 'soumise_directeur' || session.statut === 'soumise_verrouillee';
    } catch {
      return false;
    }
  },

  async getPointCaisseSessionActive(_vendeurId: number = 3, _vendeurNom: string = 'Noam Koffi'): Promise<PointDeCaisse> {
    return apiFetch<PointDeCaisse>('/api/caisse/session-active');
  },

  async soumettrePointCaisse(_payload: {
    sessionId: number;
    comptages: { especes: number; wave: number; orange_money: number; mtn_money: number; carte_bancaire: number; cheque: number; };
    observations: string;
    vendeurNom: string;
  }): Promise<PointDeCaisse> {
    // TODO: Implémenter la soumission via API
    return this.getPointCaisseSessionActive();
  },

  async validerPointCaisse(_sessionId: number, _directeurNom: string = 'Eden Touré (Directeur)'): Promise<PointDeCaisse> {
    return this.getPointCaisseSessionActive();
  },

  async rejeterPointCaisse(_sessionId: number, _motif: string, _directeurNom: string = 'Eden Touré (Directeur)'): Promise<PointDeCaisse> {
    return this.getPointCaisseSessionActive();
  },

  async ouvrirNouvelleSession(_fondCaisse: number = 50000, _vendeurId: number = 3, _vendeurNom: string = 'Noam Koffi'): Promise<PointDeCaisse> {
    return this.getPointCaisseSessionActive();
  },

  async deverrouillerCaisseManuellement(): Promise<boolean> {
    return false;
  },

  // -------------------------------------------------------------
  // MULTI-CAISSES & TERMINAUX
  // -------------------------------------------------------------
  async getCaisses(): Promise<Array<{ id: number; code: string; nom: string; emplacement: string; statut: string; ventes_jour: number; ca_jour: number }>> {
    return apiFetch<any[]>('/api/caisses');
  },

  // -------------------------------------------------------------
  // ADMINISTRATION & SAUVEGARDES
  // -------------------------------------------------------------
  async getBackups(): Promise<Array<{ filename: string; tailleKo: number; creeLe: string }>> {
    return apiFetch<any[]>('/api/admin/backups');
  },

  async creerBackup(): Promise<{ success: boolean; filename: string; tailleKo: number; creeLe: string }> {
    return apiFetch<any>('/api/admin/backups/create', { method: 'POST' });
  },

  // -------------------------------------------------------------
  // GESTION DE TRÉSORERIE & MOUVEMENTS DE CAISSE
  // -------------------------------------------------------------
  async getMouvementsCaisse(): Promise<MouvementCaisse[]> {
    return apiFetch<MouvementCaisse[]>('/api/caisse/mouvements');
  },

  async ajouterMouvementCaisse(payload: {
    sens: SensMouvementCaisse;
    type: TypeMouvementCaisse;
    montant: number;
    motif: string;
    justificatif?: string;
    effectue_par_nom: string;
    effectue_par_id?: number;
  }): Promise<MouvementCaisse> {
    return apiFetch<MouvementCaisse>('/api/caisse/mouvements', {
      method: 'POST',
      body: JSON.stringify({
        sens: payload.sens,
        type: payload.type,
        montant: payload.montant,
        motif: payload.motif,
        justificatif: payload.justificatif,
        effectue_par_id: payload.effectue_par_id || 2,
      }),
    });
  },

  async getSoldeCaisseActuel(): Promise<{
    soldeActuel: number;
    totalEntrees: number;
    totalSorties: number;
    fondInitial: number;
    totalVentesEspeces: number;
    totalEntreesManuelles: number;
  }> {
    const data = await apiFetch<any>('/api/caisse/solde');
    return {
      soldeActuel: Number(data.solde_actuel || 0),
      totalEntrees: Number(data.total_entrees || 0),
      totalSorties: Number(data.total_sorties || 0),
      fondInitial: Number(data.fond_initial || 50000),
      totalVentesEspeces: Number(data.total_ventes_especes || 0),
      totalEntreesManuelles: Number(data.total_entrees_manuelles || 0),
    };
  }
};
