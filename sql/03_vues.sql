-- ============================================================================
-- MOLLY MARKET - Script 03 : Vues
-- Base de données : mollymarket_backend
-- ============================================================================

-- ============================================================================
-- VUE : vue_clients
-- Clients avec leur total d'achats calculé
-- ============================================================================
DROP VIEW IF EXISTS vue_clients CASCADE;
CREATE OR REPLACE VIEW vue_clients AS
SELECT 
    c.id,
    c.code_client,
    c.nom,
    c.prenom,
    c.telephone,
    c.email,
    c.adresse,
    c.actif,
    c.date_creation,
    COALESCE(SUM(v.montant_total) FILTER (WHERE v.statut = 'terminee'), 0) AS total_achats
FROM clients c
LEFT JOIN ventes v ON v.client_id = c.id
GROUP BY c.id, c.code_client, c.nom, c.prenom, c.telephone, c.email, c.adresse, c.actif, c.date_creation
ORDER BY c.date_creation DESC;

COMMENT ON VIEW vue_clients IS 'Vue des clients avec total des achats cumulé';

-- ============================================================================
-- VUE : vue_employes
-- Employés avec leur rôle
-- ============================================================================
DROP VIEW IF EXISTS vue_employes CASCADE;
CREATE OR REPLACE VIEW vue_employes AS
SELECT 
    u.id,
    u.matricule,
    u.nom,
    u.prenom,
    u.email,
    u.telephone,
    u.role::TEXT AS role,
    u.date_embauche,
    u.actif,
    u.avatar_url,
    u.dernier_acces
FROM utilisateurs u
ORDER BY u.date_creation DESC;

COMMENT ON VIEW vue_employes IS 'Vue des employés du supermarché';

-- ============================================================================
-- VUE : vue_commandes (vue des ventes)
-- Ventes avec noms client et vendeur, statut paiement
-- ============================================================================
DROP VIEW IF EXISTS vue_commandes CASCADE;
CREATE OR REPLACE VIEW vue_commandes AS
SELECT 
    v.id,
    v.numero_ticket,
    v.client_id,
    CASE 
        WHEN c.id IS NOT NULL THEN c.prenom || ' ' || c.nom
        ELSE 'Client au comptoir'
    END AS client_nom,
    v.vendeur_id,
    u.prenom || ' ' || u.nom AS vendeur_nom,
    v.date_vente,
    v.montant_total,
    v.statut::TEXT AS statut,
    v.motif_annulation,
    COALESCE(
        (SELECT sp.statut::TEXT FROM paiements sp WHERE sp.vente_id = v.id ORDER BY sp.date_paiement DESC LIMIT 1),
        'impaye'
    ) AS statut_paiement
FROM ventes v
LEFT JOIN clients c ON c.id = v.client_id
JOIN utilisateurs u ON u.id = v.vendeur_id
ORDER BY v.date_vente DESC;

COMMENT ON VIEW vue_commandes IS 'Vue des ventes avec détails client et vendeur';

-- ============================================================================
-- VUE : vue_top_clients
-- Top clients classés par total des dépenses
-- ============================================================================
DROP VIEW IF EXISTS vue_top_clients CASCADE;
CREATE OR REPLACE VIEW vue_top_clients AS
SELECT 
    c.id AS client_id,
    c.code_client,
    c.prenom || ' ' || c.nom AS nom_complet,
    c.email,
    COUNT(v.id) AS nombre_achats,
    COALESCE(SUM(v.montant_total), 0) AS total_depense
FROM clients c
JOIN ventes v ON v.client_id = c.id AND v.statut = 'terminee'
GROUP BY c.id, c.code_client, c.prenom, c.nom, c.email
ORDER BY total_depense DESC
LIMIT 10;

COMMENT ON VIEW vue_top_clients IS 'Top 10 des meilleurs clients par dépenses';

-- ============================================================================
-- VUE : vue_stock
-- Produits avec statut de stock et nom de catégorie
-- ============================================================================
DROP VIEW IF EXISTS vue_stock CASCADE;
CREATE OR REPLACE VIEW vue_stock AS
SELECT 
    p.id,
    p.code_barre,
    p.nom,
    p.categorie_id,
    cat.nom AS categorie_nom,
    p.prix_vente,
    p.prix_achat,
    p.seuil_alerte,
    p.stock_actuel,
    CASE 
        WHEN p.stock_actuel = 0 THEN 'rupture'
        WHEN p.stock_actuel <= p.seuil_alerte THEN 'stock_faible'
        ELSE 'en_stock'
    END AS statut_stock,
    p.unite_mesure,
    p.date_maj
FROM produits p
JOIN categories cat ON cat.id = p.categorie_id
WHERE p.actif = TRUE
ORDER BY cat.nom, p.nom;

COMMENT ON VIEW vue_stock IS 'Vue des produits en stock avec statut et catégorie';

-- ============================================================================
-- VUE : vue_top_produits
-- Top produits par chiffre d'affaires
-- ============================================================================
DROP VIEW IF EXISTS vue_top_produits CASCADE;
CREATE OR REPLACE VIEW vue_top_produits AS
SELECT 
    p.id AS produit_id,
    p.code_barre,
    p.nom,
    cat.nom AS categorie,
    COALESCE(SUM(lv.quantite), 0) AS quantite_vendue,
    COALESCE(SUM(lv.sous_total), 0) AS chiffre_affaires
FROM produits p
JOIN categories cat ON cat.id = p.categorie_id
LEFT JOIN lignes_vente lv ON lv.produit_id = p.id
LEFT JOIN ventes v ON v.id = lv.vente_id AND v.statut = 'terminee'
GROUP BY p.id, p.code_barre, p.nom, cat.nom
HAVING COALESCE(SUM(lv.quantite), 0) > 0
ORDER BY chiffre_affaires DESC
LIMIT 10;

COMMENT ON VIEW vue_top_produits IS 'Top 10 des produits les plus vendus par CA';

-- ============================================================================
-- VUE : vue_paiements
-- Paiements avec détails vente et client
-- ============================================================================
DROP VIEW IF EXISTS vue_paiements CASCADE;
CREATE OR REPLACE VIEW vue_paiements AS
SELECT 
    p.id,
    p.reference_paiement,
    p.vente_id,
    v.numero_ticket,
    CASE 
        WHEN c.id IS NOT NULL THEN c.prenom || ' ' || c.nom
        ELSE 'Client au comptoir'
    END AS client_nom,
    p.montant,
    p.mode_paiement::TEXT AS mode_paiement,
    p.date_paiement,
    p.statut::TEXT AS statut
FROM paiements p
LEFT JOIN ventes v ON v.id = p.vente_id
LEFT JOIN clients c ON c.id = v.client_id
ORDER BY p.date_paiement DESC;

COMMENT ON VIEW vue_paiements IS 'Vue des paiements avec ticket et client';

-- ============================================================================
-- VUE : vue_achats
-- Achats avec noms fournisseur et employés
-- ============================================================================
DROP VIEW IF EXISTS vue_achats CASCADE;
CREATE OR REPLACE VIEW vue_achats AS
SELECT 
    a.id,
    a.numero_achat,
    a.fournisseur_id,
    f.nom_entreprise AS fournisseur_nom,
    a.date_achat,
    a.date_reception,
    a.date_paiement,
    a.montant_total,
    a.statut::TEXT AS statut,
    a.facture_fournisseur_ref,
    uc.prenom || ' ' || uc.nom AS cree_par_nom,
    up.prenom || ' ' || up.nom AS paye_par_nom,
    ur.prenom || ' ' || ur.nom AS receptionne_par_nom
FROM achats a
JOIN fournisseurs f ON f.id = a.fournisseur_id
LEFT JOIN utilisateurs uc ON uc.id = a.cree_par_id
LEFT JOIN utilisateurs up ON up.id = a.paye_par_id
LEFT JOIN utilisateurs ur ON ur.id = a.receptionne_par_id
ORDER BY a.date_achat DESC;

COMMENT ON VIEW vue_achats IS 'Vue des achats avec fournisseur et employés';

-- ============================================================================
-- VUE : vue_mouvements_stock
-- Historique des mouvements de stock
-- ============================================================================
DROP VIEW IF EXISTS vue_mouvements_stock CASCADE;
CREATE OR REPLACE VIEW vue_mouvements_stock AS
SELECT 
    ms.id,
    ms.produit_id,
    p.nom AS produit_nom,
    p.code_barre,
    ms.type_mouvement::TEXT AS type_mouvement,
    ms.quantite,
    ms.stock_avant,
    ms.stock_apres,
    ms.reference_document,
    u.prenom || ' ' || u.nom AS utilisateur_nom,
    u.prenom || ' ' || u.nom AS operateur_nom,
    ms.motif,
    ms.date_mouvement
FROM mouvements_stock ms
JOIN produits p ON p.id = ms.produit_id
LEFT JOIN utilisateurs u ON u.id = ms.utilisateur_id
ORDER BY ms.date_mouvement DESC;

COMMENT ON VIEW vue_mouvements_stock IS 'Historique complet des mouvements de stock';

-- ============================================================================
-- VUE : vue_statistiques
-- Données agrégées pour le tableau de bord
-- ============================================================================
DROP VIEW IF EXISTS vue_statistiques CASCADE;
CREATE OR REPLACE VIEW vue_statistiques AS
SELECT 
    -- Chiffre d'affaires du jour
    COALESCE(SUM(v.montant_total) FILTER (
        WHERE v.statut = 'terminee' AND v.date_vente::DATE = CURRENT_DATE
    ), 0) AS ca_journalier,
    
    -- Chiffre d'affaires d'hier
    COALESCE(SUM(v.montant_total) FILTER (
        WHERE v.statut = 'terminee' AND v.date_vente::DATE = CURRENT_DATE - INTERVAL '1 day'
    ), 0) AS ca_hier,
    
    -- Chiffre d'affaires du mois
    COALESCE(SUM(v.montant_total) FILTER (
        WHERE v.statut = 'terminee' 
        AND DATE_TRUNC('month', v.date_vente) = DATE_TRUNC('month', CURRENT_DATE)
    ), 0) AS ca_mensuel,
    
    -- Chiffre d'affaires du mois dernier
    COALESCE(SUM(v.montant_total) FILTER (
        WHERE v.statut = 'terminee' 
        AND DATE_TRUNC('month', v.date_vente) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    ), 0) AS ca_mois_dernier,
    
    -- Chiffre d'affaires annuel
    COALESCE(SUM(v.montant_total) FILTER (
        WHERE v.statut = 'terminee' 
        AND DATE_TRUNC('year', v.date_vente) = DATE_TRUNC('year', CURRENT_DATE)
    ), 0) AS ca_annuel,
    
    -- Nombre de ventes du jour
    COUNT(*) FILTER (
        WHERE v.statut = 'terminee' AND v.date_vente::DATE = CURRENT_DATE
    ) AS total_ventes_du_jour,
    
    -- Nombre total de clients actifs
    (SELECT COUNT(*) FROM clients WHERE actif = TRUE) AS total_clients_actifs,
    
    -- Nombre total de produits actifs
    (SELECT COUNT(*) FROM produits WHERE actif = TRUE) AS total_produits_actifs

FROM ventes v;

COMMENT ON VIEW vue_statistiques IS 'Statistiques globales du tableau de bord';

-- ============================================================================
-- VUE : vue_ventes_par_categorie
-- Ventes agrégées par catégorie
-- ============================================================================
DROP VIEW IF EXISTS vue_ventes_par_categorie CASCADE;
CREATE OR REPLACE VIEW vue_ventes_par_categorie AS
SELECT 
    cat.nom AS categorie,
    COALESCE(SUM(lv.sous_total), 0) AS montant,
    ROUND(
        COALESCE(SUM(lv.sous_total), 0) * 100.0 / 
        NULLIF((SELECT SUM(sous_total) FROM lignes_vente lv2 JOIN ventes v2 ON v2.id = lv2.vente_id WHERE v2.statut = 'terminee'), 0),
        1
    ) AS pourcentage
FROM categories cat
LEFT JOIN produits p ON p.categorie_id = cat.id
LEFT JOIN lignes_vente lv ON lv.produit_id = p.id
LEFT JOIN ventes v ON v.id = lv.vente_id AND v.statut = 'terminee'
GROUP BY cat.nom
HAVING COALESCE(SUM(lv.sous_total), 0) > 0
ORDER BY montant DESC;

COMMENT ON VIEW vue_ventes_par_categorie IS 'Répartition des ventes par catégorie de produits';

-- ============================================================================
-- VUE : vue_produits_en_rupture
-- Produits en rupture de stock ou stock faible
-- ============================================================================
DROP VIEW IF EXISTS vue_produits_en_rupture CASCADE;
CREATE OR REPLACE VIEW vue_produits_en_rupture AS
SELECT 
    p.id,
    p.code_barre,
    p.nom,
    p.categorie_id,
    cat.nom AS categorie_nom,
    p.prix_vente,
    p.prix_achat,
    p.seuil_alerte,
    p.stock_actuel,
    CASE 
        WHEN p.stock_actuel = 0 THEN 'rupture'
        ELSE 'stock_faible'
    END AS statut_stock,
    p.unite_mesure,
    p.date_maj
FROM produits p
JOIN categories cat ON cat.id = p.categorie_id
WHERE p.actif = TRUE AND p.stock_actuel <= p.seuil_alerte
ORDER BY p.stock_actuel ASC;

COMMENT ON VIEW vue_produits_en_rupture IS 'Produits en rupture ou stock faible (alerte)';

-- ============================================================================
-- FIN du script 03_vues.sql
-- ============================================================================
