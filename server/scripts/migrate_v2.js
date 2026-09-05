/**
 * @file server/scripts/migrate_v2.js
 * Migration PostgreSQL : Multi-Caisses, Indexation de performance, et intégrité
 */
import pool from '../db.js';

async function migrate() {
  console.log('🚀 Démarrage de la migration PostgreSQL V2 (Multi-Caisses & Indexation)...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Table des caisses physiques
    console.log('1. Création de la table `caisses`...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS caisses (
        id SERIAL PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        emplacement VARCHAR(100) DEFAULT 'Zone Principale',
        statut VARCHAR(30) DEFAULT 'active' CHECK (statut IN ('active', 'fermee', 'maintenance')),
        ip_terminal VARCHAR(50),
        derniere_activite TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        cree_le TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Données initiales des caisses de supermarché
    await client.query(`
      INSERT INTO caisses (code, nom, emplacement, statut)
      VALUES 
        ('CAISSE-01', 'Caisse Principale N°1 (Centrale)', 'Rez-de-chaussée - Entrée', 'active'),
        ('CAISSE-02', 'Caisse Express N°2 (Paniers < 5)', 'Rez-de-chaussée - Sortie rapide', 'active'),
        ('CAISSE-03', 'Caisse Libre-Service N°3 (Étage)', '1er Étage - Rayon Vêtements', 'active')
      ON CONFLICT (code) DO NOTHING;
    `);

    // 2. Colonne caisse_id sur points_caisse et ventes
    console.log('2. Ajout de caisse_id sur points_caisse et ventes...');
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='points_caisse' AND column_name='caisse_id'
        ) THEN
          ALTER TABLE points_caisse ADD COLUMN caisse_id INTEGER REFERENCES caisses(id) DEFAULT 1;
        END IF;

        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='ventes' AND column_name='caisse_id'
        ) THEN
          ALTER TABLE ventes ADD COLUMN caisse_id INTEGER REFERENCES caisses(id) DEFAULT 1;
        END IF;
      END $$;
    `);

    // 3. Index de performance B-Tree
    console.log('3. Création des index de performance B-Tree...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ventes_date ON ventes(date_vente);
      CREATE INDEX IF NOT EXISTS idx_ventes_vendeur ON ventes(vendeur_id);
      CREATE INDEX IF NOT EXISTS idx_ventes_caisse ON ventes(caisse_id);
      CREATE INDEX IF NOT EXISTS idx_lignes_vente_vente ON lignes_vente(vente_id);
      CREATE INDEX IF NOT EXISTS idx_lignes_vente_produit ON lignes_vente(produit_id);
      CREATE INDEX IF NOT EXISTS idx_paiements_date ON paiements(date_paiement);
      CREATE INDEX IF NOT EXISTS idx_paiements_mode ON paiements(mode_paiement);
      CREATE INDEX IF NOT EXISTS idx_paiements_vente ON paiements(vente_id);
      CREATE INDEX IF NOT EXISTS idx_points_caisse_statut_vendeur ON points_caisse(statut, vendeur_id);
      CREATE INDEX IF NOT EXISTS idx_points_caisse_caisse_id ON points_caisse(caisse_id);
      CREATE INDEX IF NOT EXISTS idx_mouvements_produit_date ON mouvements_stock(produit_id, date_mouvement);
    `);

    await client.query('COMMIT');
    console.log('✅ Migration PostgreSQL V2 terminée avec succès !');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la migration :', err);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
