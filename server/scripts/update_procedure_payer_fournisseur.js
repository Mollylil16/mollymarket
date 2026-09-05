import pool from '../db.js';

async function run() {
  try {
    await pool.query(`
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

          -- 1. Statut d'achat
          UPDATE achats SET 
              statut = 'paye_par_directeur',
              paye_par_id = p_paye_par_id,
              date_paiement = CURRENT_TIMESTAMP
          WHERE id = p_achat_id;

          -- 2. Sortie de caisse physique si espèces ou caisse
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
    `);
    console.log('✅ Procédure payer_facture_fournisseur mise à jour avec succès');
    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur SQL:', err);
    process.exit(1);
  }
}

run();
