import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { formatFCFA } from './format';
import { PointDeCaisse, VueStatistiques, Paiement } from '../types';

// ============================================================================
// HELPERS DE DESIGN & FORMATAGE POUR LES DOCUMENTS PDF
// ============================================================================

const PDF_COLORS = {
  primary: [15, 23, 42] as [number, number, number],       // Slate 900
  headerBg: [30, 41, 59] as [number, number, number],      // Slate 800
  secondary: [71, 85, 105] as [number, number, number],    // Slate 600
  muted: [148, 163, 184] as [number, number, number],      // Slate 400
  border: [226, 232, 240] as [number, number, number],     // Slate 200
  accentGreen: [21, 128, 61] as [number, number, number],  // Emerald 700
  accentRed: [220, 38, 38] as [number, number, number],    // Red 600
  lightRow: [248, 250, 252] as [number, number, number],   // Slate 50
  white: [255, 255, 255] as [number, number, number]
};

function formatDocDate(val: any): string {
  if (!val) return '-';
  const d = new Date(val);
  if (isNaN(d.getTime())) return String(val);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  // Si l'horodatage contient une heure précise (pas juste minuit UTC)
  if (val.includes && val.includes('T') && !val.endsWith('00:00:00.000Z')) {
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  }
  return `${day}/${month}/${year}`;
}

/**
 * Dessine un en-tête d'entreprise épuré et professionnel (style fiduciaire / entreprise)
 */
function drawCorporateHeader(
  doc: jsPDF,
  title: string,
  docSubtitle: string,
  metaRight: { label: string; value: string }[] = []
) {
  // Ligne fine d'accentuation supérieure
  doc.setFillColor(...PDF_COLORS.headerBg);
  doc.rect(14, 10, 182, 1.5, 'F');

  // Nom de l'entreprise
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('MOLLY MARKET', 14, 19);

  // Sous-titre & coordonnées légales
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text('Supermarché & Commerce Général • Abidjan, Côte d\'Ivoire', 14, 24);
  doc.text('Tél : +225 07 00 00 00 00 • RCCM : CI-ABJ-2024-B • CC / IFU : 2415890 Z', 14, 28);

  // Titre du document (Côté droit ou encadré)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(title.toUpperCase(), 196, 19, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(docSubtitle, 196, 24, { align: 'right' });

  // Métadonnées à droite
  let currentY = 28;
  metaRight.forEach((m) => {
    doc.text(`${m.label} : ${m.value}`, 196, currentY, { align: 'right' });
    currentY += 4;
  });

  // Ligne de séparation élégante
  const lineY = Math.max(32, currentY + 1);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);
  doc.line(14, lineY, 196, lineY);

  return lineY + 6;
}

/**
 * Ajoute un pied de page officiel avec pagination automatique sur toutes les pages
 */
function addCorporateFooter(doc: jsPDF, documentLabel: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const dateGeneration = new Date().toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height || 297;

    // Ligne de séparation pied de page
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 12, 196, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.muted);

    // Gauche
    doc.text(
      `MOLLY MARKET • ${documentLabel} • Document officiel d'exploitation`,
      14,
      pageHeight - 7
    );

    // Droite
    doc.text(
      `Édité le ${dateGeneration} • Page ${i} sur ${pageCount}`,
      196,
      pageHeight - 7,
      { align: 'right' }
    );
  }
}

// ============================================================================
// EXPORTS EXCEL (.xlsx)
// ============================================================================

export function exporterPointCaisseExcel(point: PointDeCaisse) {
  const wb = XLSX.utils.book_new();

  const recapData = [
    ['MOLLY MARKET - POINT DE CAISSE JOURNALIER'],
    ['Abidjan, Côte d\'Ivoire'],
    [''],
    ['Numéro de Session', point.numero_session],
    ['Date de la journée', formatDocDate(point.date_journee)],
    ['Heure d\'ouverture', point.heure_ouverture],
    ['Heure de clôture', point.heure_cloture || 'Non renseignée'],
    ['Caissier / Vendeur', point.vendeur_nom],
    ['Statut de la session', point.statut.toUpperCase()],
    ['Fond de caisse initial (FCFA)', point.fond_caisse_initial],
    ['Total des ventes (FCFA)', point.total_ventes],
    ['Nombre de tickets', point.nombre_tickets],
    ['Total théorique attendu (FCFA)', point.total_theorique],
    ['Total réel compté (FCFA)', point.total_compte],
    ['Écart de caisse (FCFA)', point.ecart_total],
    ['Date de soumission', point.soumis_le || 'En cours'],
    ['Validé par', point.valide_par_nom || 'En attente de validation'],
    ['Observations', point.observations || 'Aucune observation']
  ];
  const wsRecap = XLSX.utils.aoa_to_sheet(recapData);
  XLSX.utils.book_append_sheet(wb, wsRecap, 'Récapitulatif');

  const detailData = [
    ['Mode de Règlement', 'Montant Théorique (FCFA)', 'Montant Compté (FCFA)', 'Écart (FCFA)', 'Observation']
  ];

  Object.values(point.repartition || {}).forEach((rep) => {
    detailData.push([
      rep.libelle || (rep as any).mode || (rep as any).mode_paiement || 'Mode',
      rep.montant_theorique.toString(),
      rep.montant_compte.toString(),
      rep.ecart.toString(),
      rep.ecart === 0 ? 'Conforme' : rep.ecart > 0 ? 'Excédent' : 'Déficit'
    ]);
  });

  const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Par Mode de Paiement');

  XLSX.writeFile(wb, `Point_Caisse_${point.numero_session}.xlsx`);
}

export function exporterHistoriquePointsCaisseExcel(points: PointDeCaisse[]) {
  const wb = XLSX.utils.book_new();
  const data = [
    ['Numéro Session', 'Date Journée', 'Vendeur', 'Statut', 'Tickets', 'Fond Caisse', 'Ventes (FCFA)', 'Total Théorique', 'Total Compté', 'Écart', 'Validé par']
  ];

  points.forEach((p) => {
    data.push([
      p.numero_session,
      formatDocDate(p.date_journee),
      p.vendeur_nom,
      p.statut,
      p.nombre_tickets.toString(),
      p.fond_caisse_initial.toString(),
      p.total_ventes.toString(),
      p.total_theorique.toString(),
      p.total_compte.toString(),
      p.ecart_total.toString(),
      p.valide_par_nom || 'En attente'
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Historique Points Caisse');
  XLSX.writeFile(wb, `Historique_Points_Caisse_MollyMarket.xlsx`);
}

export function exporterStatistiquesExcel(stats: VueStatistiques, periodeLabel: string = 'Mois en cours') {
  const wb = XLSX.utils.book_new();

  const caData = [
    ['MOLLY MARKET - RAPPORT STATISTIQUE COMMERCIAL'],
    ['Période analysée', periodeLabel],
    ['Généré le', new Date().toLocaleString('fr-FR')],
    [''],
    ['Indicateur', 'Montant / Valeur (FCFA)'],
    ['Chiffre d\'Affaires Journalier', stats.chiffre_affaires.journalier.toString()],
    ['Chiffre d\'Affaires Veille', stats.chiffre_affaires.hier.toString()],
    ['Évolution Journalière', `${stats.chiffre_affaires.evolution_journaliere}%`],
    ['Chiffre d\'Affaires Mensuel', stats.chiffre_affaires.mensuel.toString()],
    ['Chiffre d\'Affaires Mois Précédent', stats.chiffre_affaires.mois_dernier.toString()],
    ['Évolution Mensuelle', `${stats.chiffre_affaires.evolution_mensuelle}%`],
    ['Total Clients Actifs', stats.total_clients_actifs.toString()],
    ['Total Produits Référencés', stats.total_produits_actifs.toString()],
    ['Total Ventes Enregistrées', stats.total_ventes_du_jour.toString()]
  ];
  const wsCA = XLSX.utils.aoa_to_sheet(caData);
  XLSX.utils.book_append_sheet(wb, wsCA, 'Synthèse CA');

  const catData = [['Catégorie', 'Chiffre d\'Affaires (FCFA)', 'Part (%)']];
  stats.ventes_par_categorie.forEach((c) => {
    catData.push([c.categorie, c.montant.toString(), `${c.pourcentage}%`]);
  });
  const wsCat = XLSX.utils.aoa_to_sheet(catData);
  XLSX.utils.book_append_sheet(wb, wsCat, 'Ventes par Catégorie');

  const prodData = [['Produit', 'Catégorie', 'Quantité Vendue', 'Chiffre d\'Affaires (FCFA)']];
  stats.top_produits.forEach((p) => {
    prodData.push([p.nom, p.categorie, p.quantite_vendue.toString(), p.chiffre_affaires.toString()]);
  });
  const wsProd = XLSX.utils.aoa_to_sheet(prodData);
  XLSX.utils.book_append_sheet(wb, wsProd, 'Top Produits');

  XLSX.writeFile(wb, `Statistiques_MollyMarket_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exporterPaiementsExcel(paiements: Paiement[], filtreActif: string = 'Tous les règlements') {
  const wb = XLSX.utils.book_new();

  const headers = [
    ['MOLLY MARKET - JOURNAL DES RÈGLEMENTS ET ENCAISSEMENTS'],
    ['Filtre appliqué : ' + filtreActif],
    ['Date d\'extraction : ' + new Date().toLocaleString('fr-FR')],
    [''],
    ['Réf. Paiement', 'N° Ticket', 'Client / Bénéficiaire', 'Mode de Règlement', 'Date & Heure', 'Montant (FCFA)', 'Statut']
  ];

  paiements.forEach((p) => {
    headers.push([
      p.reference_paiement,
      p.numero_ticket,
      p.client_nom,
      p.mode_paiement.toUpperCase(),
      formatDocDate(p.date_paiement),
      p.montant.toString(),
      p.statut.toUpperCase()
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(headers);
  XLSX.utils.book_append_sheet(wb, ws, 'Paiements');
  XLSX.writeFile(wb, `Paiements_MollyMarket_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ============================================================================
// EXPORTS PDF HAUTE DÉFINITION & DESIGN ÉPURÉ
// ============================================================================

/**
 * 1. Exporter le Journal des Règlements & Paiements en PDF
 */
export function exporterPaiementsPDF(paiements: Paiement[], filtreActif: string = 'Tous les règlements') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const total = paiements.reduce((acc, p) => acc + p.montant, 0);

  // En-tête formel
  const startY = drawCorporateHeader(
    doc,
    'Journal des Encaissements',
    'Règlements de caisse & transactions clients',
    [
      { label: 'Filtre', value: filtreActif },
      { label: 'Date rapport', value: new Date().toLocaleDateString('fr-FR') }
    ]
  );

  // Cartouche de synthèse
  doc.setFillColor(...PDF_COLORS.lightRow);
  doc.roundedRect(14, startY, 182, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(14, startY, 182, 12, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text('Nombre de transactions enregistrées :', 18, startY + 7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`${paiements.length} règlement(s)`, 72, startY + 7.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text('Total cumulé encaissé :', 115, startY + 7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.accentGreen);
  doc.text(formatFCFA(total), 155, startY + 7.5);

  // Données du tableau
  const rows = paiements.map((p) => [
    p.reference_paiement,
    p.numero_ticket || '-',
    p.client_nom || 'Client au comptoir',
    p.mode_paiement.replace(/_/g, ' ').toUpperCase(),
    formatDocDate(p.date_paiement),
    formatFCFA(p.montant),
    p.statut === 'paye' ? 'Payé' : p.statut === 'partiel' ? 'Partiel' : 'Impayé'
  ]);

  autoTable(doc, {
    startY: startY + 16,
    head: [['Réf. Paiement', 'Ticket', 'Client', 'Mode Règlement', 'Date & Heure', 'Montant', 'Statut']],
    body: rows,
    headStyles: {
      fillColor: PDF_COLORS.headerBg,
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.lightRow
    },
    styles: {
      fontSize: 7.8,
      cellPadding: 2.5,
      textColor: PDF_COLORS.primary,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.1
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 32 },
      1: { cellWidth: 28 },
      2: { cellWidth: 34 },
      3: { cellWidth: 26 },
      4: { cellWidth: 26, fontSize: 7.2 },
      5: { halign: 'right', fontStyle: 'bold', textColor: PDF_COLORS.primary, cellWidth: 24 },
      6: { halign: 'center', cellWidth: 12 }
    }
  });

  addCorporateFooter(doc, 'Journal des Paiements');
  doc.save(`Journal_Paiements_MollyMarket_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * 2. Exporter le Point de Caisse Journalier en PDF
 */
export function exporterPointCaissePDF(point: PointDeCaisse) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = drawCorporateHeader(
    doc,
    'Procès-Verbal de Caisse',
    'Clôture journalière & Rapprochement physique',
    [
      { label: 'Session N°', value: point.numero_session },
      { label: 'Date journée', value: formatDocDate(point.date_journee) }
    ]
  );

  // 1. Cadre d'identification de la session
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('1. INFORMATIONS D\'EXPLOITATION', 14, startY + 2);

  const statutLibelle =
    point.statut === 'validee_directeur'
      ? 'APPROUVÉ & VALIDÉ PAR LA DIRECTION'
      : point.statut === 'soumise_directeur'
      ? 'SOUMIS (EN ATTENTE VALIDATION DIRECTION)'
      : 'SESSION EN COURS';

  const infoRows = [
    ['Caissier / Agent', point.vendeur_nom, 'Statut Session', statutLibelle],
    ['Heure d\'ouverture', point.heure_ouverture || '07:30', 'Heure de clôture', point.heure_cloture || 'En attente'],
    ['Fond de caisse initial', formatFCFA(point.fond_caisse_initial), 'Tickets émis', `${point.nombre_tickets} ticket(s)`],
    ['Total Ventes Encaissées', formatFCFA(point.total_ventes), 'Total Attendu (Théorique)', formatFCFA(point.total_theorique)]
  ];

  autoTable(doc, {
    startY: startY + 5,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2, textColor: PDF_COLORS.primary },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondary, cellWidth: 38 },
      1: { fontStyle: 'bold', cellWidth: 53 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondary, cellWidth: 38 },
      3: { fontStyle: 'bold', cellWidth: 53 }
    }
  });

  // 2. Tableau de réconciliation / Billetage
  const detailStartY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : startY + 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('2. RAPPROCHEMENT PAR CATÉGORIE DE RÈGLEMENT', 14, detailStartY);

  const modesLabels: { [k: string]: string } = {
    especes: 'Espèces (Monnaie & Billets comptés)',
    wave: 'Wave Mobile Money CI',
    orange_money: 'Orange Money CI (Terminal Kiosque)',
    mtn_money: 'MTN Mobile Money MoMo',
    carte_bancaire: 'Carte Bancaire (Télécollecte TPE)',
    cheque: 'Chèques Bancaires Encaissés'
  };

  const detailRows: any[] = [];
  const repartition = point.repartition || {};

  Object.keys(modesLabels).forEach((key) => {
    const item = repartition[key] || {
      montant_theorique: 0,
      montant_compte: 0,
      ecart: 0
    };
    const th = Number(item.montant_theorique || 0);
    const co = Number(item.montant_compte || 0);
    const ec = co - th;

    detailRows.push([
      modesLabels[key],
      formatFCFA(th),
      formatFCFA(co),
      ec === 0 ? '0 FCFA' : ec > 0 ? `+${formatFCFA(ec)}` : formatFCFA(ec),
      ec === 0 ? 'Conforme' : ec > 0 ? 'Excédent' : 'Déficit'
    ]);
  });

  // Ligne totale
  detailRows.push([
    'TOTAL GÉNÉRAL DE LA CAISSE',
    formatFCFA(point.total_theorique),
    formatFCFA(point.total_compte),
    point.ecart_total === 0 ? '0 FCFA' : point.ecart_total > 0 ? `+${formatFCFA(point.ecart_total)}` : formatFCFA(point.ecart_total),
    point.ecart_total === 0 ? 'CONFORME' : point.ecart_total > 0 ? 'EXCÉDENT' : 'DÉFICIT'
  ]);

  autoTable(doc, {
    startY: detailStartY + 3,
    head: [['Moyen de Paiement', 'Théorique Système', 'Physique Compté', 'Écart', 'Constat']],
    body: detailRows,
    headStyles: {
      fillColor: PDF_COLORS.headerBg,
      textColor: 255,
      fontSize: 8,
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.lightRow
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.8,
      lineColor: PDF_COLORS.border,
      lineWidth: 0.1,
      textColor: PDF_COLORS.primary
    },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { halign: 'right', cellWidth: 32 },
      2: { halign: 'right', cellWidth: 32, fontStyle: 'bold' },
      3: { halign: 'right', cellWidth: 26, fontStyle: 'bold' },
      4: { halign: 'center', cellWidth: 22 }
    },
    didParseCell: (data) => {
      // Styliser la ligne de total général
      if (data.row.index === detailRows.length - 1) {
        data.cell.styles.fillColor = PDF_COLORS.headerBg;
        data.cell.styles.textColor = [255, 255, 255];
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  // 3. Observations & Signatures
  const obsStartY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 8 : 190;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('3. OBSERVATIONS ET JUSTIFICATIONS DU CAISSIER', 14, obsStartY);

  doc.setFillColor(...PDF_COLORS.lightRow);
  doc.roundedRect(14, obsStartY + 3, 182, 14, 1, 1, 'F');
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(14, obsStartY + 3, 182, 14, 1, 1, 'S');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(point.observations || 'Billetage régulier et conforme. Aucun écart constaté lors de la clôture.', 18, obsStartY + 10);

  // 4. Cartouches de signatures
  const sigY = obsStartY + 26;
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.5);

  // Cadre signature Caissier
  doc.roundedRect(14, sigY, 86, 26, 1, 1, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`Agent Caissier : ${point.vendeur_nom}`, 18, sigY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text('Signature & date', 18, sigY + 11);

  // Cadre signature Directeur
  doc.roundedRect(110, sigY, 86, 26, 1, 1, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(`Direction / Visa : ${point.valide_par_nom || 'Eden Touré (Directeur)'}`, 114, sigY + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text('Cachet & signature de validation', 114, sigY + 11);

  addCorporateFooter(doc, 'Point de Caisse Journalier');
  doc.save(`Point_Caisse_${point.numero_session}.pdf`);
}

/**
 * 3. Exporter les Statistiques Commerciales en PDF
 */
export function exporterStatistiquesPDF(stats: VueStatistiques, periodeLabel: string = 'Mois en cours') {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const startY = drawCorporateHeader(
    doc,
    'Rapport d\'Activité Commerciale',
    'Indicateurs clés de performance & Ventes',
    [
      { label: 'Période', value: periodeLabel },
      { label: 'Date d\'édition', value: new Date().toLocaleDateString('fr-FR') }
    ]
  );

  // 1. Indicateurs Majeurs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('1. SYNTHÈSE DU CHIFFRE D\'AFFAIRES', 14, startY + 2);

  const kpiRows = [
    ['CA Journalier', formatFCFA(stats.chiffre_affaires.journalier), 'Évolution vs Veille', `+${stats.chiffre_affaires.evolution_journaliere}%`],
    ['CA Mensuel', formatFCFA(stats.chiffre_affaires.mensuel), 'Évolution vs M-1', `+${stats.chiffre_affaires.evolution_mensuelle}%`],
    ['Clients Actifs', `${stats.total_clients_actifs} clients`, 'Volume Transactions', `${stats.total_ventes_du_jour} ventes`]
  ];

  autoTable(doc, {
    startY: startY + 5,
    body: kpiRows,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2.5, textColor: PDF_COLORS.primary, lineColor: PDF_COLORS.border },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: PDF_COLORS.secondary, cellWidth: 42 },
      1: { fontStyle: 'bold', textColor: PDF_COLORS.accentGreen, cellWidth: 49 },
      2: { fontStyle: 'bold', textColor: PDF_COLORS.secondary, cellWidth: 42 },
      3: { fontStyle: 'bold', cellWidth: 49 }
    }
  });

  // 2. Ventes par catégorie
  const catY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 7 : startY + 45;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('2. RÉPARTITION PAR RAYON / CATÉGORIE', 14, catY);

  const catRows = stats.ventes_par_categorie.map((c) => [
    c.categorie,
    formatFCFA(c.montant),
    `${c.pourcentage}%`
  ]);

  autoTable(doc, {
    startY: catY + 3,
    head: [['Rayon / Famille de Produits', 'Chiffre d\'Affaires Réalisé', 'Part']],
    body: catRows,
    headStyles: { fillColor: PDF_COLORS.headerBg, textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: PDF_COLORS.lightRow },
    styles: { fontSize: 8, cellPadding: 2.2, textColor: PDF_COLORS.primary, lineColor: PDF_COLORS.border },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold' },
      1: { halign: 'right', fontStyle: 'bold', cellWidth: 62 },
      2: { halign: 'center', cellWidth: 30 }
    }
  });

  // 3. Top Produits Vendus
  const topY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 7 : 140;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('3. PALMARÈS DES MEILLEURES VENTES', 14, topY);

  const prodRows = stats.top_produits.slice(0, 6).map((p, idx) => [
    `#${idx + 1} ${p.nom}`,
    p.categorie,
    `${p.quantite_vendue} unité(s)`,
    formatFCFA(p.chiffre_affaires)
  ]);

  autoTable(doc, {
    startY: topY + 3,
    head: [['Désignation Article', 'Rayon', 'Volume Vendu', 'Chiffre d\'Affaires']],
    body: prodRows,
    headStyles: { fillColor: PDF_COLORS.headerBg, textColor: 255, fontSize: 8 },
    alternateRowStyles: { fillColor: PDF_COLORS.lightRow },
    styles: { fontSize: 8, cellPadding: 2.2, textColor: PDF_COLORS.primary, lineColor: PDF_COLORS.border },
    columnStyles: {
      0: { cellWidth: 72, fontStyle: 'bold' },
      1: { cellWidth: 40 },
      2: { halign: 'center', cellWidth: 30 },
      3: { halign: 'right', fontStyle: 'bold', textColor: PDF_COLORS.accentGreen, cellWidth: 40 }
    }
  });

  addCorporateFooter(doc, 'Rapport Statistiques Commerciales');
  doc.save(`Statistiques_MollyMarket_${new Date().toISOString().slice(0, 10)}.pdf`);
}
