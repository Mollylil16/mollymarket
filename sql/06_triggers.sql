-- ============================================================================
-- MOLLY MARKET - Script 06 : Triggers
-- Base de données : mollymarket_backend
-- ============================================================================

-- ============================================================================
-- TRIGGER 1 : Interdire un prix négatif (produits)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_interdire_prix_negatif()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.prix_vente < 0 THEN
        RAISE EXCEPTION 'ERREUR TRIGGER : Le prix de vente ne peut pas être négatif (valeur: %)', NEW.prix_vente;
    END IF;
    IF NEW.prix_achat < 0 THEN
        RAISE EXCEPTION 'ERREUR TRIGGER : Le prix d''achat ne peut pas être négatif (valeur: %)', NEW.prix_achat;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_interdire_prix_negatif ON produits;
CREATE TRIGGER trg_interdire_prix_negatif
    BEFORE INSERT OR UPDATE ON produits
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_interdire_prix_negatif();

COMMENT ON TRIGGER trg_interdire_prix_negatif ON produits IS 'Empêche l''insertion ou la mise à jour avec un prix négatif';

-- ============================================================================
-- TRIGGER 2 : Empêcher un stock négatif (produits)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_empecher_stock_negatif()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_actuel < 0 THEN
        RAISE EXCEPTION 'ERREUR TRIGGER : Le stock ne peut pas être négatif pour le produit "%" (stock résultant: %)', 
            NEW.nom, NEW.stock_actuel;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_empecher_stock_negatif ON produits;
CREATE TRIGGER trg_empecher_stock_negatif
    BEFORE UPDATE ON produits
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_empecher_stock_negatif();

COMMENT ON TRIGGER trg_empecher_stock_negatif ON produits IS 'Empêche que le stock d''un produit devienne négatif';

-- ============================================================================
-- TRIGGER 3 : Calcul automatique du montant d'une commande (lignes_vente)
-- Après insertion d'une ligne de vente, recalcule le montant total
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_calcul_montant_commande()
RETURNS TRIGGER AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    SELECT COALESCE(SUM(quantite * prix_unitaire), 0)
    INTO v_total
    FROM lignes_vente
    WHERE vente_id = NEW.vente_id;
    
    UPDATE ventes SET montant_total = v_total WHERE id = NEW.vente_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcul_montant_commande ON lignes_vente;
CREATE TRIGGER trg_calcul_montant_commande
    AFTER INSERT ON lignes_vente
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_calcul_montant_commande();

COMMENT ON TRIGGER trg_calcul_montant_commande ON lignes_vente IS 'Recalcule automatiquement le montant total de la vente';

-- ============================================================================
-- TRIGGER 4 : Mise à jour automatique du stock lors d'une vente (lignes_vente)
-- Après insertion d'une ligne de vente, décrémente le stock et crée un mouvement
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_maj_stock_vente()
RETURNS TRIGGER AS $$
DECLARE
    v_stock_avant INTEGER;
    v_numero_ticket VARCHAR;
    v_vendeur_id INTEGER;
BEGIN
    -- Récupérer le stock avant
    SELECT stock_actuel INTO v_stock_avant FROM produits WHERE id = NEW.produit_id;
    
    -- Décrémenter le stock
    UPDATE produits 
    SET stock_actuel = stock_actuel - NEW.quantite,
        date_maj = CURRENT_TIMESTAMP
    WHERE id = NEW.produit_id;
    
    -- Récupérer le numéro de ticket et le vendeur
    SELECT numero_ticket, vendeur_id INTO v_numero_ticket, v_vendeur_id
    FROM ventes WHERE id = NEW.vente_id;
    
    -- Enregistrer le mouvement de stock
    INSERT INTO mouvements_stock (produit_id, type_mouvement, quantite, stock_avant, stock_apres,
                                  reference_document, utilisateur_id, motif)
    VALUES (NEW.produit_id, 'sortie_vente', -NEW.quantite, v_stock_avant,
            v_stock_avant - NEW.quantite, v_numero_ticket, v_vendeur_id,
            'Vente caisse #' || v_numero_ticket);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_maj_stock_vente ON lignes_vente;
CREATE TRIGGER trg_maj_stock_vente
    AFTER INSERT ON lignes_vente
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_maj_stock_vente();

COMMENT ON TRIGGER trg_maj_stock_vente ON lignes_vente IS 'Décrémente automatiquement le stock après chaque vente';

-- ============================================================================
-- TRIGGER 5 : Historique des modifications de prix (produits)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_historique_prix()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.prix_vente IS DISTINCT FROM NEW.prix_vente 
       OR OLD.prix_achat IS DISTINCT FROM NEW.prix_achat THEN
        INSERT INTO historique_prix (produit_id, ancien_prix_vente, nouveau_prix_vente,
                                     ancien_prix_achat, nouveau_prix_achat)
        VALUES (NEW.id, OLD.prix_vente, NEW.prix_vente, OLD.prix_achat, NEW.prix_achat);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_historique_prix ON produits;
CREATE TRIGGER trg_historique_prix
    AFTER UPDATE ON produits
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_historique_prix();

COMMENT ON TRIGGER trg_historique_prix ON produits IS 'Enregistre l''historique des modifications de prix';

-- ============================================================================
-- TRIGGER 6 : Journalisation des suppressions (clients)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_journal_suppression_clients()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO journal_suppressions (table_nom, enregistrement_id, donnees_json)
    VALUES ('clients', OLD.id, to_jsonb(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_suppression_clients ON clients;
CREATE TRIGGER trg_journal_suppression_clients
    AFTER DELETE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_journal_suppression_clients();

-- ============================================================================
-- TRIGGER 7 : Journalisation des suppressions (produits)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_journal_suppression_produits()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO journal_suppressions (table_nom, enregistrement_id, donnees_json)
    VALUES ('produits', OLD.id, to_jsonb(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_suppression_produits ON produits;
CREATE TRIGGER trg_journal_suppression_produits
    AFTER DELETE ON produits
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_journal_suppression_produits();

-- ============================================================================
-- TRIGGER 8 : Journalisation des suppressions (ventes)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_journal_suppression_ventes()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO journal_suppressions (table_nom, enregistrement_id, donnees_json)
    VALUES ('ventes', OLD.id, to_jsonb(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_suppression_ventes ON ventes;
CREATE TRIGGER trg_journal_suppression_ventes
    AFTER DELETE ON ventes
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_journal_suppression_ventes();

-- ============================================================================
-- TRIGGER 9 : Journalisation des suppressions (categories)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_journal_suppression_categories()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO journal_suppressions (table_nom, enregistrement_id, donnees_json)
    VALUES ('categories', OLD.id, to_jsonb(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_suppression_categories ON categories;
CREATE TRIGGER trg_journal_suppression_categories
    AFTER DELETE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_journal_suppression_categories();

-- ============================================================================
-- TRIGGER 10 : Journalisation des suppressions (fournisseurs)
-- ============================================================================
CREATE OR REPLACE FUNCTION trg_fn_journal_suppression_fournisseurs()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO journal_suppressions (table_nom, enregistrement_id, donnees_json)
    VALUES ('fournisseurs', OLD.id, to_jsonb(OLD));
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_suppression_fournisseurs ON fournisseurs;
CREATE TRIGGER trg_journal_suppression_fournisseurs
    AFTER DELETE ON fournisseurs
    FOR EACH ROW
    EXECUTE FUNCTION trg_fn_journal_suppression_fournisseurs();

-- ============================================================================
-- FIN du script 06_triggers.sql
-- ============================================================================
