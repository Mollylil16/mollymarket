import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../services/api';
import { Produit, Categorie } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useToast } from '../context/ToastContext';
import { formatFCFA } from '../utils/format';
import { Package, Plus, Edit2, Barcode, Filter } from 'lucide-react';

export const ProduitsPage: React.FC = () => {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStockFilter, setSelectedStockFilter] = useState<string>('all');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduit, setEditingProduit] = useState<Produit | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code_barre: '',
    nom: '',
    categorie_id: 1,
    prix_vente: 0,
    prix_achat: 0,
    seuil_alerte: 10,
    unite_mesure: 'unité',
    stock_initial: 0
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const { toastSuccess, toastError } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        apiClient.getVueStock(),
        apiClient.getVueCategories()
      ]);
      setProduits(prods);
      setCategories(cats);
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement des produits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProduits = useMemo(() => {
    return produits.filter((p) => {
      const matchCat =
        selectedCategory === 'all' || String(p.categorie_id) === selectedCategory;
      const matchStock =
        selectedStockFilter === 'all' || p.statut_stock === selectedStockFilter;
      return matchCat && matchStock;
    });
  }, [produits, selectedCategory, selectedStockFilter]);

  const openAddModal = () => {
    setEditingProduit(null);
    setFormErrors({});
    setFormData({
      code_barre: `61811005${Math.floor(10000 + Math.random() * 90000)}`,
      nom: '',
      categorie_id: categories.length > 0 ? categories[0].id : 1,
      prix_vente: 1500,
      prix_achat: 1000,
      seuil_alerte: 10,
      unite_mesure: 'unité',
      stock_initial: 20
    });
    setModalOpen(true);
  };

  const openEditModal = (p: Produit) => {
    setEditingProduit(p);
    setFormErrors({});
    setFormData({
      code_barre: p.code_barre || '',
      nom: p.nom,
      categorie_id: p.categorie_id || (categories.length > 0 ? categories[0].id : 1),
      prix_vente: Number(p.prix_vente) || 0,
      prix_achat: Number(p.prix_achat) || 0,
      seuil_alerte: p.seuil_alerte || 10,
      unite_mesure: p.unite_mesure || 'unité',
      stock_initial: p.stock_actuel || 0
    });
    setModalOpen(true);
  };

  const handlePriceChange = (field: 'prix_vente' | 'prix_achat', rawVal: string) => {
    const val = parseFloat(rawVal) || 0;
    if (val < 0) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: 'Le prix doit être supérieur ou égal à 0.'
      }));
    } else {
      setFormErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
    setFormData((prev) => ({ ...prev, [field]: Math.max(0, val) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.prix_vente < 0 || formData.prix_achat < 0) {
      toastError('Le prix de vente ou le prix d\'achat ne peut pas être négatif.');
      return;
    }

    if (!formData.nom.trim() || !formData.code_barre.trim()) {
      toastError('Veuillez renseigner le nom et le code-barres.');
      return;
    }

    setSaving(true);
    try {
      if (editingProduit) {
        await apiClient.modifierProduit(editingProduit.id, {
          nom: formData.nom,
          categorie_id: formData.categorie_id,
          prix_vente: formData.prix_vente,
          prix_achat: formData.prix_achat,
          seuil_alerte: formData.seuil_alerte,
          unite_mesure: formData.unite_mesure
        });
        toastSuccess('Fiche produit mise à jour avec succès');
      } else {
        await apiClient.ajouterProduit(formData);
        toastSuccess('Nouveau produit référencé dans le catalogue');
      }
      setModalOpen(false);
      loadData();
    } catch (err: any) {
      toastError(err.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Produit>[] = [
    {
      key: 'code_barre',
      header: 'Code-Barres',
      width: '135px',
      accessor: (p) => (
        <div className="flex items-center gap-1.5 font-mono text-neutral-800">
          <Barcode className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold">{p.code_barre}</span>
        </div>
      )
    },
    {
      key: 'nom',
      header: 'Désignation Produit',
      accessor: (p) => (
        <div>
          <div className="font-bold text-neutral-900">{p.nom}</div>
          <div className="text-[11px] text-neutral-500">Rayon : {p.categorie_nom}</div>
        </div>
      )
    },
    {
      key: 'prix_vente',
      header: 'Prix Vente',
      align: 'right',
      width: '120px',
      accessor: (p) => (
        <span className="font-bold text-neutral-900">{formatFCFA(p.prix_vente)}</span>
      )
    },
    {
      key: 'prix_achat',
      header: 'Prix Achat / PUMP',
      align: 'right',
      width: '140px',
      accessor: (p) => (
        <span className="text-neutral-500">{formatFCFA(p.prix_achat)}</span>
      )
    },
    {
      key: 'stock_actuel',
      header: 'Stock Actuel',
      align: 'center',
      width: '120px',
      accessor: (p) => (
        <div className="font-mono font-bold">
          <span className={p.stock_actuel === 0 ? 'text-[#E53935]' : 'text-neutral-800'}>
            {p.stock_actuel} {p.unite_mesure}
          </span>
          <span className="text-[10px] text-neutral-400 block font-sans">
            Seuil : {p.seuil_alerte}
          </span>
        </div>
      )
    },
    {
      key: 'statut_stock',
      header: 'Statut Rayon',
      align: 'center',
      width: '130px',
      accessor: (p) => {
        const labels: Record<string, string> = {
          en_stock: 'En stock',
          stock_faible: 'Stock faible',
          rupture: 'En rupture'
        };
        const tones: Record<string, 'green' | 'orange' | 'red'> = {
          en_stock: 'green',
          stock_faible: 'orange',
          rupture: 'red'
        };
        return <StatusBadge label={labels[p.statut_stock] || p.statut_stock} tone={tones[p.statut_stock] || 'green'} />;
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      width: '70px',
      accessor: (p) => (
        <button
          onClick={() => openEditModal(p)}
          className="p-1.5 rounded-lg text-neutral-500 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors"
          title="Modifier le produit"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Catalogue & Fiches Articles</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Gestion des articles, prix de vente et seuils d'alertes automatiques
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* Barre de filtres par rayon et état de stock */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200/90 shadow-xs flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-600">
          <Filter className="w-4 h-4 text-[#2E7D32]" />
          <span>Filtrer par :</span>
        </div>

        {/* Filtre Catégorie */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 bg-neutral-50/50 text-neutral-800 focus:outline-none focus:border-[#2E7D32]"
        >
          <option value="all">Tous les rayons</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nom}
            </option>
          ))}
        </select>

        {/* Filtre État de Stock */}
        <select
          value={selectedStockFilter}
          onChange={(e) => setSelectedStockFilter(e.target.value)}
          className="px-3 py-1.5 text-xs rounded-lg border border-neutral-300 bg-neutral-50/50 text-neutral-800 focus:outline-none focus:border-[#2E7D32]"
        >
          <option value="all">Tous les statuts de stock</option>
          <option value="en_stock">En stock</option>
          <option value="stock_faible">Stock faible (alerte)</option>
          <option value="rupture">En rupture</option>
        </select>

        <div className="ml-auto text-xs text-neutral-400 font-medium">
          {filteredProduits.length} produit(s) affiché(s)
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredProduits}
        isLoading={loading}
        searchPlaceholder="Rechercher par désignation, code-barres..."
        searchKeys={['nom', 'code_barre', 'categorie_nom']}
      />

      {/* Modal Produit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editingProduit ? 'Modifier la fiche produit' : 'Créer un nouveau produit'}
        subtitle="Gestion des caractéristiques, tarifs et seuils de réapprovisionnement"
        footer={
          <>
            <button
              type="button"
              disabled={saving}
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="produit-form"
              disabled={saving || Object.keys(formErrors).length > 0}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editingProduit ? 'Enregistrer' : 'Valider'}
            </button>
          </>
        }
      >
        <form id="produit-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="p-code"
              label="Code-Barres EAN-13"
              required
              placeholder="3250390012341"
              value={formData.code_barre}
              onChange={(e) => setFormData({ ...formData, code_barre: e.target.value })}
            />

            <FormField
              id="p-cat"
              label="Rayon / Catégorie"
              type="select"
              required
              value={formData.categorie_id}
              onChange={(e) =>
                setFormData({ ...formData, categorie_id: parseInt(e.target.value, 10) })
              }
              options={categories.map((c) => ({ value: c.id, label: c.nom }))}
            />
          </div>

          <FormField
            id="p-nom"
            label="Désignation du produit"
            required
            placeholder="Ex: Lait Demi-Écrémé Grandlait (Pack 6x1L)"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="p-prix-vente"
              label="Prix de Vente TTC (FCFA)"
              type="number"
              required
              min="0"
              step="1"
              value={formData.prix_vente}
              onChange={(e) => handlePriceChange('prix_vente', e.target.value)}
              error={formErrors.prix_vente}
            />

            <FormField
              id="p-prix-achat"
              label="Prix d'Achat Fournisseur (FCFA)"
              type="number"
              required
              min="0"
              step="1"
              value={formData.prix_achat}
              onChange={(e) => handlePriceChange('prix_achat', e.target.value)}
              error={formErrors.prix_achat}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              id="p-seuil"
              label="Seuil d'alerte stock"
              type="number"
              min="0"
              required
              value={formData.seuil_alerte}
              onChange={(e) =>
                setFormData({ ...formData, seuil_alerte: parseInt(e.target.value, 10) || 0 })
              }
            />

            <FormField
              id="p-unite"
              label="Unité de mesure"
              type="select"
              value={formData.unite_mesure}
              onChange={(e) => setFormData({ ...formData, unite_mesure: e.target.value })}
              options={[
                { value: 'unité', label: 'Unité / Pièce' },
                { value: 'kg', label: 'Kilogramme (kg)' },
                { value: 'pack', label: 'Pack / Carton' },
                { value: 'bouteille', label: 'Bouteille' },
                { value: 'flacon', label: 'Flacon' },
                { value: 'paquet', label: 'Paquet' }
              ]}
            />

            {!editingProduit && (
              <FormField
                id="p-stock-init"
                label="Stock initial en rayon"
                type="number"
                min="0"
                value={formData.stock_initial}
                onChange={(e) =>
                  setFormData({ ...formData, stock_initial: parseInt(e.target.value, 10) || 0 })
                }
              />
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
};
