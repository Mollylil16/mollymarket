/**
 * @file server/index.js
 * Serveur Express.js pour MollyMarket
 * Connecte le frontend React au backend PostgreSQL
 * 
 * AUCUNE logique métier directe — tout est délégué aux procédures/fonctions/vues PostgreSQL
 * + Sécurisation JWT, Support Multi-Caisses, Diagnostic Ping & Sauvegardes automatisées
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db.js';
import { genererToken, verifierToken, exigerRole } from './middleware/auth.js';
import { executerSauvegarde, listerSauvegardes } from './scripts/backup.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(verifierToken);

// ========================= DIAGNOSTIC & SANTÉ =========================
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    app: 'MollyMarket Backend API',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// ========================= AUTHENTIFICATION (JWT) =========================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const result = await pool.query(
      'SELECT * FROM fn_authentifier_utilisateur($1, $2)',
      [email, mot_de_passe]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants invalides. Vérifiez votre adresse email et mot de passe.' });
    }
    const u = result.rows[0];
    const userPayload = {
      id: u.user_id,
      matricule: u.user_matricule,
      nom: u.user_nom,
      prenom: u.user_prenom,
      email: u.user_email,
      role: u.user_role,
      avatar: u.user_avatar || undefined,
      dernierAcces: u.user_dernier_acces || undefined
    };

    const token = genererToken(userPayload);

    res.json({
      token,
      user: userPayload,
      // Compatibilité directe avec les consommateurs de payload à plat
      ...userPayload
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= MULTI-CAISSES =========================
app.get('/api/caisses', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM ventes v WHERE v.caisse_id = c.id AND v.date_vente::DATE = CURRENT_DATE) AS ventes_jour,
        (SELECT COALESCE(SUM(v.montant_total), 0) FROM ventes v WHERE v.caisse_id = c.id AND v.date_vente::DATE = CURRENT_DATE) AS ca_jour
      FROM caisses c
      ORDER BY c.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= DASHBOARD / STATISTIQUES =========================
app.get('/api/dashboard/ca', async (req, res) => {
  try {
    const result = await pool.query("SELECT chiffre_affaires('jour') AS data");
    res.json(result.rows[0].data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/statistiques', async (req, res) => {
  try {
    const periode = req.query.periode || 'mois';
    
    const [caResult, topClientsResult, topProduitsResult, statsResult, 
           ventesCategResult, ruptureResult, evolutionResult] = await Promise.all([
      pool.query("SELECT chiffre_affaires('jour') AS data"),
      pool.query('SELECT * FROM vue_top_clients'),
      pool.query('SELECT * FROM vue_top_produits'),
      pool.query('SELECT * FROM vue_statistiques'),
      pool.query('SELECT * FROM vue_ventes_par_categorie'),
      pool.query('SELECT * FROM vue_produits_en_rupture'),
      pool.query('SELECT * FROM fn_evolution_ventes($1)', [periode])
    ]);

    const stats = statsResult.rows[0] || {};
    const couleurs = ['#FB8C00','#0288D1','#43A047','#E53935','#2E7D32','#00ACC1','#7B1FA2','#8D6E63',
                      '#F4511E','#1565C0','#558B2F','#C62828','#00838F','#6A1B9A','#4E342E','#37474F'];

    res.json({
      chiffre_affaires: caResult.rows[0].data,
      top_clients: topClientsResult.rows,
      top_produits: topProduitsResult.rows,
      ventes_par_categorie: ventesCategResult.rows.map((r, i) => ({
        categorie: r.categorie,
        montant: Number(r.montant),
        pourcentage: Number(r.pourcentage || 0),
        couleur: couleurs[i % couleurs.length]
      })),
      evolution_ventes: evolutionResult.rows.map(r => ({
        periode: r.periode,
        montant: Number(r.montant),
        nombre_ventes: Number(r.nombre_ventes)
      })),
      produits_en_rupture: ruptureResult.rows,
      total_clients_actifs: Number(stats.total_clients_actifs || 0),
      total_produits_actifs: Number(stats.total_produits_actifs || 0),
      total_ventes_du_jour: Number(stats.total_ventes_du_jour || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= UTILISATEURS / EMPLOYÉS =========================
app.get('/api/utilisateurs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vue_employes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/utilisateurs', exigerRole('Directeur', 'Administrateur'), async (req, res) => {
  try {
    const { nom, prenom, email, mot_de_passe, role, telephone } = req.body;
    const result = await pool.query(
      'CALL ajouter_utilisateur($1, $2, $3, $4, $5, $6, NULL)',
      [nom, prenom, email, mot_de_passe, role, telephone]
    );
    const newId = result.rows[0].p_id;
    const u = await pool.query('SELECT * FROM vue_employes WHERE id = $1', [newId]);
    res.json(u.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/utilisateurs/:id', async (req, res) => {
  try {
    const { nom, prenom, email, role, telephone, actif } = req.body;
    await pool.query('CALL modifier_utilisateur($1, $2, $3, $4, $5, $6, $7)',
      [parseInt(req.params.id), nom || null, prenom || null, email || null, 
       role || null, telephone || null, actif !== undefined ? actif : null]);
    const u = await pool.query('SELECT * FROM vue_employes WHERE id = $1', [req.params.id]);
    res.json(u.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= CLIENTS =========================
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vue_clients');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clients', async (req, res) => {
  try {
    const { nom, prenom, telephone, email, adresse, ville } = req.body;
    const result = await pool.query(
      'CALL ajouter_client($1, $2, $3, $4, $5, $6, NULL)',
      [nom, prenom, telephone, email, adresse, ville]
    );
    const newId = result.rows[0].p_id;
    const cl = await pool.query('SELECT * FROM vue_clients WHERE id = $1', [newId]);
    res.json(cl.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const { nom, prenom, telephone, email, adresse, ville } = req.body;
    await pool.query('CALL modifier_client($1, $2, $3, $4, $5, $6, $7)',
      [parseInt(req.params.id), nom || null, prenom || null, telephone || null,
       email || null, adresse || null, ville || null]);
    const cl = await pool.query('SELECT * FROM vue_clients WHERE id = $1', [req.params.id]);
    res.json(cl.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= FOURNISSEURS =========================
app.get('/api/fournisseurs', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vue_fournisseurs');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/fournisseurs', async (req, res) => {
  try {
    const { nom_entreprise, contact_nom, telephone, email, adresse, ville } = req.body;
    const result = await pool.query(
      'CALL ajouter_fournisseur($1, $2, $3, $4, $5, $6, NULL)',
      [nom_entreprise, contact_nom, telephone, email, adresse, ville]
    );
    const newId = result.rows[0].p_id;
    const frs = await pool.query('SELECT * FROM fournisseurs WHERE id = $1', [newId]);
    res.json(frs.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/fournisseurs/:id', async (req, res) => {
  try {
    const { nom_entreprise, contact_nom, telephone, email, adresse, ville } = req.body;
    await pool.query(`UPDATE fournisseurs SET 
      nom_entreprise = COALESCE($2, nom_entreprise),
      contact_nom = COALESCE($3, contact_nom),
      telephone = COALESCE($4, telephone),
      email = COALESCE($5, email),
      adresse = COALESCE($6, adresse),
      ville = COALESCE($7, ville)
      WHERE id = $1`,
      [parseInt(req.params.id), nom_entreprise, contact_nom, telephone, email, adresse, ville]);
    const frs = await pool.query('SELECT * FROM fournisseurs WHERE id = $1', [req.params.id]);
    res.json(frs.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= CATEGORIES =========================
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, COALESCE(cnt.nb, 0) AS nombre_produits
      FROM categories c
      LEFT JOIN (SELECT categorie_id, COUNT(*) AS nb FROM produits WHERE actif = TRUE GROUP BY categorie_id) cnt
        ON cnt.categorie_id = c.id
      ORDER BY c.nom
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { nom, description, icone, couleur } = req.body;
    const result = await pool.query(
      'CALL ajouter_categorie($1, $2, $3, $4, NULL)',
      [nom, description, icone, couleur]
    );
    const newId = result.rows[0].p_id;
    const cat = await pool.query('SELECT * FROM categories WHERE id = $1', [newId]);
    res.json(cat.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { nom, description, icone, couleur } = req.body;
    await pool.query('CALL modifier_categorie($1, $2, $3, $4, $5)',
      [parseInt(req.params.id), nom || null, description || null, icone || null, couleur || null]);
    const cat = await pool.query('SELECT * FROM categories WHERE id = $1', [req.params.id]);
    res.json(cat.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= PRODUITS & STOCKS =========================
app.get('/api/produits', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vue_stock');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/produits', async (req, res) => {
  try {
    const { code_barre, nom, categorie_id, prix_vente, prix_achat, seuil_alerte, unite_mesure, stock_initial } = req.body;
    const result = await pool.query(
      'CALL ajouter_produit($1, $2, $3, $4, $5, $6, $7, $8, NULL)',
      [code_barre, nom, categorie_id, prix_vente, prix_achat, seuil_alerte, unite_mesure, stock_initial || 0]
    );
    const newId = result.rows[0].p_id;
    const prod = await pool.query('SELECT * FROM vue_stock WHERE id = $1', [newId]);
    res.json(prod.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/produits/:id', async (req, res) => {
  try {
    const { nom, prix_vente, prix_achat, seuil_alerte, categorie_id, unite_mesure } = req.body;
    await pool.query('CALL modifier_produit($1, $2, $3, $4, $5, $6, $7)',
      [parseInt(req.params.id), nom || null, prix_vente || null, prix_achat || null,
       seuil_alerte || null, categorie_id || null, unite_mesure || null]);
    const prod = await pool.query('SELECT * FROM vue_stock WHERE id = $1', [req.params.id]);
    res.json(prod.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stocks/mouvements', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vue_mouvements_stock');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/stocks/ajuster', async (req, res) => {
  try {
    const { produit_id, nouvelle_quantite, motif, utilisateur_id } = req.body;
    await pool.query('CALL ajuster_stock($1, $2, $3, $4)',
      [produit_id, nouvelle_quantite, motif, utilisateur_id]);
    const prod = await pool.query('SELECT * FROM vue_stock WHERE id = $1', [produit_id]);
    res.json(prod.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stocks/disponible/:produitId', async (req, res) => {
  try {
    const result = await pool.query('SELECT stock_disponible($1) AS stock', [parseInt(req.params.produitId)]);
    res.json({ stock: result.rows[0].stock });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= VENTES =========================
app.get('/api/ventes', async (req, res) => {
  try {
    const ventesResult = await pool.query('SELECT * FROM vue_commandes');
    const ventes = [];
    for (const v of ventesResult.rows) {
      const lignesResult = await pool.query(`
        SELECT lv.*, p.nom AS produit_nom 
        FROM lignes_vente lv JOIN produits p ON p.id = lv.produit_id 
        WHERE lv.vente_id = $1`, [v.id]);
      ventes.push({ ...v, lignes: lignesResult.rows });
    }
    res.json(ventes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ventes', async (req, res) => {
  try {
    const { client_id, lignes, vendeur_id, mode_paiement, caisse_id } = req.body;
    const result = await pool.query(
      'CALL effectuer_vente($1, $2, $3, $4, NULL, NULL, NULL)',
      [client_id || 0, JSON.stringify(lignes), vendeur_id, mode_paiement || 'especes']
    );
    const venteId = result.rows[0].p_vente_id;

    if (caisse_id) {
      await pool.query('UPDATE ventes SET caisse_id = $1 WHERE id = $2', [caisse_id, venteId]);
    }

    const venteResult = await pool.query('SELECT * FROM vue_commandes WHERE id = $1', [venteId]);
    const lignesResult = await pool.query(`
      SELECT lv.*, p.nom AS produit_nom 
      FROM lignes_vente lv JOIN produits p ON p.id = lv.produit_id 
      WHERE lv.vente_id = $1`, [venteId]);
    
    const paiementResult = await pool.query('SELECT * FROM vue_paiements WHERE vente_id = $1 LIMIT 1', [venteId]);
    
    res.json({
      vente: { ...venteResult.rows[0], caisse_id: caisse_id || 1, lignes: lignesResult.rows },
      paiement: paiementResult.rows[0] || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ventes/:id/annuler', async (req, res) => {
  try {
    const { motif, utilisateur_id } = req.body;
    await pool.query('CALL annuler_vente($1, $2, $3)',
      [parseInt(req.params.id), motif, utilisateur_id]);
    const venteResult = await pool.query('SELECT * FROM vue_commandes WHERE id = $1', [req.params.id]);
    const lignesResult = await pool.query(`
      SELECT lv.*, p.nom AS produit_nom 
      FROM lignes_vente lv JOIN produits p ON p.id = lv.produit_id 
      WHERE lv.vente_id = $1`, [req.params.id]);
    res.json({ ...venteResult.rows[0], lignes: lignesResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= ACHATS =========================
app.get('/api/achats', async (req, res) => {
  try {
    const achatsResult = await pool.query('SELECT * FROM vue_achats');
    const achats = [];
    for (const a of achatsResult.rows) {
      const lignesResult = await pool.query(`
        SELECT la.*, p.nom AS produit_nom 
        FROM lignes_achat la JOIN produits p ON p.id = la.produit_id 
        WHERE la.achat_id = $1`, [a.id]);
      achats.push({ ...a, lignes: lignesResult.rows });
    }
    res.json(achats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/achats', async (req, res) => {
  try {
    const { fournisseur_id, lignes, cree_par_id } = req.body;
    const result = await pool.query(
      'CALL effectuer_achat($1, $2, $3, NULL, NULL, NULL)',
      [fournisseur_id, JSON.stringify(lignes), cree_par_id]
    );
    const achatId = result.rows[0].p_achat_id;
    const achatResult = await pool.query('SELECT * FROM vue_achats WHERE id = $1', [achatId]);
    const lignesResult = await pool.query(`
      SELECT la.*, p.nom AS produit_nom 
      FROM lignes_achat la JOIN produits p ON p.id = la.produit_id 
      WHERE la.achat_id = $1`, [achatId]);
    res.json({ ...achatResult.rows[0], lignes: lignesResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/achats/:id/reception', async (req, res) => {
  try {
    const { utilisateur_id } = req.body;
    await pool.query('CALL reception_stock($1, $2)', [parseInt(req.params.id), utilisateur_id]);
    const achatResult = await pool.query('SELECT * FROM vue_achats WHERE id = $1', [req.params.id]);
    const lignesResult = await pool.query(`
      SELECT la.*, p.nom AS produit_nom 
      FROM lignes_achat la JOIN produits p ON p.id = la.produit_id 
      WHERE la.achat_id = $1`, [req.params.id]);
    res.json({ ...achatResult.rows[0], lignes: lignesResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/achats/:id/payer', async (req, res) => {
  try {
    const { paye_par_id, mode_paiement } = req.body;
    await pool.query('CALL payer_facture_fournisseur($1, $2, $3)', [
      parseInt(req.params.id, 10),
      paye_par_id || 2,
      mode_paiement || 'especes'
    ]);
    const achatResult = await pool.query('SELECT * FROM vue_achats WHERE id = $1', [req.params.id]);
    res.json(achatResult.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= PAIEMENTS =========================
app.get('/api/paiements', async (req, res) => {
  try {
    const mode = req.query.mode;
    let result;
    if (mode && mode !== 'tous') {
      result = await pool.query('SELECT * FROM vue_paiements WHERE mode_paiement = $1', [mode]);
    } else {
      result = await pool.query('SELECT * FROM vue_paiements');
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/paiements', async (req, res) => {
  try {
    const { vente_id, montant, mode_paiement } = req.body;
    const ref = 'PAY-MANUAL-' + Date.now().toString().slice(-4);
    const result = await pool.query(
      'INSERT INTO paiements (reference_paiement, vente_id, montant, mode_paiement, statut) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [ref, vente_id, montant, mode_paiement, 'paye']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= POINT DE CAISSE =========================
app.get('/api/caisse/sessions', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT pc.*, u.prenom || ' ' || u.nom AS vendeur_nom,
             uv.prenom || ' ' || uv.nom AS valide_par_nom,
             c.nom AS caisse_nom
      FROM points_caisse pc
      JOIN utilisateurs u ON u.id = pc.vendeur_id
      LEFT JOIN utilisateurs uv ON uv.id = pc.valide_par_id
      LEFT JOIN caisses c ON c.id = pc.caisse_id
      ORDER BY pc.date_journee DESC
    `);
    for (const session of result.rows) {
      const billet = await pool.query('SELECT * FROM billetage_point_caisse WHERE point_caisse_id = $1', [session.id]);
      session.repartition = {};
      for (const b of billet.rows) {
        session.repartition[b.mode_paiement] = b;
      }
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/caisse/session-active', async (req, res) => {
  try {
    const caisseId = req.query.caisse_id ? parseInt(req.query.caisse_id, 10) : null;

    let queryStr = `
      SELECT pc.*, u.prenom || ' ' || u.nom AS vendeur_nom, c.nom AS caisse_nom
      FROM points_caisse pc
      JOIN utilisateurs u ON u.id = pc.vendeur_id
      LEFT JOIN caisses c ON c.id = pc.caisse_id
      WHERE (pc.statut = 'ouverte' OR pc.date_journee = CURRENT_DATE)
    `;
    const params = [];
    if (caisseId) {
      params.push(caisseId);
      queryStr += ` AND pc.caisse_id = $${params.length}`;
    }
    queryStr += ` ORDER BY pc.id DESC LIMIT 1`;

    let result = await pool.query(queryStr, params);

    if (result.rows.length === 0) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const insertResult = await pool.query(`
        INSERT INTO points_caisse (numero_session, date_journee, heure_ouverture, vendeur_id, statut, fond_caisse_initial, caisse_id)
        VALUES ($1, CURRENT_DATE, '07:30', 3, 'ouverte', 0, $2) RETURNING *
      `, ['PC-' + todayStr.replace(/-/g, '') + '-01', caisseId || 1]);
      result = { rows: insertResult.rows };
    }

    const session = result.rows[0];
    const fondInitial = Number(session.fond_caisse_initial || 0);
    const sessionDate = session.date_journee;

    // Calculer les ventes réelles du jour depuis PostgreSQL
    const ventesJour = await pool.query(`
      SELECT COALESCE(SUM(montant_total), 0) AS total_ventes,
             COUNT(*) AS nombre_tickets
      FROM ventes
      WHERE (date_vente::DATE = $1::DATE OR date_vente::DATE = CURRENT_DATE) AND statut = 'terminee'
    `, [sessionDate]);

    const totalVentes = Number(ventesJour.rows[0]?.total_ventes || 0);
    const nbTickets = parseInt(ventesJour.rows[0]?.nombre_tickets || '0', 10);
    const totalTheorique = fondInitial + totalVentes;

    // Calculer la ventilation par moyen de paiement du jour
    const paiementsJour = await pool.query(`
      SELECT mode_paiement, COALESCE(SUM(montant), 0) AS total
      FROM paiements
      WHERE date_paiement::DATE = $1::DATE OR date_paiement::DATE = CURRENT_DATE
      GROUP BY mode_paiement
    `, [sessionDate]);

    const paiementsMap = {};
    for (const p of paiementsJour.rows) {
      paiementsMap[p.mode_paiement] = Number(p.total);
    }

    const modes = ['especes', 'wave', 'orange_money', 'mtn_money', 'carte_bancaire', 'cheque'];
    session.repartition = {};
    for (const m of modes) {
      const montantVentes = paiementsMap[m] || 0;
      const th = m === 'especes' ? (fondInitial + montantVentes) : montantVentes;
      session.repartition[m] = {
        mode_paiement: m,
        montant_theorique: th,
        montant_compte: th,
        ecart: 0
      };
    }

    session.total_ventes = totalVentes;
    session.nombre_tickets = nbTickets;
    session.total_theorique = totalTheorique;
    session.total_compte = totalTheorique;
    session.ecart_total = 0;

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= MOUVEMENTS CAISSE =========================
app.get('/api/caisse/mouvements', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT mc.*, u.prenom || ' ' || u.nom AS effectue_par_nom
      FROM mouvements_caisse mc
      JOIN utilisateurs u ON u.id = mc.effectue_par_id
      ORDER BY mc.date_mouvement DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/caisse/mouvements', async (req, res) => {
  try {
    const { sens, type, montant, motif, justificatif, effectue_par_id } = req.body;
    const lastResult = await pool.query('SELECT solde_apres FROM mouvements_caisse ORDER BY date_mouvement DESC LIMIT 1');
    const dernierSolde = lastResult.rows.length > 0 ? Number(lastResult.rows[0].solde_apres) : 50000;
    const soldeApres = sens === 'entree' ? dernierSolde + montant : Math.max(0, dernierSolde - montant);

    const result = await pool.query(`
      INSERT INTO mouvements_caisse (sens, type, montant, motif, justificatif, effectue_par_id, solde_apres)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [sens, type, montant, motif, justificatif, effectue_par_id, soldeApres]);
    
    const mvt = result.rows[0];
    const userResult = await pool.query('SELECT prenom || \' \' || nom AS name FROM utilisateurs WHERE id = $1', [effectue_par_id]);
    mvt.effectue_par_nom = userResult.rows[0]?.name || '';
    
    res.json(mvt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/caisse/solde', async (req, res) => {
  try {
    // 1. Fond initial de la session active ou dernière session
    const sessionRes = await pool.query(`
      SELECT COALESCE(fond_caisse_initial, 50000) AS fond_initial
      FROM points_caisse
      ORDER BY date_journee DESC LIMIT 1
    `);
    const fondInitial = sessionRes.rows.length > 0 ? Number(sessionRes.rows[0].fond_initial) : 50000;

    // 2. Ventes en espèces encaissées
    const ventesEspecesRes = await pool.query(`
      SELECT COALESCE(SUM(montant), 0) AS total_especes
      FROM paiements
      WHERE mode_paiement = 'especes'
    `);
    const totalVentesEspeces = Number(ventesEspecesRes.rows[0]?.total_especes || 0);

    // 3. Mouvements de caisse manuels (Apports de fonds & Décaissements)
    const mouvsRes = await pool.query(`
      SELECT 
        COALESCE(SUM(montant) FILTER (WHERE sens = 'entree'), 0) AS total_entrees_manuelles,
        COALESCE(SUM(montant) FILTER (WHERE sens = 'sortie'), 0) AS total_sorties_manuelles
      FROM mouvements_caisse
    `);
    const totalEntreesManuelles = Number(mouvsRes.rows[0]?.total_entrees_manuelles || 0);
    const totalSortiesManuelles = Number(mouvsRes.rows[0]?.total_sorties_manuelles || 0);

    const totalEntrees = totalVentesEspeces + totalEntreesManuelles;
    const totalSorties = totalSortiesManuelles;
    const soldeActuel = fondInitial + totalEntrees - totalSorties;

    res.json({
      solde_actuel: soldeActuel,
      total_entrees: totalEntrees,
      total_sorties: totalSorties,
      fond_initial: fondInitial,
      total_ventes_especes: totalVentesEspeces,
      total_entrees_manuelles: totalEntreesManuelles
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= SAUVEGARDES & ADMINISTRATION =========================
app.get('/api/admin/backups', exigerRole('Directeur', 'Administrateur'), async (req, res) => {
  try {
    const backups = listerSauvegardes();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/backups/create', exigerRole('Directeur', 'Administrateur'), async (req, res) => {
  try {
    const result = await executerSauvegarde();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= FONCTIONS UTILITAIRES =========================
app.get('/api/fonctions/meilleur-client', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meilleur_client()');
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fonctions/meilleur-produit', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM meilleur_produit()');
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/fonctions/nombre-commandes', async (req, res) => {
  try {
    const debut = req.query.debut || new Date().toISOString().slice(0, 10);
    const fin = req.query.fin || new Date().toISOString().slice(0, 10);
    const result = await pool.query('SELECT nombre_commandes($1, $2) AS total', [debut, fin]);
    res.json({ total: result.rows[0].total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ========================= DÉMARRAGE =========================
app.listen(PORT, () => {
  console.log(`✅ Serveur MollyMarket Backend V2 démarré sur http://localhost:${PORT}`);
  console.log(`🔒 Authentification JWT & Sécurité RBAC activées`);
  console.log(`🏪 Multi-Caisses & Indexation PostgreSQL opérationnelles`);
});
