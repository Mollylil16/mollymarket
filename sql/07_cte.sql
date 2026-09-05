-- ============================================================================
-- MOLLY MARKET - Script 07 : CTE (Common Table Expressions)
-- Base de données : mollymarket_backend
-- ============================================================================

-- ============================================================================
-- CTE 1 : Meilleurs Clients (WITH)
-- Top 10 des clients par total de dépenses
-- ============================================================================

-- Requête CTE : Meilleurs clients
WITH meilleurs_clients AS (
    SELECT 
        c.id AS client_id,
        c.code_client,
        c.prenom || ' ' || c.nom AS nom_complet,
        c.email,
        COUNT(v.id) AS nombre_achats,
        COALESCE(SUM(v.montant_total), 0) AS total_depense,
        RANK() OVER (ORDER BY COALESCE(SUM(v.montant_total), 0) DESC) AS rang
    FROM clients c
    JOIN ventes v ON v.client_id = c.id AND v.statut = 'terminee'
    GROUP BY c.id, c.code_client, c.prenom, c.nom, c.email
)
SELECT 
    client_id,
    code_client,
    nom_complet,
    email,
    nombre_achats,
    total_depense,
    rang
FROM meilleurs_clients
WHERE rang <= 10
ORDER BY rang;

-- ============================================================================
-- CTE 2 : Meilleurs Produits (WITH)
-- Top 10 des produits par chiffre d'affaires
-- ============================================================================

WITH meilleurs_produits AS (
    SELECT 
        p.id AS produit_id,
        p.code_barre,
        p.nom,
        cat.nom AS categorie,
        COALESCE(SUM(lv.quantite), 0) AS quantite_vendue,
        COALESCE(SUM(lv.sous_total), 0) AS chiffre_affaires,
        RANK() OVER (ORDER BY COALESCE(SUM(lv.sous_total), 0) DESC) AS rang
    FROM produits p
    JOIN categories cat ON cat.id = p.categorie_id
    LEFT JOIN lignes_vente lv ON lv.produit_id = p.id
    LEFT JOIN ventes v ON v.id = lv.vente_id AND v.statut = 'terminee'
    GROUP BY p.id, p.code_barre, p.nom, cat.nom
)
SELECT 
    produit_id,
    code_barre,
    nom,
    categorie,
    quantite_vendue,
    chiffre_affaires,
    rang
FROM meilleurs_produits
WHERE rang <= 10 AND quantite_vendue > 0
ORDER BY rang;

-- ============================================================================
-- CTE 3 : Ventes Mensuelles (WITH)
-- Agrégation des ventes par mois de l'année en cours
-- ============================================================================

WITH ventes_mensuelles AS (
    SELECT 
        DATE_TRUNC('month', v.date_vente) AS mois,
        TO_CHAR(v.date_vente, 'TMMonth YYYY') AS periode,
        COUNT(v.id) AS nombre_ventes,
        COALESCE(SUM(v.montant_total), 0) AS chiffre_affaires,
        COUNT(DISTINCT v.client_id) AS clients_uniques
    FROM ventes v
    WHERE v.statut = 'terminee'
    AND DATE_TRUNC('year', v.date_vente) = DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY DATE_TRUNC('month', v.date_vente), TO_CHAR(v.date_vente, 'TMMonth YYYY')
)
SELECT 
    periode,
    nombre_ventes,
    chiffre_affaires,
    clients_uniques,
    ROUND(chiffre_affaires / NULLIF(nombre_ventes, 0), 2) AS panier_moyen
FROM ventes_mensuelles
ORDER BY mois;

-- ============================================================================
-- CTE 4 : Analyse complète avec WITH MATERIALIZED
-- Réécriture matérialisée pour optimisation du tableau de bord
-- ============================================================================

WITH ca_global AS MATERIALIZED (
    SELECT 
        COALESCE(SUM(montant_total) FILTER (WHERE date_vente::DATE = CURRENT_DATE), 0) AS ca_jour,
        COALESCE(SUM(montant_total) FILTER (
            WHERE DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE)
        ), 0) AS ca_mois,
        COALESCE(SUM(montant_total) FILTER (
            WHERE DATE_TRUNC('year', date_vente) = DATE_TRUNC('year', CURRENT_DATE)
        ), 0) AS ca_annee,
        COUNT(*) FILTER (WHERE date_vente::DATE = CURRENT_DATE) AS ventes_du_jour
    FROM ventes
    WHERE statut = 'terminee'
),
top_5_clients AS MATERIALIZED (
    SELECT 
        c.prenom || ' ' || c.nom AS nom_complet,
        COALESCE(SUM(v.montant_total), 0) AS total_depense
    FROM clients c
    JOIN ventes v ON v.client_id = c.id AND v.statut = 'terminee'
    GROUP BY c.id, c.prenom, c.nom
    ORDER BY total_depense DESC
    LIMIT 5
),
top_5_produits AS MATERIALIZED (
    SELECT 
        p.nom,
        COALESCE(SUM(lv.sous_total), 0) AS ca_produit
    FROM produits p
    JOIN lignes_vente lv ON lv.produit_id = p.id
    JOIN ventes v ON v.id = lv.vente_id AND v.statut = 'terminee'
    GROUP BY p.id, p.nom
    ORDER BY ca_produit DESC
    LIMIT 5
),
alertes_stock AS MATERIALIZED (
    SELECT 
        p.nom,
        p.stock_actuel,
        p.seuil_alerte,
        CASE WHEN p.stock_actuel = 0 THEN 'RUPTURE' ELSE 'ALERTE' END AS type_alerte
    FROM produits p
    WHERE p.actif = TRUE AND p.stock_actuel <= p.seuil_alerte
)
SELECT 
    'Résumé du tableau de bord' AS section,
    (SELECT json_build_object(
        'ca_jour', ca_jour, 'ca_mois', ca_mois, 'ca_annee', ca_annee, 'ventes_du_jour', ventes_du_jour
    ) FROM ca_global) AS chiffre_affaires,
    (SELECT json_agg(json_build_object('client', nom_complet, 'total', total_depense)) FROM top_5_clients) AS meilleurs_clients,
    (SELECT json_agg(json_build_object('produit', nom, 'ca', ca_produit)) FROM top_5_produits) AS meilleurs_produits,
    (SELECT json_agg(json_build_object('produit', nom, 'stock', stock_actuel, 'alerte', type_alerte)) FROM alertes_stock) AS alertes_stock;

-- ============================================================================
-- CTE 5 : Ventes par catégorie avec pourcentage (WITH)
-- ============================================================================

WITH ventes_categories AS (
    SELECT 
        cat.nom AS categorie,
        COALESCE(SUM(lv.sous_total), 0) AS montant
    FROM categories cat
    LEFT JOIN produits p ON p.categorie_id = cat.id
    LEFT JOIN lignes_vente lv ON lv.produit_id = p.id
    LEFT JOIN ventes v ON v.id = lv.vente_id AND v.statut = 'terminee'
    GROUP BY cat.nom
    HAVING COALESCE(SUM(lv.sous_total), 0) > 0
),
total_general AS (
    SELECT SUM(montant) AS total FROM ventes_categories
)
SELECT 
    vc.categorie,
    vc.montant,
    ROUND(vc.montant * 100.0 / NULLIF(tg.total, 0), 1) AS pourcentage
FROM ventes_categories vc
CROSS JOIN total_general tg
ORDER BY vc.montant DESC;

-- ============================================================================
-- FIN du script 07_cte.sql
-- ============================================================================
