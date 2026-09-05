/**
 * @file server/scripts/generate_dossier_pdf.js
 * Générateur du Dossier Technique Complet & Guide de Soutenance Molly Market
 * Format PDF Corporate Fiduciaire Haute Définition
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
  lightRow: [248, 250, 252],   // Slate 50
  white: [255, 255, 255]
};

function addHeader(doc, chapterTitle) {
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(14, 10, 182, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.primary);
  doc.text('MOLLY MARKET SARL', 14, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...COLORS.secondary);
  doc.text('Dossier Technique & Guide de Soutenance SQL / Full-Stack', 14, 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.accentGreen);
  doc.text(chapterTitle.toUpperCase(), 196, 17, { align: 'right' });

  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.4);
  doc.line(14, 23, 196, 23);

  return 28;
}

function generatePDF() {
  console.log('📄 Génération du Dossier Technique & Guide de Soutenance PDF...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ==========================================================================
  // PAGE 1 : COUVERTURE & PAGE DE GARDE OFFICIELLE
  // ==========================================================================
  doc.setFillColor(...COLORS.headerBg);
  doc.rect(0, 0, 210, 297, 'F');

  // Cadre intérieur décoratif
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(1);
  doc.rect(10, 10, 190, 277);

  // Logo / Titre Principal
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text('MOLLY MARKET', 105, 70, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('SYSTÈME DE GESTION INTÉGRÉ & POINT DE VENTE SUPERMARCHÉ', 105, 80, { align: 'center' });

  // Ligne de séparation
  doc.setFillColor(34, 197, 94);
  doc.rect(80, 88, 50, 2, 'F');

  // Sous-titre document
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('DOSSIER TECHNIQUE D\'ARCHITECTURE', 105, 115, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('& GUIDE DE PRÉSENTATION ORALE (SOUTENANCE)', 105, 123, { align: 'center' });

  // Encadré Résumé
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(25, 145, 160, 65, 3, 3, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(25, 145, 160, 65, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(34, 197, 94);
  doc.text('PÉRIMÈTRE & CONTENU DU DOCUMENT :', 32, 156);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240);
  doc.text('• Architecture 3-Tiers : React 19 (SPA) + Express (Node.js) + PostgreSQL 16+', 32, 165);
  doc.text('• Moteur Métier 100% Procédural : Procédures PL/pgSQL, Triggers & Vues', 32, 172);
  doc.text('• Fonctionnalités Supermarché : Mode Offline-First, ESC/POS 80mm & Multi-Caisses', 32, 179);
  doc.text('• Sécurité & Fiabilité : Authentification JWT, RBAC, Index B-Tree & Sauvegardes 7j', 32, 186);
  doc.text('• Scénarios Démonstration Pas-à-Pas & Fiches Questions/Réponses pour le Jury', 32, 193);
  doc.text('• Monnaie & Comptabilité : Francs CFA (FCFA) • Conformité OHADA / Côte d\'Ivoire', 32, 200);

  // Pied de page couverture
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Supermarché Molly Market Abidjan • République de Côte d\'Ivoire', 105, 245, { align: 'center' });
  doc.text('Promotion Informatique & Systèmes d\'Information • Année 2026', 105, 252, { align: 'center' });
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Document confidentiel d\'ingénierie et de soutenance', 105, 260, { align: 'center' });

  // ==========================================================================
  // PAGE 2 : CHAPITRE 1 - PRÉSENTATION & ARCHITECTURE DU SYSTÈME
  // ==========================================================================
  doc.addPage();
  let y = addHeader(doc, 'Chapitre 1 : Architecture Système');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.primary);
  doc.text('1. PRÉSENTATION DU SYSTÈME ET STACK TECHNIQUE', 14, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.secondary);
  doc.text(
    'Molly Market est une solution de gestion de supermarché de grade entreprise conçue selon une architecture\n' +
    '3-Tiers découplée et orientée procédures. La règle d\'or du système est le zéro calcul arbitraire côté frontend :\n' +
    'l\'ensemble des calculs de stocks, TVA, totaux de caisse, et billettages sont scellés au cœur de PostgreSQL.',
    14,
    y
  );
  y += 15;

  // Tableau Stack
  const stackRows = [
    ['Couche Présentation (Frontend)', 'React 19, TypeScript 5.8, Vite 6.2, Tailwind CSS, Zustand, Lucide React', 'Interface caisse POS réactive, formulaires de gestion, visualisations KPI et exports.'],
    ['Mode Hors-Ligne (Offline-First)', 'IndexedDB API (mollymarket_pos_offline), Hook useOnlineStatus', 'Continuité des encaissements en cas de coupure réseau + synchronisation automatique.'],
    ['Impression Caisse Thermique', 'ESC/POS Protocol (80mm / 58mm), WebSerial / WebUSB API', 'Impression instantanée sur rouleau thermique sans dialogue navigateur avec coupe papier.'],
    ['Couche Service (Backend API)', 'Node.js 22 LTS, Express.js 4.21, pg.Pool (node-postgres)', 'Passerelle HTTP stateless légère, requêtes paramétrées ($1, $2) et sécurité.'],
    ['Sécurité & Contrôle d\'Accès', 'JSON Web Tokens (JWT), Middleware RBAC (Directeur, Vendeur, etc.)', 'Chiffrement des sessions, signature d\'accès et protection des routes d\'administration.'],
    ['Couche Données & Métier', 'PostgreSQL 16+, PL/pgSQL, Triggers, Vues Métier, Index B-Tree', 'Exécution transactionnelle ACID, audit trail automatique et procédures d\'encaissement.'],
    ['Sauvegardes & Résilience', 'Script pg_dump / backup.js avec rétention tournante 7 jours', 'Sauvegardes SQL horodatées automatiques avec suppression cyclique des anciens dumps.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Composant / Couche', 'Technologies Utilisées', 'Rôle & Bénéfice Opérationnel']],
    body: stackRows,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { cellWidth: 58 },
      2: { cellWidth: 78 }
    }
  });

  y = doc.lastAutoTable.finalY + 8;

  // Schéma de communication textuel / cartouche
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. FLUX TRANSACTIONNEL & GESTION HORS-LIGNE (OFFLINE-FIRST)', 14, y);
  y += 5;

  const fluxRows = [
    ['1. Scan & Panier', 'Le caissier scanne les articles (code-barres). Calcul visuel TTC/HT instantané côté client.'],
    ['2. Validation En Ligne', 'Appel POST /api/ventes avec Bearer JWT -> Exécution CALL effectuer_vente(...) -> Décrémentation automatique du stock par trigger -> Réponse immédiate avec ticket officiel.'],
    ['3. Coupure Réseau (Offline)', 'Si le serveur est injoignable, la vente est stockée dans IndexedDB (pending_sales). Un ticket provisoire TK-OFF-XXXXXX est émis sans bloquer le passage des clients.'],
    ['4. Synchronisation Auto', 'Dès reconnexion, le hook useOnlineStatus pousse les ventes en attente vers PostgreSQL et affiche un toast de confirmation.']
  ];

  autoTable(doc, {
    startY: y,
    body: fluxRows,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', textColor: COLORS.accentGreen },
      1: { cellWidth: 140 }
    }
  });

  // ==========================================================================
  // PAGE 3 : CHAPITRE 2 - MODÈLE RELATIONNEL & STRUCTURE DES TABLES
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Chapitre 2 : Schéma Relationnel (MCD/MLD)');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. STRUCTURE DES TABLES POSTGRESQL & INTÉGRITÉ', 14, y);
  y += 6;

  const tablesDesc = [
    ['utilisateurs', 'id, matricule, nom, prenom, email, mot_de_passe, role, telephone, actif', 'Gestion des comptes et des rôles (Directeur, Administrateur, Vendeur, Magasinier).'],
    ['caisses', 'id, code, nom, emplacement, statut, derniere_activite', 'Terminaux physiques de vente pour gestion multi-caisses simultanée (Centrale, Express, Étage).'],
    ['categories', 'id, nom, description, icone, couleur, actif', 'Rayons du supermarché (Alimentation, Boissons, Entretien, Vêtements, Cosmétiques...).'],
    ['produits', 'id, code_barre, nom, categorie_id, prix_vente, prix_achat, stock_actuel, seuil_alerte', 'Catalogue articles avec codes-barres EAN-13, prix en FCFA et suivi de stock en temps réel.'],
    ['ventes', 'id, numero_ticket, client_id, vendeur_id, caisse_id, date_vente, montant_total, statut', 'En-tête des tickets de caisse avec référence unique TK-YYYYMMDD-XXX et caisse d\'émission.'],
    ['lignes_vente', 'id, vente_id, produit_id, quantite, prix_unitaire, montant_total', 'Détail des articles vendus. L\'insertion déclenche le trigger de décrémentation de stock.'],
    ['paiements', 'id, reference_paiement, vente_id, montant, mode_paiement, date_paiement, statut', 'Encaissements ventilés par mode : especes, wave, orange_money, mtn_money, carte, cheque.'],
    ['points_caisse', 'id, numero_session, caisse_id, date_journee, heure_ouverture, statut, fond_initial', 'Sessions journalières de caisse (statuts : ouverte, soumise_directeur, validee_directeur).'],
    ['billetage_point_caisse', 'id, point_caisse_id, mode_paiement, montant_theorique, montant_compte, ecart', 'Réconciliation et constat d\'écart par mode de règlement (Espèces vs Mobile Money).'],
    ['mouvements_stock', 'id, produit_id, type_mouvement, quantite, stock_avant, stock_apres, motif', 'Traçabilité immuable (Audit Trail) de toutes les entrées/sorties de stock.'],
    ['fournisseurs / achats', 'id, code_fournisseur, nom_entreprise, telephone, adresse / lignes_achat', 'Circuit d\'approvisionnement : commande magasinier -> réception stock -> paiement directeur.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Nom de la Table', 'Colonnes Principales', 'Rôle Métier & Relations']],
    body: tablesDesc,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7.2, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 36, fontStyle: 'bold' },
      1: { cellWidth: 68, fontSize: 6.8 },
      2: { cellWidth: 78 }
    }
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. PLAN D\'INDEXATION B-TREE (PERFORMANCES < 10MS)', 14, y);
  y += 5;

  const indexRows = [
    ['idx_ventes_date & idx_ventes_caisse', 'ventes(date_vente), ventes(caisse_id)', 'Accélération des calculs de CA journalier et filtrage des sessions de caisse.'],
    ['idx_lignes_vente_vente / produit', 'lignes_vente(vente_id, produit_id)', 'Jointure instantanée des lignes d\'articles lors de l\'édition des tickets.'],
    ['idx_paiements_mode & date', 'paiements(mode_paiement, date_paiement)', 'Ventilation instantanée des encaissements Mobile Money (Wave, OM) et Espèces.'],
    ['idx_mouvements_produit_date', 'mouvements_stock(produit_id, date_mouvement)', 'Reconstitution rapide de l\'historique d\'un article lors des audits de stock.']
  ];

  autoTable(doc, {
    startY: y,
    body: indexRows,
    theme: 'grid',
    styles: { fontSize: 7.2, cellPadding: 1.8, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', textColor: COLORS.accentBlue },
      1: { cellWidth: 55 },
      2: { cellWidth: 77 }
    }
  });

  // ==========================================================================
  // PAGE 4 : CHAPITRE 3 - ANALYSE DES PROCÉDURES, TRIGGERS ET VUES
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Chapitre 3 : Objets SQL & Moteur PL/pgSQL');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. PROCÉDURES STOCKÉES & LOGIQUE MÉTIER TRANSACTIONNELLE', 14, y);
  y += 6;

  const procRows = [
    [
      'effectuer_vente(...)',
      'CALL effectuer_vente(client_id, p_lignes, vendeur_id, mode_paiement, p_vente_id, p_numero_ticket, p_montant_total)',
      '1. Génère un numéro de ticket TK-YYYYMMDD-XXX.\n' +
      '2. Insère dans `ventes`.\n' +
      '3. Boucle sur le JSON des articles et insère dans `lignes_vente`.\n' +
      '4. Le trigger `trg_decrementer_stock_vente` décrémente automatiquement le stock et vérifie la disponibilité.\n' +
      '5. Insère le paiement dans `paiements` avec référence PAY-YYYYMMDD-XXX.'
    ],
    [
      'ajuster_stock(...)',
      'CALL ajuster_stock(produit_id, nouvelle_quantite, motif, utilisateur_id)',
      'Rectifie le stock physique d\'un article après inventaire et crée une ligne dans `mouvements_stock` avec le motif.'
    ],
    [
      'reception_stock(...) & payer_facture(...)',
      'CALL reception_stock(achat_id, user_id) / CALL payer_facture_fournisseur(achat_id, user_id)',
      'Incrémente les stocks reçus du fournisseur et valide la facture pour décaissement par la direction.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Nom Procédure', 'Signature PL/pgSQL', 'Logique Exécutée & Règles de Gestion']],
    body: procRows,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7.2, cellPadding: 2.2, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 38, fontStyle: 'bold' },
      1: { cellWidth: 54, fontSize: 6.5 },
      2: { cellWidth: 90 }
    }
  });

  y = doc.lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text('2. TRIGGERS AUTOMATIQUES ET VUES MÉTIER', 14, y);
  y += 5;

  const triggerViews = [
    ['trg_decrementer_stock_vente', 'AFTER INSERT ON lignes_vente', 'Vérifie si stock_actuel >= quantite. Décrémente le stock et génère un mouvement de type \'vente\'. En cas de stock insuffisant, lève une exception SQL qui annule toute la vente.'],
    ['trg_audit_suppression', 'BEFORE DELETE ON produits', 'Interdit la suppression physique des produits ayant des ventes rattachées et journalise l\'action dans `journal_suppressions`.'],
    ['vue_stock / vue_commandes', 'Vues relationnelles jointes', 'Vue_stock expose le stock actuel et le statut d\'alerte. Vue_commandes joint les clients, vendeurs et totaux.'],
    ['vue_statistiques / top_produits', 'Vues décisionnelles', 'Agrège le CA journalier, mensuel, la répartition par rayon et le palmarès des articles les plus vendus.']
  ];

  autoTable(doc, {
    startY: y,
    head: [['Nom Déclencheur / Vue', 'Type d\'Événement / Cible', 'Règle de Gestion Assurée']],
    body: triggerViews,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 7.8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7.2, cellPadding: 2, textColor: COLORS.primary, lineColor: COLORS.border },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold' },
      1: { cellWidth: 46 },
      2: { cellWidth: 90 }
    }
  });

  // ==========================================================================
  // PAGE 5 : CHAPITRE 4 - SCÉNARIOS DE DÉMONSTRATION PAS-À-PAS
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Chapitre 4 : Scénarios Démonstration Soutenance');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SCÉNARIOS DE DÉMONSTRATION À EFFECTUER LORS DE LA PRÉSENTATION', 14, y);
  y += 6;

  const scenarios = [
    [
      'Scénario 1 : Authentification & Multi-Caisses',
      '1. Se connecter avec le compte Caissier (Noam Koffi, role: Vendeur).\n' +
      '2. Sélectionner le terminal physique dans le POS (ex: Caisse Principale N°1).\n' +
      '3. Constater l\'indicateur vert 🟢 "Connecté au serveur" et la présence du token JWT chiffré dans les requêtes.'
    ],
    [
      'Scénario 2 : Encaissement & Décrémentation Stock',
      '1. Scanner 2 articles (ex: Lait Bonnet Rouge + Riz Dinor) via le scanner ou les boutons de bip rapide.\n' +
      '2. Sélectionner le mode de règlement Espèces ou Wave Mobile Money.\n' +
      '3. Valider l\'encaissement : constater le déclenchement de la procédure SQL `effectuer_vente`, la décrémentation immédiate du stock dans `produits` et l\'apparition du ticket.\n' +
      '4. Cliquer sur "Impression Thermique 80mm (ESC/POS)" pour montrer le format de ticket de caisse direct.'
    ],
    [
      'Scénario 3 : Simulation Hors-Ligne (Offline-First)',
      '1. Couper momentanément le serveur backend dans le terminal.\n' +
      '2. Constater le basculement instantané du badge en 🟠 "Mode Hors-Ligne".\n' +
      '3. Effectuer une vente : elle est enregistrée dans IndexedDB et émet un ticket local TK-OFF-XXXXXX.\n' +
      '4. Relancer le serveur backend : le hook détecte la reconnexion et synchronise automatiquement la vente.'
    ],
    [
      'Scénario 4 : Clôture de Caisse & Billetage',
      '1. Aller sur l\'onglet "Point de Caisse" (journée en cours).\n' +
      '2. Constater les montants théoriques calculés par PostgreSQL pour chaque moyen (Espèces, Wave, OM).\n' +
      '3. Saisir le comptage physique dans le tiroir-caisse -> Constater l\'écart à 0 FCFA (Conforme 🟢).\n' +
      '4. Soumettre la caisse au Directeur : la session est verrouillée jusqu\'au lendemain.\n' +
      '5. Se connecter en Directeur (Eden Touré) pour valider officiellement la session et exporter le PV en PDF.'
    ],
    [
      'Scénario 5 : Sauvegarde de Base de Données',
      '1. Exécuter le script `node server/scripts/backup.js`.\n' +
      '2. Montrer la création du dump horodaté dans `server/backups/` et la règle de rétention 7 jours.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Scénario Métier', 'Actions Pas-à-Pas à Réaliser Devant le Jury']],
    body: scenarios,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7.5, cellPadding: 2.5, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: 'bold', textColor: COLORS.accentGreen },
      1: { cellWidth: 127 }
    }
  });

  // ==========================================================================
  // PAGE 6 : CHAPITRE 5 - FICHES RÉPONSES AUX QUESTIONS DU JURY
  // ==========================================================================
  doc.addPage();
  y = addHeader(doc, 'Chapitre 5 : Fiches Réponses Jury (FAQ)');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('QUESTIONS CLASSIQUES DU JURY ET ARGUMENTAIRE TECHNIQUE', 14, y);
  y += 6;

  const faqRows = [
    [
      'Pourquoi avoir choisi PostgreSQL avec des procédures stockées plutôt que de tout calculer dans Node.js ?',
      'Pour garantir l\'intégrité absolue des données et le principe ACID. Si la logique était dans Node.js, une coupure de courant ou un crash applicatif au milieu d\'une vente pourrait enregistrer le paiement sans décrémenter le stock. Avec PostgreSQL et les procédures stockées transactionnelles (BEGIN...COMMIT), toute la vente et ses impacts de stocks sont atomiques : tout réussit ou tout est annulé.'
    ],
    [
      'Comment le système gère-t-il la concurrence si 3 caisses vendent le dernier article en même temps ?',
      'PostgreSQL applique un verrouillage de ligne (Row-Level Locking). Le trigger `trg_decrementer_stock_vente` vérifie la condition `stock_actuel >= quantite`. La première caisse valide la décrémentation, et les deux autres déclenchent une exception SQL "Stock insuffisant", empêchant tout sur-stockage négatif.'
    ],
    [
      'Comment fonctionne le mode hors-ligne sans connexion internet ?',
      'Le frontend exploite l\'API IndexedDB standard du navigateur (base locale `mollymarket_pos_offline`). Lors d\'une coupure réseau, la transaction est stockée localement dans la file d\'attente `pending_sales`. Dès le rétablissement de la connexion, le hook `useOnlineStatus` dépile la file et transmet les ventes au backend de manière transparente.'
    ],
    [
      'Quelle est la stratégie de sécurité mise en place sur les API ?',
      '1. Authentification par jeton JWT signé (expiration 12h).\n' +
      '2. Contrôle d\'accès RBAC (Role-Based Access Control) côté backend : un caissier ne peut pas accéder aux routes de sauvegarde ou de suppression.\n' +
      '3. Requêtes SQL 100% paramétrées éliminant tout risque d\'injection SQL.'
    ],
    [
      'Comment sont gérés les écarts de caisse en fin de journée ?',
      'Le système calcule la vérité théorique pour chaque mode de règlement (Espèces + fond de caisse initial, Wave, Orange Money). Le caissier saisit son comptage réel. La différence génère l\'écart exact. La session est verrouillée et transmise au Directeur Eden qui est la seule autorité habilitée à valider ou rejeter le point de caisse.'
    ]
  ];

  autoTable(doc, {
    startY: y,
    head: [['Question Prévisible du Jury', 'Réponse Technique Recommandée']],
    body: faqRows,
    headStyles: { fillColor: COLORS.headerBg, textColor: 255, fontSize: 8, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: COLORS.lightRow },
    styles: { fontSize: 7.5, cellPadding: 2.8, textColor: COLORS.primary, lineColor: COLORS.border, lineWidth: 0.1 },
    columnStyles: {
      0: { cellWidth: 60, fontStyle: 'bold', textColor: COLORS.accentBlue },
      1: { cellWidth: 122 }
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

    doc.text('MOLLY MARKET SARL • Dossier Technique & Guide de Soutenance', 14, h - 7);
    doc.text(`Édition officielle du ${dateStr} • Page ${i} sur ${totalPages}`, 196, h - 7, { align: 'right' });
  }

  // Sauvegarder dans les deux emplacements
  const rootPath = path.resolve(__dirname, '../../../MollyMarket_Dossier_Technique_et_Guide_Soutenance.pdf');
  const publicPath = path.resolve(__dirname, '../../public/MollyMarket_Dossier_Technique_et_Guide_Soutenance.pdf');

  const pdfBytes = doc.output('arraybuffer');
  fs.writeFileSync(rootPath, Buffer.from(pdfBytes));
  fs.writeFileSync(publicPath, Buffer.from(pdfBytes));

  console.log(`✅ Dossier PDF généré avec succès dans :`);
  console.log(`   - ${rootPath}`);
  console.log(`   - ${publicPath}`);
}

generatePDF();
