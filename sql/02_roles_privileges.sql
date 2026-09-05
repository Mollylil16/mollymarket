-- ============================================================================
-- MOLLY MARKET - Script 02 : Rôles et Privilèges
-- Base de données : mollymarket_backend
-- ============================================================================

-- Suppression des rôles existants (si besoin de réinitialisation)
DO $$
BEGIN
    -- Révoquer tous les privilèges existants
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM administrateur' ;
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM vendeur';
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM magasinier';
    EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM directeur';
EXCEPTION WHEN OTHERS THEN
    NULL; -- Ignorer si les rôles n'existent pas encore
END $$;

DROP ROLE IF EXISTS administrateur;
DROP ROLE IF EXISTS vendeur;
DROP ROLE IF EXISTS magasinier;
DROP ROLE IF EXISTS directeur;

-- ============================================================================
-- CRÉATION DES RÔLES
-- ============================================================================

-- Rôle Administrateur : accès complet
CREATE ROLE administrateur;
COMMENT ON ROLE administrateur IS 'Accès complet à toutes les tables et opérations';

-- Rôle Vendeur : gestion des ventes et clients
CREATE ROLE vendeur;
COMMENT ON ROLE vendeur IS 'Peut effectuer des ventes, gérer les clients et paiements';

-- Rôle Magasinier : gestion des stocks et achats
CREATE ROLE magasinier;
COMMENT ON ROLE magasinier IS 'Peut gérer le stock, les produits, les catégories et les achats fournisseurs';

-- Rôle Directeur : consultation des statistiques et validation
CREATE ROLE directeur;
COMMENT ON ROLE directeur IS 'Peut consulter les statistiques, valider les points de caisse et les achats';

-- ============================================================================
-- PRIVILÈGES DU RÔLE : administrateur
-- Accès complet à toutes les tables
-- ============================================================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO administrateur;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO administrateur;
GRANT USAGE ON SCHEMA public TO administrateur;

-- ============================================================================
-- PRIVILÈGES DU RÔLE : vendeur
-- Ventes, clients, paiements, consultation produits
-- ============================================================================

GRANT USAGE ON SCHEMA public TO vendeur;

-- Le vendeur peut consulter les produits (pour la caisse)
GRANT SELECT ON produits TO vendeur;
GRANT SELECT ON categories TO vendeur;

-- Le vendeur gère les clients
GRANT SELECT, INSERT, UPDATE ON clients TO vendeur;
GRANT USAGE, SELECT ON SEQUENCE clients_id_seq TO vendeur;

-- Le vendeur effectue les ventes
GRANT SELECT, INSERT ON ventes TO vendeur;
GRANT USAGE, SELECT ON SEQUENCE ventes_id_seq TO vendeur;
GRANT SELECT, INSERT ON lignes_vente TO vendeur;
GRANT USAGE, SELECT ON SEQUENCE lignes_vente_id_seq TO vendeur;

-- Le vendeur gère les paiements
GRANT SELECT, INSERT ON paiements TO vendeur;
GRANT USAGE, SELECT ON SEQUENCE paiements_id_seq TO vendeur;

-- Le vendeur consulte les points de caisse
GRANT SELECT, INSERT, UPDATE ON points_caisse TO vendeur;
GRANT USAGE, SELECT ON SEQUENCE points_caisse_id_seq TO vendeur;
GRANT SELECT, INSERT, UPDATE ON billetage_point_caisse TO vendeur;
GRANT USAGE, SELECT ON SEQUENCE billetage_point_caisse_id_seq TO vendeur;

-- Le vendeur peut lire les utilisateurs (pour afficher son profil)
GRANT SELECT ON utilisateurs TO vendeur;

-- Le vendeur peut lire les mouvements de stock (consultation)
GRANT SELECT ON mouvements_stock TO vendeur;
GRANT USAGE, SELECT ON SEQUENCE mouvements_stock_id_seq TO vendeur;

-- ============================================================================
-- PRIVILÈGES DU RÔLE : magasinier
-- Stocks, produits, catégories, fournisseurs, achats
-- ============================================================================

GRANT USAGE ON SCHEMA public TO magasinier;

-- Le magasinier gère les produits
GRANT SELECT, INSERT, UPDATE ON produits TO magasinier;
GRANT USAGE, SELECT ON SEQUENCE produits_id_seq TO magasinier;

-- Le magasinier gère les catégories
GRANT SELECT, INSERT, UPDATE, DELETE ON categories TO magasinier;
GRANT USAGE, SELECT ON SEQUENCE categories_id_seq TO magasinier;

-- Le magasinier gère les fournisseurs
GRANT SELECT, INSERT, UPDATE ON fournisseurs TO magasinier;
GRANT USAGE, SELECT ON SEQUENCE fournisseurs_id_seq TO magasinier;

-- Le magasinier gère les achats
GRANT SELECT, INSERT, UPDATE ON achats TO magasinier;
GRANT USAGE, SELECT ON SEQUENCE achats_id_seq TO magasinier;
GRANT SELECT, INSERT ON lignes_achat TO magasinier;
GRANT USAGE, SELECT ON SEQUENCE lignes_achat_id_seq TO magasinier;

-- Le magasinier gère les mouvements de stock
GRANT SELECT, INSERT ON mouvements_stock TO magasinier;
GRANT USAGE, SELECT ON SEQUENCE mouvements_stock_id_seq TO magasinier;

-- Le magasinier peut lire les utilisateurs (pour afficher son profil)
GRANT SELECT ON utilisateurs TO magasinier;

-- ============================================================================
-- PRIVILÈGES DU RÔLE : directeur
-- Consultation statistiques, validation achats et points de caisse
-- ============================================================================

GRANT USAGE ON SCHEMA public TO directeur;

-- Le directeur consulte toutes les tables en lecture
GRANT SELECT ON ALL TABLES IN SCHEMA public TO directeur;

-- Le directeur peut valider les achats (UPDATE statut)
GRANT UPDATE ON achats TO directeur;

-- Le directeur peut valider les points de caisse
GRANT UPDATE ON points_caisse TO directeur;

-- Le directeur gère la trésorerie
GRANT INSERT, UPDATE ON mouvements_caisse TO directeur;
GRANT USAGE, SELECT ON SEQUENCE mouvements_caisse_id_seq TO directeur;

-- Le directeur peut payer les factures fournisseurs
GRANT UPDATE ON achats TO directeur;

-- ============================================================================
-- CRÉATION DES UTILISATEURS (LOGIN)
-- ============================================================================

-- Suppression des utilisateurs existants
DROP USER IF EXISTS admin_molly;
DROP USER IF EXISTS directeur_molly;
DROP USER IF EXISTS vendeur_molly;
DROP USER IF EXISTS magasinier_molly;

-- Utilisateur Administrateur
CREATE USER admin_molly WITH PASSWORD 'admin225';
GRANT administrateur TO admin_molly;
COMMENT ON ROLE admin_molly IS 'Utilisateur : Kouamé Brunell (Administrateur)';

-- Utilisateur Directeur
CREATE USER directeur_molly WITH PASSWORD 'directeur225';
GRANT directeur TO directeur_molly;
COMMENT ON ROLE directeur_molly IS 'Utilisateur : Touré Eden (Directeur)';

-- Utilisateur Vendeur
CREATE USER vendeur_molly WITH PASSWORD 'vendeur225';
GRANT vendeur TO vendeur_molly;
COMMENT ON ROLE vendeur_molly IS 'Utilisateur : Koffi Noam (Vendeur)';

-- Utilisateur Magasinier
CREATE USER magasinier_molly WITH PASSWORD 'magasinier225';
GRANT magasinier TO magasinier_molly;
COMMENT ON ROLE magasinier_molly IS 'Utilisateur : Bakayoko Ayo (Magasinier)';

-- ============================================================================
-- VÉRIFICATION DES RÔLES
-- ============================================================================

-- Requête de vérification : lister les rôles et leurs privilèges
SELECT 
    r.rolname AS "Rôle",
    CASE 
        WHEN r.rolsuper THEN 'Oui'
        ELSE 'Non'
    END AS "Superuser",
    CASE 
        WHEN r.rolcreatedb THEN 'Oui'
        ELSE 'Non'
    END AS "Créer BD",
    CASE 
        WHEN r.rolcanlogin THEN 'Oui'
        ELSE 'Non'
    END AS "Connexion"
FROM pg_roles r
WHERE r.rolname IN ('administrateur', 'vendeur', 'magasinier', 'directeur',
                     'admin_molly', 'directeur_molly', 'vendeur_molly', 'magasinier_molly')
ORDER BY r.rolname;

-- ============================================================================
-- FIN du script 02_roles_privileges.sql
-- ============================================================================
