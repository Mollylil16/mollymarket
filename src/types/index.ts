// Types pour l'application Molly Market

export type UserRole = 'Administrateur' | 'Directeur' | 'Vendeur' | 'Magasinier';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  avatar?: string;
  dernierAcces?: string;
}

export interface Client {
  id: number;
  code_client: string;
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  actif: boolean;
  date_creation: string;
  total_achats?: number;
}

export interface Employe {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: UserRole;
  date_embauche: string;
  actif: boolean;
}

export interface Fournisseur {
  id: number;
  code_fournisseur: string;
  nom_entreprise: string;
  contact_nom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  actif: boolean;
}

export interface Categorie {
  id: number;
  code: string;
  nom: string;
  description: string;
  nombre_produits?: number;
}

export type StatutStock = 'en_stock' | 'stock_faible' | 'rupture';

export interface Produit {
  id: number;
  code_barre: string;
  nom: string;
  categorie_id: number;
  categorie_nom?: string;
  prix_vente: number;
  prix_achat: number;
  seuil_alerte: number;
  stock_actuel: number;
  statut_stock: StatutStock;
  unite_mesure: string;
  date_maj?: string;
}

export type StatutAchat =
  | 'en_attente_paiement_directeur'
  | 'paye_par_directeur'
  | 'en_attente'
  | 'recu'
  | 'annule';

export interface LigneAchat {
  produit_id: number;
  produit_nom?: string;
  quantite: number;
  prix_unitaire: number;
  sous_total?: number;
}

export interface Achat {
  id: number;
  numero_achat: string;
  fournisseur_id: number;
  fournisseur_nom?: string;
  date_achat: string;
  date_reception?: string | null;
  date_paiement?: string | null;
  montant_total: number;
  statut: StatutAchat;
  lignes: LigneAchat[];
  cree_par_nom?: string;
  paye_par_nom?: string;
  receptionne_par_nom?: string;
  facture_fournisseur_ref?: string;
}

export type StatutVente = 'terminee' | 'annulee';

export interface LigneVente {
  produit_id: number;
  produit_nom?: string;
  quantite: number;
  prix_unitaire: number;
  sous_total?: number;
}

export interface Vente {
  id: number;
  numero_ticket: string;
  client_id?: number | null;
  client_nom?: string;
  date_vente: string;
  montant_total: number;
  statut: StatutVente;
  lignes: LigneVente[];
  vendeur_id: number;
  vendeur_nom?: string;
  caisse_id?: number;
  caisse_nom?: string;
  statut_paiement: 'paye' | 'partiel' | 'impaye';
  motif_annulation?: string;
}

export type StatutPaiement = 'paye' | 'partiel' | 'impaye';
export type ModePaiement =
  | 'especes'
  | 'wave'
  | 'orange_money'
  | 'mtn_money'
  | 'moov_money'
  | 'carte_bancaire'
  | 'cheque'
  | 'mobile_money'
  | 'virement';

export interface Paiement {
  id: number;
  reference_paiement: string;
  vente_id: number;
  numero_ticket?: string;
  client_nom?: string;
  montant: number;
  mode_paiement: ModePaiement;
  date_paiement: string;
  statut: StatutPaiement;
}

export type StatutPointCaisse =
  | 'ouverte'
  | 'soumise_directeur'
  | 'validee_directeur'
  | 'rejetee_directeur'
  | 'soumise_verrouillee';

export interface LigneBilletagePointCaisse {
  mode: ModePaiement;
  libelle: string;
  montant_theorique: number;
  montant_compte: number;
  ecart: number;
}

export interface PointDeCaisse {
  id: number;
  numero_session: string;
  date_journee: string; // YYYY-MM-DD
  heure_ouverture: string;
  heure_cloture?: string;
  vendeur_id: number;
  vendeur_nom: string;
  statut: StatutPointCaisse;
  fond_caisse_initial: number;
  total_ventes: number;
  nombre_tickets: number;
  repartition: Record<string, LigneBilletagePointCaisse>;
  total_theorique: number;
  total_compte: number;
  ecart_total: number;
  observations?: string;
  soumis_le?: string;
  valide_par_nom?: string;
  date_validation?: string;
}

export type TypeMouvementStock =
  | 'entree_achat'
  | 'sortie_vente'
  | 'ajustement_inventaire'
  | 'retour_client'
  | 'perte'
  | 'entree'
  | 'sortie'
  | 'ajustement'
  | 'annulation_vente';

export interface MouvementStock {
  id: number;
  produit_id: number;
  produit_nom?: string;
  code_barre?: string;
  type_mouvement: TypeMouvementStock;
  quantite: number; // positif pour entrée, négatif pour sortie
  date_mouvement: string;
  reference_document?: string;
  utilisateur_nom?: string;
  operateur_nom?: string;
  stock_avant?: number;
  stock_apres: number;
  motif?: string;
}

export interface TopClient {
  client_id: number;
  code_client: string;
  nom_complet: string;
  email: string;
  nombre_achats: number;
  total_depense: number;
}

export interface TopProduit {
  produit_id: number;
  code_barre: string;
  nom: string;
  categorie: string;
  quantite_vendue: number;
  chiffre_affaires: number;
}

export interface VenteParCategorie {
  categorie: string;
  montant: number;
  pourcentage: number;
  couleur?: string;
}

export interface EvolutionVentes {
  periode: string; // Ex: '01/09', 'Semaine 35', etc.
  montant: number;
  nombre_ventes: number;
}

export interface ChiffreAffaires {
  journalier: number;
  hier: number;
  evolution_journaliere: number; // %
  mensuel: number;
  mois_dernier: number;
  evolution_mensuelle: number; // %
  annuel: number;
}

export interface VueStatistiques {
  chiffre_affaires: ChiffreAffaires;
  top_clients: TopClient[];
  top_produits: TopProduit[];
  ventes_par_categorie: VenteParCategorie[];
  evolution_ventes: EvolutionVentes[];
  produits_en_rupture: Produit[];
  total_clients_actifs: number;
  total_produits_actifs: number;
  total_ventes_du_jour: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duree?: number;
}

export type SensMouvementCaisse = 'entree' | 'sortie';
export type TypeMouvementCaisse =
  | 'apport_fond'
  | 'entree_exceptionnelle'
  | 'retrait_banque'
  | 'depense_especes'
  | 'paiement_fournisseur'
  | 'ajustement_fond';

export interface MouvementCaisse {
  id: number;
  sens: SensMouvementCaisse;
  type: TypeMouvementCaisse;
  montant: number;
  motif: string;
  justificatif?: string;
  effectue_par_nom: string;
  date_mouvement: string;
  solde_apres: number;
}

