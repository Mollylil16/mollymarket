/**
 * @file server/scripts/generate_dossier_pdf.js
 * Générateur du Master Dossier Technique & Guide Ultime de Soutenance Molly Market
 * Format PDF Corporate Haute Définition avec analyse Fichier par Fichier et Ligne par Ligne
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COLORS = {
  primary: [15, 23, 42],       // Slate 900
  headerBg: [30, 41, 59],      // Slate 800
  secondary: [71, 85, 105],    // Slate 600
  muted: [148, 163, 184],      // Slate 400
  border: [226, 232, 240],     // Slate 200
  accentGreen: [21, 128, 61],  // Emerald 700
  accentBlue: [2, 132, 199],   // Sky 600
  accentAmber: [180, 83, 9],   // Amber 700
  accentPurple: [126, 34, 206],// Purple 700
  lightRow: [248, 250, 252],   // Slate 50
  white: [255, 255, 255]
};

function addHeader(doc, chapterTitle) {
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(14, 10, 182, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...COLORS.primary);
  doc.text('MOLLY MARKET SARL', 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.secondary);
  doc.text('Master Dossier Technique & Guide d\'Explication Fichier par Fichier', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.accentGreen);
  doc.text(chapterTitle.toUpperCase(), 196, 17, { align: 'right' });

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(14, 23, 196, 23);

  return 28;
}

function generatePDF() {
  console.log('📄 Génération du Master Dossier Technique & Guide de Soutenance PDF...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ==========================================================================
  // PAGE 1 : COUVERTURE OFFICIELLE HAUTE DÉFINITION
  // ==========================================================================
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 0, 210, 297, 'F');

  // Cadre décoratif double
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(1.2);
  doc.rect(10, 10, 190, 277);
  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.4);
  doc.rect(12, 12, 186, 273);

  // Logo & Titre
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('MOLLY MARKET', 105, 58, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('SYSTÈME INTÉGRÉ DE GESTION DE SUPERMARCHÉ & POINT DE VENTE (POS)', 105, 67, { align: 'center' });

  // Ligne de séparation verte
  doc.setFillColor(34, 197, 94);
  doc.rect(75, 74, 60, 2, 'F');

  // Titre du Document
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MASTER DOSSIER TECHNIQUE D\'ARCHITECTURE', 105, 95, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('& GUIDE EXPLICATIF FICHIER PAR FICHIER POUR LA SOUTENANCE', 105, 103, { align: 'center' });

  // Encadré Résumé du Dossier
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(20, 120, 170, 95, 3, 3, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(20, 120, 170, 95, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(34, 197, 94);
  doc.text('CONTENU DU DOSSIER & GUIDE DE DÉMONSTRATION :', 28, 132);

  const sommaireItems = [
    '• PARTIE 1 : Base de Données SQL (01 à 10) - Schéma, Triggers, Procédures, Rôles & PUMP',
    '• PARTIE 2 : Backend API Express (server/index.js, db.js, auth.js) - Délégation 100% SQL',
    '• PARTIE 3 : Frontend React 19 (POS, Caisse, Achats, IndexedDB, Impression ESC/POS)',
    '• PARTIE 4 : Guide Chronologique de Soutenance Orale (Discours & Timing minute par minute)',
    '• PARTIE 5 : 5 Scénarios de Démonstration en Direct (Miroir SQL & Interface Utilisateur)',
    '• PARTIE 6 : Fiches Réponses aux Questions Pièges & FAQ Technique du Jury',
    '• Conformité Comptable : Francs CFA (XOF / FCFA) & Système Comptable OHADA'
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(226, 232, 240);
  let somY = 142;
  sommaireItems.forEach(item => {
    doc.text(item, 28, somY);
    somY += 8;
  });

  // Cartouche d'authentification
  doc.setFillColor(30, 41, 59);
  doc.roundedRect(20, 225, 170, 30, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PROPRIÉTÉ & CONTEXTE DU PROJET', 28, 234);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225);
  doc.text('Supermarché Molly Market Abidjan • République de Côte d\'Ivoire', 28, 241);
  doc.text('Architecture 3-Tiers : React 19 + Node.js 22 LTS + PostgreSQL 16+ PL/pgSQL', 28, 247);

  // Pied de page couverture
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Document technique confidentiel d\'ingénierie et de soutenance • Année 2026', 105, 275, { align: 'center' });

  // ==========================================================================
  // PAGE 2 : ARCHITECTURE GLOBALE 3-TIERS & PRINCIPE "DATABASE-FIRST"
  // ==========================================================================
  doc.addPage();
  let y = addHeader(doc, 'Architecture Système & Principes Directeurs');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. VUE D\'ENSEMBLE DE L\'ARCHITECTURE 3-TIERS', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'Molly Market repose sur le principe fondamental de la "Database-First Business Logic" : aucun calcul critique\n' +
    '(TVA, validation de stock, valorisation d\'inventaire, ventilation de caisse, PUMP) n\'est confié arbitrairement\n' +
    'au client JavaScript ou à Node.js. PostgreSQL est le garant unique de l\'atomicité ACID et de la cohérence comptable.',
    14,
    y
  );
  y += 13;

  const archRows = [
    ['Couche Présentation\n(Frontend)', 'React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS, Zustand, Lucide React', 'Interface caisse POS réactive, scan codes-barres, réconciliation de caisse, tableaux de bord de gestion et impression thermique.'],
    ['Résilience Hors-Ligne\n(Offline-First)', 'API IndexedDB (mollymarket_pos_offline), Hook useOnlineStatus', 'Permet l\'encaissement continu en cas de coupure de réseau. Les ventes en attente sont stockées localement et synchronisées automatiquement dès le retour du serveur.'],
    ['Couche Service\n(Backend REST)', 'Node.js 22 LTS, Express 4.21, pg.Pool (node-postgres), JSON Web Token', 'Passerelle HTTP stateless ultra-légère. Elle vérifie les jetons JWT, applique le contrôle RBAC et délègue 100% des opérations aux procédures stockées SQL via CALL.'],
    ['Couche Données & Métier\n(Base de Données)', 'PostgreSQL 16+, PL/pgSQL, Triggers, Vues Métier, Index B-Tree, RLS', 'Moteur décisionnel et transactionnel. Exécute les procédures stockées (CALL), garantit l\'intégrité des stocks par triggers et maintient l\'historique immuable (Audit Trail).'],
    ['Périphériques Caisse', 'Protocole ESC/POS 80mm/58mm, WebSerial / WebUSB / Impression brute', 'Génération des flux binaires d\'impression pour tickets thermiques de supermarché avec ouverture automatique du tiroir-caisse et coupe-papier.'],
    ['Plan de Sauvegarde', 'Scripts batch & Node.js avec pg_dump / pg_restore et rétention 7j', 'Sauvegardes journalières horodatées, dumps binaires et SQL clairs avec rotation automatique.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Couche / Module', 'Technologies & Composants', 'Rôle Métier & Valeur Ajoutée']],
    body: archRows,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7, cellPadding: 2.2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 58 },
      2: { cellWidth: 82 }
    }
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. FLUX TRANSACTIONNEL DÉTAILLÉ D\'UNE VENTE AU SUPERMARCHÉ', 14, y);
  y += 4.5;

  const fluxVente = [
    ['1. Bip Code-Barres', 'Le lecteur scanne l\'article (EAN-13). Le frontend interroge le catalogue mémoire et incrémente le panier.'],
    ['2. Choix Paiement', 'Le caissier sélectionne le mode : Espèces, Wave Mobile Money, Orange Money, MTN ou Carte.'],
    ['3. Requête API Sécurisée', 'POST /api/ventes avec Bearer Token JWT contenant le client_id, le vendeur_id et le panier JSON.'],
    ['4. Exécution PL/pgSQL', 'Le backend exécute CALL effectuer_vente(...) -> Début de transaction atomique PostgreSQL.'],
    ['5. Déclenchement Trigger', 'L\'insertion dans lignes_vente déclenche trg_decrementer_stock_vente qui décrémente stock_actuel.'],
    ['6. Verrouillage Concurrence', 'Si stock_actuel < quantite, le trigger lève une exception SQL qui ROLLBACK l\'intégralité de la vente.'],
    ['7. Ticket & Impression', 'PostgreSQL retourne le numéro officiel TK-YYYYMMDD-XXX et le ticket thermique 80mm est généré.']
  ];

  autoTable(doc, {
    startY: y,
    body: fluxVente,
    theme: 'grid',
    styles: { fontSize: 6.8, cellPadding: 1.8, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', textColor: COLORS.accentGreen },
      1: { cellWidth: 140 }
    }
  });

  // ==========================================================================
  // PAGE 3 : PARTIE 1 - BASE DE DONNÉES SQL (01_tables.sql & 02_roles_privileges.sql)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 1 : Base de Données - Tables, Contraintes & Rôles');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. FICHIER 01_tables.sql : SCHÉMA RELATIONNEL & CONTRAINTES', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'Comment expliquer ce fichier au jury : "Ce script crée l\'intégralité du modèle relationnel en respectant\n' +
    'la 3ème Forme Normale (3NF). Il définit 11 tables relationnelles, 6 types énumérés ENUM, des contraintes d\'intégrité\n' +
    'CHECK (prix >= 0, stock >= 0), des clés étrangères avec ON DELETE RESTRICT et un plan d\'index B-Tree."',
    14,
    y
  );
  y += 12;

  const tablesStructure = [
    ['utilisateurs', 'id, matricule, nom, prenom, email, mot_de_passe, role, telephone, actif', 'CHECK sur format email et matricule unique. Gère les comptes du personnel.'],
    ['caisses', 'id, code, nom, emplacement, statut, derniere_activite', 'Terminaux physiques de vente (Caisse 1 Centrale, Caisse 2 Express).'],
    ['categories', 'id, nom, description, icone, couleur, actif', 'Rayons du supermarché (Alimentation, Boissons, Entretien, Vêtements, Cosmétiques).'],
    ['produits', 'id, code_barre, nom, categorie_id, prix_vente, prix_achat, stock_actuel, seuil_alerte', 'CHECK (prix_vente >= 0 AND prix_achat >= 0), EAN-13 UNIQUE, Index B-Tree sur code_barre.'],
    ['ventes', 'id, numero_ticket, client_id, vendeur_id, caisse_id, date_vente, montant_total, statut', 'En-tête des tickets TK-YYYYMMDD-XXX, liaison caisse_id pour gestion multi-caisses.'],
    ['lignes_vente', 'id, vente_id, produit_id, quantite, prix_unitaire, montant_total', 'Lignes du ticket. Le trigger décrémente stock_actuel et recalcule ventes.montant_total.'],
    ['paiements', 'id, reference_paiement, vente_id, montant, mode_paiement, date_paiement, statut', 'Ventilation financière : especes, wave, orange_money, mtn_money, carte, cheque.'],
    ['points_caisse', 'id, numero_session, caisse_id, date_journee, heure_ouverture, statut, fond_initial', 'Sessions de caisse (statuts : ouverte, soumise_directeur, validee_directeur).'],
    ['billetage_point_caisse', 'id, point_caisse_id, mode_paiement, montant_theorique, montant_compte, ecart', 'Réconciliation et calcul automatique des écarts de caisse en fin de journée.'],
    ['mouvements_stock', 'id, produit_id, type_mouvement, quantite, stock_avant, stock_apres, motif', 'Audit Trail immuable de chaque variation (vente, achat, inventaire, casse, retour).'],
    ['fournisseurs / achats', 'id, code_fournisseur, nom_entreprise / id, numero_facture, statut, montant', 'Circuit d\'approvisionnement : commande -> réception magasinier -> paiement directeur.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Table SQL', 'Colonnes Clés', 'Contraintes & Explication Soutenance']],
    body: tablesStructure,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 1.8, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold' },
      1: { cellWidth: 70, fontSize: 6.4 },
      2: { cellWidth: 76 }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. FICHIER 02_roles_privileges.sql : MODÈLE DE SÉCURITÉ RBAC & RLS', 14, y);
  y += 4.5;

  const rolesDesc = [
    ['administrateur', 'ALL PRIVILEGES sur toutes les tables, séquences et procédures.', 'Superviseur technique : gestion des utilisateurs, sauvegardes, restauration et maintenance.'],
    ['directeur', 'SELECT sur toutes les vues, EXECUTE sur validation de caisse et paiement achats.', 'Direction commerciale : consultation des statistiques, validation finale des caisses et décaissement.'],
    ['vendeur (caissier)', 'SELECT sur produits/clients, INSERT sur ventes/lignes_vente/paiements.', 'Opérateur caisse : encaissement POS, saisie du billetage. Aucune modification de prix autorisée.'],
    ['magasinier', 'SELECT/UPDATE sur produits, INSERT sur réceptions achats & ajustements.', 'Gestionnaire de stock : réception des livraisons fournisseurs, inventaires et alertes ruptures.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Rôle PostgreSQL', 'Privilèges SQL (GRANT / REVOKE)', 'Explication Rôle Métier']],
    body: rolesDesc,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 1.8, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold', textColor: COLORS.accentBlue },
      1: { cellWidth: 70 },
      2: { cellWidth: 76 }
    }
  });

  // ==========================================================================
  // PAGE 4 : PARTIE 1 - BASE DE DONNÉES SQL (03_vues.sql & 04_fonctions.sql)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 1 : Base de Données - Vues Métier & Fonctions PL/pgSQL');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. FICHIER 03_vues.sql : VUES DE REPORTING & JOINTURES COMPLEXE', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'Comment expliquer ce fichier au jury : "Les vues masquent la complexité des jointures relationnelles\n' +
    'et offrent des flux pré-agrégés sécurisés pour les tableaux de bord du Directeur et du Magasinier sans duplication."',
    14,
    y
  );
  y += 10;

  const vuesDesc = [
    ['vue_stock', 'SELECT p.*, c.nom AS categorie, CASE WHEN stock_actuel <= seuil_alerte THEN \'critique\' ELSE \'ok\' END AS etat_stock FROM produits p JOIN categories c...', 'Fournit au magasinier l\'état consolidé du stock avec badge d\'alerte rupture automatique.'],
    ['vue_commandes', 'SELECT v.*, u.nom AS vendeur_nom, cl.nom AS client_nom, p.mode_paiement, p.statut AS statut_paiement FROM ventes v JOIN utilisateurs u...', 'Expose l\'historique complet des tickets de caisse avec le vendeur, le client et le mode de règlement.'],
    ['vue_achats', 'SELECT a.*, f.nom_entreprise AS fournisseur_nom, u.nom AS acheteur_nom FROM achats a JOIN fournisseurs f...', 'Consolide le circuit d\'approvisionnement : statut de livraison, montant total et état de paiement.'],
    ['vue_statistiques', 'Agrégations GROUP BY : CA journalier, CA mensuel, panier moyen, nombre de tickets et répartition par mode.', 'Alimente les graphiques du tableau de bord de la direction en temps réel.'],
    ['vue_top_clients', 'SELECT cl.*, COUNT(v.id) AS nb_achats, SUM(v.montant_total) AS total_depense FROM clients cl JOIN ventes v...', 'Identifie les meilleurs clients pour la politique de fidélité du supermarché.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Nom de la Vue', 'Structure & Définition SQL', 'Rôle Métier']],
    body: vuesDesc,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold' },
      1: { cellWidth: 84, fontSize: 6.3 },
      2: { cellWidth: 62 }
    }
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. FICHIER 04_fonctions.sql : FONCTIONS MÉTIER PL/pgSQL', 14, y);
  y += 4.5;

  const fonctionsDesc = [
    ['fn_authentifier_utilisateur(email, mdp)', 'RETURNS TABLE(...)', 'Vérifie l\'email et compare le hash du mot de passe avec pgcrypto (crypt / gen_salt). Retourne le profil et le rôle si valide, lève une exception sinon.'],
    ['chiffre_affaires(debut, fin)', 'RETURNS NUMERIC', 'Calcule le chiffre d\'affaires net encaissé sur une plage de dates en ne retenant que les ventes au statut \'terminee\'.'],
    ['stock_disponible(produit_id)', 'RETURNS INTEGER', 'Retourne la quantité réelle disponible en rayon après déduction des réservations en cours.'],
    ['fn_generer_numero_ticket()', 'RETURNS VARCHAR', 'Génère une référence unique TK-YYYYMMDD-XXXX basée sur la séquence du jour.'],
    ['fn_generer_reference_paiement()', 'RETURNS VARCHAR', 'Génère la référence comptable PAY-YYYYMMDD-XXXX pour la traçabilité fiduciaire.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Fonction PL/pgSQL', 'Type Retour', 'Logique Exécutée & Explication Soutenance']],
    body: fonctionsDesc,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: COLORS.accentPurple },
      1: { cellWidth: 32 },
      2: { cellWidth: 100 }
    }
  });

  // ==========================================================================
  // PAGE 5 : PARTIE 1 - BASE DE DONNÉES SQL (05_procedures.sql - LIGNE PAR LIGNE)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 1 : Base de Données - Procédures Stockées (05_procedures.sql)');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. DÉCORTICAGE LIGNE PAR LIGNE DE LA PROCÉDURE effectuer_vente', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'C\'est la procédure la plus importante de la soutenance. Expliquez au jury comment chaque ligne garantit\n' +
    'l\'atomicité : "La procédure prend en entrée le panier JSON du client. Si un seul article manque, tout est annulé."',
    14,
    y
  );
  y += 10;

  const effectuerVenteDetail = [
    ['Lignes 140-148', 'En-tête & Paramètres', 'CREATE PROCEDURE effectuer_vente(p_client_id, p_lignes JSON, p_vendeur_id, p_mode_paiement, INOUT p_vente_id, INOUT p_numero_ticket, INOUT p_montant_total)'],
    ['Lignes 149-155', 'Génération Ticket & En-tête', 'v_numero_ticket := fn_generer_numero_ticket(); -> INSERT INTO ventes (...) RETURNING id INTO p_vente_id; Initialise la vente à 0 FCFA.'],
    ['Lignes 156-160', 'Boucle sur le Panier JSON', 'FOR v_ligne IN SELECT * FROM json_array_elements(p_lignes) LOOP -> Itère sur chaque article envoyé par le frontend.'],
    ['Lignes 161-172', 'Vérification Stock & Verrou', 'SELECT stock_actuel, prix_vente INTO v_produit FROM produits WHERE id = ...; IF stock_actuel < quantite THEN RAISE EXCEPTION \'Stock insuffisant...\';'],
    ['Lignes 173-181', 'Insertion Ligne & Trigger', 'INSERT INTO lignes_vente(vente_id, produit_id, quantite, prix_unitaire) VALUES (...); -> Déclenche automatiquement le trigger de stock.'],
    ['Lignes 182-185', 'Recalcul du Montant Total', 'SELECT montant_total INTO p_montant_total FROM ventes WHERE id = p_vente_id; Récupère le total exact recalculé par le trigger.'],
    ['Lignes 186-191', 'Paiement & Clôture', 'INSERT INTO paiements(reference_paiement, vente_id, montant, mode_paiement, statut) VALUES (fn_generer_ref(), p_vente_id, p_montant_total, ...);']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Bloc / Lignes', 'Étape Procédure', 'Explication Précise du Code PL/pgSQL']],
    body: effectuerVenteDetail,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 32, fontStyle: 'bold', textColor: COLORS.accentGreen },
      1: { cellWidth: 44, fontStyle: 'bold' },
      2: { cellWidth: 106 }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. AUTRES PROCÉDURES STOCKÉES STRATÉGIQUES DU SYSTÈME', 14, y);
  y += 4.5;

  const autresProcedures = [
    ['annuler_vente(vente_id, motif, user_id)', 'Vérifie que la vente est \'terminee\'. Boucle sur les lignes_vente, incrémente le stock_actuel, crée une entrée mouvement_stock de type \'annulation_vente\' et passe le statut à \'annulee\'.'],
    ['effectuer_achat(fournisseur_id, lignes, user_id)', 'Crée une commande d\'achat fournisseur en statut \'en_attente\'. Insère les lignes d\'achat avec les quantités et prix d\'achat négociés.'],
    ['reception_stock(achat_id, user_id)', 'Exécutée par le Magasinier. Incrémente le stock des articles reçus, recalcule le Prix Unitaire Moyen Pondéré (PUMP) et passe l\'achat à \'receptionne\'.'],
    ['payer_facture_fournisseur(achat_id, mode, user_id)', 'Exécutée par le Directeur. Valide le règlement de la facture fournisseur, génère un décaissement et met à jour la trésorerie de caisse.'],
    ['ajuster_stock(produit_id, nouvelle_qte, motif, user_id)', 'Ajustement après inventaire physique. Calcule le delta, met à jour le stock et journalise la justification dans mouvements_stock.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Nom Procédure', 'Logique de Fonctionnement & Sécurité']],
    body: autresProcedures,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: COLORS.accentBlue },
      1: { cellWidth: 127 }
    }
  });

  // ==========================================================================
  // PAGE 6 : PARTIE 1 - TRIGGERS, PUMP, CTE & SCRIPTS D'EXPLOITATION (06 à 10)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 1 : Triggers, Calcul PUMP, CTEs & Sauvegardes');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. FICHIER 06_triggers.sql : DÉCLENCHEURS & FORMULE DU PUMP', 14, y);
  y += 5;

  const triggersTable = [
    ['trg_interdire_prix_negatif', 'BEFORE INSERT OR UPDATE ON produits', 'Vérifie IF NEW.prix_vente < 0 OR NEW.prix_achat < 0 THEN RAISE EXCEPTION. Empêche toute incohérence tarifaire.'],
    ['trg_empecher_stock_negatif', 'BEFORE UPDATE ON produits', 'Vérifie IF NEW.stock_actuel < 0 THEN RAISE EXCEPTION. Protège contre les ruptures fantômes et ventes à découvert.'],
    ['trg_calcul_montant_commande', 'AFTER INSERT ON lignes_vente', 'Recalcule automatiquement le montant_total de la table ventes par SUM(quantite * prix_unitaire).'],
    ['trg_audit_mouvement_stock', 'AFTER INSERT ON mouvements_stock', 'Garantit l\'immutabilité : aucune ligne de mouvement_stock ne peut être modifiée ou supprimée (Audit Trail comptable).'],
    ['Calcul du PUMP (Réapprovisionnement)', 'Formule Mathématique Standard', 'PUMP_nouveau = [(Stock_actuel * PUMP_ancien) + (Qte_achetee * Prix_achat_nouveau)] / (Stock_actuel + Qte_achetee)']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Déclencheur / Règle', 'Cible & Événement', 'Action & Règle Métier']],
    body: triggersTable,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 1.8, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { cellWidth: 48 },
      2: { cellWidth: 88 }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. FICHIERS 07_cte.sql, 08, 09 & 10 : REQUÊTES AVANCÉES & EXPLOITATION', 14, y);
  y += 4.5;

  const suiteSql = [
    ['07_cte.sql (Requêtes Analytiques & Fenêtrage)', '• Segmentation RFM (Récence, Fréquence, Montant) avec NTILE(4) OVER (...)\n• Palmarès des ventes par catégorie avec DENSE_RANK() OVER (PARTITION BY categorie_id ORDER BY total DESC)\n• Évolution cumulative du CA avec SUM(montant_total) OVER (ORDER BY date_vente).'],
    ['08_seed_data.sql (Jeu de Données)', '• 130+ références réelles (Produits de grande consommation d\'Abidjan, boissons, épicerie, textile).\n• 4 utilisateurs opérationnels avec mots de passe chiffrés (Admin, Directeur Eden, Caissier Noam, Magasinier).'],
    ['09_sauvegarde_restauration.sql + .bat', '• Sauvegarde binaire haute performance : pg_dump -Fc -d mollymarket_backend -f backup.dump\n• Restauration transactionnelle : pg_restore --clean --if-exists -d mollymarket_backend backup.dump\n• Script batch backup_mollymarket.bat avec rotation automatique sur 7 jours.'],
    ['10_import_export_copy.sql (Import CSV)', '• Import massif haute vitesse via la commande SQL : \\copy produits FROM \'sql/data/produits.csv\' WITH (FORMAT csv, HEADER true, DELIMITER \',\')\n• Idéal pour initialiser 50 000 articles en moins d\'une seconde.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Fichier & Thème', 'Détails Techniques & Points Clés pour la Soutenance']],
    body: suiteSql,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', textColor: COLORS.accentAmber },
      1: { cellWidth: 122 }
    }
  });

  // ==========================================================================
  // PAGE 7 : PARTIE 2 - BACKEND NODE.JS & EXPRESS (server/index.js, db.js, auth.js)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 2 : Backend API Express - Architecture & Délégation SQL');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. STRUCTURE DU BACKEND & DÉLÉGATION 100% SQL', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'Comment expliquer le backend au jury : "Le backend Node.js / Express a été conçu comme une passerelle HTTP\n' +
    'stateless sécurisée. Son rôle se limite à l\'authentification JWT, la validation des paramètres et l\'appel direct\n' +
    'des procédures stockées PostgreSQL (CALL) et des vues métier. Aucune logique métier n\'est codée en dur en JavaScript."',
    14,
    y
  );
  y += 12;

  const backendFiles = [
    [
      'server/db.js (Gestion de la Connexion Pool)',
      'Lignes 1-35 : Instanciation du pool `pg.Pool` avec configuration des variables d\'environnement (.env).\n' +
      'Gère la réutilisation des connexions TCP, élimine les fuites de mémoire et expose la méthode `query(sql, params)`\n' +
      'avec support des transactions et gestion des erreurs de déconnexion inattendue.'
    ],
    [
      'server/middleware/auth.js (JWT & Contrôle RBAC)',
      'Lignes 1-45 : Middleware `verifierToken` qui extrait le header `Authorization: Bearer <token>` et valide la signature\n' +
      'avec `jwt.verify(token, JWT_SECRET)`. En cas de succès, injecte `req.utilisateur = decoded`.\n' +
      'Middleware `exigerRole(...roles)` qui vérifie si le rôle de l\'utilisateur a le droit d\'accéder à la route (ex: Directeur/Admin).'
    ],
    [
      'server/index.js (Routes REST & Appels Procédures)',
      'Lignes 1-80 : Initialisation Express, CORS, parseur JSON et montage des middlewares.\n' +
      'Lignes 81-220 : Routes d\'authentification (`POST /api/auth/login` appelant `fn_authentifier_utilisateur`).\n' +
      'Lignes 221-450 : Routes Caisse & Ventes (`POST /api/ventes` appelant `CALL effectuer_vente($1, $2, ...)`).\n' +
      'Lignes 451-650 : Routes Point de Caisse, Trésorerie (`/api/caisse/solde`) et Achats Fournisseurs.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Fichier Backend', 'Description Ligne par Ligne & Rôle']],
    body: backendFiles,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7, cellPadding: 2.2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: COLORS.accentBlue },
      1: { cellWidth: 127 }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. CARTOGRAPHIE DES ROUTES API EXPRESS <-> OBJETS POSTGRESQL', 14, y);
  y += 4.5;

  const routeMapping = [
    ['POST /api/auth/login', 'Public', 'SELECT * FROM fn_authentifier_utilisateur($1, $2)', 'Authentification sécurisée avec hash pgcrypto.'],
    ['POST /api/ventes', 'Vendeur / Dir', 'CALL effectuer_vente($1, $2, $3, $4, $5, $6, $7)', 'Création ticket, boucle JSON, trigger stock, paiement.'],
    ['POST /api/ventes/:id/annuler', 'Directeur / Admin', 'CALL annuler_vente($1, $2, $3)', 'Annulation transactionnelle et retour en stock.'],
    ['GET /api/caisse/solde', 'Tous connectés', 'Calcul agrégé : Fond + Ventes Espèces + Entrées - Sorties', 'Solde de trésorerie physique en temps réel.'],
    ['POST /api/achats', 'Magasinier / Dir', 'CALL effectuer_achat($1, $2, $3)', 'Création d\'une commande fournisseur.'],
    ['POST /api/achats/:id/receptionner', 'Magasinier / Dir', 'CALL reception_stock($1, $2)', 'Entrée de stock et mise à jour PUMP.'],
    ['POST /api/achats/:id/payer', 'Directeur', 'CALL payer_facture_fournisseur($1, $2, $3)', 'Paiement fournisseur et sortie de caisse automatique.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Route API REST', 'Accès RBAC', 'Objet SQL PostgreSQL Appelé', 'Rôle Métier']],
    body: routeMapping,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.2, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.5, cellPadding: 1.8, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold' },
      1: { cellWidth: 26 },
      2: { cellWidth: 62, fontStyle: 'bold', textColor: COLORS.accentGreen },
      3: { cellWidth: 52 }
    }
  });

  // ==========================================================================
  // PAGE 8 : PARTIE 3 - FRONTEND REACT 19 / TYPESCRIPT (COMPOSANTS CLÉS)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 3 : Frontend React 19 - Composants & Expérience POS');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. DÉCORTICAGE DES COMPOSANTS FRONTEND MAJEURS', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'Comment expliquer le frontend au jury : "L\'interface est développée en React 19 et TypeScript avec Vite.\n' +
    'Elle combine une ergonomie fluide pour le passage en caisse rapide et des outils de contrôle stricts pour la direction."',
    14,
    y
  );
  y += 10;

  const frontendComponents = [
    [
      'SupermarchePOSTerminal.tsx',
      'Écran de Vente & Caisse POS',
      '• Écouteur global d\'événements clavier pour douchette code-barres (capture USB standard).\n' +
      '• Panier interactif : calcul immédiat TTC/HT, gestion des quantités et remises autorisées.\n' +
      '• Modal Multi-Moyens : choix Espèces (avec calcul de monnaie à rendre), Wave, Orange Money, Carte.\n' +
      '• Intégration de la file IndexedDB pour continuité hors-ligne et bouton d\'impression ESC/POS.'
    ],
    [
      'PointDeCaissePage.tsx',
      'Clôture & Réconciliation Caisse',
      '• Affichage des montants théoriques calculés par la base de données pour chaque moyen de règlement.\n' +
      '• Grille de saisie du comptage physique réel (billets de 10 000, 5 000, 2 000, 1 000, 500 et pièces).\n' +
      '• Calcul automatique de l\'écart en temps réel (Vert = Conforme, Rouge = Écart).\n' +
      '• Circuit de double validation : soumission par le Caissier -> validation finale et visa par le Directeur.'
    ],
    [
      'AchatsPage.tsx',
      'Approvisionnements Fournisseurs',
      '• Création de bons de commande avec sélection des fournisseurs d\'Abidjan et lignes d\'articles.\n' +
      '• Écran de réception magasinier avec vérification des quantités livrées.\n' +
      '• Module de paiement directeur : décaissement espèces ou virement avec débit automatique du solde de caisse.'
    ],
    [
      'DirecteurDashboard.tsx / Admin',
      'Tableaux de Bord & KPIs',
      '• Graphiques de tendance du CA journalier/mensuel (Recharts), palmarès des meilleures ventes.\n' +
      '• Alertes ruptures de stocks, audit des mouvements et panneau de gestion des utilisateurs.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Fichier Composant', 'Module Métier', 'Fonctionnalités & Points Forts']],
    body: frontendComponents,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', textColor: COLORS.accentBlue },
      1: { cellWidth: 40, fontStyle: 'bold' },
      2: { cellWidth: 100 }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. SERVICES TECHNIQUES : OFFLINE-FIRST & IMPRESSION THERMIQUE ESC/POS', 14, y);
  y += 4.5;

  const servicesDesc = [
    ['src/services/api.ts', 'Client Axios centralisé avec intercepteur JWT. Injecte automatiquement le token dans Authorization: Bearer et intercepte les erreurs 401 pour redirection sécurisée.'],
    ['src/hooks/useOnlineStatus.ts', 'Surveille l\'état réseau via window.addEventListener(\'online\'/\'offline\') et effectue des pings légers vers le backend pour basculer instantanément en mode dégradé.'],
    ['IndexedDB (mollymarket_pos_offline)', 'Base de données locale NoSQL du navigateur. Stocke les ventes en attente (pending_sales) et émet un ticket provisoire TK-OFF-XXXXXX sans bloquer le caissier.'],
    ['src/utils/escpos.ts', 'Générateur de commandes binaires pour imprimantes thermiques 80mm/58mm (Epson TM-T20, Xprinter) : initialisation ESC @, alignement ESC a, texte gras ESC E, coupe papier GS V.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Composant Technique', 'Description & Rôle dans le Système']],
    body: servicesDesc,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: COLORS.accentGreen },
      1: { cellWidth: 132 }
    }
  });

  // ==========================================================================
  // PAGE 9 : PARTIE 4 - GUIDE DE SOUTENANCE ORALE & CHRONOMÉTRAGE (15 MINUTES)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 4 : Guide Chronologique de Soutenance Orale (15 min)');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. DÉROULEMENT MINUTE PAR MINUTE DE VOTRE SOUTENANCE', 14, y);
  y += 5;

  const oralPlan = [
    [
      '0:00 - 2:00\n(2 min)',
      'Introduction & Contexte Métier',
      '• Saluer le jury et introduire le projet Molly Market : supermarché moderne à Abidjan.\n' +
      '• Poser la problématique : rapidité en caisse, fiabilité des stocks, multi-paiements (Wave, Espèces), et continuité en cas de coupure internet.\n' +
      '• Annoncer la démarche : architecture Database-First garantissant une intégrité absolue.'
    ],
    [
      '2:00 - 5:30\n(3.5 min)',
      'Démonstration POS & Encaissement',
      '• Se connecter en Caissier (Noam Koffi) sur le terminal Caisse Centrale.\n' +
      '• Bip rapide de 2 articles au code-barres (Lait Bonnet Rouge + Riz Dinor).\n' +
      '• Choisir le paiement Espèces avec rendu de monnaie ou Wave Mobile Money.\n' +
      '• Valider : montrer la génération du ticket officiel TK-20260905-001 et l\'impression thermique 80mm.'
    ],
    [
      '5:30 - 9:00\n(3.5 min)',
      'Zoom Moteur SQL, Triggers & Procédures',
      '• Ouvrir le code SQL : montrer la procédure stockée `effectuer_vente` et la boucle JSON.\n' +
      '• Expliquer le trigger `trg_decrementer_stock_vente` et le verrou anti-stock négatif.\n' +
      '• Montrer la vue `vue_stock` et le recalcul automatique du PUMP lors des réceptions fournisseurs.'
    ],
    [
      '9:00 - 12:00\n(3 min)',
      'Clôture Caisse, Hors-Ligne & Sauvegardes',
      '• Aller sur le Point de Caisse : montrer le calcul théorique, saisir le billetage physique (Écart = 0 FCFA).\n' +
      '• Soumettre au Directeur -> Se connecter en Directeur Eden Touré pour valider et tirer le PV.\n' +
      '• Démontrer la résilience hors-ligne avec IndexedDB et lancer le script de sauvegarde `backup.bat`.'
    ],
    [
      '12:00 - 15:00\n(3 min)',
      'Conclusion & Réponses aux Questions',
      '• Synthétiser les points forts : Performance (< 10ms), Sécurité RBAC/JWT, Zéro calcul arbitraire JS.\n' +
      '• Remercier le jury et ouvrir la session de questions/réponses avec assurance.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Timing', 'Phase de Présentation', 'Discours & Actions Recommandées Devant le Jury']],
    body: oralPlan,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2.2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold', textColor: COLORS.accentGreen },
      1: { cellWidth: 44, fontStyle: 'bold' },
      2: { cellWidth: 112 }
    }
  });

  y = doc.lastAutoTable.finalY + 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('2. PHRASES CLÉS & VOCABULAIRE TECHNIQUE VALORISANT', 14, y);
  y += 4.5;

  const punchlines = [
    ['Sur la Base de Données :', '"Nous avons fait le choix stratégique de sceller les règles de gestion au niveau du SGBD PostgreSQL sous forme de procédures stockées PL/pgSQL pour garantir le respect strict des propriétés ACID."'],
    ['Sur le Mode Hors-Ligne :', '"Grâce au stockage NoSQL local IndexedDB, une rupture de connectivité n\'interrompt jamais l\'activité commerciale du supermarché ; les transactions sont rejouées atomiquement dès la reconnexion."'],
    ['Sur la Sécurité RBAC :', '"La sécurité est appliquée en profondeur : jeton JWT signé côté API et politiques de rôles granulaires au niveau de PostgreSQL interdisant toute modification non autorisée."']
  ];

  autoTable(doc, {
    startY: y,
    body: punchlines,
    theme: 'grid',
    styles: { fontSize: 6.8, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', textColor: COLORS.accentBlue },
      1: { cellWidth: 140, fontStyle: 'italic' }
    }
  });

  // ==========================================================================
  // PAGE 10 : PARTIE 5 - 5 SCÉNARIOS DE DÉMONSTRATION EN DIRECT (SQL + UI)
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 5 : 5 Scénarios de Démonstration en Direct');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('SCÉNARIOS DE DÉMONSTRATION DIRECTE DEVANT LE JURY (MIROIR SQL & UI)', 14, y);
  y += 5;

  const liveScenarios = [
    [
      'Scénario A : Vente Multi-Moyens & Décrémentation Stock',
      'Interface : Dans le POS, scanner 2x "Huile Dinor 1L" (Code: 6181100380021). Choisir paiement "Wave Mobile Money". Cliquer sur Valider.\n' +
      'Preuve SQL : Exécuter `SELECT * FROM vue_stock WHERE id = 2;` -> Constater la diminution exacte de 2 unités et l\'insertion dans `mouvements_stock`.'
    ],
    [
      'Scénario B : Commande Fournisseur -> Réception PUMP -> Paiement Caisse',
      'Interface : 1. Magasinier crée un achat de 50 packs d\'eau Awa. 2. Clique sur "Réceptionner le stock". 3. Directeur va dans "Achats" et clique sur "Payer la facture (Espèces)".\n' +
      'Preuve SQL : Vérifier `SELECT stock_actuel, prix_achat FROM produits WHERE id=1;` (PUMP recalculé) et `SELECT solde_actuel FROM vue_solde_caisse;` (Débité).'
    ],
    [
      'Scénario C : Clôture de Caisse & Réconciliation Billetage',
      'Interface : Aller sur "Point de Caisse". Saisir le comptage des billets dans le tiroir. L\'écart s\'affiche à 0 FCFA. Cliquer sur "Soumettre au Directeur".\n' +
      'Preuve SQL : `SELECT * FROM billetage_point_caisse WHERE point_caisse_id = ...;` -> Écart = 0.00 FCFA. Session verrouillée.'
    ],
    [
      'Scénario D : Test de Rupture & Rejet Atomique (Anti-Stock Négatif)',
      'Interface : Tenter de vendre 9999 unités d\'un article en stock limité (ex: 5 unités).\n' +
      'Preuve SQL : Constater le message toast rouge d\'erreur renvoyé par PostgreSQL : "Stock insuffisant pour ce produit". Zéro corruption, vente annulée.'
    ],
    [
      'Scénario E : Coupure Réseau & Synchronisation Automatique',
      'Interface : Couper le serveur Node.js. Le badge passe en 🟠 Hors-Ligne. Effectuer une vente -> ticket local TK-OFF-XXXX émis. Relancer le serveur -> Synchronisation réussie.\n' +
      'Preuve SQL : La vente est insérée dans `ventes` avec le flag synchronisé et le stock décrémenté rétroactivement.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Scénario Métier', 'Protocole de Démonstration (Interface Web & Preuve SQL)']],
    body: liveScenarios,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2.2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: COLORS.accentGreen },
      1: { cellWidth: 132 }
    }
  });

  // ==========================================================================
  // PAGE 11 : PARTIE 6 - FAQ & FICHES RÉPONSES AUX QUESTIONS PIÈGES DU JURY
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Partie 6 : Fiches Réponses aux Questions Pièges (FAQ)');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.primary);
  doc.text('RÉPONSES TYPES AUX QUESTIONS TECHNIQUES & ARCHITECTURALES DU JURY', 14, y);
  y += 5;

  const trapQuestions = [
    [
      'Pourquoi avoir mis la logique dans PostgreSQL plutôt que dans Node.js / Express ?',
      'Pour respecter les garanties ACID (Atomicité, Cohérence, Isolation, Durabilité). Si le serveur web crashe ou redémarre pendant une vente, une transaction gérée par Node.js pourrait laisser des données incohérentes (ex: argent encaissé mais stock non débité). Avec une procédure stockée PL/pgSQL encapsulée dans un bloc transactionnel, c\'est le moteur PostgreSQL qui garantit que tout réussit ou que tout est annulé (ROLLBACK).'
    ],
    [
      'Comment le système gère-t-il la concurrence si 2 caisses vendent le dernier article à la même milliseconde ?',
      'PostgreSQL utilise le mécanisme de verrouillage de ligne (Row-Level Locking). Lors de l\'exécution de `effectuer_vente`, la clause `UPDATE produits SET stock_actuel = stock_actuel - quantite` pose un verrou exclusif sur la ligne de l\'article. La première transaction passe, tandis que la seconde déclenche l\'exception du trigger `trg_empecher_stock_negatif` et annule la vente concurrente proprement.'
    ],
    [
      'Comment garantissez-vous que le mode hors-ligne ne crée pas de doublons lors de la reconnexion ?',
      'Chaque vente générée hors-ligne reçoit un identifiant UUID unique local et une clé d\'idempotence stockée dans IndexedDB. Lors de la synchronisation, le backend vérifie l\'existence préalable de cet identifiant avant toute insertion, éliminant tout risque de double facturation.'
    ],
    [
      'Quelle est la différence entre une Procédure Stockée (PROCEDURE) et une Fonction (FUNCTION) dans votre projet ?',
      'Une FUNCTION (04_fonctions.sql) retourne obligatoirement une valeur ou une table et ne peut pas exécuter d\'instructions de contrôle de transaction (COMMIT/ROLLBACK) autonomes. Une PROCEDURE (05_procedures.sql), introduite en PostgreSQL 11+, est appelée via CALL, peut manipuler des paramètres INOUT et gérer des transactions complètes.'
    ],
    [
      'Comment assurez-vous la conformité avec la réglementation comptable OHADA et les spécificités d\'Abidjan ?',
      '1. Monnaie officielle : Franc CFA (XOF / FCFA) sans centimes fractionnaires sur les espèces.\n' +
      '2. Intégration native des paiements Mobile Money (Wave, Orange Money, MTN) omniprésents en Côte d\'Ivoire.\n' +
      '3. Piste d\'audit immuable (Audit Trail) dans `mouvements_stock` interdisant toute modification rétroactive.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Question Piège du Jury', 'Réponse Technique & Argumentaire Recommandé']],
    body: trapQuestions,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.5, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 6.8, cellPadding: 2.2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: COLORS.accentAmber },
      1: { cellWidth: 127 }
    }
  });

  // ==========================================================================
  // NUMÉROTATION DES PAGES SUR L'ENSEMBLE DU DOCUMENT (SAUF COUVERTURE)
  // ==========================================================================
  const totalPages = doc.internal.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.height || 297;

    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.4);
    doc.line(14, h - 12, 196, h - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);

    doc.text('MOLLY MARKET SARL • Master Dossier Technique & Guide de Soutenance', 14, h - 7);
    doc.text(`Édition officielle du ${dateStr} • Page ${i} sur ${totalPages}`, 196, h - 7, { align: 'right' });
  }

  // Sauvegarde dans les deux emplacements cibles
  const rootPath = path.resolve(__dirname, '../../../MollyMarket_Dossier_Technique_et_Guide_Soutenance.pdf');
  const publicPath = path.resolve(__dirname, '../../public/MollyMarket_Dossier_Technique_et_Guide_Soutenance.pdf');

  const pdfBytes = doc.output('arraybuffer');
  try {
    fs.writeFileSync(rootPath, Buffer.from(pdfBytes));
    console.log(`   - Écrit avec succès : ${rootPath}`);
  } catch (e) {
    console.warn(`⚠️ Avertissement rootPath : ${e.message}`);
  }

  try {
    fs.writeFileSync(publicPath, Buffer.from(pdfBytes));
    console.log(`   - Écrit avec succès : ${publicPath}`);
  } catch (e) {
    console.warn(`⚠️ Avertissement publicPath : ${e.message}`);
  }

  console.log(`✅ Master Dossier PDF généré avec succès (${totalPages} pages complètes).`);
}

generatePDF();
