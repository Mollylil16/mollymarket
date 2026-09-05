-- ============================================================================
-- MOLLY MARKET - Script 04 : Fonctions
-- Base de données : mollymarket_backend
-- ============================================================================

-- ============================================================================
-- FONCTION : calcul_total_commande(p_vente_id)
-- Calcule le total d'une vente à partir de ses lignes
-- ============================================================================
CREATE OR REPLACE FUNCTION calcul_total_commande(p_vente_id INTEGER)
RETURNS NUMERIC(12,2) AS $$
DECLARE
    v_total NUMERIC(12,2);
BEGIN
    SELECT COALESCE(SUM(sous_total), 0)
    INTO v_total
    FROM lignes_vente
    WHERE vente_id = p_vente_id;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcul_total_commande IS 'Calcule le montant total d''une vente';

-- ============================================================================
-- FONCTION : meilleur_client()
-- Retourne le client ayant le plus dépensé
-- ============================================================================
CREATE OR REPLACE FUNCTION meilleur_client()
RETURNS TABLE(
    client_id INTEGER,
    code_client VARCHAR,
    nom_complet TEXT,
    email VARCHAR,
    nombre_achats BIGINT,
    total_depense NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.code_client,
        (c.prenom || ' ' || c.nom)::TEXT,
        c.email,
        COUNT(v.id),
        COALESCE(SUM(v.montant_total), 0)
    FROM clients c
    JOIN ventes v ON v.client_id = c.id AND v.statut = 'terminee'
    GROUP BY c.id, c.code_client, c.prenom, c.nom, c.email
    ORDER BY COALESCE(SUM(v.montant_total), 0) DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION meilleur_client IS 'Retourne le meilleur client (plus gros dépensier)';

-- ============================================================================
-- FONCTION : meilleur_produit()
-- Retourne le produit ayant le plus de chiffre d'affaires
-- ============================================================================
CREATE OR REPLACE FUNCTION meilleur_produit()
RETURNS TABLE(
    produit_id INTEGER,
    code_barre VARCHAR,
    nom VARCHAR,
    categorie TEXT,
    quantite_vendue BIGINT,
    chiffre_affaires NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.code_barre,
        p.nom,
        cat.nom::TEXT,
        COALESCE(SUM(lv.quantite), 0)::BIGINT,
        COALESCE(SUM(lv.sous_total), 0)
    FROM produits p
    JOIN categories cat ON cat.id = p.categorie_id
    LEFT JOIN lignes_vente lv ON lv.produit_id = p.id
    LEFT JOIN ventes v ON v.id = lv.vente_id AND v.statut = 'terminee'
    GROUP BY p.id, p.code_barre, p.nom, cat.nom
    ORDER BY COALESCE(SUM(lv.sous_total), 0) DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION meilleur_produit IS 'Retourne le produit avec le meilleur chiffre d''affaires';

-- ============================================================================
-- FONCTION : chiffre_affaires(p_periode)
-- Retourne le CA selon la période demandée (jour/mois/annee)
-- ============================================================================
CREATE OR REPLACE FUNCTION chiffre_affaires(p_periode TEXT DEFAULT 'jour')
RETURNS JSON AS $$
DECLARE
    v_result JSON;
    v_journalier NUMERIC;
    v_hier NUMERIC;
    v_mensuel NUMERIC;
    v_mois_dernier NUMERIC;
    v_annuel NUMERIC;
    v_evol_jour NUMERIC;
    v_evol_mois NUMERIC;
BEGIN
    -- CA journalier
    SELECT COALESCE(SUM(montant_total), 0) INTO v_journalier
    FROM ventes WHERE statut = 'terminee' AND date_vente::DATE = CURRENT_DATE;
    
    -- CA hier
    SELECT COALESCE(SUM(montant_total), 0) INTO v_hier
    FROM ventes WHERE statut = 'terminee' AND date_vente::DATE = CURRENT_DATE - INTERVAL '1 day';
    
    -- CA mensuel
    SELECT COALESCE(SUM(montant_total), 0) INTO v_mensuel
    FROM ventes WHERE statut = 'terminee' 
    AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE);
    
    -- CA mois dernier
    SELECT COALESCE(SUM(montant_total), 0) INTO v_mois_dernier
    FROM ventes WHERE statut = 'terminee' 
    AND DATE_TRUNC('month', date_vente) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');
    
    -- CA annuel
    SELECT COALESCE(SUM(montant_total), 0) INTO v_annuel
    FROM ventes WHERE statut = 'terminee' 
    AND DATE_TRUNC('year', date_vente) = DATE_TRUNC('year', CURRENT_DATE);
    
    -- Calcul des évolutions
    v_evol_jour := CASE WHEN v_hier > 0 THEN ROUND(((v_journalier - v_hier) / v_hier) * 100, 2) ELSE 0 END;
    v_evol_mois := CASE WHEN v_mois_dernier > 0 THEN ROUND(((v_mensuel - v_mois_dernier) / v_mois_dernier) * 100, 2) ELSE 0 END;
    
    v_result := json_build_object(
        'journalier', v_journalier,
        'hier', v_hier,
        'evolution_journaliere', v_evol_jour,
        'mensuel', v_mensuel,
        'mois_dernier', v_mois_dernier,
        'evolution_mensuelle', v_evol_mois,
        'annuel', v_annuel
    );
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION chiffre_affaires IS 'Calcule le chiffre d''affaires avec évolution';

-- ============================================================================
-- FONCTION : nombre_commandes(p_date_debut, p_date_fin)
-- Compte les commandes sur une période
-- ============================================================================
CREATE OR REPLACE FUNCTION nombre_commandes(
    p_date_debut DATE DEFAULT CURRENT_DATE,
    p_date_fin DATE DEFAULT CURRENT_DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM ventes
    WHERE statut = 'terminee'
    AND date_vente::DATE BETWEEN p_date_debut AND p_date_fin;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION nombre_commandes IS 'Compte les ventes terminées sur une période';

-- ============================================================================
-- FONCTION : stock_disponible(p_produit_id)
-- Retourne le stock actuel d'un produit
-- ============================================================================
CREATE OR REPLACE FUNCTION stock_disponible(p_produit_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_stock INTEGER;
BEGIN
    SELECT stock_actuel INTO v_stock
    FROM produits
    WHERE id = p_produit_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Produit #% introuvable', p_produit_id;
    END IF;
    
    RETURN v_stock;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION stock_disponible IS 'Retourne le stock disponible d''un produit';

-- ============================================================================
-- FONCTION : fn_authentifier_utilisateur(p_email, p_mot_de_passe)
-- Authentification d'un utilisateur
-- Note: Pour la démo, on compare directement le hash simple.
-- En production, utiliser pgcrypto avec crypt() et gen_salt()
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_authentifier_utilisateur(
    p_email VARCHAR,
    p_mot_de_passe VARCHAR
)
RETURNS TABLE(
    user_id INTEGER,
    user_matricule VARCHAR,
    user_nom VARCHAR,
    user_prenom VARCHAR,
    user_email VARCHAR,
    user_role TEXT,
    user_avatar TEXT,
    user_dernier_acces TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.matricule,
        u.nom,
        u.prenom,
        u.email,
        u.role::TEXT,
        COALESCE(u.avatar_url, '')::TEXT,
        COALESCE(TO_CHAR(u.dernier_acces, 'YYYY-MM-DD HH24:MI'), '')::TEXT
    FROM utilisateurs u
    WHERE u.email = p_email 
    AND u.mot_de_passe_hash = p_mot_de_passe
    AND u.actif = TRUE;
    
    -- Mettre à jour le dernier accès
    UPDATE utilisateurs SET dernier_acces = CURRENT_TIMESTAMP 
    WHERE email = p_email AND actif = TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_authentifier_utilisateur IS 'Authentifie un utilisateur par email et mot de passe';

-- ============================================================================
-- FONCTION : fn_evolution_ventes(p_periode)
-- Retourne l'évolution des ventes pour les graphiques
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_evolution_ventes(p_periode TEXT DEFAULT 'mois')
RETURNS TABLE(
    periode TEXT,
    montant NUMERIC,
    nombre_ventes BIGINT
) AS $$
BEGIN
    IF p_periode = 'jour' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(v.date_vente, 'HH24') || 'h' AS per,
            COALESCE(SUM(v.montant_total), 0),
            COUNT(v.id)
        FROM ventes v
        WHERE v.statut = 'terminee' AND v.date_vente::DATE = CURRENT_DATE
        GROUP BY TO_CHAR(v.date_vente, 'HH24')
        ORDER BY TO_CHAR(v.date_vente, 'HH24');
    ELSIF p_periode = 'annee' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(v.date_vente, 'YYYY') AS per,
            COALESCE(SUM(v.montant_total), 0),
            COUNT(v.id)
        FROM ventes v
        WHERE v.statut = 'terminee'
        GROUP BY TO_CHAR(v.date_vente, 'YYYY')
        ORDER BY TO_CHAR(v.date_vente, 'YYYY');
    ELSE
        -- Par défaut : semaines du mois courant
        RETURN QUERY
        SELECT 
            'Semaine ' || TO_CHAR(v.date_vente, 'W') AS per,
            COALESCE(SUM(v.montant_total), 0),
            COUNT(v.id)
        FROM ventes v
        WHERE v.statut = 'terminee'
        AND DATE_TRUNC('month', v.date_vente) = DATE_TRUNC('month', CURRENT_DATE)
        GROUP BY TO_CHAR(v.date_vente, 'W')
        ORDER BY TO_CHAR(v.date_vente, 'W');
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_evolution_ventes IS 'Retourne l''évolution des ventes par période pour les graphiques';

-- ============================================================================
-- FONCTION : fn_generer_numero_ticket()
-- Génère un numéro de ticket unique
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_generer_numero_ticket()
RETURNS VARCHAR AS $$
DECLARE
    v_num INTEGER;
    v_ticket VARCHAR;
BEGIN
    SELECT COUNT(*) + 1 INTO v_num
    FROM ventes 
    WHERE date_vente::DATE = CURRENT_DATE;
    
    v_ticket := 'TK-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_num::TEXT, 3, '0');
    RETURN v_ticket;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : fn_generer_numero_achat()
-- Génère un numéro d'achat unique
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_generer_numero_achat()
RETURNS VARCHAR AS $$
DECLARE
    v_num INTEGER;
    v_ref VARCHAR;
BEGIN
    SELECT COUNT(*) + 1 INTO v_num
    FROM achats 
    WHERE date_achat::DATE = CURRENT_DATE;
    
    v_ref := 'ACH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_num::TEXT, 2, '0');
    RETURN v_ref;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : fn_generer_code_client()
-- Génère un code client unique
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_generer_code_client()
RETURNS VARCHAR AS $$
DECLARE
    v_num INTEGER;
BEGIN
    SELECT COALESCE(MAX(id), 0) + 1 INTO v_num FROM clients;
    RETURN 'CLI-' || LPAD(v_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FONCTION : fn_generer_reference_paiement()
-- Génère une référence de paiement unique
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_generer_reference_paiement()
RETURNS VARCHAR AS $$
DECLARE
    v_num INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO v_num
    FROM paiements 
    WHERE date_paiement::DATE = CURRENT_DATE;
    
    RETURN 'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(v_num::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FIN du script 04_fonctions.sql
-- ============================================================================
