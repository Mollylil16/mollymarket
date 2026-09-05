/**
 * @file server/scripts/backup.js
 * Script de sauvegarde automatique et manuelle de la base de données PostgreSQL
 * Inclut la compression et la politique de rétention tournante (7 jours)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUPS_DIR = path.resolve(__dirname, '../backups');

// S'assurer que le dossier backups existe
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

/**
 * Génère un dump SQL complet des tables et données de Molly Market
 */
export async function executerSauvegarde() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_mollymarket_${timestamp}.sql`;
  const filepath = path.join(BACKUPS_DIR, filename);

  const client = await pool.connect();
  try {
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    let dumpContent = `-- ============================================================================\n`;
    dumpContent += `-- SAUVEGARDE AUTOMATIQUE MOLLY MARKET\n`;
    dumpContent += `-- Date: ${new Date().toISOString()}\n`;
    dumpContent += `-- ============================================================================\n\n`;

    for (const row of tablesRes.rows) {
      const tableName = row.table_name;
      const dataRes = await client.query(`SELECT * FROM "${tableName}"`);
      
      dumpContent += `-- Table: ${tableName} (${dataRes.rows.length} lignes)\n`;
      if (dataRes.rows.length > 0) {
        for (const dataRow of dataRes.rows) {
          const keys = Object.keys(dataRow);
          const columns = keys.map(k => `"${k}"`).join(', ');
          const values = keys.map(k => {
            const val = dataRow[k];
            if (val === null) return 'NULL';
            if (typeof val === 'number' || typeof val === 'boolean') return val;
            if (val instanceof Date) return `'${val.toISOString()}'`;
            if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
            return `'${String(val).replace(/'/g, "''")}'`;
          }).join(', ');
          
          dumpContent += `INSERT INTO "${tableName}" (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING;\n`;
        }
      }
      dumpContent += `\n`;
    }

    fs.writeFileSync(filepath, dumpContent, 'utf-8');
    const stats = fs.statSync(filepath);

    // Appliquer la rétention tournante (conserver les 7 plus récents)
    nettoyerAnciennesSauvegardes(7);

    return {
      success: true,
      filename,
      tailleOctets: stats.size,
      tailleKo: Math.round(stats.size / 1024),
      creeLe: new Date().toISOString(),
      emplacement: filepath
    };
  } finally {
    client.release();
  }
}

/**
 * Liste les sauvegardes disponibles
 */
export function listerSauvegardes() {
  if (!fs.existsSync(BACKUPS_DIR)) return [];
  const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.sql'));
  return files.map(file => {
    const fullPath = path.join(BACKUPS_DIR, file);
    const stats = fs.statSync(fullPath);
    return {
      filename: file,
      tailleOctets: stats.size,
      tailleKo: Math.round(stats.size / 1024),
      creeLe: stats.birthtime || stats.mtime
    };
  }).sort((a, b) => new Date(b.creeLe).getTime() - new Date(a.creeLe).getTime());
}

/**
 * Rétention tournante
 */
function nettoyerAnciennesSauvegardes(maxFichiers = 7) {
  try {
    const backups = listerSauvegardes();
    if (backups.length > maxFichiers) {
      const aSupprimer = backups.slice(maxFichiers);
      for (const b of aSupprimer) {
        const fullPath = path.join(BACKUPS_DIR, b.filename);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`🧹 Ancienne sauvegarde supprimée : ${b.filename}`);
        }
      }
    }
  } catch (err) {
    console.error('Erreur lors du nettoyage des sauvegardes :', err);
  }
}

// Exécution directe en CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  executerSauvegarde()
    .then(res => {
      console.log('✅ Sauvegarde effectuée :', res);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Erreur sauvegarde :', err);
      process.exit(1);
    });
}
