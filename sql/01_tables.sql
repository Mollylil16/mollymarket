-- ============================================================================
-- MOLLY MARKET - Script 01 : Création des tables
-- Base de données : mollymarket_backend
-- Exécuter dans pgAdmin sur la base mollymarket_backend
-- ============================================================================

-- Nettoyage préalable (ordre inverse des dépendances)
DROP TABLE IF EXISTS billetage_point_caisse CASCADE;
DROP TABLE IF EXISTS mouvements_caisse CASCADE;
DROP TABLE IF EXISTS points_caisse CASCADE;
DROP TABLE IF EXISTS journal_suppressions CASCADE;
DROP TABLE IF EXISTS historique_prix CASCADE;
DROP TABLE IF EXISTS mouvements_stock CASCADE;
DROP TABLE IF EXISTS paiements CASCADE;
DROP TABLE IF EXISTS lignes_vente CASCADE;
DROP TABLE IF EXISTS ventes CASCADE;
DROP TABLE IF EXISTS lignes_achat CASCADE;
DROP TABLE IF EXISTS achats CASCADE;
DROP TABLE IF EXISTS produits CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS fournisseurs CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- Suppression des types ENUM existants
DROP TYPE IF EXISTS type_role CASCADE;
DROP TYPE IF EXISTS statut_vente CASCADE;
DROP TYPE IF EXISTS statut_achat CASCADE;
DROP TYPE IF EXISTS mode_paiement CASCADE;
DROP TYPE IF EXISTS statut_paiement CASCADE;
DROP TYPE IF EXISTS type_mouvement_stock CASCADE;
DROP TYPE IF EXISTS statut_point_caisse CASCADE;
DROP TYPE IF EXISTS sens_mouvement_caisse CASCADE;
DROP TYPE IF EXISTS type_mouvement_caisse CASCADE;

-- ============================================================================
-- TYPES ENUM
-- ============================================================================

CREATE TYPE type_role AS ENUM ('Administrateur', 'Directeur', 'Vendeur', 'Magasinier');

CREATE TYPE statut_vente AS ENUM ('terminee', 'annulee');

CREATE TYPE statut_achat AS ENUM (
    'en_attente_paiement_directeur',
    'paye_par_directeur',
    'en_attente',
    'recu',
    'annule'
);

CREATE TYPE mode_paiement AS ENUM (
    'especes',
    'wave',
    'orange_money',
    'mtn_money',
    'moov_money',
    'carte_bancaire',
    'cheque',
    'mobile_money',
    'virement'
);

CREATE TYPE statut_paiement AS ENUM ('paye', 'partiel', 'impaye');

CREATE TYPE type_mouvement_stock AS ENUM (
    'entree_achat',
    'sortie_vente',
    'ajustement_inventaire',
    'retour_client',
    'perte',
    'entree',
    'sortie',
    'ajustement',
    'annulation_vente'
);

CREATE TYPE statut_point_caisse AS ENUM (
    'ouverte',
    'soumise_directeur',
    'validee_directeur',
    'rejetee_directeur',
    'soumise_verrouillee'
);

CREATE TYPE sens_mouvement_caisse AS ENUM ('entree', 'sortie');

CREATE TYPE type_mouvement_caisse AS ENUM (
    'apport_fond',
    'entree_exceptionnelle',
    'retrait_banque',
    'depense_especes',
    'paiement_fournisseur',
    'ajustement_fond'
);

-- ============================================================================
-- TABLE : utilisateurs
-- ============================================================================
CREATE TABLE utilisateurs (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe_hash VARCHAR(255) NOT NULL,
    role type_role NOT NULL,
    telephone VARCHAR(30),
    avatar_url TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_embauche DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dernier_acces TIMESTAMP
);

COMMENT ON TABLE utilisateurs IS 'Table des utilisateurs (employés) du supermarché avec authentification';

-- ============================================================================
-- TABLE : clients
-- ============================================================================
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    code_client VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(30),
    email VARCHAR(150),
    adresse TEXT,
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE clients IS 'Table des clients du supermarché';

-- ============================================================================
-- TABLE : fournisseurs
-- ============================================================================
CREATE TABLE fournisseurs (
    id SERIAL PRIMARY KEY,
    code_fournisseur VARCHAR(20) NOT NULL UNIQUE,
    nom_entreprise VARCHAR(200) NOT NULL,
    contact_nom VARCHAR(150),
    telephone VARCHAR(30),
    email VARCHAR(150),
    adresse TEXT,
    ville VARCHAR(100),
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE fournisseurs IS 'Table des fournisseurs du supermarché';

-- ============================================================================
-- TABLE : categories
-- ============================================================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    description TEXT,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categories IS 'Rayons / catégories de produits du supermarché';

-- ============================================================================
-- TABLE : produits
-- ============================================================================
CREATE TABLE produits (
    id SERIAL PRIMARY KEY,
    code_barre VARCHAR(50) NOT NULL UNIQUE,
    nom VARCHAR(200) NOT NULL,
    categorie_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    prix_vente NUMERIC(12,2) NOT NULL CHECK (prix_vente >= 0),
    prix_achat NUMERIC(12,2) NOT NULL CHECK (prix_achat >= 0),
    seuil_alerte INTEGER DEFAULT 10,
    stock_actuel INTEGER DEFAULT 0 CHECK (stock_actuel >= 0),
    unite_mesure VARCHAR(50) DEFAULT 'Unité',
    actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_maj TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE produits IS 'Catalogue des produits avec prix réels en FCFA et gestion du stock';

-- ============================================================================
-- TABLE : ventes
-- ============================================================================
CREATE TABLE ventes (
    id SERIAL PRIMARY KEY,
    numero_ticket VARCHAR(30) NOT NULL UNIQUE,
    client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
    vendeur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    montant_total NUMERIC(12,2) DEFAULT 0,
    statut statut_vente DEFAULT 'terminee',
    motif_annulation TEXT
);

COMMENT ON TABLE ventes IS 'Ventes aux clients (tickets de caisse)';

-- ============================================================================
-- TABLE : lignes_vente
-- ============================================================================
CREATE TABLE lignes_vente (
    id SERIAL PRIMARY KEY,
    vente_id INTEGER NOT NULL REFERENCES ventes(id) ON DELETE CASCADE,
    produit_id INTEGER NOT NULL REFERENCES produits(id),
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire NUMERIC(12,2) NOT NULL,
    sous_total NUMERIC(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED
);

COMMENT ON TABLE lignes_vente IS 'Détail des articles vendus par ticket';

-- ============================================================================
-- TABLE : achats
-- ============================================================================
CREATE TABLE achats (
    id SERIAL PRIMARY KEY,
    numero_achat VARCHAR(30) NOT NULL UNIQUE,
    fournisseur_id INTEGER NOT NULL REFERENCES fournisseurs(id),
    cree_par_id INTEGER REFERENCES utilisateurs(id),
    paye_par_id INTEGER REFERENCES utilisateurs(id),
    receptionne_par_id INTEGER REFERENCES utilisateurs(id),
    date_achat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_reception TIMESTAMP,
    date_paiement TIMESTAMP,
    montant_total NUMERIC(12,2) DEFAULT 0,
    statut statut_achat DEFAULT 'en_attente_paiement_directeur',
    facture_fournisseur_ref VARCHAR(100)
);

COMMENT ON TABLE achats IS 'Commandes d''achat auprès des fournisseurs';

-- ============================================================================
-- TABLE : lignes_achat
-- ============================================================================
CREATE TABLE lignes_achat (
    id SERIAL PRIMARY KEY,
    achat_id INTEGER NOT NULL REFERENCES achats(id) ON DELETE CASCADE,
    produit_id INTEGER NOT NULL REFERENCES produits(id),
    quantite INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire NUMERIC(12,2) NOT NULL,
    sous_total NUMERIC(12,2) GENERATED ALWAYS AS (quantite * prix_unitaire) STORED
);

COMMENT ON TABLE lignes_achat IS 'Détail des articles commandés au fournisseur';

-- ============================================================================
-- TABLE : paiements
-- ============================================================================
CREATE TABLE paiements (
    id SERIAL PRIMARY KEY,
    reference_paiement VARCHAR(50) NOT NULL UNIQUE,
    vente_id INTEGER REFERENCES ventes(id) ON DELETE SET NULL,
    montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
    mode_paiement mode_paiement NOT NULL,
    date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    statut statut_paiement DEFAULT 'paye'
);

COMMENT ON TABLE paiements IS 'Encaissements des ventes (Wave, Orange Money, espèces, etc.)';

-- ============================================================================
-- TABLE : mouvements_stock
-- ============================================================================
CREATE TABLE mouvements_stock (
    id SERIAL PRIMARY KEY,
    produit_id INTEGER NOT NULL REFERENCES produits(id),
    type_mouvement type_mouvement_stock NOT NULL,
    quantite INTEGER NOT NULL,
    stock_avant INTEGER,
    stock_apres INTEGER NOT NULL,
    reference_document VARCHAR(50),
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    motif TEXT,
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE mouvements_stock IS 'Historique de tous les mouvements de stock (entrées, sorties, ajustements)';

-- ============================================================================
-- TABLE : historique_prix
-- ============================================================================
CREATE TABLE historique_prix (
    id SERIAL PRIMARY KEY,
    produit_id INTEGER NOT NULL REFERENCES produits(id),
    ancien_prix_vente NUMERIC(12,2),
    nouveau_prix_vente NUMERIC(12,2),
    ancien_prix_achat NUMERIC(12,2),
    nouveau_prix_achat NUMERIC(12,2),
    utilisateur_id INTEGER REFERENCES utilisateurs(id),
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE historique_prix IS 'Journal des modifications de prix des produits';

-- ============================================================================
-- TABLE : journal_suppressions
-- ============================================================================
CREATE TABLE journal_suppressions (
    id SERIAL PRIMARY KEY,
    table_nom VARCHAR(100) NOT NULL,
    enregistrement_id INTEGER NOT NULL,
    donnees_json JSONB NOT NULL,
    supprime_par_id INTEGER REFERENCES utilisateurs(id),
    date_suppression TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE journal_suppressions IS 'Journalisation de toutes les suppressions pour audit';

-- ============================================================================
-- TABLE : points_caisse
-- ============================================================================
CREATE TABLE points_caisse (
    id SERIAL PRIMARY KEY,
    numero_session VARCHAR(30) NOT NULL UNIQUE,
    date_journee DATE NOT NULL,
    heure_ouverture TIME,
    heure_cloture TIME,
    vendeur_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    statut statut_point_caisse DEFAULT 'ouverte',
    fond_caisse_initial NUMERIC(12,2) DEFAULT 50000,
    total_ventes NUMERIC(12,2) DEFAULT 0,
    nombre_tickets INTEGER DEFAULT 0,
    total_theorique NUMERIC(12,2) DEFAULT 0,
    total_compte NUMERIC(12,2) DEFAULT 0,
    ecart_total NUMERIC(12,2) DEFAULT 0,
    observations TEXT,
    soumis_le TIMESTAMP,
    valide_par_id INTEGER REFERENCES utilisateurs(id),
    date_validation TIMESTAMP
);

COMMENT ON TABLE points_caisse IS 'Sessions de caisse journalières avec billetage et validation directeur';

-- ============================================================================
-- TABLE : billetage_point_caisse
-- ============================================================================
CREATE TABLE billetage_point_caisse (
    id SERIAL PRIMARY KEY,
    point_caisse_id INTEGER NOT NULL REFERENCES points_caisse(id) ON DELETE CASCADE,
    mode_paiement mode_paiement NOT NULL,
    libelle VARCHAR(100),
    montant_theorique NUMERIC(12,2) DEFAULT 0,
    montant_compte NUMERIC(12,2) DEFAULT 0,
    ecart NUMERIC(12,2) DEFAULT 0
);

COMMENT ON TABLE billetage_point_caisse IS 'Détail du billetage par mode de paiement pour chaque point de caisse';

-- ============================================================================
-- TABLE : mouvements_caisse
-- ============================================================================
CREATE TABLE mouvements_caisse (
    id SERIAL PRIMARY KEY,
    sens sens_mouvement_caisse NOT NULL,
    type type_mouvement_caisse NOT NULL,
    montant NUMERIC(12,2) NOT NULL CHECK (montant > 0),
    motif TEXT NOT NULL,
    justificatif TEXT,
    effectue_par_id INTEGER NOT NULL REFERENCES utilisateurs(id),
    date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    solde_apres NUMERIC(12,2) DEFAULT 0
);

COMMENT ON TABLE mouvements_caisse IS 'Mouvements de trésorerie (fond de caisse, dépenses, retraits)';

-- ============================================================================
-- INDEX pour performances
-- ============================================================================
CREATE INDEX idx_produits_categorie ON produits(categorie_id);
CREATE INDEX idx_produits_code_barre ON produits(code_barre);
CREATE INDEX idx_ventes_date ON ventes(date_vente);
CREATE INDEX idx_ventes_client ON ventes(client_id);
CREATE INDEX idx_ventes_vendeur ON ventes(vendeur_id);
CREATE INDEX idx_lignes_vente_vente ON lignes_vente(vente_id);
CREATE INDEX idx_lignes_vente_produit ON lignes_vente(produit_id);
CREATE INDEX idx_achats_fournisseur ON achats(fournisseur_id);
CREATE INDEX idx_lignes_achat_achat ON lignes_achat(achat_id);
CREATE INDEX idx_paiements_vente ON paiements(vente_id);
CREATE INDEX idx_mouvements_stock_produit ON mouvements_stock(produit_id);
CREATE INDEX idx_mouvements_stock_date ON mouvements_stock(date_mouvement);
CREATE INDEX idx_historique_prix_produit ON historique_prix(produit_id);
CREATE INDEX idx_points_caisse_date ON points_caisse(date_journee);

-- ============================================================================
-- FIN du script 01_tables.sql
-- ============================================================================
