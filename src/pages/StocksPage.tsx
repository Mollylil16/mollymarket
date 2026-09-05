import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Produit, MouvementStock } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Boxes,
  Sliders,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  CheckCircle2,
  RefreshCw,
  Bell,
  Send,
  ShoppingBag
} from 'lucide-react';

export const StocksPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'etat' | 'historique'>('etat');
  const [stocks, setStocks] = useState<Produit[]>([]);
  const [mouvements, setMouvements] = useState<MouvementStock[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Ajustement
  const [modalAjustementOpen, setModalAjustementOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [nouvelleQuantite, setNouvelleQuantite] = useState<number>(0);
  const [motifAjustement, setMotifAjustement] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  const { toastSuccess, toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [stocksData, mouvsData] = await Promise.all([
        apiClient.getVueStock(),
        apiClient.getVueHistoriqueStock()
      ]);
      setStocks(stocksData);
      setMouvements(mouvsData);
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement des données de stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAjustement = (prod: Produit) => {
    setSelectedProduct(prod);
    setNouvelleQuantite(prod.stock_actuel);
    setMotifAjustement('Inventaire physique contradictoire');
    setModalAjustementOpen(true);
  };

  const handleSaveAjustement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (nouvelleQuantite < 0) {
      toastError('Le stock physique ne peut pas être négatif.');
      return;
    }

    if (!motifAjustement.trim()) {
      toastError('Veuillez renseigner un motif pour la traçabilité de l\'ajustement.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.ajusterStock(
        selectedProduct.id,
        nouvelleQuantite,
        motifAjustement,
        user ? `${user.prenom} ${user.nom}` : 'Magasinier'
      );
      toastSuccess('Ajustement de stock enregistré avec succès', 'Mise à jour du stock et journal d\'audit');
      setModalAjustementOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de l\'ajustement');
    } finally {
      setSaving(false);
    }
  };

  const prevenirDirecteur = (p?: Produit) => {
    if (p) {
      toastSuccess(
        `Alerte transmise au Directeur Eden pour "${p.nom}"`,
        `Stock critique : ${p.stock_actuel} ${p.unite_mesure} restant(s) (Seuil: ${p.seuil_alerte})`
      );
    } else {
      const nbAlerte = stocks.filter((s) => s.statut_stock !== 'en_stock').length;
      toastSuccess(
        `Rapport des ruptures envoyé au Directeur Eden (${nbAlerte} articles)`,
        'Notification transmise pour accord d\'approvisionnement fournisseur'
      );
    }
  };

  // Colonnes Vue État du Stock
  const stockColumns: Column<Produit>[] = [
    {
      key: 'code_barre',
      header: 'Code EAN',
      width: '130px',
      accessor: (p) => <span className="font-mono text-neutral-800">{p.code_barre}</span>
    },
    {
      key: 'nom',
      header: 'Article en rayon',
      accessor: (p) => (
        <div>
          <div className="font-bold text-neutral-900">{p.nom}</div>
          <div className="text-[11px] text-neutral-500">{p.categorie_nom}</div>
        </div>
      )
    },
    {
      key: 'stock_actuel',
      header: 'Stock Disponible',
      align: 'center',
      width: '150px',
      accessor: (p) => (
        <div className="font-mono font-bold text-sm">
          <span className={p.stock_actuel === 0 ? 'text-[#E53935]' : 'text-neutral-900'}>
            {p.stock_actuel} {p.unite_mesure}
          </span>
        </div>
      )
    },
    {
      key: 'seuil_alerte',
      header: 'Seuil Critique',
      align: 'center',
      width: '120px',
      accessor: (p) => (
        <span className="text-xs text-neutral-500 font-medium">
          {p.seuil_alerte} {p.unite_mesure}
        </span>
      )
    },
    {
      key: 'statut_stock',
      header: 'Niveau d\'alerte',
      align: 'center',
      width: '130px',
      accessor: (p) => {
        const labels = {
          en_stock: 'En stock',
          stock_faible: 'Alerte Seuil',
          rupture: 'Rupture'
        };
        const tones: { [k: string]: 'green' | 'orange' | 'red' } = {
          en_stock: 'green',
          stock_faible: 'orange',
          rupture: 'red'
        };
        return <StatusBadge label={labels[p.statut_stock]} tone={tones[p.statut_stock]} />;
      }
    },
    {
      key: 'actions',
      header: 'Actions Magasinier',
      sortable: false,
      align: 'right',
      width: '230px',
      accessor: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          {p.statut_stock !== 'en_stock' && (
            <>
              <button
                onClick={() => prevenirDirecteur(p)}
                className="p-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors"
                title="Prévenir le Directeur du stock bas"
              >
                <Bell className="w-3.5 h-3.5" />
              </button>

              <Link
                to="/achats"
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] transition-colors"
                title="Commander auprès du fournisseur"
              >
                <ShoppingBag className="w-3 h-3" />
                <span>Commander</span>
              </Link>
            </>
          )}

          <button
            onClick={() => openAjustement(p)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
            title="Ajustement d'inventaire physique"
          >
            <Sliders className="w-3 h-3 text-[#2E7D32]" />
            <span>Ajuster</span>
          </button>
        </div>
      )
    }
  ];

  // Colonnes Historique Mouvements
  const mouvColumns: Column<MouvementStock>[] = [
    {
      key: 'date_mouvement',
      header: 'Date & Heure',
      width: '140px',
      accessor: (m) => <span className="text-neutral-600 font-mono text-[11px]">{m.date_mouvement}</span>
    },
    {
      key: 'produit_nom',
      header: 'Produit',
      accessor: (m) => <span className="font-bold text-neutral-900">{m.produit_nom}</span>
    },
    {
      key: 'type_mouvement',
      header: 'Type Mouvement',
      width: '140px',
      accessor: (m) => {
        switch (m.type_mouvement) {
          case 'entree':
            return (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                <ArrowUpRight className="w-3.5 h-3.5" /> Entrée Achat
              </span>
            );
          case 'sortie':
            return (
              <span className="inline-flex items-center gap-1 font-bold text-rose-600">
                <ArrowDownRight className="w-3.5 h-3.5" /> Sortie Vente
              </span>
            );
          case 'ajustement':
            return (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                <Sliders className="w-3.5 h-3.5" /> Inventaire
              </span>
            );
          case 'annulation_vente':
            return (
              <span className="inline-flex items-center gap-1 font-bold text-blue-600">
                <RefreshCw className="w-3.5 h-3.5" /> Réintégration
              </span>
            );
          default:
            return m.type_mouvement;
        }
      }
    },
    {
      key: 'quantite',
      header: 'Variation',
      align: 'center',
      width: '90px',
      accessor: (m) => (
        <span
          className={`font-mono font-bold ${
            m.quantite > 0 ? 'text-[#2E7D32]' : 'text-[#E53935]'
          }`}
        >
          {m.quantite > 0 ? `+${m.quantite}` : m.quantite}
        </span>
      )
    },
    {
      key: 'stock_evolution',
      header: 'Évolution Stock',
      align: 'center',
      width: '120px',
      accessor: (m) => (
        <span className="font-mono text-xs text-neutral-500">
          {m.stock_avant} ➔ <b className="text-neutral-900">{m.stock_apres}</b>
        </span>
      )
    },
    {
      key: 'motif',
      header: 'Motif / Contexte',
      accessor: (m) => (
        <div>
          <span className="text-neutral-800 font-medium block">{m.motif}</span>
          <span className="text-[10px] text-neutral-400">Opérateur : {m.operateur_nom}</span>
        </div>
      )
    }
  ];

  const articlesEnAlerte = stocks.filter((s) => s.statut_stock !== 'en_stock');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Gestion des Stocks & Traçabilité</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Vue en temps réel (v_etat_stock) et journal d'audit des mouvements (v_historique_stock)
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-neutral-100 rounded-xl border border-neutral-200">
          <button
            onClick={() => setActiveTab('etat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'etat'
                ? 'bg-white text-[#2E7D32] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>État Actuel des Stocks</span>
          </button>
          <button
            onClick={() => setActiveTab('historique')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'historique'
                ? 'bg-white text-[#2E7D32] shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historique des Mouvements</span>
          </button>
        </div>
      </div>

      {/* Alerte Banner si ruptures ou faibles */}
      {articlesEnAlerte.length > 0 && activeTab === 'etat' && (
        <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#FB8C00] shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-amber-900 block">
                Attention : {articlesEnAlerte.length} article(s) sous le seuil d'alerte ou en rupture en rayon
              </span>
              <span className="text-amber-700">
                Vous pouvez alerter le Directeur Eden ou passer directement commande auprès de vos fournisseurs.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => prevenirDirecteur()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alerter le Directeur</span>
            </button>

            <Link
              to="/achats"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold transition-colors shadow-xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Commander fournisseurs</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Table depending on Tab */}
      {activeTab === 'etat' ? (
        <DataTable
          columns={stockColumns}
          data={stocks}
          isLoading={loading}
          searchPlaceholder="Rechercher un produit en stock..."
          searchKeys={['nom', 'code_barre', 'categorie_nom']}
        />
      ) : (
        <DataTable
          columns={mouvColumns}
          data={mouvements}
          isLoading={loading}
          searchPlaceholder="Rechercher dans l'historique par produit ou motif..."
          searchKeys={['produit_nom', 'motif', 'operateur_nom']}
        />
      )}

      {/* Modal Ajustement de stock */}
      {selectedProduct && (
        <Modal
          isOpen={modalAjustementOpen}
          onClose={() => !saving && setModalAjustementOpen(false)}
          title={`Ajuster le stock : ${selectedProduct.nom}`}
          subtitle="Procédure stockée : CALL sp_ajustement_stock(produit_id, nouvelle_quantite, motif, operateur_id)"
          footer={
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => setModalAjustementOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="ajustement-form"
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
              >
                {saving ? 'Enregistrement...' : 'Valider la régularisation'}
              </button>
            </>
          }
        >
          <form id="ajustement-form" onSubmit={handleSaveAjustement} className="space-y-4">
            <div className="p-3 bg-neutral-50 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="text-neutral-500 block">Stock théorique actuel</span>
                <span className="text-base font-bold text-neutral-800">
                  {selectedProduct.stock_actuel} {selectedProduct.unite_mesure}
                </span>
              </div>
              <div className="text-right">
                <span className="text-neutral-500 block">Seuil d'alerte rayon</span>
                <span className="text-xs font-semibold text-neutral-700">
                  {selectedProduct.seuil_alerte} {selectedProduct.unite_mesure}
                </span>
              </div>
            </div>

            <FormField
              id="ajust-qty"
              label="Nouveau Stock Physique Constaté"
              type="number"
              min="0"
              required
              value={nouvelleQuantite}
              onChange={(e) =>
                setNouvelleQuantite(Math.max(0, parseInt(e.target.value, 10) || 0))
              }
              helpText="Valeur réelle après comptage en rayon ou en réserve"
            />

            <FormField
              id="ajust-motif"
              label="Motif d'ajustement (justificatif d'audit)"
              type="textarea"
              required
              rows={2}
              placeholder="Ex: Casse rayon, démarque inconnue, régularisation inventaire annuel..."
              value={motifAjustement}
              onChange={(e) => setMotifAjustement(e.target.value)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
};
