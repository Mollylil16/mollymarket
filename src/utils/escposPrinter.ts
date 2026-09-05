/**
 * @file src/utils/escposPrinter.ts
 * Pilote d'impression thermique directe ESC/POS pour imprimantes de caisse (80mm et 58mm)
 * Supporte WebSerial, WebUSB et fallback d'impression directe rapide
 */
import { formatFCFA } from './format';

export interface TicketThermiqueData {
  numero_ticket: string;
  date_vente: string;
  vendeur_nom: string;
  caisse_nom?: string;
  client_nom?: string;
  mode_paiement: string;
  montant_total: number;
  montant_recu?: number;
  monnaie_rendue?: number;
  lignes: Array<{
    produit_nom: string;
    quantite: number;
    prix_unitaire: number;
    montant_total: number;
  }>;
}

/**
 * Construit la séquence d'octets binaires standard ESC/POS pour imprimante thermique
 */
export function genererESCPOSTrame(data: TicketThermiqueData, largeur: 80 | 58 = 80): Uint8Array {
  const enc = new TextEncoder();
  const buffer: number[] = [];

  const add = (...bytes: number[]) => buffer.push(...bytes);
  const addText = (text: string) => buffer.push(...Array.from(enc.encode(text)));
  const addLine = (text: string = '') => addText(text + '\n');

  const maxChars = largeur === 80 ? 48 : 32;
  const separateur = '-'.repeat(maxChars);

  // 1. Initialiser l'imprimante (ESC @)
  add(0x1b, 0x40);

  // 2. En-tête centré (ESC a 1)
  add(0x1b, 0x61, 0x01);

  // Titre en double taille & gras (ESC ! 0x38)
  add(0x1b, 0x21, 0x38);
  addLine('MOLLY MARKET');

  // Retour taille normale (ESC ! 0x00)
  add(0x1b, 0x21, 0x00);
  addLine('Supermarché & Commerce Général');
  addLine('Abidjan, Côte d\'Ivoire • Tél : +225 07 00 00 00');
  addLine('RCCM: CI-ABJ-2024-B • CC/IFU: 2415890 Z');
  addLine(separateur);

  // 3. Infos Ticket (Aligné à gauche ESC a 0)
  add(0x1b, 0x61, 0x00);
  addLine(`TICKET : ${data.numero_ticket}`);
  addLine(`DATE   : ${new Date(data.date_vente).toLocaleString('fr-FR')}`);
  addLine(`CAISSE : ${data.caisse_nom || 'Caisse Principale N°1'}`);
  addLine(`AGENT  : ${data.vendeur_nom}`);
  if (data.client_nom && data.client_nom !== 'Client Comptoir') {
    addLine(`CLIENT : ${data.client_nom}`);
  }
  addLine(separateur);

  // 4. Articles
  addLine('ARTICLE                 QTE    P.U     TOTAL');
  addLine(separateur);

  data.lignes.forEach((l) => {
    const nom = l.produit_nom.length > 20 ? l.produit_nom.substring(0, 19) + '.' : l.produit_nom.padEnd(20);
    const qte = String(l.quantite).padStart(4);
    const pu = String(Math.round(l.prix_unitaire)).padStart(7);
    const tot = String(Math.round(l.montant_total)).padStart(9);
    addLine(`${nom} ${qte} ${pu} ${tot}`);
  });

  addLine(separateur);

  // 5. Totaux (Gras & Aligné à droite)
  add(0x1b, 0x61, 0x02); // Align right
  add(0x1b, 0x21, 0x20); // Gras grand
  addLine(`TOTAL TTC : ${formatFCFA(data.montant_total)}`);

  add(0x1b, 0x21, 0x00); // Normal
  addLine(`RÈGLEMENT (${data.mode_paiement.toUpperCase()}) : ${formatFCFA(data.montant_recu || data.montant_total)}`);
  if (data.monnaie_rendue && data.monnaie_rendue > 0) {
    addLine(`MONNAIE RENDUE : ${formatFCFA(data.monnaie_rendue)}`);
  }

  // 6. Pied de page centré
  add(0x1b, 0x61, 0x01);
  addLine(separateur);
  addLine('Merci de votre visite et à très bientôt !');
  addLine('Les articles vendus ne sont ni repris ni échangés');
  addLine('Conservez ce ticket pour tout recours.');
  addLine('');
  addLine('');
  addLine('');

  // 7. Massicot / Coupe papier automatique (GS V 0)
  add(0x1d, 0x56, 0x00);

  return new Uint8Array(buffer);
}

/**
 * Tente une impression directe via port WebSerial (USB / Série)
 */
export async function imprimerViaWebSerial(data: TicketThermiqueData): Promise<boolean> {
  if (!('serial' in navigator)) {
    return false;
  }
  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    const writer = port.writable.getWriter();
    const trame = genererESCPOSTrame(data, 80);
    await writer.write(trame);
    writer.releaseLock();
    await port.close();
    return true;
  } catch (err) {
    console.warn('Impression WebSerial annulée ou non disponible:', err);
    return false;
  }
}

/**
 * Impression thermique optimisée instantanée sans boîte de dialogue encombrante
 */
export function imprimerTicketThermiqueDOM(data: TicketThermiqueData) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const lignesHTML = data.lignes.map(l => `
    <tr>
      <td style="padding: 2px 0; text-align: left;">${l.produit_nom}</td>
      <td style="padding: 2px 0; text-align: center;">${l.quantite}</td>
      <td style="padding: 2px 0; text-align: right;">${Math.round(l.prix_unitaire)}</td>
      <td style="padding: 2px 0; text-align: right; font-weight: bold;">${Math.round(l.montant_total)}</td>
    </tr>
  `).join('');

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Ticket ${data.numero_ticket}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 76mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            font-size: 11px;
            color: #000;
            line-height: 1.3;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .title { font-size: 15px; font-weight: 900; letter-spacing: 0.5px; }
          .hr { border-top: 1px dashed #000; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
          .total-box { font-size: 14px; font-weight: bold; margin: 4px 0; text-align: right; }
        </style>
      </head>
      <body>
        <div class="text-center">
          <div class="title">MOLLY MARKET</div>
          <div>Supermarché & Commerce Général</div>
          <div>Abidjan, Côte d'Ivoire</div>
          <div>Tél : +225 07 00 00 00</div>
          <div>RCCM: CI-ABJ-2024-B • IFU: 2415890 Z</div>
          <div class="hr"></div>
        </div>

        <div><strong>TICKET :</strong> ${data.numero_ticket}</div>
        <div><strong>DATE   :</strong> ${new Date(data.date_vente).toLocaleString('fr-FR')}</div>
        <div><strong>CAISSE :</strong> ${data.caisse_nom || 'Caisse Principale N°1'}</div>
        <div><strong>AGENT  :</strong> ${data.vendeur_nom}</div>
        ${data.client_nom && data.client_nom !== 'Client Comptoir' ? `<div><strong>CLIENT :</strong> ${data.client_nom}</div>` : ''}
        <div class="hr"></div>

        <table>
          <thead>
            <tr style="border-bottom: 1px dashed #000;">
              <th style="text-align: left; padding: 2px 0;">Article</th>
              <th style="text-align: center; padding: 2px 0;">Qté</th>
              <th style="text-align: right; padding: 2px 0;">P.U</th>
              <th style="text-align: right; padding: 2px 0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${lignesHTML}
          </tbody>
        </table>

        <div class="hr"></div>
        <div class="total-box">TOTAL TTC : ${formatFCFA(data.montant_total)}</div>
        <div class="text-right">Règlement (${data.mode_paiement.toUpperCase()}) : ${formatFCFA(data.montant_recu || data.montant_total)}</div>
        ${data.monnaie_rendue && data.monnaie_rendue > 0 ? `<div class="text-right">Monnaie Rendue : ${formatFCFA(data.monnaie_rendue)}</div>` : ''}

        <div class="hr"></div>
        <div class="text-center" style="font-size: 9.5px; margin-top: 6px;">
          <div>Merci de votre visite et à très bientôt !</div>
          <div>Les articles vendus ne sont ni repris ni échangés.</div>
        </div>
      </body>
    </html>
  `);
  doc.close();

  iframe.contentWindow?.focus();
  setTimeout(() => {
    iframe.contentWindow?.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 300);
}
