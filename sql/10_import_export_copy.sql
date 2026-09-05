-- ============================================================================
-- MOLLY MARKET - Script 10 : Importation et Exportation avec COPY / \copy
-- Base de données : mollymarket_backend
-- ============================================================================

-- ============================================================================
-- 1. PRÉSENTATION DE LA COMMANDE COPY
-- ============================================================================
-- La commande PostgreSQL COPY permet de charger en masse des données (Bulk Insert)
-- depuis des fichiers CSV, texte ou flux d'entrée standard, de manière ultra-rapide.
--
-- Deux variantes existent :
--  - COPY (côté serveur) : nécessite les privilèges superutilisateur ou rôle pg_read_server_files
--  - \copy (côté client dans psql) : lit le fichier directement sur la machine cliente

-- ============================================================================
-- 2. IMPORTATION VIA COMMANDE CLIENTE psql (\copy) - RECOMMANDÉ
-- ============================================================================

-- A. Importer les catégories :
-- \copy categories(id, code, nom, description) FROM 'sql/data/categories.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- B. Importer les fournisseurs :
-- \copy fournisseurs(id, code_fournisseur, nom_entreprise, contact_nom, telephone, email, adresse, ville, actif) FROM 'sql/data/fournisseurs.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- C. Importer les clients :
-- \copy clients(id, code_client, nom, prenom, telephone, email, adresse, actif) FROM 'sql/data/clients.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- ============================================================================
-- 3. IMPORTATION SERVEUR (COPY ... FROM) AVEC CHEMIN ABSOLU
-- ============================================================================

-- Exemple d'exécution directe si le fichier est placé sur le serveur :
/*
COPY categories(id, code, nom, description)
FROM 'C:/Users/ASUS/mollymarket/molly-market/sql/data/categories.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8');

COPY fournisseurs(id, code_fournisseur, nom_entreprise, contact_nom, telephone, email, adresse, ville, actif)
FROM 'C:/Users/ASUS/mollymarket/molly-market/sql/data/fournisseurs.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8');

COPY clients(id, code_client, nom, prenom, telephone, email, adresse, actif)
FROM 'C:/Users/ASUS/mollymarket/molly-market/sql/data/clients.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',', ENCODING 'UTF8');
*/

-- ============================================================================
-- 4. IMPORTATION DIRECTE EN LIGNE AVEC COPY ... FROM stdin
-- ============================================================================
-- Utilisable dans pgAdmin ou un script SQL sans dépendance de fichier externe :

-- Création d'une table temporaire de démonstration pour le jury
CREATE TEMP TABLE IF NOT EXISTS demo_import_produits (
    code_barre VARCHAR(50),
    designation VARCHAR(150),
    prix_unitaire_ttc NUMERIC(12,2),
    stock_initial INT
);

-- Insertion de données en masse via flux COPY
COPY demo_import_produits (code_barre, designation, prix_unitaire_ttc, stock_initial) FROM stdin WITH (FORMAT csv, DELIMITER ';');
3017620422003;Riz Parfumé Dinor 5kg;4500;50
6181100530014;Huile Raffinée Dinor 1.5L;1750;80
6181100530229;Pâte Alimentaire Maman 500g;450;200
3045320001570;Chocolat Tartiner Chocolion 400g;1600;35
6181100530335;Savon de Ménage BF 200g;300;150
\.

-- Vérification de l'importation
SELECT * FROM demo_import_produits;

-- Mise à jour des séquences après import en masse
SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories));
SELECT setval('fournisseurs_id_seq', (SELECT COALESCE(MAX(id), 1) FROM fournisseurs));
SELECT setval('clients_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clients));
SELECT setval('produits_id_seq', (SELECT COALESCE(MAX(id), 1) FROM produits));

-- ============================================================================
-- 5. EXPORTATION DES DONNÉES EN CSV (REPORTING)
-- ============================================================================

-- Exportation de la vue d'analyse des ventes vers un CSV :
-- \copy (SELECT * FROM vue_tableau_de_bord_directeur) TO 'export_kpi_directeur.csv' WITH (FORMAT csv, HEADER true, DELIMITER ';');

-- Exportation de l'inventaire valorisé :
-- \copy (SELECT * FROM vue_valeur_stock_par_categorie) TO 'export_inventaire_stock.csv' WITH (FORMAT csv, HEADER true, DELIMITER ';');

-- ============================================================================
-- FIN DU SCRIPT 10_import_export_copy.sql
-- ============================================================================
