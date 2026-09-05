import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Achat, Fournisseur, Produit } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatFCFA } from '../utils/format';
import {
  ShoppingBag,
  Plus,
  CheckCircle,
  PackageCheck,
  Eye,
  Trash2,
  CreditCard,
  Clock,
  FileText,
  Send,
  AlertCircle,
  CheckCircle2,
  Truck,
  Layers
} from 'lucide-react';

export const AchatsPage: React.FC = () => {
  const [achats, setAchats] = useState<Achat[]>([]);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalNewOpen, setModalNewOpen] = useState(false);
  const [modalDetailOpen, setModalDetailOpen] = useState(false);
  const [modalPayerOpen, setModalPayerOpen] = useState(false);
  const [selectedAchat, setSelectedAchat] = useState<Achat | null>(null);
  const [achatAPayer, setAchatAPayer] = useState<Achat | null>(null);
  const [modePaiementDirecteur, setModePaiementDirecteur] = useState<string>('virement');
  const [submitting, setSubmitting] = useState(false);

  // New Purchase Form
  const [fournisseurId, setFournisseurId] = useState<number>(1);
  const [factureRef, setFactureRef] = useState<string>('');
  const [lignesAchat, setLignesAchat] = useState<
    { produit_id: number; quantite: number; prix_unitaire: number }[]
  >([{ produit_id: 1, quantite: 50, prix_unitaire: 1.60 }]);

  // Totaux retournés par le backend (aucune formule en dur dans le client)
  const [calculBackend, setCalculBackend] = useState<{
    montant_ht: number;
    tva: number;
    montant_total: number;
  }>({ montant_ht: 80, tva: 20, montant_total: 100 });

  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [achatsData, frsData, prodsData] = await Promise.all([
        apiClient.getVueAchats(),
        apiClient.getVueFournisseurs(),
        apiClient.getVueStock()
      ]);
      setAchats(achatsData);
      setFournisseurs(frsData);
      setProduits(prodsData);
      if (frsData.length > 0) setFournisseurId(frsData[0].id);
    } catch (err: any) {
      toastError(err.message || 'Erreur chargement des achats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Déclencher le calcul côté serveur dès que les lignes changent
  useEffect(() => {
    const fetchCalculation = async () => {
      try {
        const res = await apiClient.simulerCalculAchat(lignesAchat);
        setCalculBackend({
          montant_ht: res.montant_ht,
          tva: res.tva,
          montant_total: res.montant_total
        });
      } catch (err) {
        console.error('Erreur calcul serveur', err);
      }
    };
    if (lignesAchat.length > 0) {
      fetchCalculation();
    }
  }, [lignesAchat]);

  const handleAddLine = () => {
    const firstProd = produits[0];
    setLignesAchat((prev) => [
      ...prev,
      {
        produit_id: firstProd ? firstProd.id : 1,
        quantite: 10,
        prix_unitaire: firstProd ? firstProd.prix_achat : 1.0
      }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    setLignesAchat((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleLineProductChange = (index: number, pId: number) => {
    const prod = produits.find((p) => p.id === pId);
    setLignesAchat((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        produit_id: pId,
        prix_unitaire: prod ? prod.prix_achat : 1.0
      };
      return copy;
    });
  };

  const handleLineQtyChange = (index: number, qty: number) => {
    setLignesAchat((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantite: Math.max(1, qty) };
      return copy;
    });
  };

  const handleLinePriceChange = (index: number, price: number) => {
    setLignesAchat((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], prix_unitaire: Math.max(0, price) };
      return copy;
    });
  };

  const handleSubmitAchat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lignesAchat.length === 0) {
      toastError('Ajoutez au moins un produit à la commande.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.effectuerAchat({
        fournisseur_id: fournisseurId,
        lignes: lignesAchat,
        cree_par_nom: user ? `${user.prenom} ${user.nom}` : 'Karim Benali (Magasinier)'
      });
      toastSuccess(
        'Bon d\'achat enregistré & Facture transmise au Directeur pour règlement',
        'Circuit Magasinier -> Directeur'
      );
      setModalNewOpen(false);
      setFactureRef('');
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de l\'achat');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayerFacture = async () => {
    if (!achatAPayer) return;
    setSubmitting(true);
    try {
      await apiClient.payerFactureFournisseur(
        achatAPayer.id,
        user ? `${user.prenom} ${user.nom}` : 'Eden Touré (Directeur)',
        modePaiementDirecteur
      );
      toastSuccess(
        `Facture ${achatAPayer.facture_fournisseur_ref || achatAPayer.numero_achat} payée (${formatFCFA(achatAPayer.montant_total)})`,
        'Sortie de caisse / banque enregistrée dans la trésorerie'
      );
      setModalPayerOpen(false);
      setAchatAPayer(null);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du paiement de la facture');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceptionStock = async (achat: Achat) => {
    if (!window.confirm(`Confirmer la réception de la marchandise pour l'achat ${achat.numero_achat} ? Les stocks seront incrémentés automatiquement en rayon.`)) {
      return;
    }

    try {
      await apiClient.receptionStock(
        achat.id,
        user ? `${user.prenom} ${user.nom}` : 'Karim Benali (Magasinier)'
      );
      toastSuccess(
        `Marchandises réceptionnées ! Les stocks de ${achat.lignes.length} article(s) ont été incrémentés.`,
        'CALL sp_reception_stock'
      );
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur réception stock');
    }
  };

  const facturesEnAttentePaiement = achats.filter(
    (a) => a.statut === 'en_attente_paiement_directeur'
  );
  const totalFacturesEnAttente = facturesEnAttentePaiement.reduce(
    (s, a) => s + a.montant_total,
    0
  );

  const columns: Column<Achat>[] = [
    {
      key: 'numero_achat',
      header: 'N° Commande & Facture',
      width: '170px',
      accessor: (a) => (
        <div>
          <span className="font-mono font-bold text-neutral-900 block">{a.numero_achat}</span>
          <span className="text-[11px] text-neutral-400 font-mono">
            {a.facture_fournisseur_ref || 'Facture jointe'}
          </span>
        </div>
      )
    },
    {
      key: 'fournisseur',
      header: 'Fournisseur',
      accessor: (a) => (
        <div>
          <div className="font-bold text-neutral-900">{a.fournisseur_nom}</div>
          <div className="text-[11px] text-neutral-400">Émis par : {a.cree_par_nom}</div>
          {a.paye_par_nom && (
            <div className="text-[10px] text-emerald-700 font-medium">
              ✓ Payé par : {a.paye_par_nom} ({a.date_paiement})
            </div>
          )}
        </div>
      )
    },
    {
      key: 'date_achat',
      header: 'Date d\'émission',
      width: '140px',
      accessor: (a) => <span className="text-neutral-600">{a.date_achat}</span>
    },
    {
      key: 'montant_total',
      header: 'Montant Facture',
      align: 'right',
      width: '140px',
      accessor: (a) => (
        <span className="font-bold text-neutral-900 font-mono">{formatFCFA(a.montant_total)}</span>
      )
    },
    {
      key: 'statut',
      header: 'Circuit & Statut',
      align: 'center',
      width: '190px',
      accessor: (a) => {
        const labels: Record<string, string> = {
          en_attente_paiement_directeur: 'Facture chez le Directeur',
          paye_par_directeur: 'Payé Directeur • En transit',
          en_attente: 'En attente livraison',
          recu: 'Réceptionné & En rayon',
          annule: 'Annulé'
        };
        const tones: Record<string, 'orange' | 'blue' | 'green' | 'red'> = {
          en_attente_paiement_directeur: 'orange',
          paye_par_directeur: 'blue',
          en_attente: 'orange',
          recu: 'green',
          annule: 'red'
        };
        return <StatusBadge label={labels[a.statut] || a.statut} tone={tones[a.statut] || 'orange'} />;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      width: '180px',
      accessor: (a) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedAchat(a);
              setModalDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors"
            title="Consulter le bon de commande & facture"
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Action pour le Directeur : Payer la facture fournisseur */}
          {(user?.role === 'Directeur' || user?.role === 'Administrateur') &&
            a.statut === 'en_attente_paiement_directeur' && (
              <button
                onClick={() => {
                  setAchatAPayer(a);
                  setModalPayerOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#2E7D32] hover:bg-[#1B5E20] text-white transition-all shadow-xs"
                title="Payer la facture fournisseur (Débit Caisse/Banque)"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payer facture</span>
              </button>
            )}

          {/* Action pour le Magasinier : Réceptionner la marchandise */}
          {(a.statut === 'paye_par_directeur' || a.statut === 'en_attente') && (
            <button
              onClick={() => handleReceptionStock(a)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              title="Valider la réception physique en magasin et incrémenter les stocks"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Réceptionner</span>
            </button>
          )}

          {a.statut === 'en_attente_paiement_directeur' && user?.role === 'Magasinier' && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 inline-flex items-center gap-1 font-medium">
              <Clock className="w-3 h-3" /> Attente Directeur
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Circuit Approvisionnement & Gestion Fournisseur Molly Market */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm">
        <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2E7D32]" /> Circuit Approvisionnement & Rôles Molly Market
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center text-[10px] font-bold">1</span>
              <span>Magasinier</span>
            </div>
            <p className="text-neutral-500 text-[11px]">Suit le stock, passe la commande et transmet la facture au Directeur</p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center text-[10px] font-bold">2</span>
              <span>Directeur</span>
            </div>
            <p className="text-neutral-500 text-[11px]">Vérifie la facture et effectue le paiement fournisseur (sortie caisse/banque)</p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center text-[10px] font-bold">3</span>
              <span>Fournisseur</span>
            </div>
            <p className="text-neutral-500 text-[11px]">Achemine les marchandises commandées jusqu'au supermarché</p>
          </div>

          <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-neutral-700 font-bold mb-1">
              <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#2E7D32] flex items-center justify-center text-[10px] font-bold">4</span>
              <span>Magasinier</span>
            </div>
            <p className="text-neutral-500 text-[11px]">Réceptionne les produits et alimente immédiatement les stocks en rayon</p>
          </div>
        </div>
      </div>

      {/* Alerte Directeur si factures en attente de paiement */}
      {facturesEnAttentePaiement.length > 0 && (user?.role === 'Directeur' || user?.role === 'Administrateur') && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-800 shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm">
                {facturesEnAttentePaiement.length} Facture(s) Fournisseur(s) en attente de paiement par la Direction
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                Montant total des factures à régler : <span className="font-bold font-mono">{formatFCFA(totalFacturesEnAttente)}</span>.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Achats Fournisseurs & Facturation</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Commandes Magasinier, règlement des factures par le Directeur et réception des stocks
          </p>
        </div>

        <button
          onClick={() => setModalNewOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Passer une commande fournisseur</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={achats}
        isLoading={loading}
        searchPlaceholder="Rechercher par N° d'achat ou fournisseur..."
        searchKeys={['numero_achat', 'fournisseur_nom']}
      />

      {/* Modal Nouveau Bon d'Achat */}
      <Modal
        isOpen={modalNewOpen}
        onClose={() => !submitting && setModalNewOpen(false)}
        title="Effectuer un Achat Fournisseur"
        subtitle="Procédure stockée : CALL sp_effectuer_achat(fournisseur_id, lignes_json, utilisateur_id)"
        size="lg"
        footer={
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setModalNewOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="achat-form"
              disabled={submitting || lignesAchat.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submitting ? 'Validation...' : 'Valider la commande d\'achat'}
            </button>
          </>
        }
      >
        <form id="achat-form" onSubmit={handleSubmitAchat} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField
              id="achat-frs"
              label="Sélectionner le Fournisseur"
              type="select"
              required
              value={fournisseurId}
              onChange={(e) => setFournisseurId(parseInt(e.target.value, 10))}
              options={fournisseurs.map((f) => ({
                value: f.id,
                label: `${f.nom_entreprise} (${f.ville})`
              }))}
            />

            <FormField
              id="achat-facture-ref"
              label="N° Facture Fournisseur (Proforma)"
              type="text"
              placeholder="Ex: FAC-2026-0089"
              value={factureRef}
              onChange={(e) => setFactureRef(e.target.value)}
              helperText="La facture sera transmise au Directeur pour ordonnancement du paiement"
            />
          </div>

          <div className="border-t border-neutral-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-700">
                Articles & Quantités à commander
              </label>
              <button
                type="button"
                onClick={handleAddLine}
                className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter une ligne
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {lignesAchat.map((ligne, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs"
                >
                  <div className="flex-1">
                    <select
                      value={ligne.produit_id}
                      onChange={(e) => handleLineProductChange(index, parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-medium focus:outline-none focus:border-[#2E7D32]"
                    >
                      {produits.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nom} (Reste: {p.stock_actuel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qté"
                      value={ligne.quantite}
                      onChange={(e) => handleLineQtyChange(index, parseInt(e.target.value, 10))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs text-center font-bold focus:outline-none focus:border-[#2E7D32]"
                    />
                  </div>

                  <div className="w-28">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Prix U"
                      value={ligne.prix_unitaire}
                      onChange={(e) => handleLinePriceChange(index, parseFloat(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs text-right font-medium focus:outline-none focus:border-[#2E7D32]"
                    />
                  </div>

                  {lignesAchat.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(index)}
                      className="p-1 text-neutral-400 hover:text-[#E53935]"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Récapitulatif calculé par la fonction PostgreSQL */}
          <div className="p-3.5 rounded-xl bg-neutral-100/80 border border-neutral-200 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-medium">
              Total retourné par la fonction PostgreSQL :
            </span>
            <div className="text-right">
              <span className="text-base font-black text-[#212121]">
                {formatFCFA(calculBackend.montant_total)} TTC
              </span>
              <div className="text-[10px] text-neutral-400">
                (dont TVA : {formatFCFA(calculBackend.tva)})
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Consultation Détail Achat */}
      {selectedAchat && (
        <Modal
          isOpen={modalDetailOpen}
          onClose={() => setModalDetailOpen(false)}
          title={`Détail Commande ${selectedAchat.numero_achat}`}
          subtitle={`Fournisseur : ${selectedAchat.fournisseur_nom}`}
          footer={
            <button
              onClick={() => setModalDetailOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
            >
              Fermer
            </button>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-xl">
              <div>
                <span className="text-neutral-400 block">Date émission</span>
                <span className="font-semibold text-neutral-800">{selectedAchat.date_achat}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Statut réception</span>
                <span className="font-semibold text-neutral-800">
                  {selectedAchat.statut === 'recu'
                    ? `Reçu le ${selectedAchat.date_reception}`
                    : 'En attente'}
                </span>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Article</th>
                  <th className="py-2 text-center">Quantité</th>
                  <th className="py-2 text-right">Prix Unitaire</th>
                  <th className="py-2 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {selectedAchat.lignes.map((l, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-neutral-900">{l.produit_nom}</td>
                    <td className="py-2 text-center font-bold">{l.quantite}</td>
                    <td className="py-2 text-right">{formatFCFA(l.prix_unitaire)}</td>
                    <td className="py-2 text-right font-bold text-[#2E7D32]">
                      {formatFCFA(l.sous_total || l.quantite * l.prix_unitaire)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center font-bold text-sm">
              <span>Total Commande TTC</span>
              <span className="text-[#2E7D32]">{formatFCFA(selectedAchat.montant_total)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Règlement Facture Fournisseur par le Directeur */}
      {achatAPayer && (
        <Modal
          isOpen={modalPayerOpen}
          onClose={() => !submitting && setModalPayerOpen(false)}
          title="Règlement de la Facture Fournisseur"
          subtitle={`Bon ${achatAPayer.numero_achat} • ${achatAPayer.fournisseur_nom}`}
          size="md"
          footer={
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalPayerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handlePayerFacture}
                className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" />
                <span>{submitting ? 'Validation...' : 'Valider le paiement fournisseur'}</span>
              </button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-emerald-900 font-bold">Montant à décaisser :</span>
                <span className="text-base font-extrabold text-[#2E7D32] font-mono">
                  {formatFCFA(achatAPayer.montant_total)}
                </span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Fournisseur : <span className="font-semibold">{achatAPayer.fournisseur_nom}</span> | Facture : <span className="font-mono">{achatAPayer.facture_fournisseur_ref || 'Jointe'}</span>
              </p>
            </div>

            <FormField
              id="mode-paiement-directeur"
              label="Mode de Règlement Financier"
              type="select"
              required
              value={modePaiementDirecteur}
              onChange={(e) => setModePaiementDirecteur(e.target.value)}
              options={[
                { value: 'virement', label: 'Virement bancaire professionnel' },
                { value: 'cheque', label: 'Chèque certifié d\'entreprise' },
                { value: 'especes', label: 'Espèces (Sortie Fond de Caisse)' }
              ]}
              helperText="Cette opération déduira automatiquement le montant de la trésorerie générale du supermarché."
            />

            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 text-neutral-600 space-y-1 text-[11px]">
              <div className="font-semibold text-neutral-800">Note comptable & Traçabilité :</div>
              <div>• Ordonnateur : {user ? `${user.prenom} ${user.nom} (${user.role})` : 'Directeur'}</div>
              <div>• Statut suivant : La commande passera en statut "Payé par Directeur - En transit". Le magasinier sera notifié pour la réception physique.</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
