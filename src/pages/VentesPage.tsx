import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Vente, Client, Produit, ModePaiement } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useCaisseStore } from '../store/useCaisseStore';
import { formatFCFA } from '../utils/format';
import {
  ShoppingCart,
  Plus,
  Ban,
  Receipt,
  Eye,
  Trash2,
  CreditCard,
  Banknote,
  DollarSign,
  AlertCircle,
  Lock,
  ArrowRight,
  ScanLine
} from 'lucide-react';
import { SupermarchePOSTerminal } from '../components/pos/SupermarchePOSTerminal';

export const VentesPage: React.FC = () => {
  const {
    isVerrouillee: caisseVerrouillee,
    isOuverte,
    statutSession,
    chargerEtatCaisse
  } = useCaisseStore();

  const [activeTab, setActiveTab] = useState<'terminal' | 'historique'>('terminal');
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [modalNewOpen, setModalNewOpen] = useState(false);
  const [modalDetailOpen, setModalDetailOpen] = useState(false);
  const [modalAnnulerOpen, setModalAnnulerOpen] = useState(false);
  const [selectedVente, setSelectedVente] = useState<Vente | null>(null);
  const [motifAnnulation, setMotifAnnulation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New Sale State
  const [clientId, setClientId] = useState<number | ''>('');
  const [modePaiement, setModePaiement] = useState<ModePaiement>('carte_bancaire');
  const [panier, setPanier] = useState<{ produit_id: number; quantite: number }[]>([
    { produit_id: 1, quantite: 1 }
  ]);

  // Total calculé par la fonction PostgreSQL (zéro calcul financier côté client)
  const [totalCalculeParBackend, setTotalCalculeParBackend] = useState<{
    montant_ht: number;
    tva: number;
    montant_total: number;
  }>({ montant_ht: 0, tva: 0, montant_total: 0 });

  const { user } = useAuth();
  const { toastSuccess, toastError, toastWarning } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [ventesData, clientsData, prodsData] = await Promise.all([
        apiClient.getVueCommandes(),
        apiClient.getVueClients(),
        apiClient.getVueStock(),
        chargerEtatCaisse(user?.id || 3, user ? `${user.prenom} ${user.nom}` : 'Noam Koffi')
      ]);
      setVentes(ventesData);
      setClients(clientsData);
      setProduits(prodsData);
    } catch (err: any) {
      toastError(err.message || 'Erreur chargement des ventes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Dès que le panier change, appel de la fonction PostgreSQL de calcul
  useEffect(() => {
    const interrogerFonctionCalcul = async () => {
      if (panier.length === 0) {
        setTotalCalculeParBackend({ montant_ht: 0, tva: 0, montant_total: 0 });
        return;
      }
      try {
        const res = await apiClient.simulerCalculVente(panier);
        setTotalCalculeParBackend({
          montant_ht: res.montant_ht,
          tva: res.tva,
          montant_total: res.montant_total
        });
      } catch (e) {
        console.error('Erreur appel fn_calculer_total_vente', e);
      }
    };
    interrogerFonctionCalcul();
  }, [panier]);

  const handleAjouterLigne = () => {
    const disponible = produits.find((p) => p.stock_actuel > 0);
    if (!disponible) {
      toastWarning('Aucun produit disponible en stock.');
      return;
    }
    setPanier((prev) => [...prev, { produit_id: disponible.id, quantite: 1 }]);
  };

  const handleSupprimerLigne = (idx: number) => {
    setPanier((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleProduitChange = (index: number, pId: number) => {
    setPanier((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], produit_id: pId };
      return copy;
    });
  };

  const handleQuantiteChange = (index: number, qty: number) => {
    setPanier((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], quantite: Math.max(1, qty) };
      return copy;
    });
  };

  const handleSubmitVente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (panier.length === 0) {
      toastError('Le panier de caisse est vide.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.effectuerVente({
        client_id: clientId ? Number(clientId) : null,
        lignes: panier,
        vendeur_id: user ? user.id : 3,
        vendeur_nom: user ? `${user.prenom} ${user.nom}` : 'Aïssata Diallo',
        mode_paiement: modePaiement
      });

      toastSuccess(
        `Ticket de caisse ${res.vente.numero_ticket} validé (${formatFCFA(res.vente.montant_total)})`,
        'CALL sp_effectuer_vente'
      );

      setModalNewOpen(false);
      setPanier([{ produit_id: 1, quantite: 1 }]);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de la validation du ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnnulerVente = async () => {
    if (!selectedVente) return;
    if (!motifAnnulation.trim()) {
      toastError('Veuillez spécifier le motif d\'annulation de la vente.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.annulerVente(
        selectedVente.id,
        motifAnnulation,
        user ? `${user.prenom} ${user.nom}` : 'Vendeur'
      );
      toastSuccess(
        `Vente ${selectedVente.numero_ticket} annulée. Stocks réintégrés par trigger.`,
        'CALL sp_annuler_vente'
      );
      setModalAnnulerOpen(false);
      setMotifAnnulation('');
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur annulation vente');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: Column<Vente>[] = [
    {
      key: 'numero_ticket',
      header: 'N° Ticket',
      width: '160px',
      accessor: (v) => (
        <div className="flex items-center gap-1.5 font-mono font-bold text-neutral-900">
          <Receipt className="w-3.5 h-3.5 text-[#2E7D32]" />
          <span>{v.numero_ticket}</span>
        </div>
      )
    },
    {
      key: 'client',
      header: 'Client',
      accessor: (v) => (
        <div>
          <div className="font-bold text-neutral-900">{v.client_nom}</div>
          <div className="text-[11px] text-neutral-400">Vendeur : {v.vendeur_nom}</div>
        </div>
      )
    },
    {
      key: 'date_vente',
      header: 'Date & Heure',
      width: '140px',
      accessor: (v) => <span className="text-neutral-600">{v.date_vente}</span>
    },
    {
      key: 'montant_total',
      header: 'Total Payé',
      align: 'right',
      width: '130px',
      accessor: (v) => (
        <span className="font-bold text-neutral-900">{formatFCFA(v.montant_total)}</span>
      )
    },
    {
      key: 'statut',
      header: 'Statut',
      align: 'center',
      width: '120px',
      accessor: (v) => (
        <StatusBadge
          label={v.statut === 'terminee' ? 'Validée' : 'Annulée'}
          tone={v.statut === 'terminee' ? 'green' : 'red'}
        />
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      width: '120px',
      accessor: (v) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => {
              setSelectedVente(v);
              setModalDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors"
            title="Consulter le ticket de caisse"
          >
            <Eye className="w-4 h-4" />
          </button>

          {v.statut === 'terminee' && (
            <button
              onClick={() => {
                setSelectedVente(v);
                setMotifAnnulation('');
                setModalAnnulerOpen(true);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-[#E53935] hover:bg-rose-50 transition-colors"
              title="Annuler cette vente (CALL sp_annuler_vente)"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Alerte Caisse Verrouillée */}
      {caisseVerrouillee && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-900">
              <div className="font-bold text-rose-950 text-sm">
                Caisse verrouillée jusqu'au lendemain
              </div>
              <p className="mt-0.5">
                Le point de caisse journalier a été clôturé et soumis au Directeur Eden. Les encaissements de ventes sont bloqués pour préserver la réconciliation comptable jusqu'à l'ouverture de la session de demain.
              </p>
            </div>
          </div>
          <Link
            to="/point-de-caisse"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shrink-0 transition-colors shadow-2xs"
          >
            <span>Voir le point</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Encaissement & Ventes Clients</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Émission des tickets de caisse et procédures d'annulation sécurisées
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/point-de-caisse"
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 text-xs font-semibold shadow-2xs transition-all"
          >
            <Receipt className="w-4 h-4 text-[#2E7D32]" />
            <span>Session de caisse</span>
          </Link>
        </div>
      </div>

      {/* Onglets Mode Caisse POS vs Historique */}
      <div className="flex items-center gap-3 border-b border-neutral-200 pb-2">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'terminal'
              ? 'bg-[#2E7D32] text-white shadow-sm'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <ScanLine className="w-4 h-4" />
          <span>Scanner & Caisse Enregistreuse</span>
        </button>

        <button
          onClick={() => setActiveTab('historique')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'historique'
              ? 'bg-[#2E7D32] text-white shadow-sm'
              : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Historique des Tickets de Caisse ({ventes.length})</span>
        </button>
      </div>

      {activeTab === 'terminal' ? (
        <SupermarchePOSTerminal onVenteComplete={loadData} />
      ) : (
        <DataTable
          columns={columns}
          data={ventes}
          isLoading={loading}
          searchPlaceholder="Rechercher par N° ticket ou nom client..."
          searchKeys={['numero_ticket', 'client_nom', 'vendeur_nom']}
        />
      )}

      {/* Modal Effectuer Vente (Caisse) */}
      <Modal
        isOpen={modalNewOpen}
        onClose={() => !submitting && setModalNewOpen(false)}
        title="Encaisser une Vente (Caisse)"
        subtitle="CALL sp_effectuer_vente • Calcul automatique du total par fonction PostgreSQL"
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
              form="vente-form"
              disabled={submitting || panier.length === 0}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Receipt className="w-4 h-4" />
              <span>Valider & Encaisser {formatFCFA(totalCalculeParBackend.montant_total)}</span>
            </button>
          </>
        }
      >
        <form id="vente-form" onSubmit={handleSubmitVente} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Choix Client */}
            <FormField
              id="v-client"
              label="Client (Fidélité ou Passage)"
              type="select"
              value={clientId}
              onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
              options={[
                { value: '', label: '👤 Client de passage au comptoir' },
                ...clients
                  .filter((c) => c.actif)
                  .map((c) => ({
                    value: c.id,
                    label: `${c.nom} ${c.prenom} (${c.code_client})`
                  }))
              ]}
            />

            {/* Mode de règlement */}
            <FormField
              id="v-mode"
              label="Mode de Règlement"
              type="select"
              required
              value={modePaiement}
              onChange={(e) => setModePaiement(e.target.value as ModePaiement)}
              options={[
                { value: 'wave', label: 'Wave Mobile Money' },
                { value: 'orange_money', label: 'Orange Money CI' },
                { value: 'mtn_money', label: 'MTN Mobile Money' },
                { value: 'moov_money', label: 'Moov Money CI' },
                { value: 'especes', label: 'Espèces (FCFA)' },
                { value: 'carte_bancaire', label: 'Carte Bancaire' },
                { value: 'cheque', label: 'Chèque' }
              ]}
            />
          </div>

          {/* Panier Articles */}
          <div className="border-t border-neutral-100 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-700">
                Articles scannés / Ajoutés au panier
              </label>
              <button
                type="button"
                onClick={handleAjouterLigne}
                className="text-xs font-bold text-[#2E7D32] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un article
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {panier.map((item, idx) => {
                const prod = produits.find((p) => p.id === item.produit_id);
                const enStock = prod ? prod.stock_actuel : 0;
                const depassement = item.quantite > enStock;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs transition-colors ${
                      depassement
                        ? 'bg-rose-50/50 border-rose-300'
                        : 'bg-neutral-50 border-neutral-200'
                    }`}
                  >
                    <div className="flex-1">
                      <select
                        value={item.produit_id}
                        onChange={(e) =>
                          handleProduitChange(idx, parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs font-medium focus:outline-none focus:border-[#2E7D32]"
                      >
                        {produits.map((p) => (
                          <option key={p.id} value={p.id} disabled={p.stock_actuel === 0}>
                            {p.nom} - {formatFCFA(p.prix_vente)} (Dispo: {p.stock_actuel})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <input
                        type="number"
                        min="1"
                        placeholder="Qté"
                        value={item.quantite}
                        onChange={(e) =>
                          handleQuantiteChange(idx, parseInt(e.target.value, 10))
                        }
                        className="w-full bg-white border border-neutral-300 rounded-lg p-1.5 text-xs text-center font-bold focus:outline-none focus:border-[#2E7D32]"
                      />
                    </div>

                    <div className="w-28 text-right font-bold text-neutral-800">
                      {formatFCFA(prod ? prod.prix_vente * item.quantite : 0)}
                    </div>

                    {panier.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSupprimerLigne(idx)}
                        className="p-1 text-neutral-400 hover:text-[#E53935]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bandeau Total renvoyé par la fonction PostgreSQL */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#2E7D32]" />
              <div>
                <span className="text-xs font-bold text-[#2E7D32] block">
                  Total renvoyé par PostgreSQL (SELECT fn_calculer_total_vente)
                </span>
                <span className="text-[11px] text-neutral-500">
                  Montant HT : {formatFCFA(totalCalculeParBackend.montant_ht)} • TVA : {formatFCFA(totalCalculeParBackend.tva)}
                </span>
              </div>
            </div>

            <div className="text-2xl font-black text-[#212121]">
              {formatFCFA(totalCalculeParBackend.montant_total)}
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal Détail Ticket */}
      {selectedVente && (
        <Modal
          isOpen={modalDetailOpen}
          onClose={() => setModalDetailOpen(false)}
          title={`Ticket de Caisse #${selectedVente.numero_ticket}`}
          subtitle={`Enregistré le ${selectedVente.date_vente} par ${selectedVente.vendeur_nom}`}
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
            <div className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-neutral-400 block text-[11px]">Client</span>
                <span className="font-bold text-neutral-900">{selectedVente.client_nom}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[11px]">Statut</span>
                <StatusBadge
                  label={selectedVente.statut === 'terminee' ? 'Payé' : 'Annulé'}
                  tone={selectedVente.statut === 'terminee' ? 'green' : 'red'}
                />
              </div>
            </div>

            {selectedVente.motif_annulation && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[#E53935]">
                <div className="font-bold">Motif de l'annulation :</div>
                <div>{selectedVente.motif_annulation}</div>
              </div>
            )}

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 font-bold uppercase text-[10px]">
                  <th className="py-2">Article</th>
                  <th className="py-2 text-center">Quantité</th>
                  <th className="py-2 text-right">Prix U.</th>
                  <th className="py-2 text-right">Sous-total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {selectedVente.lignes.map((ligne, i) => (
                  <tr key={i}>
                    <td className="py-2 font-medium text-neutral-900">{ligne.produit_nom}</td>
                    <td className="py-2 text-center font-bold">{ligne.quantite}</td>
                    <td className="py-2 text-right">{formatFCFA(ligne.prix_unitaire)}</td>
                    <td className="py-2 text-right font-bold text-[#2E7D32]">
                      {formatFCFA(ligne.sous_total || ligne.quantite * ligne.prix_unitaire)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-3 border-t border-neutral-200 flex justify-between items-center font-bold text-sm">
              <span>Total TTC</span>
              <span className="text-lg text-[#2E7D32]">
                {formatFCFA(selectedVente.montant_total)}
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Confirmation Annulation */}
      {selectedVente && (
        <Modal
          isOpen={modalAnnulerOpen}
          onClose={() => !submitting && setModalAnnulerOpen(false)}
          title={`Annuler la Vente #${selectedVente.numero_ticket}`}
          subtitle="Procédure stockée : CALL sp_annuler_vente(vente_id, motif, utilisateur_id)"
          footer={
            <>
              <button
                type="button"
                disabled={submitting}
                onClick={() => setModalAnnulerOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Retour
              </button>
              <button
                type="button"
                disabled={submitting || !motifAnnulation.trim()}
                onClick={handleAnnulerVente}
                className="px-4 py-2 text-xs font-bold text-white bg-[#E53935] hover:bg-red-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {submitting ? 'Traitement...' : 'Confirmer l\'annulation'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-950">
              <AlertCircle className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Attention :</p>
                <p className="mt-0.5">
                  L'exécution de la procédure PostgreSQL <code>sp_annuler_vente</code> réintégrera
                  automatiquement tous les articles vendus dans les stocks disponibles via son trigger.
                </p>
              </div>
            </div>

            <FormField
              id="motif-annul"
              label="Motif obligatoire de l'annulation"
              type="textarea"
              required
              rows={3}
              placeholder="Ex: Erreur de saisie caisse, retour marchandise client, article endommagé..."
              value={motifAnnulation}
              onChange={(e) => setMotifAnnulation(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
};
