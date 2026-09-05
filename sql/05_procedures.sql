-- ============================================================================
-- MOLLY MARKET - Script 05 : Procédures Stockées
-- Base de données : mollymarket_backend
-- ============================================================================

-- ============================================================================
-- PROCÉDURE : ajouter_client
-- ============================================================================
CREATE OR REPLACE PROCEDURE ajouter_client(
    p_nom VARCHAR,
    p_prenom VARCHAR,
    p_telephone VARCHAR,
    p_email VARCHAR,
    p_adresse TEXT,
    INOUT p_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO clients (code_client, nom, prenom, telephone, email, adresse)
    VALUES (fn_generer_code_client(), p_nom, p_prenom, p_telephone, p_email, p_adresse)
    RETURNING id INTO p_id;
END;
$$;

COMMENT ON PROCEDURE ajouter_client IS 'Ajoute un nouveau client avec code auto-généré';

-- ============================================================================
-- PROCÉDURE : modifier_client
-- ============================================================================
CREATE OR REPLACE PROCEDURE modifier_client(
    p_id INTEGER,
    p_nom VARCHAR,
    p_prenom VARCHAR,
    p_telephone VARCHAR,
    p_email VARCHAR,
    p_adresse TEXT
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE clients 
    SET nom = p_nom, prenom = p_prenom, telephone = p_telephone,
        email = p_email, adresse = p_adresse
    WHERE id = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client #% introuvable', p_id;
    END IF;
END;
$$;

-- ============================================================================
-- PROCÉDURE : desactiver_client
-- ============================================================================
CREATE OR REPLACE PROCEDURE desactiver_client(
    p_id INTEGER,
    p_actif BOOLEAN
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE clients SET actif = p_actif WHERE id = p_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Client #% introuvable', p_id;
    END IF;
END;
$$;

-- ============================================================================
-- PROCÉDURE : ajouter_produit
-- ============================================================================
CREATE OR REPLACE PROCEDURE ajouter_produit(
    p_code_barre VARCHAR,
    p_nom VARCHAR,
    p_categorie_id INTEGER,
    p_prix_vente NUMERIC,
    p_prix_achat NUMERIC,
    p_seuil_alerte INTEGER,
    p_unite_mesure VARCHAR,
    p_stock_initial INTEGER DEFAULT 0,
    INOUT p_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    -- Vérification des prix (sécurité supplémentaire, le CHECK contraint aussi)
    IF p_prix_vente < 0 OR p_prix_achat < 0 THEN
        RAISE EXCEPTION 'Le prix de vente ou d''achat ne peut pas être négatif';
    END IF;
    
    INSERT INTO produits (code_barre, nom, categorie_id, prix_vente, prix_achat, 
                          seuil_alerte, stock_actuel, unite_mesure)
    VALUES (p_code_barre, p_nom, p_categorie_id, p_prix_vente, p_prix_achat,
            p_seuil_alerte, p_stock_initial, p_unite_mesure)
    RETURNING id INTO p_id;
END;
$$;

COMMENT ON PROCEDURE ajouter_produit IS 'Ajoute un nouveau produit avec vérification des prix';

-- ============================================================================
-- PROCÉDURE : modifier_produit
-- ============================================================================
CREATE OR REPLACE PROCEDURE modifier_produit(
    p_id INTEGER,
    p_nom VARCHAR DEFAULT NULL,
    p_prix_vente NUMERIC DEFAULT NULL,
    p_prix_achat NUMERIC DEFAULT NULL,
    p_seuil_alerte INTEGER DEFAULT NULL,
    p_categorie_id INTEGER DEFAULT NULL,
    p_unite_mesure VARCHAR DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE produits SET
        nom = COALESCE(p_nom, nom),
        prix_vente = COALESCE(p_prix_vente, prix_vente),
        prix_achat = COALESCE(p_prix_achat, prix_achat),
        seuil_alerte = COALESCE(p_seuil_alerte, seuil_alerte),
        categorie_id = COALESCE(p_categorie_id, categorie_id),
        unite_mesure = COALESCE(p_unite_mesure, unite_mesure),
        date_maj = CURRENT_TIMESTAMP
    WHERE id = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produit #% introuvable', p_id;
    END IF;
END;
$$;

-- ============================================================================
-- PROCÉDURE : effectuer_vente
-- Crée la vente, les lignes, le paiement et met à jour le stock
-- ============================================================================
CREATE OR REPLACE PROCEDURE effectuer_vente(
    p_client_id INTEGER,
    p_lignes JSON,
    p_vendeur_id INTEGER,
    p_mode_paiement TEXT DEFAULT 'especes',
    INOUT p_vente_id INTEGER DEFAULT NULL,
    INOUT p_numero_ticket VARCHAR DEFAULT NULL,
    INOUT p_montant_total NUMERIC DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_ligne JSON;
    v_produit RECORD;
    v_total NUMERIC := 0;
    v_ref_paiement VARCHAR;
BEGIN
    -- Générer le numéro de ticket
    p_numero_ticket := fn_generer_numero_ticket();
    
    -- Créer la vente
    INSERT INTO ventes (numero_ticket, client_id, vendeur_id, montant_total, statut)
    VALUES (p_numero_ticket, NULLIF(p_client_id, 0), p_vendeur_id, 0, 'terminee')
    RETURNING id INTO p_vente_id;
    
    -- Parcourir les lignes du panier
    FOR v_ligne IN SELECT * FROM json_array_elements(p_lignes)
    LOOP
        -- Vérifier le stock
        SELECT id, nom, stock_actuel, prix_vente INTO v_produit
        FROM produits 
        WHERE id = (v_ligne->>'produit_id')::INTEGER;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Produit #% inexistant', (v_ligne->>'produit_id')::INTEGER;
        END IF;
        
        IF v_produit.stock_actuel < (v_ligne->>'quantite')::INTEGER THEN
            RAISE EXCEPTION 'Stock insuffisant pour "%" : % en stock, % demandé',
                v_produit.nom, v_produit.stock_actuel, (v_ligne->>'quantite')::INTEGER;
        END IF;
        
        -- Insérer la ligne de vente (le trigger recalcule le montant total et met à jour le stock)
        INSERT INTO lignes_vente (vente_id, produit_id, quantite, prix_unitaire)
        VALUES (
            p_vente_id,
            (v_ligne->>'produit_id')::INTEGER,
            (v_ligne->>'quantite')::INTEGER,
            v_produit.prix_vente
        );
    END LOOP;
    
    -- Récupérer le montant total recalculé par le trigger
    SELECT montant_total INTO p_montant_total FROM ventes WHERE id = p_vente_id;
    
    -- Créer le paiement automatique
    v_ref_paiement := fn_generer_reference_paiement();
    INSERT INTO paiements (reference_paiement, vente_id, montant, mode_paiement, statut)
    VALUES (v_ref_paiement, p_vente_id, p_montant_total, p_mode_paiement::mode_paiement, 'paye');
END;
$$;

COMMENT ON PROCEDURE effectuer_vente IS 'Effectue une vente complète : création ticket + lignes + paiement + MAJ stock';

-- ============================================================================
-- PROCÉDURE : annuler_vente
-- Annule une vente et réintègre le stock
-- ============================================================================
CREATE OR REPLACE PROCEDURE annuler_vente(
    p_vente_id INTEGER,
    p_motif TEXT,
    p_utilisateur_id INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_ligne RECORD;
    v_stock_avant INTEGER;
    v_numero_ticket VARCHAR;
BEGIN
    -- Vérifier que la vente existe et n'est pas déjà annulée
    SELECT numero_ticket INTO v_numero_ticket FROM ventes WHERE id = p_vente_id AND statut = 'terminee';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vente #% introuvable ou déjà annulée', p_vente_id;
    END IF;
    
    -- Réintégrer le stock pour chaque ligne
    FOR v_ligne IN SELECT * FROM lignes_vente WHERE vente_id = p_vente_id
    LOOP
        SELECT stock_actuel INTO v_stock_avant FROM produits WHERE id = v_ligne.produit_id;
        
        UPDATE produits 
        SET stock_actuel = stock_actuel + v_ligne.quantite,
            date_maj = CURRENT_TIMESTAMP
        WHERE id = v_ligne.produit_id;
        
        -- Enregistrer le mouvement de stock (retour)
        INSERT INTO mouvements_stock (produit_id, type_mouvement, quantite, stock_avant, stock_apres,
                                      reference_document, utilisateur_id, motif)
        VALUES (v_ligne.produit_id, 'annulation_vente', v_ligne.quantite, v_stock_avant,
                v_stock_avant + v_ligne.quantite, v_numero_ticket, p_utilisateur_id,
                'Annulation vente: ' || p_motif);
    END LOOP;
    
    -- Mettre à jour le statut de la vente
    UPDATE ventes SET statut = 'annulee', motif_annulation = p_motif WHERE id = p_vente_id;
    
    -- Mettre à jour le statut du paiement
    UPDATE paiements SET statut = 'impaye' WHERE vente_id = p_vente_id;
END;
$$;

COMMENT ON PROCEDURE annuler_vente IS 'Annule une vente et réintègre le stock automatiquement';

-- ============================================================================
-- PROCÉDURE : effectuer_achat
-- Crée une commande d'achat fournisseur
-- ============================================================================
CREATE OR REPLACE PROCEDURE effectuer_achat(
    p_fournisseur_id INTEGER,
    p_lignes JSON,
    p_cree_par_id INTEGER,
    INOUT p_achat_id INTEGER DEFAULT NULL,
    INOUT p_numero_achat VARCHAR DEFAULT NULL,
    INOUT p_montant_total NUMERIC DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_ligne JSON;
    v_total NUMERIC := 0;
    v_sous_total NUMERIC;
BEGIN
    p_numero_achat := fn_generer_numero_achat();
    
    -- Créer l'achat
    INSERT INTO achats (numero_achat, fournisseur_id, cree_par_id, montant_total, statut)
    VALUES (p_numero_achat, p_fournisseur_id, p_cree_par_id, 0, 'en_attente_paiement_directeur')
    RETURNING id INTO p_achat_id;
    
    -- Parcourir et insérer les lignes d'achat
    FOR v_ligne IN SELECT * FROM json_array_elements(p_lignes)
    LOOP
        v_sous_total := (v_ligne->>'quantite')::INTEGER * (v_ligne->>'prix_unitaire')::NUMERIC;
        v_total := v_total + v_sous_total;
        
        INSERT INTO lignes_achat (achat_id, produit_id, quantite, prix_unitaire)
        VALUES (
            p_achat_id,
            (v_ligne->>'produit_id')::INTEGER,
            (v_ligne->>'quantite')::INTEGER,
            (v_ligne->>'prix_unitaire')::NUMERIC
        );
    END LOOP;
    
    -- Mettre à jour le montant total
    p_montant_total := v_total;
    UPDATE achats SET montant_total = v_total WHERE id = p_achat_id;
END;
$$;

COMMENT ON PROCEDURE effectuer_achat IS 'Crée une commande d''achat fournisseur';

-- ============================================================================
-- PROCÉDURE : reception_stock
-- Réceptionne un achat et met à jour le stock
-- ============================================================================
CREATE OR REPLACE PROCEDURE reception_stock(
    p_achat_id INTEGER,
    p_utilisateur_id INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_ligne RECORD;
    v_stock_avant INTEGER;
    v_numero_achat VARCHAR;
    v_statut TEXT;
BEGIN
    -- Vérifier l'achat
    SELECT numero_achat, statut::TEXT INTO v_numero_achat, v_statut
    FROM achats WHERE id = p_achat_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande d''achat #% introuvable', p_achat_id;
    END IF;
    
    IF v_statut = 'recu' THEN
        RAISE EXCEPTION 'Cet achat a déjà été réceptionné';
    END IF;
    
    -- Mettre à jour l'achat
    UPDATE achats SET 
        statut = 'recu',
        receptionne_par_id = p_utilisateur_id,
        date_reception = CURRENT_TIMESTAMP
    WHERE id = p_achat_id;
    
    -- Incrémenter le stock pour chaque ligne
    FOR v_ligne IN SELECT * FROM lignes_achat WHERE achat_id = p_achat_id
    LOOP
        SELECT stock_actuel INTO v_stock_avant FROM produits WHERE id = v_ligne.produit_id;
        
        UPDATE produits 
        SET stock_actuel = stock_actuel + v_ligne.quantite,
            date_maj = CURRENT_TIMESTAMP
        WHERE id = v_ligne.produit_id;
        
        -- Enregistrer le mouvement de stock
        INSERT INTO mouvements_stock (produit_id, type_mouvement, quantite, stock_avant, stock_apres,
                                      reference_document, utilisateur_id, motif)
        VALUES (v_ligne.produit_id, 'entree_achat', v_ligne.quantite, v_stock_avant,
                v_stock_avant + v_ligne.quantite, v_numero_achat, p_utilisateur_id,
                'Réception bon d''achat ' || v_numero_achat);
    END LOOP;
END;
$$;

COMMENT ON PROCEDURE reception_stock IS 'Réceptionne un achat fournisseur et met à jour les stocks';

-- ============================================================================
-- PROCÉDURE : payer_facture_fournisseur
-- ============================================================================
CREATE OR REPLACE PROCEDURE payer_facture_fournisseur(
    p_achat_id INTEGER,
    p_paye_par_id INTEGER,
    p_mode_paiement VARCHAR DEFAULT 'especes'
)
LANGUAGE plpgsql AS $$
DECLARE
    v_montant NUMERIC(12,2);
    v_numero VARCHAR;
    v_frs_nom VARCHAR;
    v_dernier_solde NUMERIC(12,2);
    v_solde_apres NUMERIC(12,2);
BEGIN
    SELECT a.montant_total, a.numero_achat, f.nom_entreprise
    INTO v_montant, v_numero, v_frs_nom
    FROM achats a
    JOIN fournisseurs f ON f.id = a.fournisseur_id
    WHERE a.id = p_achat_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande d''achat #% introuvable', p_achat_id;
    END IF;

    -- 1. Mettre à jour le statut de la facture d'achat
    UPDATE achats SET 
        statut = 'paye_par_directeur',
        paye_par_id = p_paye_par_id,
        date_paiement = CURRENT_TIMESTAMP
    WHERE id = p_achat_id;

    -- 2. Sortie de caisse physique si règlement en espèces
    IF LOWER(COALESCE(p_mode_paiement, 'especes')) IN ('especes', 'caisse') THEN
        SELECT COALESCE(
            (SELECT solde_apres FROM mouvements_caisse ORDER BY date_mouvement DESC, id DESC LIMIT 1),
            50000
        ) INTO v_dernier_solde;

        v_solde_apres := GREATEST(0, v_dernier_solde - v_montant);

        INSERT INTO mouvements_caisse (
            sens,
            type,
            montant,
            motif,
            justificatif,
            effectue_par_id,
            solde_apres
        ) VALUES (
            'sortie',
            'paiement_fournisseur',
            v_montant,
            'Règlement Facture Fournisseur ' || COALESCE(v_frs_nom, 'Fournisseur'),
            COALESCE(v_numero, 'Bon Achat #' || p_achat_id),
            p_paye_par_id,
            v_solde_apres
        );
    END IF;
END;
$$;

-- ============================================================================
-- PROCÉDURE : ajouter_fournisseur
-- ============================================================================
CREATE OR REPLACE PROCEDURE ajouter_fournisseur(
    p_nom_entreprise VARCHAR,
    p_contact_nom VARCHAR,
    p_telephone VARCHAR,
    p_email VARCHAR,
    p_adresse TEXT,
    p_ville VARCHAR,
    INOUT p_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_code VARCHAR;
    v_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_num FROM fournisseurs;
    v_code := 'FRS-' || LPAD(v_num::TEXT, 4, '0');
    
    INSERT INTO fournisseurs (code_fournisseur, nom_entreprise, contact_nom, telephone, email, adresse, ville)
    VALUES (v_code, p_nom_entreprise, p_contact_nom, p_telephone, p_email, p_adresse, p_ville)
    RETURNING id INTO p_id;
END;
$$;

-- ============================================================================
-- PROCÉDURE : ajouter_categorie
-- ============================================================================
CREATE OR REPLACE PROCEDURE ajouter_categorie(
    p_code VARCHAR,
    p_nom VARCHAR,
    p_description TEXT,
    INOUT p_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO categories (code, nom, description)
    VALUES (p_code, p_nom, p_description)
    RETURNING id INTO p_id;
END;
$$;

-- ============================================================================
-- PROCÉDURE : ajuster_stock
-- ============================================================================
CREATE OR REPLACE PROCEDURE ajuster_stock(
    p_produit_id INTEGER,
    p_nouvelle_quantite INTEGER,
    p_motif TEXT,
    p_utilisateur_id INTEGER
)
LANGUAGE plpgsql AS $$
DECLARE
    v_stock_avant INTEGER;
    v_difference INTEGER;
BEGIN
    SELECT stock_actuel INTO v_stock_avant FROM produits WHERE id = p_produit_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produit #% introuvable', p_produit_id;
    END IF;
    
    v_difference := p_nouvelle_quantite - v_stock_avant;
    
    UPDATE produits 
    SET stock_actuel = p_nouvelle_quantite, date_maj = CURRENT_TIMESTAMP
    WHERE id = p_produit_id;
    
    INSERT INTO mouvements_stock (produit_id, type_mouvement, quantite, stock_avant, stock_apres,
                                  reference_document, utilisateur_id, motif)
    VALUES (p_produit_id, 'ajustement', v_difference, v_stock_avant, p_nouvelle_quantite,
            'AJUST-' || RIGHT(EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT, 5), 
            p_utilisateur_id, p_motif);
END;
$$;

COMMENT ON PROCEDURE ajuster_stock IS 'Ajuste le stock d''un produit avec traçabilité';

-- ============================================================================
-- PROCÉDURE : ajouter_employe
-- ============================================================================
CREATE OR REPLACE PROCEDURE ajouter_employe(
    p_nom VARCHAR,
    p_prenom VARCHAR,
    p_email VARCHAR,
    p_telephone VARCHAR,
    p_role TEXT,
    p_date_embauche DATE,
    p_mot_de_passe VARCHAR DEFAULT 'secret123',
    INOUT p_id INTEGER DEFAULT NULL
)
LANGUAGE plpgsql AS $$
DECLARE
    v_matricule VARCHAR;
    v_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_num FROM utilisateurs;
    v_matricule := 'EMP-' || LPAD(v_num::TEXT, 3, '0');
    
    INSERT INTO utilisateurs (matricule, nom, prenom, email, telephone, role, mot_de_passe_hash, date_embauche)
    VALUES (v_matricule, p_nom, p_prenom, p_email, p_telephone, p_role::type_role, p_mot_de_passe, p_date_embauche)
    RETURNING id INTO p_id;
END;
$$;

-- ============================================================================
-- PROCÉDURE : modifier_employe
-- ============================================================================
CREATE OR REPLACE PROCEDURE modifier_employe(
    p_id INTEGER,
    p_nom VARCHAR DEFAULT NULL,
    p_prenom VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_telephone VARCHAR DEFAULT NULL,
    p_role TEXT DEFAULT NULL,
    p_actif BOOLEAN DEFAULT NULL
)
LANGUAGE plpgsql AS $$
BEGIN
    UPDATE utilisateurs SET
        nom = COALESCE(p_nom, nom),
        prenom = COALESCE(p_prenom, prenom),
        email = COALESCE(p_email, email),
        telephone = COALESCE(p_telephone, telephone),
        role = COALESCE(p_role::type_role, role),
        actif = COALESCE(p_actif, actif)
    WHERE id = p_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Employé #% introuvable', p_id;
    END IF;
END;
$$;

-- ============================================================================
-- FIN du script 05_procedures.sql
-- ============================================================================
