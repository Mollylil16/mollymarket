import pool from '../db.js';

async function run() {
  try {
    const achat = await pool.query('SELECT a.*, f.nom_entreprise FROM achats a JOIN fournisseurs f ON f.id = a.fournisseur_id WHERE a.id = 1');
    if (achat.rows.length > 0) {
      const a = achat.rows[0];
      const montant = Number(a.montant_total);
      const soldeApres = 102200 - montant; // 80 700 FCFA
      
      const existing = await pool.query("SELECT id FROM mouvements_caisse WHERE justificatif = $1", [a.numero_achat]);
      if (existing.rows.length === 0) {
        await pool.query(
          "INSERT INTO mouvements_caisse (sens, type, montant, motif, justificatif, effectue_par_id, solde_apres) VALUES ('sortie', 'paiement_fournisseur', $1, 'Règlement Facture Fournisseur ' || $2, $3, 2, $4)",
          [montant, a.nom_entreprise, a.numero_achat, soldeApres]
        );
        console.log('✅ Sortie de caisse enregistrée pour le bon', a.numero_achat, ':', montant, 'FCFA');
      }
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}

run();
