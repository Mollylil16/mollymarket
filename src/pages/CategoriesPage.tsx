import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { Categorie } from '../types';
import { DataTable, Column } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';
import { FormField } from '../components/ui/FormField';
import { useToast } from '../context/ToastContext';
import { Tags, Plus, Edit2, Trash2 } from 'lucide-react';

export const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Categorie | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    nom: '',
    description: ''
  });

  const { toastSuccess, toastError } = useToast();

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVueCategories();
      setCategories(data);
    } catch (err: any) {
      toastError(err.message || 'Erreur lors du chargement des catégories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditing(null);
    setFormData({ code: '', nom: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (c: Categorie) => {
    setEditing(c);
    setFormData({ code: c.code, nom: c.nom, description: c.description });
    setModalOpen(true);
  };

  const handleDelete = async (cat: Categorie) => {
    if (!window.confirm(`Confirmer la suppression du rayon "${cat.nom}" ?`)) {
      return;
    }
    try {
      await apiClient.supprimerCategorie(cat.id);
      toastSuccess('Catégorie supprimée', 'CALL sp_supprimer_categorie');
      loadCategories();
    } catch (err: any) {
      toastError(err.message || 'Erreur suppression');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) {
      toastError('Le nom du rayon est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await apiClient.modifierCategorie(editing.id, formData);
        toastSuccess('Catégorie modifiée', 'CALL sp_modifier_categorie');
      } else {
        const codeGen = formData.code.trim() || `CAT-${formData.nom.slice(0, 5).toUpperCase()}`;
        await apiClient.ajouterCategorie({ ...formData, code: codeGen });
        toastSuccess('Rayon créé', 'CALL sp_ajouter_categorie');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      toastError(err.message || 'Erreur enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const columns: Column<Categorie>[] = [
    {
      key: 'code',
      header: 'Code Rayon',
      width: '140px',
      accessor: (c) => <span className="font-mono font-bold text-neutral-800">{c.code}</span>
    },
    {
      key: 'nom',
      header: 'Nom du Rayon',
      accessor: (c) => (
        <div>
          <div className="font-bold text-neutral-900">{c.nom}</div>
          <div className="text-[11px] text-neutral-500">{c.description}</div>
        </div>
      )
    },
    {
      key: 'nombre_produits',
      header: 'Articles Référencés',
      align: 'center',
      width: '160px',
      accessor: (c) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-[#2E7D32] border border-emerald-200">
          {c.nombre_produits || 0} références
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      align: 'right',
      width: '90px',
      accessor: (c) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => openEditModal(c)}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-[#2E7D32] hover:bg-emerald-50 transition-colors"
            title="Modifier le rayon"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(c)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-[#E53935] hover:bg-rose-50 transition-colors"
            title="Supprimer la catégorie"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#212121]">Rayons & Catégories Produits</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Organisation du supermarché (Fruits & Légumes, Frais, Épicerie, Boissons...)
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs font-bold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un rayon</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={loading}
        searchPlaceholder="Rechercher par nom ou code..."
        searchKeys={['nom', 'code', 'description']}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title={editing ? 'Modifier le rayon' : 'Créer un rayon de supermarché'}
        subtitle="CALL sp_ajouter_categorie / CALL sp_modifier_categorie"
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
              form="cat-form"
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-white bg-[#2E7D32] hover:bg-[#1B5E20] rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Enregistrement...' : editing ? 'Enregistrer' : 'Valider'}
            </button>
          </>
        }
      >
        <form id="cat-form" onSubmit={handleSubmit} className="space-y-4">
          <FormField
            id="cat-code"
            label="Code Identifiant Rayon"
            placeholder="Ex: CAT-BIO"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            helpText="Généré automatiquement si laissé vide"
          />

          <FormField
            id="cat-nom"
            label="Intitulé du Rayon"
            required
            placeholder="Ex: Produits Biologiques & Sans Gluten"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          />

          <FormField
            id="cat-desc"
            label="Description / Rayon d'implantation"
            type="textarea"
            rows={3}
            placeholder="Ex: Allée centrale n°3, produits certifiés AB..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};
